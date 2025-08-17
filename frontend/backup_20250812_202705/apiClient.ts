// PATH: frontend/src/services/apiClient.ts
/**
 * Client API pour toutes les requÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚Âªtes HTTP
 * GÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚Â¨re automatiquement l'authentification et les erreurs
 */

import axios from 'axios';
import { API_CONFIG, ERROR_MESSAGES } from '../config/api.config';
import ConfigService from './configService';

// Configuration de base
const apiClient = axios.create({
  baseURL: API_CONFIG.getCurrentUrl(),
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    // Ne pas ajouter de token pour les endpoints d'authentification
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/register') ||
                          config.url?.includes('/auth/refresh');
    
    if (!isAuthEndpoint) {
      // RÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©cupÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©rer le token depuis le localStorage avec la bonne clÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©
      const token = localStorage.getItem('ecolojia_token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Log en dev
    if (import.meta.env.DEV) {
      console.log('ÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã‚Â¦ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÂ¢ÃƒÂ¢ÃƒÂ¢ââ€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÂ¢ÃƒÂ¢ÃƒÂ¢ââ€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’ââ‚¬Â¦Ãƒâ€šÃ‚Â¾ API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!config.headers.Authorization,
        headers: config.headers
      });
    }
    
    return config;
  },
  (error) => {
    console.error('ÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã‚Â¦ÃƒÂ¢ââ€šÂ¬ÃƒÂ¢ââ‚¬Å¾Ã‚Â¢ Request error:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©rer les rÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©ponses et erreurs
apiClient.interceptors.response.use(
  (response) => {
    // Log en dev
    if (import.meta.env.DEV) {
      console.log('ÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã‚Â¦ÃƒÂ¢ââ€šÂ¬Ãƒâ€¦ââ‚¬Å“ÃƒÂ¢ÃƒÂ¢ÃƒÂ¢ââ€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚Â¦ API Response:', response.config.url, response.status);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log dÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©taillÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â© de l'erreur
    if (import.meta.env.DEV) {
      console.error('ÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã‚Â¦ÃƒÂ¢ââ€šÂ¬ÃƒÂ¢ââ‚¬Å¾Ã‚Â¢ API Error:', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }
    
    // Ne pas traiter les erreurs d'authentification sur les endpoints de login/register
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || 
                          originalRequest?.url?.includes('/auth/register');
    
    // Gestion du token expirÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â© (401) - seulement pour les routes protÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©gÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©es
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      
      // Si le message est "Token non fourni", c'est qu'on n'est pas connectÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©
      if (error.response?.data?.message === 'Token non fourni') {
        // Basculer en mode dÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©mo
        ConfigService.setMode('demo');
        
        // CrÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©er une erreur personnalisÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©e qui indique qu'on est en mode dÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©mo
        const demoError = new Error('Mode dÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©monstration activÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©') as any;
        demoError.isDemoMode = true;
        demoError.statusCode = 401;
        return Promise.reject(demoError);
      }
      
      // Sinon, essayer de rafraÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚Â®chir le token
      try {
        const refreshToken = localStorage.getItem('ecolojia_refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${API_CONFIG.getCurrentUrl()}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`,
            { refreshToken }
          );
          
          const { token, refreshToken: newRefreshToken } = response.data;
          
          // Sauvegarder les nouveaux tokens avec les bonnes clÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©s
          localStorage.setItem('ecolojia_token', token);
          localStorage.setItem('ecolojia_refresh_token', newRefreshToken);
          
          // RÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©essayer la requÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚Âªte originale
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // ÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÂ¢ÃƒÂ¢ÃƒÂ¢ââ€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’ââ‚¬Å¡Ãƒâ€šÃ‚Â°chec du refresh, dÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©connecter l'utilisateur
        localStorage.removeItem('ecolojia_token');
        localStorage.removeItem('ecolojia_refresh_token');
        localStorage.removeItem('ecolojia_user');
        
        // Basculer en mode dÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©mo
        ConfigService.setMode('demo');
        
        // CrÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©er une erreur qui indique qu'on est en mode dÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©mo
        const demoError = new Error('Session expirÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©e - Mode dÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©monstration activÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©') as any;
        demoError.isDemoMode = true;
        demoError.statusCode = 401;
        return Promise.reject(demoError);
      }
    }
    
    // Gestion des autres erreurs
    let errorMessage = ERROR_MESSAGES.SERVER_ERROR;
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = ERROR_MESSAGES.TIMEOUT;
    } else if (!error.response) {
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      switch (error.response.status) {
        case 403:
          errorMessage = ERROR_MESSAGES.FORBIDDEN;
          break;
        case 404:
          errorMessage = ERROR_MESSAGES.NOT_FOUND;
          break;
        case 429:
          errorMessage = ERROR_MESSAGES.QUOTA_EXCEEDED;
          break;
        case 400:
          errorMessage = error.response.data?.message || ERROR_MESSAGES.INVALID_DATA;
          break;
        case 401:
          // Pour les endpoints d'auth, utiliser le message du serveur
          if (isAuthEndpoint) {
            errorMessage = error.response.data?.message || ERROR_MESSAGES.UNAUTHORIZED;
          } else {
            errorMessage = error.response.data?.message || ERROR_MESSAGES.UNAUTHORIZED;
          }
          break;
        default:
          errorMessage = error.response.data?.message || ERROR_MESSAGES.SERVER_ERROR;
      }
    }
    
    // CrÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©er une erreur personnalisÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©e
    const customError = new Error(errorMessage) as any;
    customError.originalError = error;
    customError.statusCode = error.response?.status;
    customError.data = error.response?.data;
    
    return Promise.reject(customError);
  }
);

// Wrapper pour gÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©rer le mode dÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©mo
const makeRequest = async (method: string, url: string, data?: any, config?: any) => {
  // Si on est en mode dÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©mo, utiliser le ConfigService
  if (ConfigService.isDemo()) {
    try {
      const response = await ConfigService.makeRequest(url, {
        method,
        body: data ? JSON.stringify(data) : undefined,
        ...config
      });
      return response;
    } catch (error) {
      console.error('Demo mode error:', error);
      throw error;
    }
  }
  
  // Sinon, utiliser le client axios normal
  const axiosMethod = method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
  
  if (axiosMethod === 'get' || axiosMethod === 'delete') {
    return apiClient[axiosMethod](url, config).then(res => res.data);
  } else {
    return apiClient[axiosMethod](url, data, config).then(res => res.data);
  }
};

// MÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©thodes utilitaires
export const api = {
  // GET
  get: <T = any>(url: string, config?: any) => 
    makeRequest('GET', url, undefined, config) as Promise<T>,
  
  // POST
  post: <T = any>(url: string, data?: any, config?: any) => 
    makeRequest('POST', url, data, config) as Promise<T>,
  
  // PUT
  put: <T = any>(url: string, data?: any, config?: any) => 
    makeRequest('PUT', url, data, config) as Promise<T>,
  
  // PATCH
  patch: <T = any>(url: string, data?: any, config?: any) => 
    makeRequest('PATCH', url, data, config) as Promise<T>,
  
  // DELETE
  delete: <T = any>(url: string, config?: any) => 
    makeRequest('DELETE', url, undefined, config) as Promise<T>,
  
  // Upload de fichier
  upload: <T = any>(url: string, file: File, onProgress?: (progress: number) => void) => {
    if (ConfigService.isDemo()) {
      // Simuler un upload en mode dÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©mo
      return new Promise<T>((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (onProgress) onProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            resolve({
              success: true,
              url: 'https://demo-url.com/file.jpg',
              filename: file.name
            } as any);
          }
        }, 200);
      });
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
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

// Export du client axios pour les cas spÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©ciaux
export { apiClient };

// Export par dÃƒÆ’Ã†â€™Ãƒâ€ ââ‚¬â„¢ÃƒÆ’ââ‚¬Â ÃƒÂ¢ââ€šÂ¬ââ€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢ââ€šÂ¬Ã…Â¡ÃƒÆ’ââ‚¬Å¡Ã‚Â©faut
export default api;


//
// === Anti-double-/api interceptor (auto-fix, generic) ===
(function attachAntiApiInterceptor(){
  try {
    var inst = apiClient;
    if (!inst || !inst.interceptors || !inst.interceptors.request) return;
    if (inst.__antiApiPatched) return;
    inst.__antiApiPatched = true;

    var API_BASE_NORMALIZED = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL ? API_CONFIG.BASE_URL : '').replace(/\/+$/, '');
    inst.interceptors.request.use(function(config){
      try {
        var url = config && config.url ? config.url : '';
        var baseEndsWithApi = /\/api$/i.test(API_BASE_NORMALIZED);
        if (baseEndsWithApi && /^\/api(\/|$)/i.test(url)) {
          config.url = url.replace(/^\/api(\/|$)/i, '/');
        }
      } catch(e){}
      return config;
    });
  } catch(e){}
})();

