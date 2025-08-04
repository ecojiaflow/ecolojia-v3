// frontend/src/services/dashboardService.ts
import { apiClient, getErrorMessage } from './apiClient';

// Types pour le dashboard
export interface DashboardStats {
  overview: {
    totalScans: number;
    averageHealthScore: number;
    productsAnalyzed: number;
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
    type: string;
    title: string;
    description: string;
    impact: string;
    icon: string;
    cta: string;
  }>;
  recentAnalyses: Array<{
    id: string;
    productName: string;
    category: string;
    healthScore: number;
    date: string;
    trend: string;
    alternatives: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string | null;
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
    bestProduct: {
      name: string;
      score: number;
    };
    worstProduct: {
      name: string;
      score: number;
    };
    discoveries: number;
    alternatives: number;
  };
}

export interface HistoryResponse {
  success: boolean;
  data: Array<{
    id: string;
    date: string;
    product: {
      name: string;
      category: string;
      brand: string;
    };
    scores: {
      health: number;
      environment: number;
      social: number;
    };
    alternatives: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  total: number;
}

export interface WeeklySummaryResponse {
  success: boolean;
  data: Array<{
    date: string;
    scans: number;
    avgScore: number;
  }>;
  summary: {
    totalScans: number;
    avgScore: number;
    bestDay: {
      date: string;
      scans: number;
      avgScore: number;
    };
    trend: string;
  };
}

export interface AchievementsResponse {
  success: boolean;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    points: number;
    category: string;
    unlocked?: boolean;
    progress?: number;
    maxProgress?: number;
  }>;
  unlockedCount: number;
  totalPoints: number;
  categories?: {
    [key: string]: {
      unlocked: number;
      total: number;
    };
  };
}

class DashboardService {
  
  async getStats(range: 'week' | 'month' | 'year' = 'month'): Promise<DashboardStats> {
    try {
      const response = await apiClient.get('/dashboard/stats', {
        params: { range }
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Dashboard stats error:', message);
      throw new Error(message);
    }
  }

  async getHistory(page: number = 1, limit: number = 10): Promise<HistoryResponse> {
    try {
      const response = await apiClient.get('/dashboard/history', {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Dashboard history error:', message);
      throw new Error(message);
    }
  }

  async getWeeklySummary(): Promise<WeeklySummaryResponse> {
    try {
      const response = await apiClient.get('/dashboard/weekly-summary');
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Weekly summary error:', message);
      throw new Error(message);
    }
  }

  async getProductDistribution(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/product-distribution');
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Product distribution error:', message);
      throw new Error(message);
    }
  }

  async getHealthTrends(period: number = 30): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/health-trends', {
        params: { period }
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Health trends error:', message);
      throw new Error(message);
    }
  }

  async getRecentScans(limit: number = 5): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/recent-scans', {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Recent scans error:', message);
      throw new Error(message);
    }
  }

  async getAchievements(): Promise<AchievementsResponse> {
    try {
      const response = await apiClient.get('/dashboard/achievements');
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Achievements error:', message);
      throw new Error(message);
    }
  }

  async getRecommendations(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/recommendations');
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Recommendations error:', message);
      throw new Error(message);
    }
  }

  async exportData(format: 'json' | 'csv' | 'pdf' = 'json', dateRange?: string): Promise<any> {
    try {
      const response = await apiClient.post('/dashboard/export', {
        format,
        dateRange
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Export data error:', message);
      throw new Error(message);
    }
  }

  async shareData(platform: string, message?: string): Promise<any> {
    try {
      const response = await apiClient.post('/dashboard/share', {
        platform,
        message
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Share data error:', message);
      throw new Error(message);
    }
  }

  // MÃ©thode pour obtenir des statistiques rapides
  async getQuickStats(): Promise<any> {
    try {
      const [stats, recentScans, achievements] = await Promise.all([
        this.getStats('month'),
        this.getRecentScans(3),
        this.getAchievements()
      ]);

      return {
        stats,
        recentScans: recentScans.scans || [],
        unlockedAchievements: achievements.unlockedCount || 0,
        totalPoints: achievements.totalPoints || 0
      };
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('Quick stats error:', message);
      throw new Error(message);
    }
  }
}

export const dashboardService = new DashboardService();