// frontend/src/services/apiClient.ts

import axios from 'axios';

// ✅ Base URL dynamique depuis .env (compatible Vite)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backend-working.onrender.com';

// ✅ Création de l'instance Axios avec options globales
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout 10 secondes (optionnel mais conseillé)
});

// ✅ Intercepteur Requête : Ajout automatique du bon token (auth ou démo)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecolojia_token');
    const demoToken = localStorage.getItem('ecolojia_demo_token');

    if (token && !config.url?.includes('demo')) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (demoToken && config.url?.includes('demo')) {
      config.headers.Authorization = `Bearer ${demoToken}`;
    }

    // Log dev uniquement
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Intercepteur Réponse : Gestion des erreurs globales
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      const isDemoMode = localStorage.getItem('ecolojia_demo_mode') === 'true';

      switch (status) {
        case 401:
          // Token expiré ou invalide
          localStorage.removeItem('ecolojia_token');
          localStorage.removeItem('ecolojia_refresh_token');

          if (!isDemoMode) {
            window.location.href = '/auth'; // Rediriger vers la page login
          }
          break;
        case 403:
          console.error('🚫 Accès interdit (403)');
          break;
        case 404:
          console.error('🔍 Ressource non trouvée (404)');
          break;
        case 500:
          console.error('💥 Erreur interne du serveur (500)');
          break;
        default:
          console.warn(`⚠️ Erreur inattendue (${status})`);
      }
    } else if (error.request) {
      console.error('📡 Pas de réponse du serveur');
    } else {
      console.error('❌ Erreur de configuration Axios :', error.message);
    }

    return Promise.reject(error);
  }
);

// ✅ Fonction utilitaire : vérifier si l'utilisateur est connecté
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('ecolojia_token');
  return !!token;
};

// ✅ Export par défaut (instance Axios)
export default apiClient;
