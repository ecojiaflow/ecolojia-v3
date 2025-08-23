// PATH: frontend/src/services/chatService.ts

import { post } from './api';
import { 
  ChatMessage, 
  ChatRequest, 
  ChatResponse,
  Product,
  AnalysisResponse
} from '../types/api';
import { notifications } from './notificationService';
import { authService } from './authService';

class ChatService {
  private readonly CHAT_HISTORY_KEY = 'chatHistory';
  private readonly MAX_HISTORY_MESSAGES = 50;
  private currentConversation: ChatMessage[] = [];

  // Envoyer un message au chat IA
  async sendMessage(
    message: string, 
    context?: {
      productId?: string;
      analysisId?: string;
      product?: Product;
      analysis?: AnalysisResponse;
    }
  ): Promise<ChatMessage> {
    try {
      // Vérifier les quotas si non premium
      if (!authService.isPremium() && !authService.canChat()) {
        notifications.push('error', 'Quota de chats IA dépassé. Passez à Premium pour continuer !');
        throw new Error('QUOTA_EXCEEDED');
      }

      // Créer le message utilisateur
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        context: {
          productId: context?.productId,
          analysisId: context?.analysisId,
        },
      };

      // Ajouter à la conversation
      this.currentConversation.push(userMessage);
      this.saveConversation();

      // Préparer la requête
      const request: ChatRequest = {
        message,
        context: {
          productId: context?.productId,
          analysisId: context?.analysisId,
          previousMessages: this.getRecentMessages(5), // Envoyer les 5 derniers messages pour le contexte
        },
      };

      // Envoyer au serveur
      const response = await post<ChatResponse>('/ai/chat', request);
      
      // Ajouter la réponse à la conversation
      this.currentConversation.push(response.message);
      this.saveConversation();

      // Mettre à jour les quotas localement
      if (!authService.isPremium()) {
        const user = authService.getCurrentUser();
        if (user && user.quotas.aiChatsRemaining > 0) {
          user.quotas.aiChatsRemaining--;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }

      return response.message;
    } catch (error: any) {
      if (error.status === 429) {
        notifications.push('error', 'Limite de messages atteinte. Veuillez patienter.');
      } else if (error.message !== 'QUOTA_EXCEEDED') {
        notifications.push('error', 'Erreur lors de l\'envoi du message');
      }
      throw error;
    }
  }

  // Obtenir des suggestions de questions
  async getSuggestions(context?: { product?: Product; analysis?: AnalysisResponse }): Promise<string[]> {
    // Si on a un contexte produit, suggérer des questions pertinentes
    if (context?.product) {
      const suggestions: string[] = [];
      
      // Questions générales
      suggestions.push(`Quels sont les risques de ${context.product.name} pour la santé ?`);
      suggestions.push(`Existe-t-il des alternatives plus saines à ${context.product.name} ?`);
      
      // Questions spécifiques selon la catégorie
      if (context.product.category === 'food') {
        suggestions.push('Ce produit convient-il à un régime végétarien ?');
        suggestions.push('Quelle est la valeur nutritionnelle de ce produit ?');
        suggestions.push('Les additifs présents sont-ils dangereux ?');
      } else if (context.product.category === 'cosmetics') {
        suggestions.push('Ce produit contient-il des perturbateurs endocriniens ?');
        suggestions.push('Est-il adapté aux peaux sensibles ?');
        suggestions.push('Quelle est la composition INCI détaillée ?');
      } else if (context.product.category === 'detergents') {
        suggestions.push('Quel est l\'impact environnemental de ce produit ?');
        suggestions.push('Est-il biodégradable ?');
        suggestions.push('Existe-t-il une version écologique ?');
      }
      
      // Questions basées sur les scores
      if (context.analysis?.results.healthImpact.score < 50) {
        suggestions.push('Comment améliorer mon score santé ?');
      }
      
      return suggestions.slice(0, 4); // Retourner max 4 suggestions
    }
    
    // Suggestions générales sans contexte
    return [
      'Comment lire les étiquettes nutritionnelles ?',
      'Quels additifs alimentaires éviter ?',
      'Comment choisir des produits plus sains ?',
      'Quelle est la différence entre bio et naturel ?',
    ];
  }

  // Obtenir la conversation actuelle
  getCurrentConversation(): ChatMessage[] {
    return this.currentConversation;
  }

  // Obtenir les messages récents
  private getRecentMessages(count: number): ChatMessage[] {
    return this.currentConversation.slice(-count * 2); // Prendre les derniers messages (user + assistant)
  }

  // Nouvelle conversation
  startNewConversation() {
    this.currentConversation = [];
    this.saveConversation();
    notifications.push('info', 'Nouvelle conversation démarrée');
  }

  // Sauvegarder la conversation
  private saveConversation() {
    try {
      // Limiter la taille de l'historique
      if (this.currentConversation.length > this.MAX_HISTORY_MESSAGES) {
        this.currentConversation = this.currentConversation.slice(-this.MAX_HISTORY_MESSAGES);
      }
      
      localStorage.setItem(this.CHAT_HISTORY_KEY, JSON.stringify(this.currentConversation));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la conversation:', error);
    }
  }

  // Charger la conversation
  loadConversation() {
    try {
      const saved = localStorage.getItem(this.CHAT_HISTORY_KEY);
      if (saved) {
        this.currentConversation = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error);
      this.currentConversation = [];
    }
  }

  // Effacer l'historique
  clearHistory() {
    this.currentConversation = [];
    localStorage.removeItem(this.CHAT_HISTORY_KEY);
    notifications.push('success', 'Historique de chat effacé');
  }

  // Obtenir le nombre de messages restants
  getRemaining(): number {
    const user = authService.getCurrentUser();
    if (!user) return 0;
    if (authService.isPremium()) return 999; // Illimité pour premium
    return user.quotas.aiChatsRemaining;
  }

  // Messages prédéfinis pour démarrer une conversation
  getStarterMessages(context?: { product?: Product; analysis?: AnalysisResponse }): string[] {
    if (context?.product) {
      return [
        `Bonjour ! Je viens d'analyser ${context.product.name}. Je suis votre assistant nutritionnel ECOLOJIA. 🌱\n\nQue souhaitez-vous savoir sur ce produit ?`,
      ];
    }
    
    return [
      'Bonjour ! Je suis votre assistant nutritionnel ECOLOJIA. 🌱\n\nJe peux vous aider à :\n• Comprendre les analyses de produits\n• Décoder les additifs et ingrédients\n• Trouver des alternatives plus saines\n• Répondre à vos questions nutrition\n\nComment puis-je vous aider aujourd\'hui ?',
    ];
  }
}

// Export d'une instance unique
export const chatService = new ChatService();

// Export direct pour compatibilité avec le code existant
export const sendChatMessage = async (
  message: string,
  context?: {
    productId?: string;
    analysisId?: string;
    product?: Product;
    analysis?: AnalysisResponse;
  }
) => chatService.sendMessage(message, context);

// Charger la conversation au démarrage
chatService.loadConversation();

// Hook React pour le chat
import { useState, useEffect, useCallback } from 'react';

export const useAIChat = (context?: { product?: Product; analysis?: AnalysisResponse }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);

  // Charger la conversation et les suggestions
  useEffect(() => {
    setMessages(chatService.getCurrentConversation());
    setRemaining(chatService.getRemaining());
    
    // Charger les suggestions
    chatService.getSuggestions(context).then(setSuggestions);
  }, [context]);

  // Envoyer un message
  const sendMessage = useCallback(async (message: string) => {
    setLoading(true);
    try {
      await chatService.sendMessage(message, {
        productId: context?.product?._id,
        product: context?.product,
        analysis: context?.analysis,
      });
      
      // Mettre à jour l'état
      setMessages(chatService.getCurrentConversation());
      setRemaining(chatService.getRemaining());
      
      // Recharger les suggestions
      const newSuggestions = await chatService.getSuggestions(context);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    } finally {
      setLoading(false);
    }
  }, [context]);

  // Nouvelle conversation
  const newConversation = useCallback(() => {
    chatService.startNewConversation();
    setMessages([]);
    chatService.getSuggestions(context).then(setSuggestions);
  }, [context]);

  // Effacer l'historique
  const clearHistory = useCallback(() => {
    chatService.clearHistory();
    setMessages([]);
  }, []);

  return {
    messages,
    suggestions,
    loading,
    remaining,
    canChat: authService.canChat(),
    isPremium: authService.isPremium(),
    sendMessage,
    newConversation,
    clearHistory,
    starterMessage: chatService.getStarterMessages(context)[0],
  };
};