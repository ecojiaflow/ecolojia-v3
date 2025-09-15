import axios from 'axios';
import axiosRetry from 'axios-retry';

const API_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com/api';

export const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' }, timeout: 12000 });

axiosRetry(api, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => axiosRetry.isNetworkError(error) || (error.response && error.response.status >= 500),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const productService = {
  analyze: (payload: { barcode?: string; category?: 'food'|'cosmetics'|'detergents'; name?: string; ingredients?: string }) =>
    api.post('/analyze/auto', payload),
  byBarcode: (barcode: string) => api.get(`/products/barcode/${barcode}`),
  search: (q: string) => api.get('/products/search', { params: { q } }),
  trending: () => api.get('/products/trending'),
  alternatives: (productId: string) => api.get(`/products/${productId}/alternatives`).catch(()=> api.get('/products/trending'))
};

export const dashboardService = {
  getStats: (period: 'week'|'month'|'year'='month') => api.get('/dashboard/stats', { params: { period } }).then(r=>r.data),
};

export const visionService = {
  analyzeImage: (base64Image: string) => api.post('/vision/analyze-image', { image: base64Image }).then(r=>r.data),
};

export const aiService = {
  chat: (message: string, context?: any) => api.post('/ai/chat', { message, context }).then(r=>r.data),
};
