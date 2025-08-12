// PATH: frontend/src/lib/api.ts
import axios, { AxiosError } from 'axios';

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Instance axios avec configuration par défaut
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface AnalysisResult {
  scores: {
    nova?: number;
    healthScore?: number;
    environmentScore?: number;
    nutriscore?: string;
  };
  details: {
    ingredientsTextRaw?: string;
    nova?: number;
    novaLabel?: string;
    novaReason?: string;
    novaConfidence?: number;
    ecoscore?: string;
    // Cosmetics
    inciTextRaw?: string;
    riskFlags?: string[];
    notableIngredients?: string[];
    riskLevel?: 'low' | 'medium' | 'high';
    // Detergents
    clpPictograms?: string[];
    surfactants?: string[];
    allergens?: string[];
    biodegradability?: string;
  };
  globalScore: number;
  confidence: number;
}

export interface VisionResult {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  result?: {
    text: string;
    extractedData: {
      name?: string;
      ingredients?: string;
      barcode?: string;
      category?: string;
    };
    confidence: number;
    service: 'google' | 'tesseract';
    usedFallback: boolean;
    duration: number;
  };
}

export interface User {
  _id: string;
  email: string;
  name: string;
  plan: 'free' | 'premium';
  quotas: {
    scansPerMonth: number;
    scansUsed: number;
    aiChatsPerMonth: number;
    aiChatsUsed: number;
  };
}

// API Methods

// Auth
export const auth = {
  async register(email: string, password: string, name: string) {
    const { data } = await api.post('/api/auth/register', { email, password, name });
    return data;
  },

  async login(email: string, password: string) {
    const { data } = await api.post('/api/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get('/api/users/me');
    return data;
  },

  async updateProfile(updates: Partial<User>) {
    const { data } = await api.put('/api/users/me', updates);
    return data;
  }
};

// Analysis
export const analysis = {
  async analyzeManual(params: {
    name: string;
    brand?: string;
    category: 'food' | 'cosmetics' | 'detergents';
    ingredients: string;
    barcode?: string;
  }): Promise<AnalysisResult> {
    const { data } = await api.post('/api/analysis/manual', params);
    return data;
  },

  async analyzeBarcode(barcode: string): Promise<AnalysisResult> {
    const { data } = await api.post('/api/analysis/barcode', { barcode });
    return data;
  },

  async getHistory(page = 1, limit = 20) {
    const { data } = await api.get('/api/analysis/history', {
      params: { page, limit }
    });
    return data;
  },

  async getAnalysisById(id: string) {
    const { data } = await api.get(`/api/analysis/${id}`);
    return data;
  }
};

// Vision
export const vision = {
  async analyzeImage(imageFile: File): Promise<VisionResult> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const { data } = await api.post('/api/vision/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async getStatus(jobId: string): Promise<VisionResult> {
    const { data } = await api.get(`/api/vision/status/${jobId}`);
    return data;
  }
};

// Products
export const products = {
  async search(query: string, filters?: any) {
    const { data } = await api.get('/api/products/search', {
      params: { q: query, ...filters }
    });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/api/products/${id}`);
    return data;
  },

  async getByBarcode(barcode: string) {
    const { data } = await api.get(`/api/products/barcode/${barcode}`);
    return data;
  },

  async getSimilar(productId: string, limit = 5) {
    const { data } = await api.get(`/api/products/${productId}/similar`, {
      params: { limit }
    });
    return data;
  }
};

// Payment
export const payment = {
  async createCheckout(plan: 'premium') {
    const { data } = await api.post('/api/payment/create-checkout', { plan });
    return data;
  },

  async getSubscription() {
    const { data } = await api.get('/api/payment/subscription');
    return data;
  },

  async cancelSubscription() {
    const { data } = await api.post('/api/payment/cancel');
    return data;
  }
};

// GDPR
export const gdpr = {
  async downloadData(format: 'json' | 'csv' = 'json') {
    const { data } = await api.get('/api/gdpr/download-data', {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    
    if (format === 'csv') {
      // Télécharger le fichier CSV
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecolojia-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
    
    return data;
  },

  async deleteAccount() {
    const { data } = await api.delete('/api/users/me');
    return data;
  }
};

// Dashboard
export const dashboard = {
  async getStats() {
    const { data } = await api.get('/api/dashboard/stats');
    return data;
  },

  async getRecentScans(limit = 10) {
    const { data } = await api.get('/api/dashboard/recent-scans', {
      params: { limit }
    });
    return data;
  },

  async getInsights() {
    const { data } = await api.get('/api/dashboard/insights');
    return data;
  }
};

// AI Chat
export const aiChat = {
  async sendMessage(message: string, context?: any) {
    const { data } = await api.post('/api/ai/chat', { message, context });
    return data;
  },

  async getChatHistory(limit = 50) {
    const { data } = await api.get('/api/ai/chat/history', {
      params: { limit }
    });
    return data;
  }
};

// Health check
export const health = {
  async check() {
    const { data } = await api.get('/_service/status');
    return data;
  }
};

export default api;