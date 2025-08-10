// PATH: frontend/src/services/historyService.ts
import api from './apiClient';
import { API_CONFIG } from '../config/api.config';

export interface HistoryItem {
  _id: string;
  productId: string;
  productName: string;
  productBrand: string;
  category: 'food' | 'cosmetic' | 'detergent';
  analysisDate: string;
  scores: {
    health: number;
    environment: number;
    social: number;
    overall: number;
  };
  nutriScore?: string;
  novaGroup?: number;
  ecoScore?: string;
  ingredients?: string[];
  allergens?: string[];
  additives?: Array<{
    code: string;
    name: string;
    risk: 'low' | 'medium' | 'high';
  }>;
  productImage?: string;
  isFavorite: boolean;
  userId: string;
}

export interface HistoryFilters {
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minScore?: number;
  maxScore?: number;
  search?: string;
}

class HistoryService {
  private static instance: HistoryService;

  static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  /**
   * Récupérer l'historique des analyses
   */
  async getHistory(
    page: number = 1,
    limit: number = 12,
    category?: string,
    sortBy: string = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<HistoryItem[]> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      if (category && category !== 'all') {
        params.append('category', category);
      }

      const response = await api.get<HistoryItem[]>(
        `${API_CONFIG.ENDPOINTS.HISTORY}?${params.toString()}`
      );

      return response;
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  }

  /**
   * Récupérer le nombre total d'éléments dans l'historique
   */
  async getHistoryCount(category?: string): Promise<number> {
    try {
      const params = new URLSearchParams();
      
      if (category && category !== 'all') {
        params.append('category', category);
      }

      const response = await api.get<{ count: number }>(
        `${API_CONFIG.ENDPOINTS.HISTORY}/count?${params.toString()}`
      );

      return response.count || 0;
    } catch (error) {
      console.error('Error fetching history count:', error);
      // En cas d'erreur, retourner un count par défaut
      return 50;
    }
  }

  /**
   * Récupérer un élément spécifique de l'historique
   */
  async getHistoryItem(id: string): Promise<HistoryItem> {
    try {
      const response = await api.get<HistoryItem>(
        `${API_CONFIG.ENDPOINTS.HISTORY}/${id}`
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching history item:', error);
      throw error;
    }
  }

  /**
   * Supprimer un ou plusieurs éléments de l'historique
   */
  async deleteHistoryItem(id: string): Promise<void> {
    try {
      await api.delete(`${API_CONFIG.ENDPOINTS.HISTORY}/${id}`);
    } catch (error) {
      console.error('Error deleting history item:', error);
      throw error;
    }
  }

  /**
   * Supprimer plusieurs éléments en une fois
   */
  async deleteMultipleItems(ids: string[]): Promise<void> {
    try {
      await api.post(`${API_CONFIG.ENDPOINTS.HISTORY}/delete-multiple`, { ids });
    } catch (error) {
      console.error('Error deleting multiple items:', error);
      throw error;
    }
  }

  /**
   * Rechercher dans l'historique
   */
  async searchHistory(
    query: string,
    filters?: HistoryFilters
  ): Promise<HistoryItem[]> {
    try {
      const params = new URLSearchParams({ q: query });
      
      if (filters) {
        if (filters.category) params.append('category', filters.category);
        if (filters.minScore) params.append('minScore', filters.minScore.toString());
        if (filters.maxScore) params.append('maxScore', filters.maxScore.toString());
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
        if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      }

      const response = await api.get<HistoryItem[]>(
        `${API_CONFIG.ENDPOINTS.HISTORY}/search?${params.toString()}`
      );

      return response;
    } catch (error) {
      console.error('Error searching history:', error);
      throw error;
    }
  }

  /**
   * Exporter l'historique
   */
  async exportHistory(format: 'csv' | 'pdf' = 'csv'): Promise<any> {
    try {
      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.HISTORY}/export?format=${format}`,
        {
          responseType: format === 'pdf' ? 'blob' : 'text'
        }
      );

      return response;
    } catch (error) {
      console.error('Error exporting history:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques de l'historique
   */
  async getHistoryStats(): Promise<{
    totalScans: number;
    averageScore: number;
    categoriesCount: Record<string, number>;
    monthlyScans: number;
    favoriteProducts: number;
  }> {
    try {
      const response = await api.get(`${API_CONFIG.ENDPOINTS.HISTORY}/stats`);
      return response;
    } catch (error) {
      console.error('Error fetching history stats:', error);
      throw error;
    }
  }

  /**
   * Marquer/Démarquer un produit comme favori
   */
  async toggleFavorite(historyId: string): Promise<void> {
    try {
      await api.patch(`${API_CONFIG.ENDPOINTS.HISTORY}/${historyId}/favorite`);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Récupérer les produits favoris
   */
  async getFavorites(): Promise<HistoryItem[]> {
    try {
      const response = await api.get<HistoryItem[]>(
        `${API_CONFIG.ENDPOINTS.HISTORY}/favorites`
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }

  /**
   * Nettoyer l'historique (supprimer les entrées anciennes)
   */
  async cleanHistory(daysToKeep: number = 90): Promise<{ deleted: number }> {
    try {
      const response = await api.post(
        `${API_CONFIG.ENDPOINTS.HISTORY}/clean`,
        { daysToKeep }
      );
      
      return response;
    } catch (error) {
      console.error('Error cleaning history:', error);
      throw error;
    }
  }
}

export default HistoryService.getInstance();