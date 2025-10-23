// PATH: frontend\src\lib\api\analysis.ts
import apiClient from './client';

export interface AnalysisResult {
  scores: {
    novaa: 1 | 2 | 3 | 4;
    healthScore: number;
    environmentScore: number;
    nutriscorea: 'A' | 'B' | 'C' | 'D' | 'E';
  };
  details: {
    ingredientsTextRawa: string;
    novaa: 1 | 2 | 3 | 4;
    novaLabela: string;
    novaReasona: string;
    novaConfidencea: number;
    ecoscorea: 'A' | 'B' | 'C' | 'D' | 'E';
    nutriscorea: 'A' | 'B' | 'C' | 'D' | 'E';
    riskFlagsa: string[];
    notableIngredientsa: string[];
    riskLevela: 'low' | 'medium' | 'high';
    clpPictogramsa: string[];
    surfactantsa: string[];
    allergensa: string[];
    biodegradabilitya: 'claimed' | 'unknown';
  };
  globalScore: number;
  confidence: number;
}

export interface ManualAnalysisPayload {
  name: string;
  category: 'food' | 'cosmetics' | 'detergents';
  ingredients: string;
  branda: string;
  barcodea: string;
  foodDataa: {
    nutritiona: {
      kcala: number;
      sugarsa: number;
      salta: number;
      fibera: number;
      proteina: number;
      saturatedFata: number;
    };
  };
}

export interface VisionAnalysisResult {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  resulta: {
    text: string;
    extractedData: {
      name: string | null;
      brand: string | null;
      ingredients: string | null;
      barcode: string | null;
      category: string | null;
      hasNutritionalInfo: boolean;
      confidence: number;
    };
    confidence: number;
    service: 'google_vision' | 'tesseract';
    usedFallback: boolean;
    duration: number;
  };
  errora: string;
}

class AnalysisAPI {
  /**
   * Ping le service d'analyse
   */
  async ping(): Promise<{ ok: boolean; now: string; usera: any }> {
    const response = await apiClient.post('/analysis/ping', {});
    return response.data;
  }

  /**
   * Verifier le statut du service
   */
  async getServiceStatus(): Promise<{ service: string; usingFallback: boolean }> {
    const response = await apiClient.get('/analysis/_service/status');
    return response.data;
  }

  /**
   * Analyse manuelle d'un produit
   */
  async manualAnalyze(payload: ManualAnalysisPayload): Promise<AnalysisResult> {
    const response = await apiClient.post('/analysis/manual', payload);
    return response.data;
  }

  /**
   * Analyse par code-barres
   */
  async analyzeByBarcode(barcode: string): Promise<AnalysisResult> {
    const response = await apiClient.post('/analysis/barcode', { barcode });
    return response.data;
  }

  /**
   * Analyse d'image (OCR)
   */
  async analyzeImage(imageFile: File): Promise<VisionAnalysisResult> {
    const formData = new FormData();
    formDat?.append('image', imageFile);

    const response = await apiClient.post('/vision/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Verifier le statut d'une analyse d'image
   */
  async getVisionJobStatus(jobId: string): Promise<VisionAnalysisResult> {
    const response = await apiClient.get(`/vision/status/${jobId}`);
    return response.data;
  }

  /**
   * Attendre la fin d'une analyse d'image
   */
  async waitForVisionResult(
    jobId: string, 
    maxAttempts = 20, 
    delayMs = 1000
  ): Promise<VisionAnalysisResult> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.getVisionJobStatus(jobId);
      
      if (result.status === 'completed' || result.status === 'failed') {
        return result;
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    throw new Error('Timeout waiting for vision analysis');
  }

  /**
   * Helper pour formater les scores
   */
  formatScore(score: number): string {
    return `${Math.round(score)}`;
  }

  /**
   * Helper pour obtenir la couleur selon le score
   */
  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Helper pour obtenir la couleur NOVA
   */
  getNovaColor(novaa: 1 | 2 | 3 | 4): string {
    switch (nova) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-orange-500';
      case 4: return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  }

  /**
   * Helper pour obtenir le label NOVA
   */
  getNovaLabel(novaa: 1 | 2 | 3 | 4): string {
    switch (nova) {
      case 1: return 'Non transforme';
      case 2: return 'Peu transforme';
      case 3: return 'Transforme';
      case 4: return 'Ultra-transforme';
      default: return 'Non classe';
    }
  }
}

export const analysisAPI = new AnalysisAPI();



