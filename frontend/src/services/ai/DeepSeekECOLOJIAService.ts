// PATH: frontend/ecolojiaFrontV3/src/services/ai/DeepSeekECOLOJIAService.ts

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Utiliser l'URL de l'API depuis les variables d'environnement
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function streamDeepSeekResponse(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  onDone?: () => void,
  onError?: (error: string) => void
) {
  try {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    
    // Utiliser l'URL complète avec la base API_URL
    const response = await fetch(`${API_URL}/api/chat/deepseek`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ messages }),
      signal: controller.signal
    });

    if (!response.ok) {
      // Gérer les différents codes d'erreur
      if (response.status === 401) {
        throw new Error('Non autorisé - Veuillez vous reconnecter');
      } else if (response.status === 403) {
        throw new Error('Accès refusé - Fonctionnalité Premium requise');
      } else if (response.status === 429) {
        throw new Error('Limite de requêtes atteinte - Veuillez patienter');
      } else {
        throw new Error(`Erreur serveur (${response.status})`);
      }
    }

    if (!response.body) {
      throw new Error('Pas de corps de réponse du serveur');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });

      // Traiter les lignes complètes
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            onDone?.();
            return;
          }
          
          if (data) {
            try {
              const parsed = JSON.parse(data);
              
              // Support pour différents formats de réponse
              const content = parsed.token || 
                           parsed.content || 
                           parsed.choices?.[0]?.delta?.content ||
                           parsed.choices?.[0]?.text;
              
              if (content) {
                onToken(content);
              }
            } catch (err) {
              console.warn('⚠️ Impossible de parser:', data);
            }
          }
        }
      }
    }

    onDone?.();
  } catch (err: any) {
    console.error('❌ Erreur streaming IA:', err);
    
    // Message d'erreur plus détaillé selon le type d'erreur
    let errorMessage = 'Erreur de connexion avec le serveur';
    
    if (err.name === 'AbortError') {
      errorMessage = 'Requête annulée';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    onError?.(errorMessage);
  }
}

// Fonction helper pour vérifier la disponibilité du service
export async function checkDeepSeekAvailability(): Promise<boolean> {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/api/chat/health`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    return response.ok;
  } catch {
    return false;
  }
}