// PATH: frontend/src/services/api.ts
import apiClient from './apiClient';

// Adapter pour axios-like interface
const api = {
  async get(url: string, config?: { params?: any; headers?: Record<string, string> }) {
    const queryString = config?.params 
      ? '?' + new URLSearchParams(config.params).toString() 
      : '';
    const response = await apiClient.get(url + queryString, config?.headers);
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    return { data: response.data };
  },

  async post(url: string, data?: any, config?: { headers?: Record<string, string> }) {
    const response = await apiClient.post(url, data, config?.headers);
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    return { data: response.data };
  },

  async put(url: string, data?: any, config?: { headers?: Record<string, string> }) {
    const response = await apiClient.put(url, data, config?.headers);
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    return { data: response.data };
  },

  async patch(url: string, data?: any, config?: { headers?: Record<string, string> }) {
    const response = await apiClient.patch(url, data, config?.headers);
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    return { data: response.data };
  },

  async delete(url: string, config?: { headers?: Record<string, string> }) {
    const response = await apiClient.delete(url, config?.headers);
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    return { data: response.data };
  }
};

export default api;
