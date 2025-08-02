// frontend/src/services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ===== CONFIGURATION =====
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Instance axios configurée
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
});

// ===== TYPES UNIFIÉS =====
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  success?: boolean;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  profile: {
    firstName: string;
    lastName: string;
    language?: string;
    theme?: string;
    avatarUrl?: string;
  };
  tier: 'free' | 'premium';
  status: 'active' | 'suspended' | 'deleted';
  // Compatibilité avec les deux structures
  quotas: {
    scansPerMonth: number;
    aiQuestionsPerDay: number;
    exportsPerMonth: number;
    scansRemaining?: number;
    scansResetDate?: Date;
    aiChatsRemaining?: number;
    aiChatsResetDate?: Date;
  };
  currentUsage: {
    scansThisMonth: number;
    aiQuestionsToday: number;
    exportsThisMonth: number;
  };
  usage?: {
    totalScans: number;
    totalChats: number;
    lastScanAt?: Date;
    lastChatAt?: Date;
  };
  subscription?: {
    lemonSqueezyCustomerId?: string;
    lemonSqueezySubscriptionId?: string;
    currentPeriodEnd?: Date;
    status?: string;
    plan?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  barcode?: string;
  name: string;
  name_fr?: string;
  name_en?: string;
  brand?: string;
  category: 'food' | 'cosmetics' | 'detergents';
  subCategory?: string;
  imageUrl?: string;
  images?: {
    front?: string;
    ingredients?: string;
    nutrition?: string;
  };
  categories?: string[];
  scores?: {
    nova?: number;
    nutriscore?: string;
    ecoscore?: string;
    healthScore?: number;
    environmentScore?: number;
  };
  analysisData?: {
    healthScore: number;
    environmentScore: number;
    socialScore: number;
    lastAnalyzedAt: Date;
    confidence: number;
  };
  nutrition?: any;
  allergens?: string[];
  ingredients?: any[];
  certifications?: string[];
  viewCount?: number;
  scanCount?: number;
}

export interface Analysis {
  _id: string;
  userId: string;
  productId?: string;
  product?: Product;
  productSnapshot?: {
    name: string;
    brand?: string;
    barcode?: string;
    imageUrl?: string;
    category: string;
  };
  analysisType?: 'barcode_scan' | 'manual_entry' | 'photo_analysis';
  analysis?: {
    healthScore: number;
    environmentScore: number;
    category: string;
    recommendations: string[];
    concerns: string[];
    benefits: string[];
    alternatives?: any[];
  };
  results?: {
    healthScore: number;
    environmentScore: number;
    socialScore: number;
    novaGroup?: number;
    nutriScore?: string;
    concerns: string[];
    benefits: string[];
    recommendations: string[];
    alternatives?: Array<{
      productId: string;
      name: string;
      reason: string;
      improvement: number;
    }>;
  };
  metadata?: {
    aiModel: string;
    confidence: number;
    processingTimeMs: number;
  };
  timestamp?: Date;
  createdAt?: Date;
}

export interface DashboardStats {
  // Structure existante
  overview?: {
    totalAnalyses: number;
    avgHealthScore: number;
    minHealthScore: number;
    maxHealthScore: number;
    categories: {
      food: number;
      cosmetics: number;
      detergents: number;
    };
  };
  // Structure alternative
  totalScans?: number;
  healthScoreAverage?: number;
  averageHealthScore?: number;
  improvementRate?: number;
  currentStreak?: number;
  categoryBreakdown?: {
    food: number;
    cosmetics: number;
    detergents: number;
  };
  categoriesBreakdown?: {
    food: number;
    cosmetics: number;
    detergents: number;
  };
  recentAnalyses?: any[];
  weeklyTrend?: Array<{
    day: string;
    scans: number;
  }>;
  monthlyProgress?: Array<{
    month: string;
    scans: number;
    avgScore: number;
  }>;
  [key: string]: any; // Pour la flexibilité
}

// ===== GESTION DES TOKENS =====
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Fonction pour obtenir le token (compatible avec les deux systèmes)
const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('ecolojia_token');
};

const setTokens = (token: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // Compatibilité avec l'ancien système
  localStorage.setItem('ecolojia_token', token);
  localStorage.setItem('ecolojia_refresh_token', refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('ecolojia_token');
  localStorage.removeItem('ecolojia_refresh_token');
};

// ===== INTERCEPTEURS =====
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log en mode debug
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Log en mode debug
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log(`✅ API Response:`, response.data);
    }
    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log des erreurs
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.error(`❌ API Error:`, error.response?.status, error.response?.data);
    }

    // Si erreur 401 et pas déjà tenté de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem('ecolojia_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;
          
          setTokens(token, newRefreshToken || refreshToken);
          
          // Retry la requête originale avec le nouveau token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Échec du refresh, rediriger vers login
        clearTokens();
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    // Formater l'erreur
    const apiError: ApiError = {
      message: error.response?.data?.message || error.response?.data?.error || error.message || 'Une erreur est survenue',
      code: error.response?.data?.code,
      status: error.response?.status,
    };

    return Promise.reject(apiError);
  }
);

// ===== SERVICES =====

// Service d'authentification
export const authService = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    const authData = response.data;
    
    // Sauvegarder les tokens
    setTokens(authData.token, authData.refreshToken);
    
    return authData;
  },

  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    const authData = response.data;
    
    // Sauvegarder les tokens
    setTokens(authData.token, authData.refreshToken);
    
    return authData;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearTokens();
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data.user || response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data.user || response.data;
  },

  refresh: async (refreshToken: string): Promise<{ token: string; refreshToken?: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Méthodes utilitaires
  getToken,
  isTokenExpired: (): boolean => {
    const token = getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },
  clearTokens,
  isAuthenticated: (): boolean => {
    return !!getToken() && !authService.isTokenExpired();
  }
};

// Service des produits
export const productService = {
  search: async (query: string, filters?: any): Promise<{ products: Product[]; total: number }> => {
    const response = await api.get('/products/search', { params: { q: query, ...filters } });
    return {
      products: response.data.products || response.data,
      total: response.data.total || response.data.length || 0
    };
  },

  getTrending: async (limit: number = 10): Promise<Product[]> => {
    const response = await api.get('/products/trending', { params: { limit } });
    return response.data.products || response.data;
  },

  getByBarcode: async (barcode: string): Promise<Product | null> => {
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      return response.data.product || response.data;
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data.product || response.data;
  },

  analyze: async (data: {
    barcode?: string;
    name?: string;
    brand?: string;
    category?: string;
    ingredients?: string;
  }): Promise<Analysis> => {
    const response = await api.post('/products/analyze', data);
    return response.data;
  },

  getAlternatives: async (productId: string): Promise<Product[]> => {
    const response = await api.get(`/products/${productId}/alternatives`);
    return response.data.alternatives || response.data;
  },

  report: async (productId: string, reason: string, details?: string): Promise<void> => {
    await api.post(`/products/${productId}/report`, { reason, details });
  },
};

// Service d'analyses
export const analysisService = {
  autoAnalyze: async (data: {
    barcode?: string;
    productId?: string;
    name?: string;
    brand?: string;
    imageUrl?: string;
    ingredients?: string;
    category?: string;
  }): Promise<Analysis> => {
    const response = await api.post('/analyze/auto', data);
    return response.data;
  },

  analyzeAuto: async (data: any): Promise<Analysis> => {
    return analysisService.autoAnalyze(data);
  },

  analyzeFood: async (data: any): Promise<Analysis> => {
    const response = await api.post('/analyze/food', data);
    return response.data;
  },

  analyzeCosmetic: async (data: any): Promise<Analysis> => {
    const response = await api.post('/analyze/cosmetic', data);
    return response.data;
  },

  analyzeDetergent: async (data: any): Promise<Analysis> => {
    const response = await api.post('/analyze/detergent', data);
    return response.data;
  },

  getHistory: async (limit: number = 50): Promise<Analysis[]> => {
    const response = await api.get('/analyze/history', { params: { limit } });
    return response.data.analyses || response.data;
  },
};

// Service du dashboard
export const dashboardService = {
  getStats: async (period: 'week' | 'month' | 'year' = 'month'): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats', { params: { range: period } });
    const data = response.data;
    
    // Normaliser les données pour la compatibilité
    return {
      ...data,
      totalScans: data.totalScans || data.overview?.totalAnalyses || 0,
      healthScoreAverage: data.healthScoreAverage || data.averageHealthScore || data.overview?.avgHealthScore || 0,
      averageHealthScore: data.averageHealthScore || data.healthScoreAverage || data.overview?.avgHealthScore || 0,
      categoryBreakdown: data.categoryBreakdown || data.categoriesBreakdown || data.overview?.categories,
      categoriesBreakdown: data.categoriesBreakdown || data.categoryBreakdown || data.overview?.categories,
      improvementRate: data.improvementRate || data.trends?.healthScoreImprovement || 0,
      currentStreak: data.currentStreak || data.trends?.currentStreak || 0,
    };
  },

  exportData: async (format: 'csv' | 'json' | 'pdf' = 'json'): Promise<Blob> => {
    const response = await api.get('/dashboard/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};

// Service de paiement
export const paymentService = {
  createCheckout: async (plan: 'monthly' | 'annual'): Promise<{ url: string; checkoutUrl?: string }> => {
    const response = await api.post('/payment/create-checkout', { plan });
    return {
      url: response.data.url || response.data.checkoutUrl,
      checkoutUrl: response.data.checkoutUrl || response.data.url
    };
  },

  getSubscription: async (): Promise<{
    active: boolean;
    subscription?: any;
  }> => {
    const response = await api.get('/payment/subscription');
    return response.data;
  },
};

// Service IA & Chat
export const aiService = {
  chat: async (message: string, context?: any): Promise<{
    response: string;
    suggestions?: string[];
  }> => {
    const response = await api.post('/ai/chat', { message, context });
    return response.data;
  },

  getSuggestions: async (productId?: string): Promise<string[]> => {
    const response = await api.get('/ai/suggestions', {
      params: { productId },
    });
    return response.data.suggestions || response.data;
  },
};

// Service Algolia (recherche)
export const searchService = {
  search: async (query: string, filters?: any): Promise<any> => {
    const response = await api.post('/algolia/search', { query, filters });
    return response.data;
  },

  getConfig: async (): Promise<{
    appId: string;
    searchKey: string;
    indices: string[];
  }> => {
    const response = await api.get('/algolia/config');
    return response.data;
  },
};

// Service d'affiliation
export const partnerService = {
  getAffiliateLink: async (productId: string, partner: string): Promise<{ url: string }> => {
    const response = await api.get('/partner/affiliate-link', {
      params: { productId, partner }
    });
    return response.data;
  },

  trackClick: async (productId: string, partner: string): Promise<void> => {
    await api.post('/partner/track-click', { productId, partner });
  },
};

// Export de l'instance API pour usage personnalisé si nécessaire
export default api;

// Service Algolia (alias pour compatibilité)
export const algoliaService = searchService;