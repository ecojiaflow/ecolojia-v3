// fallbackService.ts - Gestion intelligente des erreurs 404
import { API_CONFIG } from '../config/api.config';

class FallbackService {
  private static instance: FallbackService;
  
  static getInstance(): FallbackService {
    if (!FallbackService.instance) {
      FallbackService.instance = new FallbackService();
    }
    return FallbackService.instance;
  }

  // Intercepter les erreurs et fournir des données de fallback
  async handleApiError(error: any, endpoint: string): Promise<any> {
    console.warn(`API Error on ${endpoint}, using fallback data`);
    
    // Dashboard stats fallback
    if (endpoint.includes('dashboard/stats')) {
      return {
        totalScans: 0,
        healthScoreAverage: 75,
        categoryBreakdown: {
          food: 0,
          cosmetics: 0,
          detergents: 0
        },
        monthlyProgress: 0,
        topCategory: 'food',
        recentAnalyses: [],
        weeklyTrend: [
          { day: 'Lun', scans: 0 },
          { day: 'Mar', scans: 0 },
          { day: 'Mer', scans: 0 },
          { day: 'Jeu', scans: 0 },
          { day: 'Ven', scans: 0 },
          { day: 'Sam', scans: 0 },
          { day: 'Dim', scans: 0 }
        ]
      };
    }
    
    // History fallback
    if (endpoint.includes('history')) {
      return {
        analyses: [],
        total: 0,
        page: 1,
        limit: 10
      };
    }
    
    // Products fallback
    if (endpoint.includes('products')) {
      return {
        products: [],
        total: 0
      };
    }
    
    // Default fallback
    return null;
  }
}

export default FallbackService.getInstance();
