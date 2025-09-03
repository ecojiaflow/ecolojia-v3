// PATH: frontend/src/services/index.ts

// Re-export API client
export { http, get, post } from './api';

// Auth service exports
export { 
  authService,
  login,
  logout,
  register,
  getToken,
  isAuthenticated,
  getCurrentUser
} from './authService';

// Product service exports
export {
  searchProducts,
  getProductByBarcode,
  getProductById,
  getTrendingProducts,
  getProductAlternatives
} from './productService';

// Analysis service exports
export {
  analyzeProduct,
  getAnalysisHistory,
  resetQuota
} from './analysisService';

// Search service exports  
export {
  searchWithAlgolia,
  getAlgoliaConfig
} from './searchService';

// Notification service
export { notifications } from './notificationService';

// Chat service
export { chatService, createProductContext } from './chat/ChatService';

// Types exports
export type {
  User,
  Product,
  AnalysisResult,
  SearchResult,
  ChatMessage,
  ChatResponse,
  ProductContext
} from '../types';

// Utility functions
export const api = {
  setAuthToken: (token: string | null) => {
    if (token) {
      localStorage.setItem('ecolojia_token', token);
    } else {
      localStorage.removeItem('ecolojia_token');
    }
  },
  
  getAuthToken: () => {
    return localStorage.getItem('ecolojia_token');
  },
  
  clearAuth: () => {
    localStorage.removeItem('ecolojia_token');
    localStorage.removeItem('ecolojia_user');
  },
  
  isDemo: () => {
    return localStorage.getItem('ecolojia_demo_mode') === 'true';
  }
};

// Service health check
export const checkServicesHealth = async () => {
  const results = {
    api: false,
    auth: false,
    search: false
  };
  
  try {
    // Check API
    await get('/health');
    results.api = true;
  } catch (e) {
    console.error('API health check failed:', e);
  }
  
  try {
    // Check auth
    const token = getToken();
    results.auth = !!token;
  } catch (e) {
    console.error('Auth check failed:', e);
  }
  
  try {
    // Check search (if needed)
    const config = await getAlgoliaConfig();
    results.search = !!config;
  } catch (e) {
    console.error('Search check failed:', e);
  }
  
  return results;
};

// Default export for convenience
export default {
  auth: authService,
  api: { get, post },
  search: { searchProducts, searchWithAlgolia },
  analyze: { analyzeProduct },
  notifications,
  chat: chatService,
  utils: api
};
