// PATH: src/services/analysisService.ts
import api from './apiClient';

// Types pour les analyses
export interface AnalysisResult {
  success: boolean;
  scores: {
    nova?: number;
    healthScore: number;
    environmentScore: number;
    nutriscore?: string;
    ecoscore?: string;
  };
  details: {
    ingredientsTextRaw?: string;
    nova?: number;
    novaLabel?: string;
    novaReason?: string;
    novaConfidence?: number;
    nutriscore?: string;
    ecoscore?: string;
    riskFlags?: string[];
    notableIngredients?: string[];
    riskLevel?: string;
    clpPictograms?: string[];
    surfactants?: string[];
    allergens?: string[];
    biodegradability?: string;
  };
  globalScore: number;
  confidence: number;
  productId?: string;
  analysisId?: string;
}

export interface ManualAnalysisRequest {
  name: string;
  category: 'food' | 'cosmetics' | 'detergents';
  ingredients?: string;
  brand?: string;
  barcode?: string;
}

// Service d'analyse
class AnalysisService {
  /**
   * Analyse manuelle d'un produit
   */
  async analyzeManual(data: ManualAnalysisRequest): Promise<AnalysisResult> {
    try {
      const response = await api.post<AnalysisResult>('/api/analysis/manual', data);
      return response;
    } catch (error) {
      console.error('Erreur lors de l\'analyse manuelle:', error);
      throw error;
    }
  }

  /**
   * Analyse par code-barres
   */
  async analyzeByBarcode(barcode: string): Promise<AnalysisResult> {
    try {
      const response = await api.post<AnalysisResult>('/api/analysis/barcode', { barcode });
      return response;
    } catch (error) {
      console.error('Erreur lors de l\'analyse par code-barres:', error);
      throw error;
    }
  }

  /**
   * Analyse générale (route alternative)
   */
  async analyze(data: ManualAnalysisRequest): Promise<AnalysisResult> {
    try {
      const response = await api.post<AnalysisResult>('/api/analysis', data);
      return response;
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      throw error;
    }
  }

  /**
   * Vérification du statut du service
   */
  async checkStatus(): Promise<{ service: string; usingFallback: boolean }> {
    try {
      const response = await api.get<{ service: string; usingFallback: boolean }>(
        '/api/analysis/_service/status'
      );
      return response;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      return { service: 'analysis', usingFallback: true };
    }
  }

  /**
   * Ping du service
   */
  async ping(): Promise<{ ok: boolean; now: number; user?: any }> {
    try {
      const response = await api.post<{ ok: boolean; now: number; user?: any }>(
        '/api/analysis/ping',
        {}
      );
      return response;
    } catch (error) {
      console.error('Erreur lors du ping:', error);
      throw error;
    }
  }

  /**
   * Tracking des événements d'analyse
   * Essaie plusieurs endpoints possibles pour le tracking
   */
  async track(event: string, data?: any): Promise<void> {
    // Données de tracking à envoyer
    const trackingData = {
      event,
      data,
      timestamp: new Date().toISOString(),
      source: 'web',
      ...data
    };

    // Essayer plusieurs endpoints possibles
    const endpoints = [
      '/api/analytics/track',
      '/api/track',
      '/api/analysis/track'
    ];

    for (const endpoint of endpoints) {
      try {
        await api.post(endpoint, trackingData);
        console.log(`[Analytics] Event tracked: ${event}`, data);
        return; // Succès, on sort
      } catch (error: any) {
        // En DEV, on ignore les erreurs 404 pour le tracking
        if (import.meta.env.DEV && error?.message?.includes('404')) {
          console.log(`[Analytics] Tracking endpoint not found (${endpoint}), skipping in DEV`);
        } else {
          console.error(`[Analytics] Error tracking to ${endpoint}:`, error);
        }
      }
    }

    // Si tous les endpoints échouent en DEV, on fait un simple log
    if (import.meta.env.DEV) {
      console.log(`[Analytics] DEV MODE - Event logged locally: ${event}`, data);
    }
  }

  /**
   * Récupère l'historique des analyses de l'utilisateur
   */
  async getHistory(limit: number = 10): Promise<AnalysisResult[]> {
    try {
      const response = await api.get<{ analyses: AnalysisResult[] }>(
        `/api/analysis/history?limit=${limit}`
      );
      return response.analyses || [];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  /**
   * Récupère une analyse spécifique par ID
   */
  async getById(analysisId: string): Promise<AnalysisResult | null> {
    try {
      const response = await api.get<AnalysisResult>(`/api/analysis/${analysisId}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'analyse:', error);
      return null;
    }
  }
}

// Export d'une instance unique
const analysisService = new AnalysisService();
export default analysisService;

// Export de la classe pour les tests
export { AnalysisService };