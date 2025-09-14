// PATH: frontend/src/services/api.ts
import axios, { AxiosError, AxiosInstance } from 'axios';
import { ENV } from '../env';
// Import des données mock
import { searchMockProducts, getMockProductById, getTrendingMockProducts } from '../data/mockProducts';
import { getAccessToken, setAccessToken, setRefreshToken, setUser, clearAuth } from './apiClient';

// Vérifier si on est en mode mock
const USE_MOCK = false === true;
console.log('🎭 USE_MOCK:', USE_MOCK);

// Log de debug au chargement
console.log('🔧 API Service loading...');
console.log('📡 API URL configured:', ENV.API_URL);
console.log('🎭 MOCK MODE:', false);

// Types TypeScript
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  profile: {
    language: string;
    theme: string;
    avatarUrl?: string;
  };
  subscription: {
    tier: 'free' | 'premium';
    status: string;
  };
  quotas: {
    scansRemaining: number;
    aiChatsRemaining: number;
  };
}

export interface Product {
  _id: string;
  barcode?: string;
  name: string;
  brand?: string;
  category: 'food' | 'cosmetics' | 'detergents';
  images?: {
    front?: string;
    ingredients?: string;
    nutrition?: string;
  };
  image_url?: string;
  imageUrl?: string;
  scores?: {
    nova?: number;
    nutriscore?: string;
    ecoscore?: string;
    healthScore?: number;
    environmentScore?: number;
  };
  nova_group?: number;
  nutriscore_grade?: string;
  ecoscore_grade?: string;
  ingredients?: any[];
  nutrition?: any;
  allergens?: string[];
  foodData?: any;
  cosmeticsData?: any;
  detergentsData?: any;
}

export interface Analysis {
  productId: string;
  summary: string;
  healthImpact: {
    score: number;
    analysis: string;
    concerns: string[];
    benefits: string[];
  };
  environmentImpact: {
    score: number;
    analysis: string;
  };
  alternatives: any[];
  personalizedAdvice: string;
}

// Utiliser l'instance apiClient depuis apiClient.ts
import { apiClient } from './apiClient';

// Service d'authentification AVEC MOCK
export const authService = {
  async login(credentials: LoginCredentials) {
    console.log('🔐 Auth service login');
    if (USE_MOCK) {
      // Utiliser le authService dédié qui gère le mock
      const authSvc = await import('./authService');
      const user = await authSvc.default.login(credentials);
      return { tokens: { accessToken: 'mock', refreshToken: 'mock' }, user };
    }
    
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { tokens, user } = response.data;
      
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setUser(user);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(userData: RegisterData) {
    console.log('🔐 Auth service register');
    if (USE_MOCK) {
      const authSvc = await import('./authService');
      const user = await authSvc.default.register(userData);
      return { tokens: { accessToken: 'mock', refreshToken: 'mock' }, user };
    }
    
    try {
      const response = await apiClient.post('/auth/register', userData);
      const { tokens, user } = response.data;
      
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      setUser(user);
      
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  async logout() {
    if (USE_MOCK) {
      const authSvc = await import('./authService');
      authSvc.default.logout();
      return;
    }
    
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  },

  async getMe() {
    if (USE_MOCK) {
      const authSvc = await import('./authService');
      return authSvc.default.me();
    }
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async getProfile() {
    if (USE_MOCK) {
      const authSvc = await import('./authService');
      return authSvc.default.me();
    }
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async updateProfile(data: Partial<User>) {
    if (USE_MOCK) {
      console.log('MOCK: Update profile', data);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const updated = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    }
    const response = await apiClient.patch('/auth/profile', data);
    return response.data;
  },

  async changePassword(oldPassword: string, newPassword: string) {
    if (USE_MOCK) {
      console.log('MOCK: Change password');
      return { success: true };
    }
    return apiClient.post('/auth/change-password', { oldPassword, newPassword });
  },

  async refreshToken() {
    if (USE_MOCK) {
      const authSvc = await import('./authService');
      return authSvc.default.refresh();
    }
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

// Service des produits - AVEC MOCK
export const productService = {
  async search(query: string, filters?: any) {
    try {
      if (USE_MOCK) {
        console.log('🎭 MOCK: Recherche de', query);
        const result = searchMockProducts(query, filters);
        console.log('🎭 MOCK: Résultats', result);
        return result;
      }
      
      console.log('🔍 Searching for:', query, 'with filters:', filters);
      const params = new URLSearchParams({ q: query, ...filters });
      const response = await apiClient.get(`/products/search?${params}`);
      console.log('📦 Search response received:', response);
      return response.data;
    } catch (error) {
      console.error('❌ Search error:', error);
      throw error;
    }
  },

  async getByBarcode(barcode: string) {
    if (USE_MOCK) {
      const products = searchMockProducts(barcode);
      if (products.products.length > 0) {
        return products.products[0];
      }
      throw new Error('Produit non trouvé');
    }
    
    try {
      const response = await apiClient.get(`/products/barcode/${barcode}`);
      return response.data;
    } catch (error) {
      console.error('Get by barcode error:', error);
      throw error;
    }
  },

  async getById(id: string) {
    if (USE_MOCK) {
      const product = getMockProductById(id);
      if (!product) throw new Error('Produit non trouvé');
      return product;
    }
    
    try {
      const response = await apiClient.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get by ID error:', error);
      throw error;
    }
  },

  async getTrending(category?: string) {
    if (USE_MOCK) {
      return { products: getTrendingMockProducts(category) };
    }
    
    try {
      const params = category ? `?category=${category}` : '';
      const response = await apiClient.get(`/products/trending${params}`);
      return response.data;
    } catch (error) {
      console.error('Get trending error:', error);
      throw error;
    }
  },

  async getAlternatives(productId: string) {
    if (USE_MOCK) {
      return { alternatives: getTrendingMockProducts().slice(0, 3) };
    }
    
    try {
      const response = await apiClient.get(`/products/${productId}/alternatives`);
      return response.data;
    } catch (error) {
      console.error('Get alternatives error:', error);
      throw error;
    }
  },

  async reportProduct(productId: string, reason: string) {
    if (USE_MOCK) {
      console.log('MOCK: Report product', productId, reason);
      return { success: true };
    }
    return apiClient.post(`/products/${productId}/report`, { reason });
  },
};

// Service d'analyse AVEC MOCK
export const analysisService = {
  async analyzeProduct(data: { barcode?: string; name?: string; image?: string }) {
    if (USE_MOCK) {
      return mockService.analysis.analyzeProduct(data);
    }
    try {
      const response = await apiClient.post('/products/analyze', data);
      return response.data;
    } catch (error) {
      console.error('Analyze product error:', error);
      throw error;
    }
  },

  async analyzeFood(productData: any) {
    if (USE_MOCK) {
      return mockService.analysis.analyzeProduct(productData);
    }
    const response = await apiClient.post('/analyze/food', productData);
    return response.data;
  },

  async analyzeCosmetic(productData: any) {
    if (USE_MOCK) {
      return mockService.analysis.analyzeProduct(productData);
    }
    const response = await apiClient.post('/analyze/cosmetic', productData);
    return response.data;
  },

  async analyzeDetergent(productData: any) {
    if (USE_MOCK) {
      return mockService.analysis.analyzeProduct(productData);
    }
    const response = await apiClient.post('/analyze/detergent', productData);
    return response.data;
  },

  async getHistory(page = 1, limit = 20) {
    if (USE_MOCK) {
      return mockService.analysis.getHistory(page, limit);
    }
    const response = await apiClient.get(`/analyze/history?page=${page}&limit=${limit}`);
    return response.data;
  },
};

// Service IA / Chat AVEC MOCK
export const aiService = {
  async chat(message: string, context?: any) {
    if (USE_MOCK) {
      return mockService.ai.chat(message, context);
    }
    try {
      const response = await apiClient.post('/ai/chat', { message, context });
      return response.data;
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  },

  async getSuggestions(productId?: string) {
    if (USE_MOCK) {
      return mockService.ai.getSuggestions(productId);
    }
    const params = productId ? `?productId=${productId}` : '';
    const response = await apiClient.get(`/ai/suggestions${params}`);
    return response.data;
  },

  async getPersonalizedAdvice(profile: any) {
    if (USE_MOCK) {
      return { 
        advice: "Privilégiez les aliments peu transformés et bio pour une santé optimale. Évitez les produits avec des additifs E-numbers et privilégiez les labels de qualité." 
      };
    }
    const response = await apiClient.post('/ai/advice', { profile });
    return response.data;
  },
};

// Service Dashboard AVEC MOCK
export const dashboardService = {
  async getStats(period: 'week' | 'month' | 'year' = 'month') {
    if (USE_MOCK) {
      return mockService.dashboard.getStats(period);
    }
    try {
      const response = await apiClient.get(`/dashboard/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  },

  async getInsights() {
    if (USE_MOCK) {
      return mockService.dashboard.getInsights();
    }
    const response = await apiClient.get('/dashboard/insights');
    return response.data;
  },

  async exportData(format: 'pdf' | 'json' = 'pdf') {
    if (USE_MOCK) {
      return mockService.dashboard.exportData(format);
    }
    const response = await apiClient.get(`/dashboard/export?format=${format}`, {
      responseType: format === 'pdf' ? 'blob' : 'json'
    });
    return response.data;
  },

  async getAchievements() {
    if (USE_MOCK) {
      return mockService.dashboard.getAchievements();
    }
    const response = await apiClient.get('/dashboard/achievements');
    return response.data;
  },
};

// Service Paiement AVEC MOCK
export const paymentService = {
  async createCheckoutSession(plan: 'monthly' | 'annual') {
    if (USE_MOCK) {
      return mockService.payment.createCheckoutSession(plan);
    }
    try {
      const response = await apiClient.post('/payment/create-checkout', { plan });
      return response.data;
    } catch (error) {
      console.error('Create checkout error:', error);
      throw error;
    }
  },

  async getSubscription() {
    if (USE_MOCK) {
      return mockService.payment.getSubscription();
    }
    const response = await apiClient.get('/payment/subscription');
    return response.data;
  },

  async cancelSubscription() {
    if (USE_MOCK) {
      console.log('MOCK: Cancel subscription');
      return { success: true, message: 'Abonnement annulé (mock)' };
    }
    const response = await apiClient.post('/payment/cancel-subscription');
    return response.data;
  },

  async resumeSubscription() {
    if (USE_MOCK) {
      console.log('MOCK: Resume subscription');
      return { success: true, message: 'Abonnement repris (mock)' };
    }
    const response = await apiClient.post('/payment/resume-subscription');
    return response.data;
  },
};

// Service Affiliation
export const affiliateService = {
  async generateLink(productId: string, partner: string) {
    if (USE_MOCK) {
      return {
        url: `https://example.com/affiliate?product=${productId}&partner=${partner}`,
        trackingId: `mock-${Date.now()}`
      };
    }
    const response = await apiClient.get(`/partners/affiliate-link`, {
      params: { productId, partner }
    });
    return response.data;
  },

  async trackClick(linkId: string) {
    if (USE_MOCK) {
      console.log('MOCK: Track affiliate click', linkId);
      return { success: true };
    }
    return apiClient.post('/partners/track-click', { linkId });
  },
};

// Service de recherche Algolia
export const searchService = {
  async searchProducts(query: string, options?: any) {
    if (USE_MOCK) {
      return searchMockProducts(query, options);
    }
    
    // Pour Algolia, on peut soit passer par le backend, soit utiliser directement
    if (ENV.ALGOLIA.APP_ID && ENV.ALGOLIA.SEARCH_KEY) {
      console.log('Algolia direct search not implemented yet');
    }
    
    // Fallback sur l'API backend
    const response = await apiClient.post('/algolia/search', {
      query,
      ...options
    });
    return response.data;
  },

  async getSearchConfig() {
    if (USE_MOCK) {
      return {
        appId: 'mock-app-id',
        searchKey: 'mock-search-key',
        indices: {
          products: 'products',
          categories: 'categories'
        }
      };
    }
    const response = await apiClient.get('/algolia/config');
    return response.data;
  },
};

// Service historique
export const historyService = {
  getHistory: (page = 1, limit = 20) => analysisService.getHistory(page, limit),
  
  async exportHistory(format = 'json') {
    if (USE_MOCK) {
      const history = await mockService.analysis.getHistory(1, 100);
      return format === 'json' ? history : new Blob([JSON.stringify(history)]);
    }
    const response = await apiClient.get('/analyze/history?limit=100');
    return response.data;
  },
  
  clearHistory: async () => {
    if (USE_MOCK) {
      console.log('MOCK: Clear history');
      return { success: true };
    }
    return apiClient.delete('/analyze/history');
  }
};

// Service Quota
export const quotaService = {
  async getQuotas() {
    if (USE_MOCK) {
      return mockService.quota.getQuotas();
    }
    const response = await apiClient.get('/user/quotas');
    return response.data;
  },
  
  async consumeQuota(type: 'scan' | 'chat') {
    if (USE_MOCK) {
      return mockService.quota.updateQuota(type);
    }
    const response = await apiClient.post('/user/consume-quota', { type });
    return response.data;
  }
};

// Fonction utilitaire pour gérer les erreurs
export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
  }
  return 'Une erreur est survenue';
}

// Export default
export default apiClient;

// Alias pour compatibilité
export const userService = authService;
export const visionService = { 
  analyzeImage: async (file: File) => {
    if (USE_MOCK) {
      console.log('MOCK: Analyze image');
      return {
        productName: 'Produit détecté',
        confidence: 0.95,
        category: 'food'
      };
    }
    console.warn('Vision service non implémenté');
    return null;
  }
};

// Log de confirmation
console.log('✅ API Service loaded successfully with full mock support');