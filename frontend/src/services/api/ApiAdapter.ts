// frontend/src/services/api/ApiAdapter.ts
// Service d'adaptation pour gérer les différents formats de réponse API

export interface NormalizedAnalysisResponse {
  success: boolean;
  data: {
    id: string;
    category: 'food' | 'cosmetics' | 'detergents';
    name: string;
    brand?: string;
    score: {
      value: number;
      label: 'A' | 'B' | 'C' | 'D' | 'E';
    };
    details: {
      nova?: number;
      novaLabel?: string;
      nutriscore?: string;
      ecoscore?: string;
      ingredientsText: string;
    };
    risks: Array<{
      code: string;
      severity: 'low' | 'medium' | 'high';
      message: string;
      evidence?: string[];
    }>;
    highlights: string[];
    recommendations: string[];
  };
  timestamp: string;
}

export class ApiAdapter {
  /**
   * Normalise la réponse d'analyse quel que soit le format retourné par l'API
   */
  static normalizeAnalysisResponse(response: any): NormalizedAnalysisResponse {
    // Format normalisé (nouvelle structure)
    if (response.success && response.data) {
      return response as NormalizedAnalysisResponse;
    }

    // Format actuel en production
    if (response.globalScore !== undefined) {
      return {
        success: true,
        timestamp: response.timestamp || new Date().toISOString(),
        data: {
          id: response.id || `temp-${Date.now()}`,
          category: response.category || 'food',
          name: response.name || 'Produit',
          brand: response.brand,
          score: {
            value: response.globalScore || 0,
            label: this.getScoreLabel(response.globalScore || 0)
          },
          details: {
            nova: response.scores?.nova || response.details?.nova,
            novaLabel: response.details?.novaLabel || this.getNovaLabel(response.scores?.nova),
            nutriscore: response.scores?.nutriscore || response.details?.nutriscore,
            ecoscore: response.scores?.ecoscore || response.details?.ecoscore,
            ingredientsText: response.details?.ingredientsTextRaw || response.ingredients || ''
          },
          risks: this.extractRisks(response),
          highlights: this.extractHighlights(response),
          recommendations: response.recommendations || []
        }
      };
    }

    // Format inconnu - fallback
    throw new Error('Format de réponse API non reconnu');
  }

  /**
   * Convertit un score numérique en label A-E
   */
  private static getScoreLabel(score: number): 'A' | 'B' | 'C' | 'D' | 'E' {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'E';
  }

  /**
   * Convertit un score NOVA en label
   */
  private static getNovaLabel(nova?: number): string {
    switch (nova) {
      case 1: return 'Non transformé';
      case 2: return 'Ingrédients culinaires';
      case 3: return 'Transformé';
      case 4: return 'Ultra-transformé';
      default: return '';
    }
  }

  /**
   * Extrait les risques depuis l'ancien format
   */
  private static extractRisks(response: any): any[] {
    const risks = [];

    // Risque NOVA 4
    if (response.scores?.nova === 4 || response.details?.nova === 4) {
      risks.push({
        code: 'ULTRA_PROCESSED',
        severity: 'high',
        message: 'Produit ultra-transformé',
        evidence: response.details?.novaReason ? [response.details.novaReason] : []
      });
    }

    // Risque Nutri-Score
    const nutriscore = response.scores?.nutriscore || response.details?.nutriscore;
    if (nutriscore === 'D' || nutriscore === 'E') {
      risks.push({
        code: 'POOR_NUTRITION',
        severity: 'medium',
        message: 'Qualité nutritionnelle faible'
      });
    }

    // Score global faible
    if (response.globalScore < 40) {
      risks.push({
        code: 'LOW_HEALTH_SCORE',
        severity: 'medium',
        message: 'Score santé faible'
      });
    }

    return risks;
  }

  /**
   * Extrait les points positifs
   */
  private static extractHighlights(response: any): string[] {
    const highlights = [];

    // NOVA favorable
    if (response.scores?.nova <= 2 || response.details?.nova <= 2) {
      highlights.push('✨ Peu ou pas transformé');
    }

    // Nutri-Score favorable
    const nutriscore = response.scores?.nutriscore || response.details?.nutriscore;
    if (nutriscore === 'A' || nutriscore === 'B') {
      highlights.push('🥗 Bonne qualité nutritionnelle');
    }

    // Score global élevé
    if (response.globalScore >= 70) {
      highlights.push('👍 Bon choix santé');
    }

    return highlights;
  }

  /**
   * Normalise les erreurs API
   */
  static normalizeError(error: any): { code: string; message: string } {
    if (error.response?.data?.error) {
      return {
        code: error.response.data.error.code || 'UNKNOWN_ERROR',
        message: error.response.data.error.message || 'Une erreur est survenue'
      };
    }

    if (error.message) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'Une erreur inattendue est survenue'
    };
  }
}