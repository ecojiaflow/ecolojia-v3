// frontend/src/services/analysisService.ts - Version unifiée et robuste

import { apiClient } from './apiClient';

// Types unifiés
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
    
    // Score principal unifié
    score: UnifiedScore;
    
    // Détails spécifiques par catégorie
    details: {
      // Alimentaire
      nova?: number;
      novaLabel?: string;
      nutriscore?: string;
      ecoscore?: string;
      
      // Cosmétique
      inciScore?: number;
      riskFlags?: string[];
      notableIngredients?: string[];
      
      // Détergent
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
    
    // Données brutes (optionnel)
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
    unified: '/analysis', // Endpoint unifié pour toutes les catégories
    food: '/analysis',
    cosmetics: '/cosmetics/analyze',
    detergents: '/detergents/analyze'
  };

  private readonly categoryDetection = {
    cosmetics: ['crème', 'gel', 'shampoing', 'savon', 'lotion', 'sérum', 'masque'],
    detergents: ['lessive', 'détergent', 'nettoyant', 'javel', 'désinfectant'],
    food: ['yaourt', 'biscuit', 'chocolat', 'céréales', 'conserve', 'plat']
  };

  /**
   * Analyse un produit avec détection automatique de catégorie
   */
  async analyzeProduct(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      // Détection automatique de catégorie si non fournie
      if (!request.category && request.name) {
        request.category = this.detectCategory(request.name);
      }

      // Normalisation des données selon la catégorie
      const normalizedRequest = this.normalizeRequest(request);
      
      // Utiliser l'endpoint unifié pour toutes les catégories
      const endpoint = this.endpoints.unified;
      
      // Appel API avec retry automatique
      const response = await this.callWithRetry(endpoint, normalizedRequest);
      
      // Normalisation de la réponse
      return this.normalizeResponse(response.data, request.category || 'food');
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      
      // Gestion des erreurs avec fallback
      if (error.response?.status === 429) {
        throw new Error('Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.');
      }
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data?.error.message || 'Erreur lors de l\'analyse');
      }
      
      throw new Error('Impossible d\'analyser le produit. Vérifiez votre connexion.');
    }
  }

  /**
   * Détecte la catégorie d'un produit basé sur son nom
   */
  private detectCategory(name: string): 'food' | 'cosmetics' | 'detergents' {
    const lowerName = name.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryDetection)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category as any;
      }
    }
    
    // Par défaut: alimentaire
    return 'food';
  }

  /**
   * Normalise la requête selon la catégorie
   */
  private normalizeRequest(request: AnalysisRequest): any {
    const base = {
      name: request.name?.trim() || 'Produit sans nom',
      language: request.language || 'fr',
      mode: request.mode || 'manual',
      category: request.category || 'food' // Important pour l'endpoint unifié
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
          ingredients: request.composition || request.ingredients || '',
          composition: request.composition || request.ingredients || ''
        };
        
      default: // food
        return {
          ...base,
          ingredients: request.ingredients || '',
          barcode: request.barcode,
          brand: request.brand
        };
    }
  }

  /**
   * Normalise la réponse pour avoir une structure unifiée
   */
  private normalizeResponse(data: any, category: string): AnalysisResponse {
    // Si la réponse est déjà normalisée (nouvelle structure)
    if (data?.success !== undefined && data?.data?.score?.value !== undefined) {
      return data;
    }

    // Adaptation pour la structure actuelle du backend
    const score = this.extractUnifiedScore(data, category);
    const details = this.extractDetails(data, category);
    
    return {
      success: true,
      timestamp: data?.timestamp || new Date().toISOString(),
      analysisTime: data?.analysisTime,
      data: {
        id: data?.id || `${category}-${Date.now()}`,
        category: data?.category || category as any,
        name: data?.name || data?.productName || 'Produit analysé',
        brand: data?.brand,
        barcode: data?.barcode,
        score,
        details,
        risks: this.extractRisks(data, category),
        highlights: this.extractHighlights(data, category),
        recommendations: this.extractRecommendations(data, category),
        sources: data?.sources || [],
        raw: data
      }
    };
  }

  /**
   * Extrait un score unifié depuis différentes structures
   */
  private extractUnifiedScore(data: any, category: string): UnifiedScore {
    let value = 0;
    
    // Gestion de la structure actuelle du backend
    if (data?.globalScore !== undefined) {
      value = data.globalScore;
    } else if (data?.score?.value !== undefined) {
      value = data.score.value;
    } else {
      // Fallback par catégorie
      switch (category) {
        case 'cosmetics':
          value = data?.healthScore || data?.safetyScore || 50;
          break;
          
        case 'detergents':
          value = data?.environmentScore || data?.ecoScore || 50;
          break;
          
        default: // food
          value = data?.scores?.healthScore || 50;
      }
    }
    
    // Pénalité pour NOVA élevé (alimentaire)
    if (category === 'food' && data?.scores?.nova) {
      if (data.scores.nova === 4) value = Math.min(value, 30);
      else if (data.scores.nova === 3) value = Math.min(value, 50);
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
   * Extrait les détails spécifiques par catégorie
   */
  private extractDetails(data: any, category: string): any {
    const base = {
      ingredientsText: data?.details?.ingredientsTextRaw || data?.ingredients?.text || data?.ingredients,
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
        
      default: // food
        return {
          ...base,
          nova: data?.scores?.nova || data?.details?.nova,
          novaLabel: data?.details?.novaLabel || this.getNovaLabel(data?.scores?.nova),
          nutriscore: data?.scores?.nutriscore || data?.details?.nutriscore,
          ecoscore: data?.scores?.ecoscore || data?.details?.ecoscore
        };
    }
  }

  /**
   * Convertit un score NOVA en label
   */
  private getNovaLabel(nova?: number): string | undefined {
    if (!nova) return undefined;
    const labels = {
      1: 'Non transformé',
      2: 'Ingrédients culinaires',
      3: 'Transformé',
      4: 'Ultra-transformé'
    };
    return labels[nova as keyof typeof labels];
  }

  /**
   * Extrait les risques
   */
  private extractRisks(data: any, category: string): Risk[] {
    // Si déjà présents dans le bon format
    if (data?.risks && Array.isArray(data.risks)) {
      return data.risks;
    }
    
    const risks: Risk[] = [];
    
    // Risques spécifiques par catégorie
    switch (category) {
      case 'cosmetics':
        if (data?.details?.riskLevel === 'high' || data?.healthScore < 40) {
          risks.push({
            code: 'HIGH_RISK_INGREDIENTS',
            severity: 'high',
            message: 'Présence d\'ingrédients à risque élevé'
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
        if (data?.details?.clpPictograms?.includes('GHS09')) {
          risks.push({
            code: 'ENV_HAZARD',
            severity: 'medium',
            message: 'Dangereux pour l\'environnement'
          });
        }
        break;
        
      default: // food
        if (data?.scores?.nova === 4) {
          risks.push({
            code: 'ULTRA_PROCESSED',
            severity: 'high',
            message: 'Produit ultra-transformé',
            evidence: data?.details?.novaReason ? [data.details.novaReason] : []
          });
        }
        if (data?.scores?.nutriscore === 'E' || data?.scores?.nutriscore === 'D') {
          risks.push({
            code: 'POOR_NUTRITION',
            severity: 'medium',
            message: 'Qualité nutritionnelle faible'
          });
        }
    }
    
    return risks;
  }

  /**
   * Extrait les points positifs
   */
  private extractHighlights(data: any, category: string): string[] {
    // Si déjà présents
    if (data?.highlights && Array.isArray(data.highlights)) {
      return data.highlights;
    }
    
    const highlights: string[] = [];
    const score = this.extractUnifiedScore(data, category);
    
    if (score.value >= 80) {
      highlights.push('✨ Excellente qualité globale');
    } else if (score.value >= 60) {
      highlights.push('👍 Bonne qualité générale');
    }
    
    // Points positifs spécifiques
    if (category === 'food') {
      if (data?.scores?.nova <= 2) {
        highlights.push('🥗 Peu ou pas transformé');
      }
      if (data?.scores?.nutriscore === 'A' || data?.scores?.nutriscore === 'B') {
        highlights.push('💚 Bonne qualité nutritionnelle');
      }
    }
    
    return highlights;
  }

  /**
   * Extrait les recommandations
   */
  private extractRecommendations(data: any, category: string): string[] {
    // Si déjà présentes
    if (data?.recommendations && Array.isArray(data.recommendations)) {
      return data.recommendations;
    }
    
    const recommendations: string[] = [];
    const score = this.extractUnifiedScore(data, category);
    
    if (score.value < 40) {
      recommendations.push('Envisager des alternatives de meilleure qualité');
    }
    
    if (category === 'food' && data?.scores?.nova >= 3) {
      recommendations.push('Privilégier des aliments moins transformés');
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
   * Obtient les détails d'un produit
   */
  async getProductDetails(productId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw new Error('Impossible de récupérer les détails du produit');
    }
  }
}

export const analysisService = new AnalysisService();
export default analysisService;