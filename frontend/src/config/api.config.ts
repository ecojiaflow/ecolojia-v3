// PATH: frontend/src/config/api.config.ts

const API_CONFIG = {
  development: {
    url: 'http://localhost:5001', // ⚠️ PORT 5001, PAS 5000 !
    timeout: 30000
  },
  production: {
    url: 'https://ecolojia-backendvf.onrender.com',
    timeout: 30000
  },
  
  // Méthode pour obtenir l'URL selon l'environnement
  getCurrentApiUrl: () => {
    // Priorité : variable d'environnement > environnement détecté
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    // Détection automatique
    if (import.meta.env.PROD) {
      return API_CONFIG.production.url;
    }
    
    return API_CONFIG.development.url;
  },
  
  // Endpoints principaux avec /api/ inclus
  endpoints: {
    // Auth
    login: '/api/auth/login',
    register: '/api/auth/register',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    
    // Analysis
    analyzeBarcode: '/api/analysis/barcode',
    analyzeManual: '/api/analysis/manual',
    analyzeImage: '/api/vision/analyze-image',
    
    // Dashboard
    dashboardStats: '/api/dashboard/stats',
    quota: '/api/quota', // Endpoint correct pour les quotas
    
    // Products
    searchProducts: '/api/products/search',
    getProduct: '/api/products/:id',
    getProductByBarcode: '/api/products/barcode/:code',
    
    // User
    profile: '/api/user/profile',
    updateProfile: '/api/user/profile',
    preferences: '/api/user/preferences',
    
    // Analyses history
    analysesHistory: '/api/analyses/history',
    analysesRecent: '/api/analyses/recent',
    
    // Export
    exportAnalysis: '/api/analysis/:id/export',
    
    // Favorites
    addFavorite: '/api/analysis/:id/favorite',
    getFavorites: '/api/user/favorites'
  },
  
  // Headers par défaut
  getDefaultHeaders: () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },
  
  // Vérifier si on est en production
  isProduction: () => {
    return import.meta.env.PROD || window.location.hostname !== 'localhost';
  }
};

export default API_CONFIG;