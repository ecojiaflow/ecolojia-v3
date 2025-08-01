// frontend/src/services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ===== CONFIGURATION =====
const API_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com/api';

// Instance axios configurée
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
});

// ===== TYPES =====
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  tier: 'free' | 'premium';
  status: 'active' | 'suspended' | 'deleted';
  quotas: {
    scansRemaining: number;
    scansResetDate: Date;
    aiChatsRemaining: number;
    aiChatsResetDate: Date;
  };
  usage: {
    totalScans: number;
    totalChats: number;
    lastScanAt?: Date;
    lastChatAt?: Date;
  };
  subscription?: {
    lemonSqueezyCustomerId: string;
    lemonSqueezySubscriptionId: string;
    currentPeriodEnd: Date;
    status: string;
  };
}

export interface Product {
  _id: string;
  barcode?: string;
  name: string;
  brand?: string;
  category: 'food' | 'cosmetics' | 'detergents';
  imageUrl?: string;
  categories: string[];
  analysisData?: {
    healthScore: number;
    environmentScore: number;
    socialScore: number;
    lastAnalyzedAt: Date;
    confidence: number;
  };
  viewCount: number;
  scanCount: number;
}

export interface Analysis {
  _id: string;
  userId: string;
  productId: string;
  productSnapshot: {
    name: string;
    brand?: string;
    barcode?: string;
    imageUrl?: string;
    category: string;
  };
  analysisType: 'barcode_scan' | 'manual_entry' | 'photo_analysis';
  results: {
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
  metadata: {
    aiModel: string;
    confidence: number;
    processingTimeMs: number;
  };
  createdAt: Date;
}

export interface DashboardStats {
  overview: {
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
  trends: {
    healthScoreImprovement: number;
    comparedToLastMonth: number;
    currentStreak: number;
    bestStreak: number;
  };
  recommendations: Array<{
    id: string;
    type: 'health' | 'diversity' | 'premium' | 'welcome';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    icon: string;
    cta: string;
  }>;
  recentAnalyses: Array<{
    id: string;
    productName: string;
    category: string;
    healthScore: number;
    date: string;
    trend: 'up' | 'down' | 'stable';
    alternatives: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date | null;
    progress: number;
    maxProgress: number;
  }>;
  community: {
    averageScore: number;
    userRank: number;
    totalUsers: number;
    topCategory: string;
  };
  weeklyDigest: {
    scansCount: number;
    avgScore: number;
    bestProduct: { name: string; score: number };
    worstProduct: { name: string; score: number };
    discoveries: number;
    alternatives: number;
  };
}

// ===== INTERCEPTEURS =====

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs et le refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si erreur 401 et pas déjà tenté de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { token } = response.data;
          
          localStorage.setItem('token', token);
          
          // Retry la requête originale avec le nouveau token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Échec du refresh, rediriger vers login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Formater l'erreur
    const apiError: ApiError = {
      message: error.response?.data?.error || error.message || 'Une erreur est survenue',
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
    localStorage.setItem('token', authData.token);
    localStorage.setItem('refreshToken', authData.refreshToken);
    
    return authData;
  },

  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    const authData = response.data;
    
    // Sauvegarder les tokens
    localStorage.setItem('token', authData.token);
    localStorage.setItem('refreshToken', authData.refreshToken);
    
    return authData;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      // Nettoyer le localStorage dans tous les cas
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

// Service des produits
export const productService = {
  search: async (query: string): Promise<Product[]> => {
    const response = await api.get('/products/search', { params: { q: query } });
    return response.data.products || response.data;
  },

  getTrending: async (): Promise<Product[]> => {
    const response = await api.get('/products/trending');
    return response.data.products || response.data;
  },

  getByBarcode: async (barcode: string): Promise<Product> => {
    const response = await api.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  analyze: async (data: {
    barcode?: string;
    name?: string;
    brand?: string;
    category?: string;
  }): Promise<Analysis> => {
    const response = await api.post('/products/analyze', data);
    return response.data;
  },

  getAlternatives: async (productId: string): Promise<Product[]> => {
    const response = await api.get(`/products/${productId}/alternatives`);
    return response.data.alternatives || response.data;
  },

  report: async (productId: string, reason: string): Promise<void> => {
    await api.post(`/products/${productId}/report`, { reason });
  },
};

// Service d'analyses
export const analysisService = {
  autoAnalyze: async (data: {
    barcode?: string;
    name?: string;
    brand?: string;
    imageUrl?: string;
  }): Promise<Analysis> => {
    const response = await api.post('/analyze/auto', data);
    return response.data;
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

  getHistory: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<{
    analyses: Analysis[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await api.get('/analyze/history', { params });
    return response.data;
  },
};

// Service du dashboard
export const dashboardService = {
  getStats: async (range: 'week' | 'month' | 'year' = 'month'): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats', { params: { range } });
    return response.data;
  },

  exportData: async (format: 'csv' | 'json' = 'json'): Promise<Blob> => {
    const response = await api.get('/dashboard/export', {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
};

// Service de paiement
export const paymentService = {
  createCheckout: async (plan: 'monthly' | 'annual'): Promise<{ url: string }> => {
    const response = await api.post('/payment/create-checkout', { plan });
    return response.data;
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

// Export de l'instance API pour usage personnalisé si nécessaire
export default api;