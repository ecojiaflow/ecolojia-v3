// ===================================
// 1. apiClient.ts - VERSION CORRIGÉE
// ===================================
// PATH: frontend/src/services/apiClient.ts

import axios from 'axios';
import API_CONFIG from '../config/api.config';

// Configuration de base
const API_BASE_URL = API_CONFIG.getCurrentApiUrl();

console.log('🔧 API Client Configuration:', {
  baseURL: API_BASE_URL,
  env: import.meta.env.MODE,
  isProduction: import.meta.env.PROD,
  viteApiUrl: import.meta.env.VITE_API_URL
});

// Instance Axios avec configuration complète
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important pour les cookies
});

// Types pour une meilleure gestion des erreurs
interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// Intercepteur de requête
apiClient.interceptors.request.use(
  (config) => {
    // Ajouter le token si disponible
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log en développement
    if (import.meta.env.DEV) {
      console.log(`🔤 ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Erreur requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse
apiClient.interceptors.response.use(
  (response) => {
    // Log en développement
    if (import.meta.env.DEV) {
      console.log(`📥 ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Gestion du refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await apiClient.post('/auth/refresh', {
            refreshToken
          });

          const { token } = response.data;
          localStorage.setItem('token', token);

          // Réessayer la requête originale
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Échec du refresh, déconnexion
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    // Gestion des erreurs détaillée
    const apiError: ApiError = {
      message: 'Une erreur est survenue',
      status: error.response?.status
    };

    if (error.response) {
      // Erreur de réponse du serveur
      apiError.message = error.response.data?.error || error.response.data?.message || 'Erreur serveur';
      apiError.code = error.response.data?.code;
      apiError.details = error.response.data?.details;

      // Messages d'erreur personnalisés selon le statut
      switch (error.response.status) {
        case 400:
          apiError.message = error.response.data?.error || 'Données invalides';
          break;
        case 401:
          apiError.message = 'Session expirée, veuillez vous reconnecter';
          break;
        case 403:
          apiError.message = 'Accès refusé';
          break;
        case 404:
          apiError.message = 'Ressource non trouvée';
          break;
        case 429:
          apiError.message = 'Trop de requêtes, veuillez réessayer plus tard';
          break;
        case 500:
          apiError.message = 'Erreur serveur, veuillez réessayer plus tard';
          break;
      }
    } else if (error.request) {
      // Pas de réponse du serveur
      apiError.message = 'Impossible de contacter le serveur';
      apiError.code = 'NETWORK_ERROR';
    } else {
      // Erreur de configuration
      apiError.message = error.message;
      apiError.code = 'CLIENT_ERROR';
    }

    console.error('❌ Erreur API:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      error: apiError
    });

    return Promise.reject(apiError);
  }
);

// Fonctions utilitaires pour les requêtes communes
export const api = {
  // GET avec gestion d'erreur améliorée
  get: <T = any>(url: string, config?: any) => 
    apiClient.get<T>(url, config)
      .then(res => res.data)
      .catch(error => {
        console.error(`❌ GET ${url} failed:`, error);
        throw error;
      }),

  // POST
  post: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.post<T>(url, data, config)
      .then(res => res.data)
      .catch(error => {
        console.error(`❌ POST ${url} failed:`, error);
        throw error;
      }),

  // PUT
  put: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.put<T>(url, data, config)
      .then(res => res.data)
      .catch(error => {
        console.error(`❌ PUT ${url} failed:`, error);
        throw error;
      }),

  // PATCH
  patch: <T = any>(url: string, data?: any, config?: any) => 
    apiClient.patch<T>(url, data, config)
      .then(res => res.data)
      .catch(error => {
        console.error(`❌ PATCH ${url} failed:`, error);
        throw error;
      }),

  // DELETE
  delete: <T = any>(url: string, config?: any) => 
    apiClient.delete<T>(url, config)
      .then(res => res.data)
      .catch(error => {
        console.error(`❌ DELETE ${url} failed:`, error);
        throw error;
      }),

  // Upload avec progress
  upload: <T = any>(url: string, formData: FormData, onProgress?: (progress: number) => void) => {
    return apiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    }).then(res => res.data);
  }
};

// File d'attente pour les requêtes en attente
let requestQueue: Array<() => void> = [];

// Fonction pour vider la file d'attente
export const clearRequestQueue = () => {
  requestQueue = [];
  console.log('🧹 File d\'attente des requêtes vidée');
};

// Fonction pour extraire un message d'erreur lisible
export const getErrorMessage = (error: any): string => {
  // Si c'est déjà une chaîne
  if (typeof error === 'string') {
    return error;
  }

  // Si c'est notre format ApiError
  if (error?.message) {
    return error.message;
  }

  // Si c'est une erreur axios
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  // Si c'est une erreur réseau
  if (error?.code === 'NETWORK_ERROR') {
    return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  }

  // Message par défaut
  return 'Une erreur inattendue s\'est produite';
};

// Export nommé pour compatibilité avec les imports existants
export { apiClient };

// Export par défaut aussi
export default apiClient;

// Fonction de test de connexion
export const testConnection = async () => {
  try {
    console.log('🔍 Test de connexion à :', API_BASE_URL);
    const response = await apiClient.get('/');
    console.log('✅ Connexion réussie:', response.data);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('❌ Échec de connexion:', error);
    return { success: false, error };
  }
};

// Auto-test au chargement en développement
if (import.meta.env.DEV) {
  setTimeout(() => {
    testConnection().then(result => {
      if (!result.success) {
        console.warn('⚠️ Impossible de se connecter au backend. Vérifiez que le serveur est lancé.');
      }
    });
  }, 1000);
}
