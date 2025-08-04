// frontend/src/config/api.config.ts

// Configuration API avec auto-détection
export const API_CONFIG = {
  // Développement local
  DEVELOPMENT_URL: 'http://localhost:5001',
  
  // Production (votre backend Render)
  PRODUCTION_URL: 'https://ecolojia-backend.onrender.com',
  
  // Timeout par défaut
  TIMEOUT: 30000, // 30 secondes pour Render qui peut être lent au démarrage
  
  // Retry configuration
  RETRY: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
  },
  
  // Rate limit configuration
  RATE_LIMIT: {
    retryAfter429: true,
    showToasts: true,
    queueRequests: true
  },
  
  // Environnement
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  
  // Méthode pour obtenir l'URL courante (SANS /api qui est ajouté par apiClient)
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
  
  // Endpoints principaux (SANS /api au début)
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    CHANGE_PASSWORD: '/auth/change-password',
    
    // Dashboard
    DASHBOARD_STATS: '/dashboard/stats',
    DASHBOARD_EXPORT: '/dashboard/export',
    DASHBOARD_HISTORY: '/dashboard/history',
    DASHBOARD_WEEKLY: '/dashboard/weekly-summary',
    DASHBOARD_ACHIEVEMENTS: '/dashboard/achievements',
    DASHBOARD_RECOMMENDATIONS: '/dashboard/recommendations',
    
    // Products
    PRODUCTS_SEARCH: '/products/search',
    PRODUCTS_SCAN: '/products/scan',
    PRODUCTS_ANALYZE: '/products/analyze',
    PRODUCTS_BY_BARCODE: '/products/barcode',
    PRODUCTS_TRENDING: '/products/trending',
    
    // Analysis
    ANALYSIS_FOOD: '/analysis/food',
    ANALYSIS_COSMETIC: '/analysis/cosmetic',
    ANALYSIS_DETERGENT: '/analysis/detergent',
    
    // User
    USER_PROFILE: '/user/profile',
    USER_PREFERENCES: '/user/preferences',
    USER_HISTORY: '/user/history',
    USER_QUOTAS: '/quota/status',
    
    // AI
    AI_CHAT: '/ai/chat',
    AI_ANALYZE: '/ai/analyze',
    AI_HISTORY: '/ai/chat/history',
    AI_SUGGESTIONS: '/ai/suggestions',
    
    // Subscriptions
    SUBSCRIPTION_STATUS: '/subscription/status',
    SUBSCRIPTION_PLANS: '/subscription/plans',
    SUBSCRIPTION_UPGRADE: '/subscription/upgrade',
    SUBSCRIPTION_CANCEL: '/subscription/cancel',
    
    // GDPR
    GDPR_EXPORT: '/gdpr/export',
    GDPR_DELETE: '/gdpr/delete',
    GDPR_CONSENT: '/gdpr/consent'
  }
};

// Helper pour construire les URLs complètes (si nécessaire)
export function buildApiUrl(endpoint: string): string {
  const baseUrl = API_CONFIG.getCurrentApiUrl();
  // S'assurer qu'il n'y a pas de double slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}/api${cleanEndpoint}`;
}

// Helper pour obtenir un endpoint
export function getEndpoint(key: keyof typeof API_CONFIG.ENDPOINTS): string {
  return API_CONFIG.ENDPOINTS[key];
}

// Configuration des headers par défaut
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Client-Version': '3.0.0',
  'X-Client-Platform': 'web'
};

// Configuration pour les différents types de requêtes
export const REQUEST_CONFIG = {
  // Requêtes qui ne doivent pas être retentées
  noRetry: [
    API_CONFIG.ENDPOINTS.LOGIN,
    API_CONFIG.ENDPOINTS.REGISTER,
    API_CONFIG.ENDPOINTS.FORGOT_PASSWORD
  ],
  
  // Requêtes qui peuvent être mises en cache
  cacheable: [
    API_CONFIG.ENDPOINTS.PRODUCTS_TRENDING,
    API_CONFIG.ENDPOINTS.USER_PROFILE,
    API_CONFIG.ENDPOINTS.SUBSCRIPTION_PLANS
  ],
  
  // Requêtes prioritaires (bypass queue)
  priority: [
    API_CONFIG.ENDPOINTS.LOGIN,
    API_CONFIG.ENDPOINTS.REFRESH,
    API_CONFIG.ENDPOINTS.DASHBOARD_STATS
  ]
};

// Export pour utilisation directe
export default API_CONFIG;