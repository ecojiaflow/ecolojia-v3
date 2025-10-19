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
  // Compatibilite avec le composant simplifie
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
      console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂÆ’Ã¢â‚¬Å¡'šÃ‚Â¬ UltraTransformService - Demarrage analyse:', { productName });

      // aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ CORRECTION: Utiliser la nouvelle URL /api/products/ultra-transform
      const response = await fetch(`${this.baseUrl}/api/products/ultra-transform`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          productName: productName.trim(),
          product_name: productName.trim(), // Compatibilite backend
          ingredients: ingredients.trim()
        })
      });

      console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢Æ’Ã¢â‚¬Å¡'šÃ‚Â Reponse serveur Ultra-Transform:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('aÆ’Ã¢â‚¬Â¦'šÃ‚Â¡Æ’Ã¢â‚¬Å¡'šÃ‚Â Æ’Ã‚Â¯Æ’Ã¢â‚¬Å¡'šÃ‚Â¸Æ’Ã¢â‚¬Å¡'šÃ‚Â Endpoint ultra-transform non disponible, utilisation du fallback');
          return this.analyzeLocal(productName, ingredients);
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur HTTP:', response.status, errorData);
        throw new Error(errordata?.error || errordata?.message || `Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data?.success) {
        console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Reponse backend echec:', data);
        throw new Error(data?.message || 'Erreur analyse ultra-transformation');
      }
      
      // Extraction du resultat selon la structure de reponse
      const result = data?.analysis || data;
      
      console.log('aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ Analyse Ultra-Transformation reussie:', result);

      // Ajout des champs de compatibilite et enrichissement
      const enrichedResult: UltraTransformResult = {
        ...result,
        // Mapping pour le composant simplifie
        novaClass: this.mapTransformLevelToNova(result.transformationLevel),
        transformationScore: this.calculateTransformationScore(result),
        additivesCount: result.industrialMarkers?.filter((m: string) => m.includes('Additif')).length || result.additivesCount || 0,
        // Ajout visualization si manquante
        visualization: result.visualization || {
          levelColor: this.getLevelColor(result.transformationLevel),
          levelIcon: this.getLevelIcon(result.transformationLevel),
          levelLabel: this.getLevelLabel(result.transformationLevel)
        },
        // Metadonnees enrichies
        metadata: {
          ...result.metadata,
          analysisType: 'backend_ultra_transformation',
          version: '1.1',
          processingTime: result._metadata?.analysisTimestamp ? 'backend' : 'realtime'
        }
      };

      return enrichedResult;
    } catch (error: any) {
      console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur service Ultra-Transformation:', error);
      
      // Fallback vers analyse locale si backend indisponible
      if (error.message.includes('fetch') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('Route non trouvee') ||
          error.message.includes('404')) {
        console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬'¦Ã‚Â¾ Fallback vers analyse locale');
        return this.analyzeLocal(productName, ingredients);
      }
      
      throw error;
    }
  }

  /**
   * Analyse combinee NOVA + Ultra-Transformation
   */
  async analyzeCombined(
    productName: string,
    ingredients: string
  ): Promise<CombinedAnalysisResult> {
    try {
      console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂÆ’Ã¢â‚¬Å¡'šÃ‚Â¬ Analyse combinee NOVA + Ultra-Transform:', { productName });

      // aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ CORRECTION: Tenter d'abord /products/combined, sinon fallback
      const response = await fetch(`${this.baseUrl}/api/products/combined`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          productName: productName.trim(),
          product_name: productName.trim(), // Compatibilite
          ingredients: ingredients.trim()
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Fallback : analyses separees
          console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬'¦Ã‚Â¾ Endpoint combined non disponible, analyses separees');
          return this.combinedFallback(productName, ingredients);
        }
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = data?.analysis || data;
      
      console.log('aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ Analyse combinee reussie:', result);

      return result;
    } catch (error: any) {
      console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur analyse combinee:', error);
      
      if (error.message.includes('404') || error.message.includes('fetch')) {
        return this.combinedFallback(productName, ingredients);
      }
      
      throw error;
    }
  }

  /**
   * Fallback pour analyse combinee
   */
  private async combinedFallback(productName: string, ingredients: string): Promise<CombinedAnalysisResult> {
    console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬'¦Ã‚Â¾ Fallback analyse combinee');
    
    // Analyse ultra-transformation locale
    const ultraResult = await this.analyzeUltraTransformation(productName, ingredients);
    
    // Nova simule (basique)
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
        'Produit ultra-transforme Æ’Ã†'' Ã¢â‚¬â„¢Æ’Ã¢â‚¬Å¡'šÃ‚Â  limiter' : 
        'Produit acceptable avec moderation',
      recommendations: [
        ...ultraResult.recommendations,
        'Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬'¦Ã‚Â¾ Analyse combinee en mode fallback'
      ],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyse locale de secours (fallback)
   */
  private analyzeLocal(productName: string, ingredients: string): UltraTransformResult {
    console.log('Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬'¦Ã‚Â¾ Analyse Ultra-Transformation locale pour:', productName);
    
    // Analyse simplifiee locale
    const lower = ingredients.toLowerCase();
    let level = 1;
    const methods: string[] = [];
    const markers: string[] = [];
    
    // Detection basique des methodes de transformation
    if (lower.includes('hydrogene')) {
      methods.push('hydrogenation');
      markers.push('Marqueur detecte: hydrogenation');
      level = Math.max(level, 4);
    }
    if (lower.includes('sirop') && lower.includes('glucose')) {
      methods.push('hydrolyse enzymatique');
      markers.push('Marqueur detecte: sirop glucose-fructose');
      level = Math.max(level, 4);
    }
    if (lower.includes('maltodextrine')) {
      markers.push('Marqueur detecte: maltodextrine');
      level = Math.max(level, 4);
    }
    if (lower.includes('huile') && lower.includes('palme')) {
      methods.push('raffinage intensif');
      markers.push('Marqueur detecte: huile de palme raffinee');
      level = Math.max(level, 3);
    }
    if (lower.includes('arome artificiel') || lower.includes('arome')) {
      methods.push('aromatisation artificielle');
      markers.push('Marqueur detecte: aromes artificiels');
      level = Math.max(level, 3);
    }
    
    // Comptage des additifs E
    const eAdditives = (lower.match(/e\d{3,4}/g) || []);
    const additivesCount = eAdditives.length;
    
    if (additivesCount > 5) level = Math.max(level, 4);
    else if (additivesCount > 2) level = Math.max(level, 3);
    else if (additivesCount > 0) level = Math.max(level, 2);
    
    if (additivesCount > 0) {
      markers.push(`Marqueur detecte: ${additivesCount} additif(s) E${eAdditives.map(e => e.substring(1)).join(', E')}`);
    }
    
    // Detection conservateurs/colorants/edulcorants
    if (lower.includes('conservateur')) {
      markers.push('Marqueur detecte: conservateurs');
      level = Math.max(level, 3);
    }
    if (lower.includes('colorant')) {
      markers.push('Marqueur detecte: colorants');
      level = Math.max(level, 3);
    }
    if (lower.includes('edulcorant')) {
      markers.push('Marqueur detecte: edulcorants');
      level = Math.max(level, 3);
    }
    
    // Impact nutritionnel calcule
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
    
    // Recommandations personnalisees
    const recommendations = [
      level >= 4 ? 'Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸Æ’Ã¢â‚¬Â¦'šÃ‚Â¡Æ’Ã¢â‚¬Å¡'šÃ‚Â¨ Ultra-transformation detectee - limiter la consommation' : 
      level >= 3 ? 'aÆ’Ã¢â‚¬Â¦'šÃ‚Â¡Æ’Ã¢â‚¬Å¡'šÃ‚Â Æ’Ã‚Â¯Æ’Ã¢â‚¬Å¡'šÃ‚Â¸Æ’Ã¢â‚¬Å¡'šÃ‚Â Transformation importante - consommation moderee' :
      level >= 2 ? 'Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬aÃ¢â‚¬Å¾Ã‚Â¢aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Âº Produit transforme - consommation occasionnelle' :
      'aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ Transformation minimale - produit acceptable',
      `Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Â¦'šÃ‚Â  ${methods.length} methode(s) de transformation identifiee(s)`,
      `Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚ÂÆ’Ã¢â‚¬Å¡'šÃ‚Â¬ ${markers.length} marqueur(s) industriel(s) detecte(s)`,
      'Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸aaÃ¢â‚¬Å¡Ã‚Â¬'¦Ã¢â‚¬Å“Æ’Ã¢â‚¬Å¡'šÃ‚Â± Analyse locale - resultats approximatifs'
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
      // Compatibilite
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
      // aÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã…'œaaÃ¢â‚¬Å¡Ã‚Â¬'šÃ‚Â¦ CORRECTION: Nouvelle URL
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

  // Methodes utilitaires privees
  private getLevelColor(level: number): string {
    switch (level) {
      case 1: return '#10B981'; // vert
      case 2: return '#84CC16'; // vert clair
      case 3: return '#F59E0B'; // orange
      case 4: return '#F97316'; // orange fonce
      case 5: return '#EF4444'; // rouge
      default: return '#6B7280'; // gris
    }
  }

  private getLevelIcon(level: number): string {
    switch (level) {
      case 1: return 'Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢Æ’Ã¢â‚¬Å¡'šÃ‚Â¿';
      case 2: return 'Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸Æ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢Æ’Ã¢â‚¬Å¡'šÃ‚Â±';
      case 3: return 'aÆ’Ã¢â‚¬Â¦'šÃ‚Â¡Æ’Ã¢â‚¬Å¡'šÃ‚Â Æ’Ã‚Â¯Æ’Ã¢â‚¬Å¡'šÃ‚Â¸Æ’Ã¢â‚¬Å¡'šÃ‚Â';
      case 4: return 'Æ’Ã†''šÃ‚Â°Æ’Ã¢â‚¬Â¦'šÃ‚Â¸Æ’Ã¢â‚¬Â¦'šÃ‚Â¡Æ’Ã¢â‚¬Å¡'šÃ‚Â¨';
      case 5: return 'aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢';
      default: return 'aÆ’Ã¢â‚¬Å¡'šÃ‚ÂaaÃ¢â‚¬Å¡Ã‚Â¬'¦Ã¢â‚¬Å“';
    }
  }

  private getLevelLabel(level: number): string {
    switch (level) {
      case 1: return 'Minimal';
      case 2: return 'Simple';
      case 3: return 'Important';
      case 4: return 'Ultra';
      case 5: return 'Extreme';
      default: return 'Inconnu';
    }
  }

  // Methodes de compatibilite
  private mapTransformLevelToNova(transformLevel: number): 1 | 2 | 3 | 4 {
    if (transformLevel <= 1) return 1;
    if (transformLevel === 2) return 2;
    if (transformLevel === 3) return 3;
    return 4;
  }

  private calculateTransformationScore(result: any): number {
    const level = result.transformationLevel || 4;
    const baseScore = level * 20;
    
    // Ajustements bases sur d'autres facteurs
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




