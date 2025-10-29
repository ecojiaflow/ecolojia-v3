// PATH: frontend/src/services/fallbackService.ts
// Service de fallback pour gérer les erreurs API
import { api } from './api';

export const fallbackService = {
  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'down', error: error.message };
    }
  },

  getStatus: async () => {
    try {
      const response = await api.get('/status');
      return response.data;
    } catch (error) {
      console.error('Status check failed:', error);
      return { connected: false };
    }
  }
};