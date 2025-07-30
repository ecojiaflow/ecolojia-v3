// frontend/src/config/api.config.ts

// Configuration API avec auto-détection
export const API_CONFIG = {
  // Développement local
  DEVELOPMENT_URL: 'http://localhost:5001',
  
  // Production (votre backend Render)
  PRODUCTION_URL: 'https://ecolojia-backend.onrender.com',
  
  // Timeout par défaut
  TIMEOUT: 30000, // 30 secondes pour Render qui peut être lent au démarrage
  
  // Environnement
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  
  // Méthode pour obtenir l'URL courante
  getCurrentApiUrl(): string {
    // D'abord vérifier les variables d'environnement
    if (import.meta.env.VITE_API_URL) {
      console.log('🔗 Using VITE_API_URL:', import.meta.env.VITE_API_URL);
      return import.meta.env.VITE_API_URL;
    }
    
    // Sinon, utiliser la config par défaut selon l'environnement
    const url = this.isDevelopment ? this.DEVELOPMENT_URL : this.PRODUCTION_URL;
    console.log('🔗 Using default URL:', url, '(env:', import.meta.env.MODE, ')');
    return url;
  },
  
  // Endpoints principaux
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    
    // Dashboard
    DASHBOARD_STATS: '/dashboard/stats',
    DASHBOARD_EXPORT: '/dashboard/export',
    
    // Products
    PRODUCTS_SEARCH: '/products/search',
    PRODUCTS_SCAN: '/products/scan',
    PRODUCTS_ANALYZE: '/products/analyze',
    
    // User
    USER_PROFILE: '/user/profile',
    USER_PREFERENCES: '/user/preferences',
    USER_HISTORY: '/user/history',
    
    // AI
    AI_CHAT: '/ai/chat',
    AI_ANALYZE: '/ai/analyze',
  }
};

// Helper pour construire les URLs complètes
export function buildApiUrl(endpoint: string): string {
  const baseUrl = API_CONFIG.getCurrentApiUrl();
  // S'assurer qu'il n'y a pas de double slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}/api${cleanEndpoint}`;
}

// Export pour utilisation directe
export default API_CONFIG;