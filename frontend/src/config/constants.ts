// PATH: frontend/src/config/constants.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com';

export const ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me'
  },
  ANALYSIS: {
    BASE: '/api/analysis',
    BARCODE: '/api/analysis/barcode'
  },
  PRODUCTS: {
    SEARCH: '/api/algolia/search',
    BARCODE: '/api/products/barcode'
  },
  HISTORY: '/api/history',
  DASHBOARD: '/api/dashboard/stats',
  PAYMENT: {
    CHECKOUT: '/api/payment/create-checkout'
  }
};

