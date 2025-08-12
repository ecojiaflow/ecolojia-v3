// PATH: frontend/src/services/analysisService.ts
import api from './apiClient';
import { API_CONFIG } from '../config/api.config';

interface AnalysisData {
  name: string;
  brand?: string;
  ingredients: string;
  category?: 'food' | 'cosmetics' | 'detergents';
  barcode?: string;
}

interface AnalysisResult {
  success: boolean;
  data?: {
    name: string;
    brand?: string;
    category: string;
    scores: {
      healthScore: number;
      environmentScore: number;
      nova?: number;
      nutriscore?: string;
      ecoscore?: string;
    };
    details?: any;
    globalScore: number;
    confidence: number;
  };
  error?: string;
}

interface QuotaResponse {
  scansUsed: number;
  scansLimit: number;
  scansRemaining: number;
  plan: string;
}

class AnalysisService {
  /**
   * Analyse manuelle d'un produit
   */
  async analyzeManual(data: AnalysisData): Promise<AnalysisResult> {
    try {
      console.log('Ã°Å¸â€Â Analyse manuelle:', data);
      
      const response = await api.post('/api/analysis/manual', {
        name: data.name,
        brand: data.brand,
        category: data.category || 'food',
        ingredients: data.ingredients
      });

      console.log('Ã¢Å“â€¦ RÃ©sultat analyse manuelle:', response);
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      console.error('Ã¢ÂÅ’ Erreur analyse manuelle:', error);
      
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'analyse'
      };
    }
  }

  /**
   * Analyse par code-barres
   */
  async analyzeByBarcode(barcode: string): Promise<AnalysisResult> {
    try {
      console.log('Ã°Å¸â€œÅ  Analyse par code-barres:', barcode);
      
      const response = await api.post('/api/analysis/barcode', {
        barcode: barcode.trim()
      });

      console.log('Ã¢Å“â€¦ RÃ©sultat analyse barcode:', response);
      
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      console.error('Ã¢ÂÅ’ Erreur analyse barcode:', error);
      
      if (error.statusCode === 404) {
        return {
          success: false,
          error: 'Produit non trouvÃ© dans notre base de donnÃ©es'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Impossible d\'analyser ce code-barres'
      };
    }
  }

  /**
   * Analyse gÃ©nÃ©rique (utilisÃ©e par MultiScanPage)
   */
  async analyze(data: {
    name: string;
    barcode?: string;
    category: string;
    ingredients?: string;
  }): Promise<any> {
    try {
      // Si on a un code-barres, l'utiliser en prioritÃ©
      if (data.barcode) {
        const result = await this.analyzeByBarcode(data.barcode);
        if (result.success) return result.data;
      }
      
      // Sinon, analyse manuelle
      return await this.analyzeManual({
        name: data.name,
        ingredients: data.ingredients || '',
        category: data.category as any,
        barcode: data.barcode
      });
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de l\'analyse');
    }
  }

  /**
   * VÃ©rifier les quotas
   */
  async checkQuota(): Promise<{
    used: number;
    limit: number;
    remaining: number;
    plan: string;
  }> {
    try {
      const response = await api.get<QuotaResponse>('/api/quota');
      console.log('Ã¢Å“â€¦ Quotas:', response);
      
      return {
        used: response.scansUsed || 0,
        limit: response.scansLimit || 30,
        remaining: response.scansRemaining || 30,
        plan: response.plan || 'free'
      };
    } catch (error) {
      console.error('Ã¢ÂÅ’ Check quota error:', error);
      // Retourner des valeurs par dÃ©faut
      return {
        used: 0,
        limit: 30,
        remaining: 30,
        plan: 'free'
      };
    }
  }

  /**
   * Analyse un produit alimentaire
   */
  async analyzeFood(data: AnalysisData): Promise<any> {
    try {
      const response = await api.post('/api/analysis/food', data);
      return response;
    } catch (error: any) {
      console.error('Food analysis error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Analyse un produit cosmÃ©tique
   */
  async analyzeCosmetic(data: AnalysisData): Promise<any> {
    try {
      const response = await api.post('/api/analysis/cosmetic', data);
      return response;
    } catch (error: any) {
      console.error('Cosmetic analysis error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Analyse un dÃ©tergent
   */
  async analyzeDetergent(data: AnalysisData): Promise<any> {
    try {
      const response = await api.post('/api/analysis/detergent', data);
      return response;
    } catch (error: any) {
      console.error('Detergent analysis error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * RÃ©cupÃ©rer l'historique des analyses
   */
  async getAnalysisHistory(filters: Record<string, any> = {}): Promise<any> {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/api/analyses?${params}`);
      return response;
    } catch (error: any) {
      console.error('Get history error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * RÃ©cupÃ©rer une analyse par ID
   */
  async getAnalysisById(id: string): Promise<any> {
    try {
      const response = await api.get(`/api/analyses/${id}`);
      return response;
    } catch (error: any) {
      console.error('Get analysis error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir des suggestions basÃ©es sur l'historique
   */
  async getSuggestions(): Promise<any> {
    try {
      const response = await api.get('/api/analysis/suggestions');
      return response;
    } catch (error: any) {
      console.error('Get suggestions error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: any): Error {
    if (error.response) {
      const { data, status } = error.response;
      if (status === 401) {
        localStorage.removeItem('ecolojia_token');
        window.location.href = '/auth';
        return new Error('Session expirÃ©e. Veuillez vous reconnecter.');
      }
      if (status === 403) {
        return new Error(data.error || 'AccÃ¨s refusÃ©. VÃ©rifiez vos quotas.');
      }
      if (status === 429) {
        return new Error('Trop de requÃªtes. Veuillez patienter.');
      }
      return new Error(data.error || 'Une erreur est survenue');
    }

    if (error.request) {
      return new Error('Impossible de contacter le serveur. VÃ©rifiez votre connexion.');
    }

    return new Error('Une erreur inattendue est survenue');
  }
}

// CrÃ©er l'instance
const analysisService = new AnalysisService();

// Export nommÃ© et par dÃ©faut
export { analysisService 
  // Méthode track pour les analytics
  async track(eventType: string, data?: any): Promise<void> {
    console.log('📊 Track:', eventType, data);
    // En mode démo, on ne fait que logger
  }};
export default analysisService;

