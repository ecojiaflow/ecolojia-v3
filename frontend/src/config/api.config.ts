// src/config/api.config.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    // Auth - UN SEUL endpoint pour le profil
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      ME: '/api/users/me',  // ou /api/auth/me selon ce qui marche
      LOGOUT: '/api/auth/logout',
      PROFILE: '/api/users/me', // alias pour compatibilité
    },
    // Products
    PRODUCTS: {
      SEARCH: '/api/algolia/search',
      GET_BY_ID: '/api/products/:id',
      GET_BY_BARCODE: '/api/products/barcode/:barcode',
    },
    // Analysis
    ANALYSIS: {
      ANALYZE: '/api/analysis',
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

// Endpoints publics (pas besoin d'auth)
export const PUBLIC_ENDPOINTS = [
  '/api/algolia/search',
  '/api/products/search',
  '/api/analysis',
  '/api/products/barcode',
];

export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, params[key]);
    });
  }
  return url;
};

export const isPublicEndpoint = (endpoint: string): boolean => {
  return PUBLIC_ENDPOINTS.some(pe => endpoint.includes(pe));
};
