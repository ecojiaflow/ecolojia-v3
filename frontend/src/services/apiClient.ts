// frontend/src/services/apiClient.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api.config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // Utilise la configuration automatique
    const baseURL = API_CONFIG.getCurrentApiUrl();
    
    this.client = axios.create({
      baseURL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('ecolojia_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log en développement
        if (API_CONFIG.isDevelopment) {
          console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        // Log les erreurs en développement
        if (API_CONFIG.isDevelopment) {
          console.error('❌ API Error:', error.response?.status, error.response?.data);
        }

        // Gestion token expiré
        if (error.response?.status === 401) {
          localStorage.removeItem('ecolojia_token');
          localStorage.removeItem('ecolojia_refresh_token');
          window.location.href = '/auth';
        }

        return Promise.reject(error);
      }
    );
  }

  // Méthode pour changer dynamiquement l'URL (utile pour les tests)
  updateBaseURL(newURL: string) {
    this.client.defaults.baseURL = newURL;
    console.log('🔄 API URL mise à jour:', newURL);
  }

  // Méthodes HTTP
  get<T = any>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: any) {
    return this.client.put<T>(url, data, config);
  }

  patch<T = any>(url: string, data?: any, config?: any) {
    return this.client.patch<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: any) {
    return this.client.delete<T>(url, config);
  }
}

// Export une instance unique
export const apiClient = new ApiClient();

// Export aussi la configuration pour debug
export { API_CONFIG };