// PATH: frontend/src/services/dashboardService.ts
import api from './apiClient';
import { API_CONFIG } from '../config/api.config';

export interface DashboardStats {
  totalScans: number;
  healthScoreAverage: number;
  categoryBreakdown: {
    food: number;
    cosmetics: number;
    detergents: number;
  };
  monthlyProgress: number;
  topCategory: string;
  recentAnalyses: Array<{
    _id: string;
    productName: string;
    productBrand?: string;
    score: number;
    category: string;
    date: string;
    nutriScore?: string;
    ecoScore?: string;
    novaGroup?: number;
  }>;
  weeklyTrend: Array<{
    day: string;
    scans: number;
  }>;
  achievements?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
    progress: number;
  }>;
}

export interface PersonalizedInsights {
  recommendations: Array<{
    type: 'tip' | 'warning' | 'achievement';
    title: string;
    description: string;
    actionUrl?: string;
    icon?: string;
  }>;
  goals: Array<{
    id: string;
    name: string;
    target: number;
    current: number;
    unit: string;
    deadline?: string;
  }>;
  comparisons: {
    vsLastMonth: number;
    vsAverage: number;
    percentile: number;
  };
}

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'week' | 'month';
}

class DashboardService {
  private static instance: DashboardService;

  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Récupérer les statistiques du dashboard
   */
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<DashboardStats>(
        API_CONFIG.ENDPOINTS.DASHBOARD.STATS
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Récupérer les insights personnalisés
   */
  async getPersonalizedInsights(): Promise<PersonalizedInsights> {
    try {
      const response = await api.get<PersonalizedInsights>(
        `${API_CONFIG.ENDPOINTS.DASHBOARD.STATS}/insights`
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching personalized insights:', error);
      throw error;
    }
  }

  /**
   * Récupérer l'analyse détaillée par période
   */
  async getDetailedAnalytics(period: AnalyticsPeriod): Promise<{
    data: Array<{
      date: string;
      scans: number;
      averageScore: number;
      categories: Record<string, number>;
    }>;
    summary: {
      totalScans: number;
      averageScore: number;
      topProducts: Array<{
        name: string;
        scans: number;
        score: number;
      }>;
    };
  }> {
    try {
      const params = new URLSearchParams({
        startDate: period.startDate.toISOString(),
        endDate: period.endDate.toISOString(),
        groupBy: period.groupBy
      });

      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.DASHBOARD.STATS}/analytics?${params.toString()}`
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching detailed analytics:', error);
      throw error;
    }
  }

  /**
   * Récupérer les produits tendance
   */
  async getTrendingProducts(limit: number = 10): Promise<Array<{
    productId: string;
    name: string;
    brand: string;
    category: string;
    scanCount: number;
    averageScore: number;
    trend: 'up' | 'down' | 'stable';
  }>> {
    try {
      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.DASHBOARD.STATS}/trending?limit=${limit}`
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching trending products:', error);
      throw error;
    }
  }

  /**
   * Récupérer les widgets personnalisés du dashboard
   */
  async getDashboardWidgets(): Promise<Array<{
    id: string;
    type: string;
    position: number;
    size: 'small' | 'medium' | 'large';
    config: Record<string, any>;
  }>> {
    try {
      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.DASHBOARD.STATS}/widgets`
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching dashboard widgets:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour la configuration des widgets
   */
  async updateWidgets(widgets: Array<{
    id: string;
    position: number;
    visible: boolean;
  }>): Promise<void> {
    try {
      await api.put(
        `${API_CONFIG.ENDPOINTS.DASHBOARD.STATS}/widgets`,
        { widgets }
      );
    } catch (error) {
      console.error('Error updating widgets:', error);
      throw error;
    }
  }

  /**
   * Récupérer les objectifs de l'utilisateur
   */
  async getUserGoals(): Promise<Array<{
    id: string;
    type: 'health' | 'environment' | 'budget' | 'custom';
    name: string;
    target: number;
    current: number;
    unit: string;
    deadline?: string;
    createdAt: string;
  }>> {
    try {
      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.DASHBOARD.STATS}/goals`
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching user goals:', error);
      throw error;
    }
  }

  /**
   * Créer un nouvel objectif
   */
  async createGoal(goal: {
    type: string;
    name: string;
    target: number;
    unit: string;
    deadline?: string;
  }): Promise<void> {
    try {
      await api.post(
        `${API_CONFIG.ENDPOINTS.DASHBOARD.STATS}/goals`,
        goal
      );
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  /**
   * Récupérer les notifications du dashboard
   */
  async getDashboardNotifications(): Promise<Array<{
    id: string;
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    actionUrl?: string;
    read: boolean;
    createdAt: string;
  }>> {
    try {
      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.DASHBOARD.STATS}/notifications`
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(
        `${API_CONFIG.ENDPOINTS.DASHBOARD.STATS}/notifications/${notificationId}/read`
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Exporter les données du dashboard
   */
  async exportDashboardData(format: 'pdf' | 'csv' | 'xlsx'): Promise<Blob> {
    try {
      const response = await api.get(
        `${API_CONFIG.ENDPOINTS.DASHBOARD.STATS}/export?format=${format}`,
        { responseType: 'blob' }
      );
      
      return response;
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      throw error;
    }
  }
}

export default DashboardService.getInstance();