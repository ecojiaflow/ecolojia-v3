
// ═══════════════════════════════════════════════════════════════════════
// 3. backend/src/services/eco-score.service.js
// ═══════════════════════════════════════════════════════════════════════

const { Logger } = require('../utils/logger');
const Product = require('../models/Product');

const logger = new Logger('EcoScoreService');

class EcoScoreService {
  constructor() {
    // Coefficients pour le calcul du score
    this.weights = {
      ingredients: 0.4,
      packaging: 0.2,
      transport: 0.2,
      production: 0.2
    };

    logger.info('EcoScoreService initialized');
  }

  async calculate(product) {
    logger.info('Calculating eco-score for:', { title: product.title });
    
    const startTime = Date.now();
    
    // Score de base
    let score = 50;
    
    // Analyse par catégorie
    const categoryScore = this.getCategoryScore(product.category);
    score += categoryScore;
    
    // Analyse des ingrédients
    const ingredientsScore = this.analyzeIngredients(product.ingredients);
    score += ingredientsScore * this.weights.ingredients;
    
    // Bonus/malus spécifiques
    const modifiers = this.getScoreModifiers(product);
    score += modifiers;
    
    // Limiter entre 0 et 100
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    const duration = Date.now() - startTime;
    logger.perf('Eco-score calculation', duration, { score });
    
    const result = {
      score,
      grade: this.getGrade(score),
      ai_confidence: 0.75,
      breakdown: {
        ingredients: ingredientsScore,
        category: categoryScore,
        modifiers: modifiers
      },
      recommendations: this.getRecommendations(score, product),
      analysis: {
        environmental_impact: this.getImpactLevel(score),
        social_impact: 'Moyen',
        health_impact: score > 60 ? 'Positif' : 'À surveiller'
      },
      calculatedAt: new Date()
    };

    logger.debug('Eco-score calculated:', result);
    return result;
  }

  getCategoryScore(category) {
    const scores = {
      'alimentaire': 10,
      'food': 10,
      'cosmetics': 0,
      'cosmétique': 0,
      'detergents': -10,
      'détergent': -10
    };
    
    return scores[category?.toLowerCase()] || 0;
  }

  analyzeIngredients(ingredients) {
    if (!ingredients) return 0;
    
    const ingredientsLower = ingredients.toLowerCase();
    let score = 0;
    
    // Analyse positive
    const positiveKeywords = {
      'bio': 20,
      'organic': 20,
      'naturel': 15,
      'végétal': 10,
      'local': 15,
      'france': 10,
      'sans': 5
    };
    
    // Analyse négative
    const negativeKeywords = {
      'palm': -15,
      'huile de palme': -20,
      'chimique': -10,
      'synthétique': -10,
      'artificiel': -10,
      'pétrole': -20
    };
    
    // Calcul du score
    for (const [keyword, value] of Object.entries(positiveKeywords)) {
      if (ingredientsLower.includes(keyword)) {
        score += value;
        logger.debug('Positive keyword found:', keyword);
      }
    }
    
    for (const [keyword, value] of Object.entries(negativeKeywords)) {
      if (ingredientsLower.includes(keyword)) {
        score += value;
        logger.debug('Negative keyword found:', keyword);
      }
    }
    
    // Pénalité pour les additifs
    const additiveCount = (ingredientsLower.match(/e\d{3}/gi) || []).length;
    score -= additiveCount * 3;
    
    return score;
  }

  getScoreModifiers(product) {
    let modifiers = 0;
    
    // Bonus pour les certifications
    if (product.certifications) {
      const certBonus = {
        'bio': 10,
        'ecocert': 15,
        'cosmos': 10,
        'fairtrade': 10
      };
      
      product.certifications.forEach(cert => {
        modifiers += certBonus[cert.toLowerCase()] || 5;
      });
    }
    
    // Analyse du nom du produit
    if (product.title) {
      const titleLower = product.title.toLowerCase();
      if (titleLower.includes('écologique') || titleLower.includes('eco')) {
        modifiers += 5;
      }
    }
    
    return modifiers;
  }

  getGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'E';
  }

  getImpactLevel(score) {
    if (score >= 70) return 'Très faible';
    if (score >= 50) return 'Faible';
    if (score >= 30) return 'Moyen';
    return 'Élevé';
  }

  getRecommendations(score, product) {
    const recommendations = [];
    
    if (score >= 70) {
      recommendations.push('Excellent choix écologique ! Continuez ainsi.');
    } else if (score >= 40) {
      recommendations.push('Choix correct, mais des alternatives plus écologiques existent.');
    } else {
      recommendations.push('Impact environnemental important, privilégiez des alternatives.');
    }
    
    // Recommandations spécifiques
    recommendations.push('Privilégier les produits locaux et de saison');
    recommendations.push('Vérifier les certifications environnementales');
    
    if (product.category === 'detergents' || product.category === 'détergent') {
      recommendations.push('Utiliser avec parcimonie et respecter les dosages');
    }
    
    return recommendations.slice(0, 3);
  }

  async saveScoreToDatabase(productId, scoreData) {
    try {
      logger.info('Saving score to database:', { productId, score: scoreData.score });
      
      await Product.findByIdAndUpdate(productId, {
        $set: {
          'analysisData.healthScore': scoreData.score,
          'analysisData.lastAnalyzedAt': new Date(),
          'analysisData.version': '1.0',
          'analysisData.confidence': scoreData.ai_confidence
        }
      });
      
      logger.info('Score saved successfully');
      return true;
    } catch (error) {
      logger.error('Error saving score:', error);
      return false;
    }
  }
}

module.exports = { EcoScoreService };