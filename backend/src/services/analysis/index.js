// PATH: backend/src/services/analysis/index.js
/**
 * Analysis Service Orchestrator
 * Route vers le bon analyseur selon la catégorie
 * Point d'entrée unique pour toutes les analyses
 */

const foodAnalyzer = require('./food');
const cosmeticsAnalyzer = require('./cosmetics');
const detergentsAnalyzer = require('./detergents');

class AnalysisService {
  constructor() {
    this.analyzers = {
      food: foodAnalyzer,
      cosmetics: cosmeticsAnalyzer,
      detergents: detergentsAnalyzer
    };
    
    // Alias pour compatibilité
    this.analyzerAliases = {
      'alimentaire': 'food',
      'aliment': 'food',
      'nourriture': 'food',
      'cosmetic': 'cosmetics',
      'cosmétique': 'cosmetics',
      'beauté': 'cosmetics',
      'beauty': 'cosmetics',
      'detergent': 'detergents',
      'détergent': 'detergents',
      'nettoyant': 'detergents',
      'cleaner': 'detergents',
      'lessive': 'detergents'
    };
  }

  /**
   * Analyse un produit selon sa catégorie
   * @param {Object} productData - Données du produit
   * @param {Object} options - Options d'analyse
   * @returns {Promise<Object>} Résultat de l'analyse
   */
  async analyzeProduct(productData, options = {}) {
    try {
      // Normaliser la catégorie
      const category = this.normalizeCategory(productData.category);
      
      if (!category) {
        throw new Error('Catégorie invalide ou manquante. Utilisez: food, cosmetics ou detergents');
      }
      
      // Sélectionner l'analyseur approprié
      const analyzer = this.analyzers[category];
      
      if (!analyzer) {
        throw new Error(`Analyseur non disponible pour la catégorie: ${category}`);
      }
      
      // Lancer l'analyse
      console.log(`[AnalysisService] Analyse ${category} pour: ${productData.name || 'Produit sans nom'}`);
      const startTime = Date.now();
      
      const result = await analyzer.analyzeProduct(productData, options);
      
      const duration = Date.now() - startTime;
      console.log(`[AnalysisService] Analyse terminée en ${duration}ms`);
      
      // Enrichir le résultat avec des métadonnées
      return {
        ...result,
        metadata: {
          ...result.metadata,
          analyzedBy: 'ECOLOJIA Analysis Service',
          version: '1.0.0',
          duration: duration,
          options: options
        }
      };
      
    } catch (error) {
      console.error('[AnalysisService] Erreur:', error);
      
      // Retourner une structure d'erreur cohérente
      return {
        error: true,
        message: error.message,
        category: productData.category,
        timestamp: new Date(),
        scores: {
          healthScore: 0,
          environmentScore: 0
        },
        details: {
          error: error.message
        },
        globalScore: 0,
        confidence: 0,
        recommendations: ['❌ Analyse impossible : ' + error.message]
      };
    }
  }

  /**
   * Normalise la catégorie en utilisant les alias
   */
  normalizeCategory(category) {
    if (!category) return null;
    
    const normalized = category.toLowerCase().trim();
    
    // Vérifier les catégories principales
    if (this.analyzers[normalized]) {
      return normalized;
    }
    
    // Vérifier les alias
    if (this.analyzerAliases[normalized]) {
      return this.analyzerAliases[normalized];
    }
    
    // Tentative de détection par mots-clés
    if (normalized.includes('food') || normalized.includes('aliment')) return 'food';
    if (normalized.includes('cosm') || normalized.includes('beauty')) return 'cosmetics';
    if (normalized.includes('deterg') || normalized.includes('clean')) return 'detergents';
    
    return null;
  }

  /**
   * Vérifie si une catégorie est supportée
   */
  isCategorySupported(category) {
    return this.normalizeCategory(category) !== null;
  }

  /**
   * Retourne la liste des catégories supportées
   */
  getSupportedCategories() {
    return {
      main: Object.keys(this.analyzers),
      aliases: Object.keys(this.analyzerAliases),
      all: [...Object.keys(this.analyzers), ...Object.keys(this.analyzerAliases)]
    };
  }

  /**
   * Analyse par lot (batch)
   */
  async analyzeBatch(products, options = {}) {
    const results = [];
    const errors = [];
    
    for (const product of products) {
      try {
        const result = await this.analyzeProduct(product, options);
        if (result.error) {
          errors.push({
            product: product.name || 'Sans nom',
            error: result.message
          });
        } else {
          results.push(result);
        }
      } catch (error) {
        errors.push({
          product: product.name || 'Sans nom',
          error: error.message
        });
      }
    }
    
    return {
      success: results.length,
      failed: errors.length,
      total: products.length,
      results,
      errors,
      summary: this.generateBatchSummary(results)
    };
  }

  /**
   * Génère un résumé pour une analyse par lot
   */
  generateBatchSummary(results) {
    if (results.length === 0) {
      return { message: 'Aucune analyse réussie' };
    }
    
    const summary = {
      byCategory: {},
      averageScores: {
        health: 0,
        environment: 0,
        global: 0
      },
      recommendations: new Set()
    };
    
    // Calculer les statistiques
    results.forEach(result => {
      // Par catégorie
      const cat = result.category;
      if (!summary.byCategory[cat]) {
        summary.byCategory[cat] = {
          count: 0,
          avgHealth: 0,
          avgEnvironment: 0
        };
      }
      summary.byCategory[cat].count++;
      summary.byCategory[cat].avgHealth += result.scores.healthScore || 0;
      summary.byCategory[cat].avgEnvironment += result.scores.environmentScore || 0;
      
      // Scores globaux
      summary.averageScores.health += result.scores.healthScore || 0;
      summary.averageScores.environment += result.scores.environmentScore || 0;
      summary.averageScores.global += result.globalScore || 0;
      
      // Collecter les recommandations uniques
      if (result.recommendations) {
        result.recommendations.forEach(rec => summary.recommendations.add(rec));
      }
    });
    
    // Calculer les moyennes
    Object.keys(summary.byCategory).forEach(cat => {
      const data = summary.byCategory[cat];
      data.avgHealth = Math.round(data.avgHealth / data.count);
      data.avgEnvironment = Math.round(data.avgEnvironment / data.count);
    });
    
    summary.averageScores.health = Math.round(summary.averageScores.health / results.length);
    summary.averageScores.environment = Math.round(summary.averageScores.environment / results.length);
    summary.averageScores.global = Math.round(summary.averageScores.global / results.length);
    
    // Convertir le Set en array
    summary.recommendations = Array.from(summary.recommendations);
    
    return summary;
  }

  /**
   * Méthode pour l'ancien service (compatibilité)
   * À utiliser uniquement pour la route /api/analysis/manual
   */
  async analyze(productData) {
    return this.analyzeProduct(productData);
  }
}

// Export en singleton
module.exports = new AnalysisService();