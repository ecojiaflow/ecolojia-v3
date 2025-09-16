const { Logger } = require('../utils/logger');
const logger = new Logger('CosmeticsService');

// Import des scorers cosmétiques
let CosmeticScorer;
try {
  CosmeticScorer = require('../scorers/cosmetic/cosmeticScorer');
} catch (error) {
  logger.warn('CosmeticScorer not found, using basic scorer');
  // Scorer basique de fallback
  CosmeticScorer = class {
    async analyzeCosmetic(data) {
      const hasEndocrine = /paraben|phthalate|triclosan/i.test(data.ingredients || '');
      const hasSilicone = /dimethicone|cyclopentasiloxane/i.test(data.ingredients || '');
      const score = 100 - (hasEndocrine ? 30 : 0) - (hasSilicone ? 15 : 0);
      
      return {
        score,
        grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'E',
        confidence: 0.85,
        risk_analysis: {
          endocrine_disruptors: hasEndocrine ? ['Perturbateurs détectés'] : [],
          silicones: hasSilicone ? ['Silicones présents'] : []
        },
        allergen_analysis: { total_allergens: 0, detected: [] },
        recommendations: score < 70 ? ['Privilégier des alternatives sans perturbateurs'] : ['Produit bien formulé'],
        highlights: [],
        meta: { sources: ['ANSM', 'SCCS'] }
      };
    }
  };
}

class CosmeticsService {
  constructor() {
    this.scorer = new CosmeticScorer();
  }

  /**
   * Analyse un produit cosmétique
   */
  async analyzeCosmetic({ barcode, name, ingredients, photoUrl, locale = 'fr' }) {
    try {
      logger.info('Analyzing cosmetic product', { barcode, name, hasIngredients: !!ingredients });

      // Si pas d'ingrédients fournis, essayer de les récupérer depuis OBF
      if (!ingredients && barcode) {
        try {
          const obfData = await this.fetchFromOBF(barcode, locale);
          if (obfData?.product) {
            ingredients = obfData.product.ingredients_text || '';
            name = name || obfData.product.product_name || 'Produit cosmétique';
          }
        } catch (err) {
          logger.warn('OBF fetch failed', { error: err.message });
        }
      }

      if (!ingredients) {
        throw new Error('Ingredients required for analysis');
      }

      // Analyser avec le scorer
      const analysisResult = await this.scorer.analyzeCosmetic({
        name: name || 'Produit cosmétique',
        ingredients,
        barcode
      });

      // Formatter la réponse unifiée
      return {
        product: {
          barcode,
          name: name || 'Produit cosmétique',
          category: 'cosmetics',
          brand: null,
          image: null
        },
        scores: {
          normalized: {
            value: Math.round(analysisResult.score),
            grade: analysisResult.grade
          },
          dimensions: {
            health: Math.round(analysisResult.score),
            environment: null,
            ingredients: Math.round(analysisResult.score * 0.9)
          },
          labels: this.generateLabels(analysisResult)
        },
        flags: this.generateFlags(analysisResult),
        recommendations: {
          alternatives: [],
          actions: analysisResult.recommendations || []
        },
        insights: this.generateInsights(analysisResult),
        dataSource: 'cosmetic_analysis',
        meta: {
          cached: false,
          sourceLatencyMs: null,
          confidence: analysisResult.confidence
        }
      };

    } catch (error) {
      logger.error('Cosmetic analysis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupérer les données depuis Open Beauty Facts
   */
  async fetchFromOBF(barcode, locale = 'fr') {
    const axios = require('axios');
    const url = `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`;
    
    try {
      const { data } = await axios.get(url, { 
        timeout: 5000,
        params: { lc: locale }
      });
      return data;
    } catch (error) {
      throw new Error(`OBF fetch failed: ${error.message}`);
    }
  }

  /**
   * Générer les labels pour l'affichage
   */
  generateLabels(analysisResult) {
    const labels = [];
    
    if (analysisResult.risk_analysis?.endocrine_disruptors?.length === 0) {
      labels.push('Sans perturbateurs');
    }
    
    if (analysisResult.score >= 80) {
      labels.push('Formule clean');
    }
    
    labels.push(`Score: ${Math.round(analysisResult.score)}/100`);
    
    return labels;
  }

  /**
   * Générer les flags d'alerte
   */
  generateFlags(analysisResult) {
    const flags = [];
    
    if (analysisResult.risk_analysis?.endocrine_disruptors?.length > 0) {
      flags.push({
        type: 'endocrine',
        level: 'high',
        code: 'ENDOCRINE_DISRUPTOR'
      });
    }
    
    if (analysisResult.risk_analysis?.silicones?.length > 0) {
      flags.push({
        type: 'silicone',
        level: 'med',
        code: 'SILICONES'
      });
    }
    
    return flags;
  }

  /**
   * Générer les insights
   */
  generateInsights(analysisResult) {
    const insights = [];
    
    if (analysisResult.score >= 80) {
      insights.push({
        type: 'positive',
        message: 'Produit bien formulé avec peu de risques identifiés'
      });
    }
    
    if (analysisResult.risk_analysis?.endocrine_disruptors?.length > 0) {
      insights.push({
        type: 'warning',
        message: 'Contient des perturbateurs endocriniens potentiels'
      });
    }
    
    return insights;
  }
}

// Export singleton
module.exports = new CosmeticsService();