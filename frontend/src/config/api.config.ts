// api.config.ts - Configuration pour backend Render (production)
export const API_CONFIG = {
  // Utiliser le backend Render en production
  BASE_URL: import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com',
  TIMEOUT: 30000,
  
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      PROFILE: '/api/users/me',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh'
    },
    USERS: {
      PROFILE: '/api/users/me',
      UPDATE: '/api/users/me'
    },
    ANALYSIS: {
      MANUAL: '/api/analysis/manual',
      BARCODE: '/api/analysis/barcode',
      VISION: '/api/vision/analyze-image',
      PING: '/api/analysis/ping',
      STATUS: '/api/analysis/_service/status'
    },
    DASHBOARD: {
      STATS: '/api/dashboard/stats',
      HISTORY: '/api/dashboard/history',
      WEEKLY_SUMMARY: '/api/dashboard/weekly-summary',
      RECOMMENDATIONS: '/api/dashboard/recommendations',
      ACHIEVEMENTS: '/api/dashboard/achievements'
    },
    HISTORY: {
      LIST: '/api/history',
      COUNT: '/api/history/count'
    },
    PRODUCTS: {
      SEARCH: '/api/algolia/search',
      GET_BY_ID: '/api/products',
      STATS: '/api/products/stats',
      POPULAR: '/api/products/popular',
      TRENDING: '/api/products/trending',
      BARCODE: '/api/products/barcode'
    }
  }
};

// Helper pour construire les URLs complÃ¨tes
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper pour les headers par dÃ©faut
export const getDefaultHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = localStorage.getItem('ecolojia_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};


