// frontend/src/services/analysisService.ts - Version unifiee et robuste

import { apiClient } from './apiClient';

// Types unifies
export interface AnalysisRequest {
  mode?: 'manual' | 'barcode' | 'image';
  category?: 'food' | 'cosmetics' | 'detergents';
  name?: string;
  ingredients?: string;
  composition?: string; // Pour detergents
  barcode?: string;
  brand?: string;
  language?: 'fr' | 'en';
}

export interface UnifiedScore {
  value: number; // 0-100
  label: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface Risk {
  code: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  evidence?: string[];
}

export interface AnalysisResponse {
  success: boolean;
  timestamp: string;
  analysisTime?: number;
  data: {
    id: string;
    category: 'food' | 'cosmetics' | 'detergents';
    name: string;
    brand?: string;
    barcode?: string;
    
    // Score principal unifie
    score: UnifiedScore;
    
    // Details specifiques par categorie
    details: {
      // Alimentaire
      nova?: number;
      novaLabel?: string;
      nutriscore?: string;
      ecoscore?: string;
      
      // Cosmetique
      inciScore?: number;
      riskFlags?: string[];
      notableIngredients?: string[];
      
      // Detergent
      clpPictograms?: string[];
      surfactants?: string[];
      biodegradability?: string;
      
      // Commun
      ingredientsText?: string;
      composition?: string;
    };
    
    // Informations communes
    risks: Risk[];
    highlights: string[];
    recommendations: string[];
    sources?: string[];
    
    // Donnees brutes (optionnel)
    raw?: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class AnalysisService {
  private readonly endpoints = {
    food: '/analysis',
    cosmetics: '/cosmetics/analyze',
    detergents: '/detergents/analyze'
  };

  private readonly categoryDetection = {
    cosmetics: ['creme', 'gel', 'shampoing', 'savon', 'lotion', 'serum', 'masque'],
    detergents: ['lessive', 'detergent', 'nettoyant', 'javel', 'desinfectant'],
    food: ['yaourt', 'biscuit', 'chocolat', 'cereales', 'conserve', 'plat']
  };

  /**
   * Analyse un produit avec detection automatique de categorie
   */
  async analyzeProduct(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      // Detection automatique de categorie si non fournie
      if (!request.category && request.name) {
        request.category = this.detectCategory(request.name);
      }

      // Normalisation des donnees selon la categorie
      const normalizedRequest = this.normalizeRequest(request);
      
      // Selection de l'endpoint
      const endpoint = this.endpoints[request.category || 'food'];
      
      // Appel API avec retry automatique
      const response = await this.callWithRetry(endpoint, normalizedRequest);
      
      // Normalisation de la reponse
      return this.normalizeResponse(response.data, request.category || 'food');
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      
      // Gestion des erreurs avec fallback
      if (error.response?.status === 429) {
        throw new Error('Limite de requetes atteinte. Veuillez reessayer dans quelques instants.');
      }
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data?.error.message || 'Erreur lors de l\'analyse');
      }
      
      throw new Error('Impossible d\'analyser le produit. Verifiez votre connexion.');
    }
  }

  /**
   * Detecte la categorie d'un produit base sur son nom
   */
  private detectCategory(name: string): 'food' | 'cosmetics' | 'detergents' {
    const lowerName = name.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryDetection)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category as any;
      }
    }
    
    // Par defaut: alimentaire
    return 'food';
  }

  /**
   * Normalise la requete selon la categorie
   */
  private normalizeRequest(request: AnalysisRequest): any {
    const base = {
      name: request.name?.trim() || 'Produit sans nom',
      language: request.language || 'fr',
      mode: request.mode || 'manual'
    };

    switch (request.category) {
      case 'cosmetics':
        return {
          ...base,
          ingredients: request.ingredients || request.composition || ''
        };
        
      case 'detergents':
        return {
          ...base,
          composition: request.composition || request.ingredients || ''
        };
        
      default: // food
        return {
          ...base,
          ingredients: request.ingredients || '',
          barcode: request.barcode,
          category: 'food'
        };
    }
  }

  /**
   * Normalise la reponse pour avoir une structure unifiee
   */
  private normalizeResponse(data: any, category: string): AnalysisResponse {
    // Si la reponse est dejÂ  normalisee
    if (data?.success !== undefined && data?.data?.score?.value !== undefined) {
      return data;
    }

    // Conversion des anciennes structures
    const score = this.extractUnifiedScore(data, category);
    const details = this.extractDetails(data, category);
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        id: data?.id || `${category}-${Date.now()}`,
        category: category as any,
        name: data?.name || data?.productName || 'Produit analyse',
        brand: data?.brand,
        barcode: data?.barcode,
        score,
        details,
        risks: this.extractRisks(data, category),
        highlights: this.extractHighlights(data, category),
        recommendations: this.extractRecommendations(data, category),
        sources: data?.sources || [],
        raw: data?.raw || data
      }
    };
  }

  /**
   * Extrait un score unifie depuis differentes structures
   */
  private extractUnifiedScore(data: any, category: string): UnifiedScore {
    let value = 0;
    
    switch (category) {
      case 'cosmetics':
        value = data?.score?.value || data?.healthScore || data?.safetyScore || 50;
        break;
        
      case 'detergents':
        value = data?.score?.value || data?.environmentScore || data?.ecoScore || 50;
        break;
        
      default: // food
        value = data?.globalScore || data?.score?.value || 50;
        // Penalite pour NOVA eleve
        if (data?.scores?.nova === 4) value = Math.min(value, 30);
        else if (data?.scores?.nova === 3) value = Math.min(value, 50);
    }
    
    return {
      value: Math.round(Math.max(0, Math.min(100, value))),
      label: this.getScoreLabel(value)
    };
  }

  /**
   * Conversion score -> label
   */
  private getScoreLabel(score: number): 'A' | 'B' | 'C' | 'D' | 'E' {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'E';
  }

  /**
   * Extrait les details specifiques par categorie
   */
  private extractDetails(data: any, category: string): any {
    const base = {
      ingredientsText: data?.ingredients?.text || data?.ingredientsTextRaw || data?.ingredients,
      composition: data?.composition
    };
    
    switch (category) {
      case 'cosmetics':
        return {
          ...base,
          inciScore: data?.healthScore,
          riskFlags: data?.details?.riskFlags || [],
          notableIngredients: data?.details?.notableIngredients || []
        };
        
      case 'detergents':
        return {
          ...base,
          clpPictograms: data?.details?.clpPictograms || [],
          surfactants: data?.details?.surfactants || [],
          biodegradability: data?.details?.biodegradability
        };
        
      default:
        return {
          ...base,
          nova: data?.scores?.nova || data?.details?.nova,
          novaLabel: data?.details?.novaLabel,
          nutriscore: data?.scores?.nutriscore || data?.details?.nutriscore,
          ecoscore: data?.details?.ecoscore
        };
    }
  }

  /**
   * Extrait les risques
   */
  private extractRisks(data: any, category: string): Risk[] {
    if (data?.risks && Array.isArray(data?.risks)) {
      return data?.risks;
    }
    
    const risks: Risk[] = [];
    
    // Risques specifiques par categorie
    switch (category) {
      case 'cosmetics':
        if (data?.details?.riskLevel === 'high' || data?.healthScore < 40) {
          risks.push({
            code: 'HIGH_RISK_INGREDIENTS',
            severity: 'high',
            message: 'Presence d\'ingredients Â  risque eleve'
          });
        }
        break;
        
      case 'detergents':
        if (data?.details?.clpPictograms?.includes('GHS05')) {
          risks.push({
            code: 'CORROSIVE',
            severity: 'high',
            message: 'Produit corrosif'
          });
        }
        break;
        
      default: // food
        if (data?.scores?.nova === 4) {
          risks.push({
            code: 'ULTRA_PROCESSED',
            severity: 'high',
            message: 'Produit ultra-transforme'
          });
        }
    }
    
    return risks;
  }

  /**
   * Extrait les points positifs
   */
  private extractHighlights(data: any, category: string): string[] {
    if (data?.highlights && Array.isArray(data?.highlights)) {
      return data?.highlights;
    }
    
    const highlights: string[] = [];
    const score = this.extractUnifiedScore(data, category);
    
    if (score.value >= 80) {
      highlights.push('Ã¢Å“Â¨ Excellente qualite globale');
    } else if (score.value >= 60) {
      highlights.push('Ã°Å¸â€˜Â Bonne qualite generale');
    }
    
    return highlights;
  }

  /**
   * Extrait les recommandations
   */
  private extractRecommendations(data: any, category: string): string[] {
    if (data?.recommendations && Array.isArray(data?.recommendations)) {
      return data?.recommendations;
    }
    
    const recommendations: string[] = [];
    const score = this.extractUnifiedScore(data, category);
    
    if (score.value < 40) {
      recommendations.push('Envisager des alternatives de meilleure qualite');
    }
    
    return recommendations;
  }

  /**
   * Appel API avec retry automatique
   */
  private async callWithRetry(endpoint: string, data: any, retries = 2): Promise<any> {
    try {
      return await apiClient.post(endpoint, data);
    } catch (error: any) {
      if (retries > 0 && error.response?.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.callWithRetry(endpoint, data, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Analyse par code-barres
   */
  async analyzeByBarcode(barcode: string): Promise<AnalysisResponse> {
    return this.analyzeProduct({
      mode: 'barcode',
      barcode: barcode.trim()
    });
  }

  /**
   * Obtient les details d'un produit
   */
  async getProductDetails(productId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw new Error('Impossible de recuperer les details du produit');
    }
  }
}

export const analysisService = new AnalysisService();
export default analysisService;

