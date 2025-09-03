// Configuration API
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:10000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
};

export const ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh'
  },
  
  // Analysis
  analysis: {
    analyze: '/analysis',
    barcode: '/analysis/barcode',
    manual: '/analysis/manual',
    batch: '/analysis/batch'
  },
  
  // Products
  products: {
    search: '/products/search',
    get: (id: string) => `/products/${id}`,
    recent: '/products/recent'
  },
  
  // Vision
  vision: {
    analyze: '/vision/analyze-image'
  },
  
  // Cosmetics
  cosmetics: {
    analyze: '/cosmetics/analyze',
    health: '/cosmetics/health'
  },
  
  // Detergents
  detergents: {
    analyze: '/detergents/analyze',
    health: '/detergents/health'
  },
  
  // AI
  ai: {
    chat: '/ai/chat'
  }
};
