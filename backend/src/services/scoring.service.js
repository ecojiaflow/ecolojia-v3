const foodScorer = require('../scorers/food/foodScorer');
const cosmeticScorer = require('../scorers/cosmetic/cosmeticScorer');
const detergentScorer = require('../scorers/detergent/detergentScorer');
const Product = require('../models/Product');

class ScoringService {
  constructor() {
    this.scorers = {
      food: foodScorer,
      cosmetics: cosmeticScorer,
      detergents: detergentScorer
    };
  }

  /**
   * Calcule tous les scores pour un produit
   */
  async calculateScores(product) {
    try {
      const category = product.category || 'food';
      const scorer = this.scorers[category];
      
      if (!scorer) {
        throw new Error(`Scorer not found for category: ${category}`);
      }

      // Calculer les scores selon la catégorie
      const scores = await scorer.calculateScores(product);
      
      // Calculer le score global
      const globalScore = this.calculateGlobalScore(scores, category);
      
      return {
        ...scores,
        globalScore,
        category,
        calculatedAt: new Date()
      };
    } catch (error) {
      console.error('Error calculating scores:', error);
      return this.getDefaultScores(product.category);
    }
  }

  /**
   * Calcule le score global pondéré
   */
  calculateGlobalScore(scores, category) {
    if (category === 'food') {
      // 40% santé (nova + nutriscore), 40% environnement, 20% additifs
      const healthScore = ((100 - (scores.nova || 0) * 25) + (100 - (scores.nutriScore || 0) * 20)) / 2;
      const ecoScore = scores.ecoScore || 50;
      const additivesScore = scores.additivesScore || 50;
      
      return Math.round(
        healthScore * 0.4 +
        ecoScore * 0.4 +
        additivesScore * 0.2
      );
    } else if (category === 'cosmetics') {
      // 50% sécurité, 30% efficacité, 20% environnement
      const safetyScore = scores.safetyScore || 50;
      const efficiencyScore = scores.efficiencyScore || 50;
      const ecoScore = scores.ecoScore || 50;
      
      return Math.round(
        safetyScore * 0.5 +
        efficiencyScore * 0.3 +
        ecoScore * 0.2
      );
    } else if (category === 'detergents') {
      // 60% environnement, 40% efficacité
      const ecoScore = scores.ecoScore || 50;
      const efficiencyScore = scores.efficiencyScore || 50;
      
      return Math.round(
        ecoScore * 0.6 +
        efficiencyScore * 0.4
      );
    }
    
    return 50; // Score par défaut
  }

  /**
   * Met à jour les scores d'un produit en base
   */
  async updateProductScores(productId, scores) {
    try {
      const updateData = {
        'scores': scores,
        'scores.lastCalculated': new Date()
      };

      const product = await Product.findByIdAndUpdate(
        productId,
        { $set: updateData },
        { new: true }
      );

      return product;
    } catch (error) {
      console.error('Error updating product scores:', error);
      throw error;
    }
  }

  /**
   * Enrichit un produit avec ses scores
   */
  async enrichProductWithScores(product) {
    const scores = await this.calculateScores(product);
    
    if (product._id) {
      await this.updateProductScores(product._id, scores);
    }
    
    return { ...product.toObject(), scores };
  }

  /**
   * Retourne des scores par défaut
   */
  getDefaultScores(category = 'food') {
    return {
      globalScore: 50,
      nova: null,
      nutriScore: null,
      ecoScore: null,
      additivesScore: null,
      safetyScore: null,
      efficiencyScore: null,
      category,
      calculatedAt: new Date(),
      status: 'default'
    };
  }

  /**
   * Calcule les scores pour tous les produits
   */
  async calculateAllProductScores() {
    try {
      const products = await Product.find({});
      let updated = 0;
      
      for (const product of products) {
        const scores = await this.calculateScores(product);
        await this.updateProductScores(product._id, scores);
        updated++;
        console.log(`Scores calculated for ${product.name} (${updated}/${products.length})`);
      }
      
      return { updated, total: products.length };
    } catch (error) {
      console.error('Error calculating all scores:', error);
      throw error;
    }
  }
}

module.exports = new ScoringService();
