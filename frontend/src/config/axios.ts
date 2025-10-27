import axios from 'axios';

// Configuration selon environnement
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

// Instance axios centralisée
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur requêtes : Ajouter token automatiquement
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecolojia_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur réponses : Gérer erreurs globalement
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expiré ou invalide
    if (error.response?.status === 401) {
      localStorage.removeItem('ecolojia_token');
      localStorage.removeItem('ecolojia_user');
      window.location.href = '/login';
    }

    // Erreur serveur
    if (error.response?.status >= 500) {
      console.error('Erreur serveur:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;