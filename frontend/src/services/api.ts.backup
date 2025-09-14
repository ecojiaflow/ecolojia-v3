// PATH: frontend/src/services/api.ts
import axios from 'axios';
import apiClient from './apiClient';
import authService from './authService';

// Re-export types from authService
export type { User, LoginPayload as LoginCredentials, RegisterPayload as RegisterData } from './authService';

// Product types
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
  ingredients?: any[];
  nutrition?: any;
}

// Auth Service (using the dedicated authService)
export { authService };

// Product Service
export const productService = {
    async search(query: string, filters?: any) {
    console.log('🔍 Searching products:', query);
    try {
      const params = new URLSearchParams({ q: query, ...filters });
      const url = `/products/search?${params}`;
      console.log('📡 API URL:', url);
      
      const response = await apiClient.get(url);
      console.log('📦 Raw API Response:', response);
      console.log('📦 Response data:', response.data);
      console.log('📦 Response status:', response.status);
      
      return response.data;
    } catch (error) {
      console.error('❌ Search error:', error);
      throw error;
    }
  },

  async getByBarcode(barcode: string) {
    const response = await apiClient.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  async getTrending(category?: string) {
    const params = category ? `?category=${category}` : '';
    const response = await apiClient.get(`/products/trending${params}`);
    return response.data;
  },

  async getAlternatives(productId: string) {
    const response = await apiClient.get(`/products/${productId}/alternatives`);
    return response.data;
  },

  async analyze(data: { barcode?: string; name?: string; image?: string }) {
    const response = await apiClient.post('/products/analyze', data);
    return response.data;
  }
};

// Analysis Service
export const analysisService = {
  async analyzeProduct(data: any) {
    return productService.analyze(data);
  },

  async analyzeAuto(productData: any) {
    const response = await apiClient.post('/analyze/auto', productData);
    return response.data;
  },

  async analyzeFood(productData: any) {
    const response = await apiClient.post('/analyze/food', productData);
    return response.data;
  },

  async analyzeCosmetic(productData: any) {
    const response = await apiClient.post('/analyze/cosmetic', productData);
    return response.data;
  },

  async analyzeDetergent(productData: any) {
    const response = await apiClient.post('/analyze/detergent', productData);
    return response.data;
  },

  async getHistory(page = 1, limit = 20) {
    const response = await apiClient.get(`/analyze/history?page=${page}&limit=${limit}`);
    return response.data;
  }
};

// Dashboard Service
export const dashboardService = {
  async getStats(period: 'week' | 'month' | 'year' = 'month') {
    const response = await apiClient.get(`/dashboard/stats?period=${period}`);
    return response.data;
  },

  async getInsights() {
    const response = await apiClient.get('/dashboard/insights');
    return response.data;
  },

  async exportData(format: 'pdf' | 'json' = 'pdf') {
    const response = await apiClient.get(`/dashboard/export?format=${format}`, {
      responseType: format === 'pdf' ? 'blob' : 'json'
    });
    return response.data;
  },

  async getAchievements() {
    const response = await apiClient.get('/dashboard/achievements');
    return response.data;
  }
};

// AI Service
export const aiService = {
  async chat(message: string, context?: any) {
    const response = await apiClient.post('/ai/chat', { message, context });
    return response.data;
  },

  async getSuggestions(productId?: string) {
    const params = productId ? `?productId=${productId}` : '';
    const response = await apiClient.get(`/ai/suggestions${params}`);
    return response.data;
  }
};

// Payment Service
export const paymentService = {
  async createCheckoutSession(plan: 'monthly' | 'annual') {
    const response = await apiClient.post('/payment/create-checkout', { plan });
    return response.data;
  },

  async getSubscription() {
    const response = await apiClient.get('/payment/subscription');
    return response.data;
  },

  async cancelSubscription() {
    const response = await apiClient.post('/payment/cancel-subscription');
    return response.data;
  }
};

// Quota Service
export const quotaService = {
  async getQuotas() {
    const user = await authService.me();
    return user?.quotas || {
      scansRemaining: 0,
      aiChatsRemaining: 0,
      scansLimit: 30,
      aiChatsLimit: 5
    };
  },
  
  async consumeQuota(type: 'scan' | 'chat') {
    const response = await apiClient.post('/quota/consume', { type });
    return response.data;
  }
};

// Search Service
export const searchService = {
  searchProducts: (query: string, options?: any) => productService.search(query, options),
  
  async getSearchConfig() {
    const response = await apiClient.get('/algolia/config');
    return response.data;
  }
};

// History Service
export const historyService = analysisService;

// Aliases
export const userService = authService;

// Error handling
export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || 
           error.response?.data?.error || 
           error.message || 
           'Une erreur est survenue';
  }
  return 'Une erreur est survenue';
}

export default apiClient;


// Vision Service (placeholder - not implemented in backend yet)
export const visionService = {
  async analyzeImage(file: File) {
    console.warn('Vision service not implemented yet');
    // Pour l'instant, retourner null ou implémenter plus tard
    return null;
  }
};
console.log('✅ API Service initialized (production mode)');