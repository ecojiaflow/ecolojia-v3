// src/config/api.config.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    // Auth
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      ME: '/api/auth/me',
      LOGOUT: '/api/auth/logout',
    },
    // Products - UN SEUL endpoint de recherche
    PRODUCTS: {
      SEARCH: '/api/algolia/search',  // SEULEMENT celui-ci
      GET_BY_ID: '/api/products/:id',
      GET_BY_BARCODE: '/api/products/barcode/:barcode',
    },
    // Analysis
    ANALYSIS: {
      ANALYZE: '/api/analysis',  // UN SEUL endpoint
      BY_BARCODE: '/api/analysis/barcode',
      HISTORY: '/api/history',
    },
    // Dashboard
    DASHBOARD: {
      STATS: '/api/dashboard/stats',
      RECENT: '/api/dashboard/recent',
    },
    // Algolia
    ALGOLIA: {
      SEARCH: '/api/algolia/search',
      STATS: '/api/algolia/stats',
    }
  }
};

export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, params[key]);
    });
  }
  return url;
};
