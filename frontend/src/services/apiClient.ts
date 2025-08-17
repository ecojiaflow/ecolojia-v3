import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '../config/api.config';

// Creation de l'instance axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers
});

// Intercepteur de requete
apiClient.interceptors.request.use(
  (config) => {
    // Ajouter le token si disponible
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log en dev
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de reponse
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log en dev
    if (import.meta.env.DEV) {
      console.log(`[API] Response:`, response.data);
    }
    return response;
  },
  (error) => {
    // Gestion globale des erreurs
    if (error.response) {
      // Erreur serveur
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token expire - rediriger vers login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Acces refuse');
          break;
        case 404:
          console.error('Ressource non trouvee');
          break;
        case 500:
          console.error('Erreur serveur');
          break;
      }
      
      // Retourner l'erreur formatee
      return Promise.reject({
        status,
        message: data?.message || 'Une erreur est survenue',
        error: data?.error
      });
    } else if (error.request) {
      // Pas de reponse du serveur
      return Promise.reject({
        status: 0,
        message: 'Impossible de contacter le serveur',
        error: 'NETWORK_ERROR'
      });
    }
    
    return Promise.reject(error);
  }
);

// Export des methodes utilitaires
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem('auth_token');
};

// Types pour les reponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: string;
}

// Export de l'instance
export { apiClient };
export default apiClient;
