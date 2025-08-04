// frontend/src/services/apiClient.ts - Version corrigée

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, DEFAULT_HEADERS, REQUEST_CONFIG } from '../config/api.config';
import { toast } from 'react-hot-toast';

// Types pour les réponses API
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  retryAfter?: number;
  tier?: string;
}

// Configuration pour le retry
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// File d'attente pour les requêtes (pour éviter le bombardement en cas de 429)
class RequestQueue {
  private queue: Array<{
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    priority: boolean;
  }> = [];
  private processing = false;
  private rateLimitDelay = 0;
  private lastRequestTime = 0;
  private minRequestInterval = 100; // 100ms entre chaque requête

  async add<T>(request: () => Promise<T>, priority = false): Promise<T> {
    return new Promise((resolve, reject) => {
      if (priority) {
        // Les requêtes prioritaires passent devant
        this.queue.unshift({ request, resolve, reject, priority });
      } else {
        this.queue.push({ request, resolve, reject, priority });
      }
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      // Attendre si on est en rate limit
      if (this.rateLimitDelay > 0) {
        const waitTime = this.rateLimitDelay;
        console.log(`⏳ Rate limit: attente de ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.rateLimitDelay = 0;
      }
      
      // Respecter l'intervalle minimum entre les requêtes
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
        );
      }
      
      const { request, resolve, reject } = this.queue.shift()!;
      this.lastRequestTime = Date.now();
      
      try {
        const result = await request();
        resolve(result);
      } catch (error: any) {
        // Si c'est une erreur 429, définir le délai pour les prochaines requêtes
        if (error.response?.status === 429) {
          const retryAfter = error.response.data?.retryAfter || 60;
          this.rateLimitDelay = retryAfter * 1000;
          
          // Afficher un message utilisateur une seule fois
          if (this.queue.length > 0 && API_CONFIG.RATE_LIMIT.showToasts) {
            toast.error(`Trop de requêtes. Attente de ${retryAfter} secondes...`, {
              duration: Math.min(retryAfter * 1000, 10000),
              id: 'rate-limit-toast'
            });
          }
        }
        reject(error);
      }
    }
    
    this.processing = false;
  }

  setRateLimitDelay(seconds: number) {
    this.rateLimitDelay = Math.max(this.rateLimitDelay, seconds * 1000);
  }

  clear() {
    this.queue = [];
    this.rateLimitDelay = 0;
  }
}

// Instance globale de la file d'attente
const requestQueue = new RequestQueue();

// Créer l'instance Axios
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_CONFIG.getCurrentApiUrl()}/api`,
  timeout: API_CONFIG.TIMEOUT,
  headers: DEFAULT_HEADERS,
});

// Calculer le délai de retry avec backoff exponentiel
function calculateRetryDelay(attemptNumber: number): number {
  const config = API_CONFIG.RETRY;
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attemptNumber - 1),
    config.maxDelay
  );
  // Ajouter un peu de randomisation pour éviter la synchronisation
  return delay + Math.random() * 1000;
}

// Vérifier si une URL doit être retentée
function shouldRetry(url?: string): boolean {
  if (!url || !API_CONFIG.RATE_LIMIT.retryAfter429) return false;
  return !REQUEST_CONFIG.noRetry.some(endpoint => url.includes(endpoint));
}

// Vérifier si une requête est prioritaire
function isPriorityRequest(url?: string): boolean {
  if (!url) return false;
  return REQUEST_CONFIG.priority.some(endpoint => url.includes(endpoint));
}

// Intercepteur de requête
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('ecolojia_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ajouter un header pour tracker les retries
    if (!config.headers['X-Retry-Count']) {
      config.headers['X-Retry-Count'] = '0';
    }
    
    // Log en développement
    if (API_CONFIG.isDevelopment) {
      console.log('🔤 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        retry: config.headers['X-Retry-Count'],
      });
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse avec gestion intelligente des erreurs
apiClient.interceptors.response.use(
  (response) => {
    // Log en développement
    if (API_CONFIG.isDevelopment) {
      console.log('✅ API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
        headers: {
          tier: response.headers['x-user-tier'],
          rateLimitRemaining: response.headers['x-ratelimit-remaining'],
          quotaScans: response.headers['x-quota-scans-remaining'],
          quotaAI: response.headers['x-quota-ai-remaining']
        }
      });
    }
    
    // Afficher les infos de quota si elles sont basses
    if (API_CONFIG.RATE_LIMIT.showToasts) {
      const scansRemaining = response.headers['x-quota-scans-remaining'];
      const aiRemaining = response.headers['x-quota-ai-remaining'];
      
      if (scansRemaining && parseInt(scansRemaining) < 5) {
        toast(`⚠️ Plus que ${scansRemaining} scans restants ce mois-ci`, {
          id: 'low-scans-warning',
          duration: 5000
        });
      }
      
      if (aiRemaining && parseInt(aiRemaining) < 2) {
        toast(`⚠️ Plus que ${aiRemaining} questions IA restantes`, {
          id: 'low-ai-warning',
          duration: 5000
        });
      }
    }
    
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { 
      _retry?: boolean;
      _retryCount?: number;
    };
    
    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    const retryCount = originalRequest._retryCount || 0;
    
    // Log l'erreur avec plus de détails
    console.error('❌ API Error:', {
      url: originalRequest.url,
      fullURL: `${originalRequest.baseURL}${originalRequest.url}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.response?.data?.error || error.response?.data?.message || error.message,
      retryCount
    });
    
    // Gestion du 429 (Rate Limit)
    if (error.response?.status === 429) {
      const shouldRetryRequest = shouldRetry(originalRequest.url);
      const isPriority = isPriorityRequest(originalRequest.url);
      
      if (shouldRetryRequest && retryCount < API_CONFIG.RETRY.maxRetries) {
        originalRequest._retryCount = retryCount + 1;
        originalRequest.headers['X-Retry-Count'] = String(retryCount + 1);
        
        const retryAfter = error.response.data?.retryAfter || 60;
        const delay = Math.max(calculateRetryDelay(retryCount + 1), retryAfter * 1000);
        
        // Informer l'utilisateur du retry
        if (retryCount === 0 && API_CONFIG.RATE_LIMIT.showToasts) {
          const userTier = error.response.headers['x-user-tier'] || 
                          error.response.data?.tier || 'free';
          toast.loading(
            `Limite atteinte (${userTier}). Nouvelle tentative dans ${Math.ceil(delay / 1000)}s...`,
            {
              id: 'rate-limit-retry',
              duration: delay
            }
          );
        }
        
        // Si queue activée, utiliser la queue, sinon attendre directement
        if (API_CONFIG.RATE_LIMIT.queueRequests) {
          requestQueue.setRateLimitDelay(retryAfter);
          return requestQueue.add(() => apiClient(originalRequest), isPriority);
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
          return apiClient(originalRequest);
        }
      } else {
        // Pas de retry, afficher l'erreur
        const message = error.response.data?.message || 
                       'Trop de requêtes. Veuillez réessayer plus tard.';
        if (API_CONFIG.RATE_LIMIT.showToasts) {
          toast.error(message, {
            id: 'rate-limit-final',
            duration: 10000
          });
        }
      }
    }
    
    // Gestion du 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Ne pas essayer de rafraîchir si on est déjà sur une route d'auth
      const isAuthRoute = originalRequest.url?.includes('/auth/');
      if (isAuthRoute) {
        return Promise.reject(error);
      }
      
      const refreshToken = localStorage.getItem('ecolojia_refresh_token');
      
      if (refreshToken) {
        try {
          console.log('🔄 Tentative de rafraîchissement du token...');
          const response = await axios.post(
            `${API_CONFIG.getCurrentApiUrl()}/api/auth/refresh`,
            { refreshToken },
            { headers: DEFAULT_HEADERS }
          );
          
          if (response.data.success) {
            const newToken = response.data.accessToken || response.data.token;
            const newRefreshToken = response.data.refreshToken;
            
            localStorage.setItem('ecolojia_token', newToken);
            if (newRefreshToken) {
              localStorage.setItem('ecolojia_refresh_token', newRefreshToken);
            }
            
            console.log('✅ Token rafraîchi avec succès');
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Échec du rafraîchissement du token:', refreshError);
          localStorage.removeItem('ecolojia_token');
          localStorage.removeItem('ecolojia_refresh_token');
          window.location.href = '/auth';
          return Promise.reject(refreshError);
        }
      }
      
      // Pas de refresh token, rediriger vers login
      console.log('🔄 Redirection vers la page de connexion...');
      localStorage.removeItem('ecolojia_token');
      localStorage.removeItem('ecolojia_refresh_token');
      window.location.href = '/auth';
    }
    
    // Gestion des erreurs de quota
    if (error.response?.status === 403 && error.response.data?.error === 'QUOTA_EXCEEDED') {
      const quotaType = error.response.data?.quotaType || 'requêtes';
      if (API_CONFIG.RATE_LIMIT.showToasts) {
        toast.error(`Quota de ${quotaType} dépassé. Passez à Premium pour continuer.`, {
          duration: 10000,
          id: 'quota-exceeded'
        });
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper pour extraire le message d'erreur
export function getErrorMessage(error: any): string {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.status === 429) {
    return 'Trop de requêtes. Veuillez patienter.';
  }
  if (error.response?.status === 401) {
    return 'Session expirée. Veuillez vous reconnecter.';
  }
  if (error.response?.status === 403) {
    return 'Accès refusé.';
  }
  if (error.response?.status === 404) {
    return 'Ressource non trouvée.';
  }
  if (error.response?.status >= 500) {
    return 'Erreur serveur. Veuillez réessayer plus tard.';
  }
  if (error.code === 'ECONNABORTED') {
    return 'La requête a expiré. Vérifiez votre connexion.';
  }
  if (error.code === 'ERR_NETWORK') {
    return 'Erreur réseau. Vérifiez votre connexion internet.';
  }
  if (error.message) {
    return error.message;
  }
  return 'Une erreur inattendue s\'est produite';
}

// Helper pour vérifier si c'est une erreur réseau
export function isNetworkError(error: any): boolean {
  return !error.response && error.code !== 'ECONNABORTED';
}

// Helper pour vérifier si c'est un timeout
export function isTimeoutError(error: any): boolean {
  return error.code === 'ECONNABORTED';
}

// Helper pour vérifier si c'est une erreur de rate limit
export function isRateLimitError(error: any): boolean {
  return error.response?.status === 429;
}

// Helper pour obtenir les infos de quota depuis les headers
export function getQuotaInfo(response: any): {
  tier: string;
  scansRemaining: number | null;
  aiRemaining: number | null;
  rateLimitRemaining: number | null;
} {
  return {
    tier: response.headers['x-user-tier'] || 'unknown',
    scansRemaining: response.headers['x-quota-scans-remaining'] 
      ? parseInt(response.headers['x-quota-scans-remaining']) 
      : null,
    aiRemaining: response.headers['x-quota-ai-remaining']
      ? parseInt(response.headers['x-quota-ai-remaining'])
      : null,
    rateLimitRemaining: response.headers['x-ratelimit-remaining']
      ? parseInt(response.headers['x-ratelimit-remaining'])
      : null
  };
}

// Fonction pour nettoyer la queue (utile lors de la déconnexion)
export function clearRequestQueue() {
  requestQueue.clear();
}

// Export de la queue pour usage avancé
export { requestQueue };

export default apiClient;