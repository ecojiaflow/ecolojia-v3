// PATH: frontend/src/services/ai/ultraTransformService.ts
import { NovaResult } from './novaClassifier';

export interface UltraTransformResult {
  productName: string;
  transformationLevel: number;
  processingMethods: string[];
  industrialMarkers: string[];
  nutritionalImpact: {
    vitaminLoss: number;
    mineralRetention: number;
    proteinDenaturation: number;
    fiberDegradation: number;
    antioxidantLoss: number;
    glycemicIndexIncrease: number;
    neoformedCompounds: 'low' | 'medium' | 'high';
    bioavailabilityImpact: 'positive' | 'neutral' | 'mixed' | 'negative';
  };
  recommendations: string[];
  naturalityMatrix: {
    naturalIngredients: number;
    artificialIngredients: number;
    processingAids: number;
    naturalityScore: number;
  };
  confidence: number;
  scientificSources: string[];
  visualization?: {
    levelColor: string;
    levelIcon: string;
    levelLabel: string;
  };
  metadata?: {
    analysisType: string;
    version: string;
    processingTime: string;
  };
  // Compatibilité avec le composant simplifié
  novaClass?: 1 | 2 | 3 | 4;
  transformationScore?: number;
  additivesCount?: number;
}

export interface CombinedAnalysisResult {
  productName: string;
  nova: NovaResult;
  ultraTransformation: UltraTransformResult;
  holisticScore: number;
  globalAssessment: string;
  recommendations: string[];
  timestamp: string;
}

class UltraTransformService {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'https://ecolojia-backend-working.onrender.com';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Analyse Ultra-Transformation d'un produit
   */
  async analyzeUltraTransformation(
    productName: string,
    ingredients: string
  ): Promise<UltraTransformResult> {
    try {
      console.log('Ã°Å¸â€Â¬ UltraTransformService - Démarrage analyse:', { productName });

      // âÅ“â€¦ CORRECTION: Utiliser la nouvelle URL /api/products/ultra-transform
      const response = await fetch(`${this.baseUrl}/api/products/ultra-transform`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          productName: productName.trim(),
          product_name: productName.trim(), // Compatibilité backend
          ingredients: ingredients.trim()
        })
      });

      console.log('Ã°Å¸Å’Â Réponse serveur Ultra-Transform:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('âÅ¡Â ïÂ¸Â Endpoint ultra-transform non disponible, utilisation du fallback');
          return this.analyzeLocal(productName, ingredients);
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('âÂÅ’ Erreur HTTP:', response.status, errorData);
        throw new Error(errorData.error || errorData.message || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        console.error('âÂÅ’ Réponse backend échec:', data);
        throw new Error(data.message || 'Erreur analyse ultra-transformation');
      }
      
      // Extraction du résultat selon la structure de réponse
      const result = data.analysis || data;
      
      console.log('âÅ“â€¦ Analyse Ultra-Transformation réussie:', result);

      // Ajout des champs de compatibilité et enrichissement
      const enrichedResult: UltraTransformResult = {
        ...result,
        // Mapping pour le composant simplifié
        novaClass: this.mapTransformLevelToNova(result.transformationLevel),
        transformationScore: this.calculateTransformationScore(result),
        additivesCount: result.industrialMarkers?.filter((m: string) => m.includes('Additif')).length || result.additivesCount || 0,
        // Ajout visualization si manquante
        visualization: result.visualization || {
          levelColor: this.getLevelColor(result.transformationLevel),
          levelIcon: this.getLevelIcon(result.transformationLevel),
          levelLabel: this.getLevelLabel(result.transformationLevel)
        },
        // Métadonnées enrichies
        metadata: {
          ...result.metadata,
          analysisType: 'backend_ultra_transformation',
          version: '1.1',
          processingTime: result._metadata?.analysisTimestamp ? 'backend' : 'realtime'
        }
      };

      return enrichedResult;
    } catch (error: any) {
      console.error('âÂÅ’ Erreur service Ultra-Transformation:', error);
      
      // Fallback vers analyse locale si backend indisponible
      if (error.message.includes('fetch') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('Route non trouvée') ||
          error.message.includes('404')) {
        console.log('Ã°Å¸â€â€ž Fallback vers analyse locale');
        return this.analyzeLocal(productName, ingredients);
      }
      
      throw error;
    }
  }

  /**
   * Analyse combinée NOVA + Ultra-Transformation
   */
  async analyzeCombined(
    productName: string,
    ingredients: string
  ): Promise<CombinedAnalysisResult> {
    try {
      console.log('Ã°Å¸â€Â¬ Analyse combinée NOVA + Ultra-Transform:', { productName });

      // âÅ“â€¦ CORRECTION: Tenter d'abord /products/combined, sinon fallback
      const response = await fetch(`${this.baseUrl}/api/products/combined`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          productName: productName.trim(),
          product_name: productName.trim(), // Compatibilité
          ingredients: ingredients.trim()
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Fallback : analyses séparées
          console.log('Ã°Å¸â€â€ž Endpoint combined non disponible, analyses séparées');
          return this.combinedFallback(productName, ingredients);
        }
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = data.analysis || data;
      
      console.log('âÅ“â€¦ Analyse combinée réussie:', result);

      return result;
    } catch (error: any) {
      console.error('âÂÅ’ Erreur analyse combinée:', error);
      
      if (error.message.includes('404') || error.message.includes('fetch')) {
        return this.combinedFallback(productName, ingredients);
      }
      
      throw error;
    }
  }

  /**
   * Fallback pour analyse combinée
   */
  private async combinedFallback(productName: string, ingredients: string): Promise<CombinedAnalysisResult> {
    console.log('Ã°Å¸â€â€ž Fallback analyse combinée');
    
    // Analyse ultra-transformation locale
    const ultraResult = await this.analyzeUltraTransformation(productName, ingredients);
    
    // Nova simulé (basique)
    const novaResult: NovaResult = {
      novaGroup: ultraResult.novaClass || 4,
      healthScore: Math.max(0, 100 - (ultraResult.transformationScore || 80)),
      confidence: ultraResult.confidence,
      additives: {
        total: ultraResult.additivesCount || 0,
        details: []
      },
      productName,
      ingredients,
      analysis: {},
      source: 'fallback_combined'
    };

    return {
      productName,
      nova: novaResult,
      ultraTransformation: ultraResult,
      holisticScore: Math.round((novaResult.healthScore + (100 - (ultraResult.transformationScore || 80))) / 2),
      globalAssessment: ultraResult.transformationLevel >= 4 ? 
        'Produit ultra-transformé ÃƒÂ  limiter' : 
        'Produit acceptable avec modération',
      recommendations: [
        ...ultraResult.recommendations,
        'Ã°Å¸â€â€ž Analyse combinée en mode fallback'
      ],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyse locale de secours (fallback)
   */
  private analyzeLocal(productName: string, ingredients: string): UltraTransformResult {
    console.log('Ã°Å¸â€â€ž Analyse Ultra-Transformation locale pour:', productName);
    
    // Analyse simplifiée locale
    const lower = ingredients.toLowerCase();
    let level = 1;
    const methods: string[] = [];
    const markers: string[] = [];
    
    // Détection basique des méthodes de transformation
    if (lower.includes('hydrogéné')) {
      methods.push('hydrogénation');
      markers.push('Marqueur détecté: hydrogénation');
      level = Math.max(level, 4);
    }
    if (lower.includes('sirop') && lower.includes('glucose')) {
      methods.push('hydrolyse enzymatique');
      markers.push('Marqueur détecté: sirop glucose-fructose');
      level = Math.max(level, 4);
    }
    if (lower.includes('maltodextrine')) {
      markers.push('Marqueur détecté: maltodextrine');
      level = Math.max(level, 4);
    }
    if (lower.includes('huile') && lower.includes('palme')) {
      methods.push('raffinage intensif');
      markers.push('Marqueur détecté: huile de palme raffinée');
      level = Math.max(level, 3);
    }
    if (lower.includes('arôme artificiel') || lower.includes('arôme')) {
      methods.push('aromatisation artificielle');
      markers.push('Marqueur détecté: arômes artificiels');
      level = Math.max(level, 3);
    }
    
    // Comptage des additifs E
    const eAdditives = (lower.match(/e\d{3,4}/g) || []);
    const additivesCount = eAdditives.length;
    
    if (additivesCount > 5) level = Math.max(level, 4);
    else if (additivesCount > 2) level = Math.max(level, 3);
    else if (additivesCount > 0) level = Math.max(level, 2);
    
    if (additivesCount > 0) {
      markers.push(`Marqueur détecté: ${additivesCount} additif(s) E${eAdditives.map(e => e.substring(1)).join(', E')}`);
    }
    
    // Détection conservateurs/colorants/édulcorants
    if (lower.includes('conservateur')) {
      markers.push('Marqueur détecté: conservateurs');
      level = Math.max(level, 3);
    }
    if (lower.includes('colorant')) {
      markers.push('Marqueur détecté: colorants');
      level = Math.max(level, 3);
    }
    if (lower.includes('édulcorant')) {
      markers.push('Marqueur détecté: édulcorants');
      level = Math.max(level, 3);
    }
    
    // Impact nutritionnel calculé
    const nutritionalImpact = {
      vitaminLoss: level * 15,
      mineralRetention: Math.max(20, 100 - (level * 15)),
      proteinDenaturation: level * 12,
      fiberDegradation: level * 10,
      antioxidantLoss: level * 18,
      glycemicIndexIncrease: level >= 3 ? 25 + (level * 5) : 10,
      neoformedCompounds: level >= 4 ? 'high' as const : level >= 3 ? 'medium' as const : 'low' as const,
      bioavailabilityImpact: level >= 4 ? 'negative' as const : level >= 3 ? 'mixed' as const : 'neutral' as const
    };
    
    // Recommandations personnalisées
    const recommendations = [
      level >= 4 ? 'Ã°Å¸Å¡Â¨ Ultra-transformation détectée - limiter la consommation' : 
      level >= 3 ? 'âÅ¡Â ïÂ¸Â Transformation importante - consommation modérée' :
      level >= 2 ? 'Ã°Å¸â€™â€º Produit transformé - consommation occasionnelle' :
      'âÅ“â€¦ Transformation minimale - produit acceptable',
      `Ã°Å¸â€œÅ  ${methods.length} méthode(s) de transformation identifiée(s)`,
      `Ã°Å¸â€Â¬ ${markers.length} marqueur(s) industriel(s) détecté(s)`,
      'Ã°Å¸â€œÂ± Analyse locale - résultats approximatifs'
    ];

    const naturalIngredients = Math.max(0, ingredients.split(',').length - additivesCount - methods.length);
    
    return {
      productName,
      transformationLevel: level,
      processingMethods: methods,
      industrialMarkers: markers,
      nutritionalImpact,
      recommendations,
      naturalityMatrix: {
        naturalIngredients,
        artificialIngredients: additivesCount,
        processingAids: methods.length,
        naturalityScore: Math.max(0, Math.round(100 - (level * 20) - (additivesCount * 5)))
      },
      confidence: 0.65, // Confiance locale raisonnable
      scientificSources: ['Analyse locale NOVA', 'Patterns ultra-transformation', 'Base additifs E'],
      visualization: {
        levelColor: this.getLevelColor(level),
        levelIcon: this.getLevelIcon(level),
        levelLabel: this.getLevelLabel(level)
      },
      metadata: {
        analysisType: 'local_fallback',
        version: '1.1-local',
        processingTime: 'immediate'
      },
      // Compatibilité
      novaClass: this.mapTransformLevelToNova(level),
      transformationScore: Math.min(100, level * 20 + additivesCount * 3),
      additivesCount
    };
  }

  /**
   * Obtient les informations sur le service
   */
  async getServiceInfo(): Promise<any> {
    try {
      // âÅ“â€¦ CORRECTION: Nouvelle URL
      const response = await fetch(`${this.baseUrl}/api/products/status`);
      if (!response.ok) throw new Error('Service info unavailable');
      return await response.json();
    } catch (error) {
      return {
        service: 'Ultra-Transformation Analyzer',
        version: 'local-fallback',
        status: 'limited',
        features: ['local-analysis', 'pattern-detection']
      };
    }
  }

  // Méthodes utilitaires privées
  private getLevelColor(level: number): string {
    switch (level) {
      case 1: return '#10B981'; // vert
      case 2: return '#84CC16'; // vert clair
      case 3: return '#F59E0B'; // orange
      case 4: return '#F97316'; // orange foncé
      case 5: return '#EF4444'; // rouge
      default: return '#6B7280'; // gris
    }
  }

  private getLevelIcon(level: number): string {
    switch (level) {
      case 1: return 'Ã°Å¸Å’Â¿';
      case 2: return 'Ã°Å¸Å’Â±';
      case 3: return 'âÅ¡Â ïÂ¸Â';
      case 4: return 'Ã°Å¸Å¡Â¨';
      case 5: return 'âÂÅ’';
      default: return 'âÂâ€œ';
    }
  }

  private getLevelLabel(level: number): string {
    switch (level) {
      case 1: return 'Minimal';
      case 2: return 'Simple';
      case 3: return 'Important';
      case 4: return 'Ultra';
      case 5: return 'Extrême';
      default: return 'Inconnu';
    }
  }

  // Méthodes de compatibilité
  private mapTransformLevelToNova(transformLevel: number): 1 | 2 | 3 | 4 {
    if (transformLevel <= 1) return 1;
    if (transformLevel === 2) return 2;
    if (transformLevel === 3) return 3;
    return 4;
  }

  private calculateTransformationScore(result: any): number {
    const level = result.transformationLevel || 4;
    const baseScore = level * 20;
    
    // Ajustements basés sur d'autres facteurs
    let score = baseScore;
    
    if (result.nutritionalImpact?.vitaminLoss > 50) score += 10;
    if (result.processingMethods?.length > 3) score += 10;
    if (result.industrialMarkers?.length > 5) score += 10;
    
    return Math.min(100, score);
  }
}

// Export singleton
export const ultraTransformService = new UltraTransformService();

// Export types et classe
export default UltraTransformService;
// EOF
