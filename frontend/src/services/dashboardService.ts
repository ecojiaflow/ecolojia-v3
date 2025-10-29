// PATH: frontend/src/services/dashboardService.ts
// Service pour récupérer les données du tableau de bord
import { api } from './api';

export const dashboardService = {
  getStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération stats dashboard:', error);
      throw error;
    }
  },

  getRecentScans: async () => {
    try {
      const response = await api.get('/dashboard/recent');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération scans récents:', error);
      throw error;
    }
  },

  getHistory: async () => {
    try {
      const response = await api.get('/history');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération historique:', error);
      throw error;
    }
  }
};