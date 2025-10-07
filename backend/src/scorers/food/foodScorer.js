// backend/src/scorers/food/foodScorer.js
// Module de scoring pour les produits alimentaires

const novaClassifier = require('./novaClassifier');
const nutriScorer = require('./nutriScorer');
const additivesAnalyzer = require('./additivesAnalyzer');

class FoodScorer {
  constructor() {
    this.name = 'FoodScorer';
  }

  /**
   * Calcule tous les scores pour un produit alimentaire
   */
  async calculateScores(product) {
    try {
      // Scores individuels
      const nova = await this.calculateNova(product);
      const nutriScore = await this.calculateNutriScore(product);
      const ecoScore = await this.calculateEcoScore(product);
      const additivesScore = await this.calculateAdditivesScore(product);

      // Score global pondéré
      // Détecter labels bio depuis OpenFoodFacts
        const isBio = product.labels_tags?.some(label => 
          label.includes('bio') || 
          label.includes('organic') || 
          label.includes('ab-agriculture-biologique')
        ) || false;

        const isBio = product.labels_tags?.some(label => label.includes('bio') || label.includes('organic')) || false;
        const globalScore = this.calculateGlobalScore({ nova, nutriScore, ecoScore, additivesScore, bio: isBio });

      return {
        global: globalScore,
        nova,
        nutriScore,
        ecoScore,
        additivesScore,
        details: {
          category: 'food',
          confidence: this.calculateConfidence(product)
        }
      };
    } catch (error) {
      console.error('Error in FoodScorer:', error);
      return this.getDefaultScores();
    }
  }

  /**
   * Calcule le score NOVA (1-4)
   */
  async calculateNova(product) {
    try {
      // Utiliser le classifier existant si disponible
      if (novaClassifier && novaClassifier.classify) {
        const result = await novaClassifier.classify(
          product.ingredients || '',
          product.name || ''
        );
        return product.foodData?.novaScore || result.group || null;
      }
      
      // Fallback sur les données existantes
      return product.foodData?.novaScore || 
             product.novaScore || 
             product.nova || 
             null;
    } catch (error) {
      console.error('Error calculating NOVA:', error);
      return null;
    }
  }

  /**
   * Calcule le Nutri-Score (A-E)
   */
  async calculateNutriScore(product) {
    try {
      // Utiliser le calculator existant si disponible
      if (nutriScorer && nutriScorer.calculate) {
        return await nutriScorer.calculate(product.nutritionalInfo || {});
      }
      
      // Fallback sur les données existantes
      return product.foodData?.nutriScore || 
             product.nutriScore || 
             product.nutriscore_grade || 
             null;
    } catch (error) {
      console.error('Error calculating Nutri-Score:', error);
      return null;
    }
  }

  /**
   * Calcule l'Eco-Score (A-E)
   */
  async calculateEcoScore(product) {
    // Pour l'instant, utiliser les données existantes
    // TODO: Implémenter le calcul détaillé
    return product.foodData?.ecoScore || 
           product.ecoScore || 
           product.ecoscore_grade || 
           null;
  }

  /**
   * Calcule le score des additifs (0-100)
   */
  async calculateAdditivesScore(product) {
    try {
      if (additivesAnalyzer && additivesAnalyzer.analyzeAdditives) {
        const analysis = await additivesAnalyzer.analyzeAdditives(
          product.additives || product.additives_tags || []
        );
        return analysis.score;
      }

      // Calcul simplifié basé sur le nombre d'additifs
      const additives = product.additives || product.additives_tags || [];
      const riskAdditives = this.countRiskAdditives(additives);
      
      // Plus d'additifs = score plus bas
      const score = Math.max(0, 100 - (additives.length * 5) - (riskAdditives * 10));
      return Math.round(score);
    } catch (error) {
      console.error('Error calculating additives score:', error);
      return 50;
    }
  }

  /**
   * Compte les additifs à risque
   */
  countRiskAdditives(additives) {
    const RISK_ADDITIVES = [
      'e150d', // Caramel au sulfite d'ammonium
      'e102', 'e110', 'e122', 'e124', 'e129', // Colorants azoïques
      'e211', // Benzoate de sodium
      'e621', // Glutamate monosodique
      'e951', // Aspartame
      'e954'  // Saccharine
    ];

    return additives.filter(additive => 
      RISK_ADDITIVES.includes(additive.toLowerCase().replace(/[^a-z0-9]/g, ''))
    ).length;
  }

  /**
   * Calcule le score global pondéré
   */
  calculateGlobalScore(scores) {
    // Convertir les scores en valeurs 0-100
    const novaScore = scores.nova ? (5 - scores.nova) * 25 : 50;
    const nutriScore = this.convertLetterToScore(scores.nutriScore);
    const ecoScore = this.convertLetterToScore(scores.ecoScore);
    const additivesScore = scores.additivesScore || 50;

    // Pondération : 35% NOVA, 35% Nutri-Score, 20% Eco, 10% Additifs
    const weighted = (
      novaScore * 0.35 +
      nutriScore * 0.35 +
      ecoScore * 0.20 +
      additivesScore * 0.10
    );

    return Math.round(weighted);
  }

  /**
   * Convertit une lettre (A-E) en score (0-100)
   */
  convertLetterToScore(letter) {
    const mapping = {
      'A': 90,
      'B': 75,
      'C': 55,
      'D': 35,
      'E': 15
    };
    
    return mapping[letter?.toUpperCase()] || 50;
  }

  /**
   * Calcule la confiance du scoring
   */
  calculateConfidence(product) {
    let confidence = 0;
    let factors = 0;

    // Vérifier la présence des données importantes
    if (product.ingredients || product.ingredientsParsed) {
      confidence += 25;
      factors++;
    }
    if (product.nutritionalInfo || product.nutriments) {
      confidence += 25;
      factors++;
    }
    if (product.foodData?.novaScore || product.nova) {
      confidence += 25;
      factors++;
    }
    if (product.foodData?.nutriScore || product.nutriscore_grade) {
      confidence += 25;
      factors++;
    }

    return factors > 0 ? Math.round(confidence / factors) : 0;
  }

  /**
   * Retourne des scores par défaut
   */
  getDefaultScores() {
    return {
      global: 50,
      nova: null,
      nutriScore: null,
      ecoScore: null,
      additivesScore: 50,
      details: {
        category: 'food',
        confidence: 0,
        error: 'Unable to calculate scores'
      }
    };
  }

  /**
   * Génère des insights sur le produit
   */
  generateInsights(product, scores) {
    const insights = [];

    // Insights NOVA
    if (scores.nova === 1) {
      insights.push('Aliment non transformé ou minimalement transformé');
    } else if (scores.nova === 4) {
      insights.push('⚠️ Produit ultra-transformé - À consommer avec modération');
    }

    // Insights Nutri-Score
    if (scores.nutriScore === 'A' || scores.nutriScore === 'B') {
      insights.push('✅ Excellente qualité nutritionnelle');
    } else if (scores.nutriScore === 'D' || scores.nutriScore === 'E') {
      insights.push('⚠️ Qualité nutritionnelle faible');
    }

    // Insights additifs
    if (scores.additivesScore < 50) {
      insights.push('⚠️ Contient plusieurs additifs');
    } else if (scores.additivesScore > 80) {
      insights.push('✅ Peu ou pas d\'additifs');
    }

    // Insight global
    if (scores.global >= 75) {
      insights.push('🌟 Excellent choix pour votre santé !');
    } else if (scores.global < 40) {
      insights.push('💡 Privilégiez des alternatives moins transformées');
    }

    return insights;
  }
}

module.exports = new FoodScorer();



