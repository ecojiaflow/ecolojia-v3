// PATH: frontend/src/config/api.config.ts
/**
 * Configuration centralisÃƒÆ’Ã‚Â©e pour l'API
 */

// URLs de base selon l'environnement
const API_URLS = {
  development: import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com',
  production: import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com',
  demo: '/demo' // Mode dÃƒÆ’Ã‚Â©mo local
} as const;

// DÃƒÆ’Ã‚Â©terminer l'environnement actuel
const getCurrentEnvironment = (): keyof typeof API_URLS => {
  // Si on est en mode dÃƒÆ’Ã‚Â©mo explicite
  if (import.meta.env.VITE_APP_MODE === 'demo') return 'demo';
  
  // Si on est en production
  if (import.meta.env.VITE_IS_PRODUCTION === 'true' || import.meta.env.MODE === 'production') {
    return 'production';
  }
  
  // Sinon, dÃƒÆ’Ã‚Â©veloppement
  return 'development';
};

// Configuration principale
export const API_CONFIG = {
  // URL de base dynamique
  BASE_URL: API_URLS[getCurrentEnvironment()],
  
  // Fonction pour obtenir l'URL courante
  getCurrentUrl: () => API_URLS[getCurrentEnvironment()],
  
  // Timeout des requÃƒÆ’Ã‚Âªtes (en ms)
  TIMEOUT: 30000,
  
  // Headers par dÃƒÆ’Ã‚Â©faut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Endpoints de l'API
  ENDPOINTS: {
    // Authentification
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      ME: '/auth/me',
      VERIFY_EMAIL: '/auth/verify-email',
      RESET_PASSWORD: '/auth/reset-password',
      CHANGE_PASSWORD: '/auth/change-password',
    },
    
    // Utilisateur
    USER: {
      PROFILE: '/users/profile',
      UPDATE: '/users/profile',
      PREFERENCES: '/users/preferences',
      DELETE: '/users/account',
      EXPORT_DATA: '/users/export-data',
      UPLOAD_AVATAR: '/users/avatar',
    },
    
    // Produits
    PRODUCTS: {
      SEARCH: '/products/search',
      GET_BY_ID: '/products',
      GET_BY_BARCODE: '/products/barcode',
      CREATE: '/products',
      UPDATE: '/products',
      TRENDING: '/products/trending',
      CATEGORIES: '/products/categories',
    },
    
    // Analyses
    ANALYSIS: {
      ANALYZE: '/analysis/analyze',
      ANALYZE_BARCODE: '/analysis/barcode',
      ANALYZE_IMAGE: '/analysis/image',
      ANALYZE_MANUAL: '/analysis/manual',
      GET_BY_ID: '/analysis',
      HISTORY: '/analysis/history',
    },
    
    // Dashboard
    DASHBOARD: {
      STATS: '/dashboard/stats',
      INSIGHTS: '/dashboard/insights',
      WIDGETS: '/dashboard/widgets',
      EXPORT: '/dashboard/export',
    },
    
    // Historique
    HISTORY: '/history',
    
    // Favoris
    FAVORITES: {
      LIST: '/favorites',
      ADD: '/favorites',
      REMOVE: '/favorites',
      LISTS: '/favorites/lists',
    },
    
    // Vision/OCR
    VISION: {
      ANALYZE: '/vision/analyze-image',
      STATUS: '/vision/status',
    },
    
    // Algolia (proxy)
    ALGOLIA: {
      SEARCH: '/algolia/search',
      TRENDING: '/algolia/trending',
    },
    
    // Abonnements
    SUBSCRIPTION: {
      PLANS: '/subscription/plans',
      CURRENT: '/subscription/current',
      SUBSCRIBE: '/subscription/subscribe',
      CANCEL: '/subscription/cancel',
      UPDATE: '/subscription/update',
      HISTORY: '/subscription/history',
    },
    
    // Chat IA
    AI_CHAT: {
      SEND: '/ai/chat',
      HISTORY: '/ai/chat/history',
      CLEAR: '/ai/chat/clear',
    },
    
    // Notifications
    NOTIFICATIONS: {
      LIST: '/notifications',
      MARK_READ: '/notifications/read',
      SETTINGS: '/notifications/settings',
    },
    
    // Admin (si applicable)
    ADMIN: {
      USERS: '/admin/users',
      PRODUCTS: '/admin/products',
      ANALYTICS: '/admin/analytics',
      REPORTS: '/admin/reports',
    }
  },
  
  // ClÃƒÆ’Ã‚Â©s de stockage local
  STORAGE_KEYS: {
    TOKEN: 'ecolojia_token',
    REFRESH_TOKEN: 'ecolojia_refresh_token',
    USER: 'ecolojia_user',
    PREFERENCES: 'ecolojia_preferences',
    THEME: 'ecolojia_theme',
    LANGUAGE: 'ecolojia_language',
    ONBOARDING: 'ecolojia_onboarding_completed',
  },
  
  // Configuration des quotas
  QUOTAS: {
    FREE: {
      SCANS_PER_MONTH: 30,
      AI_CHATS_PER_MONTH: 5,
      EXPORT_ENABLED: false,
      ADVANCED_ANALYTICS: false,
    },
    PREMIUM: {
      SCANS_PER_MONTH: -1, // IllimitÃƒÆ’Ã‚Â©
      AI_CHATS_PER_MONTH: 500,
      EXPORT_ENABLED: true,
      ADVANCED_ANALYTICS: true,
    },
    FAMILY: {
      SCANS_PER_MONTH: -1, // IllimitÃƒÆ’Ã‚Â©
      AI_CHATS_PER_MONTH: 2500, // 500 par membre
      EXPORT_ENABLED: true,
      ADVANCED_ANALYTICS: true,
      MAX_MEMBERS: 5,
    }
  }
};

// Messages d'erreur standardisÃƒÆ’Ã‚Â©s
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. VÃƒÆ’Ã‚Â©rifiez votre connexion internet.',
  SERVER_ERROR: 'Erreur serveur. Veuillez rÃƒÆ’Ã‚Â©essayer plus tard.',
  UNAUTHORIZED: 'Non autorisÃƒÆ’Ã‚Â©. Veuillez vous reconnecter.',
  FORBIDDEN: 'AccÃƒÆ’Ã‚Â¨s refusÃƒÆ’Ã‚Â©. Vous n\'avez pas les permissions nÃƒÆ’Ã‚Â©cessaires.',
  NOT_FOUND: 'Ressource introuvable.',
  INVALID_DATA: 'Les donnÃƒÆ’Ã‚Â©es fournies sont invalides.',
  TIMEOUT: 'La requÃƒÆ’Ã‚Âªte a pris trop de temps. Veuillez rÃƒÆ’Ã‚Â©essayer.',
  QUOTA_EXCEEDED: 'Quota dÃƒÆ’Ã‚Â©passÃƒÆ’Ã‚Â©. Passez ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  Premium pour continuer.',
  SESSION_EXPIRED: 'Votre session a expirÃƒÆ’Ã‚Â©. Veuillez vous reconnecter.',
  TOKEN_REFRESH_FAILED: 'Impossible de rafraÃƒÆ’Ã‚Â®chir votre session.',
  OFFLINE: 'Vous ÃƒÆ’Ã‚Âªtes hors ligne. VÃƒÆ’Ã‚Â©rifiez votre connexion.',
} as const;

// Configuration des webhooks (si nÃƒÆ’Ã‚Â©cessaire)
export const WEBHOOK_EVENTS = {
  USER_REGISTERED: 'user.registered',
  USER_UPGRADED: 'user.upgraded',
  SCAN_COMPLETED: 'scan.completed',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
} as const;

// Configuration des limites
export const LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_INGREDIENTS_LENGTH: 5000,
  MAX_PRODUCT_NAME_LENGTH: 200,
  MAX_SEARCH_QUERY_LENGTH: 100,
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
} as const;

// Export des types
export type ApiEndpoint = typeof API_CONFIG.ENDPOINTS;
export type StorageKey = keyof typeof API_CONFIG.STORAGE_KEYS;
export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];
export type Environment = keyof typeof API_URLS;
