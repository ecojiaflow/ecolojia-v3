// backend/src/services/analysis/universalAnalyzer.js
// Service d'analyse universel qui route vers le bon analyseur selon la catégorie

const foodAnalyzer = require('./foodAnalyzer');
const cosmeticAnalyzer = require('./cosmeticAnalyzer');
const detergentAnalyzer = require('./detergentAnalyzer');
const { OpenFoodFactsService } = require('../external/openFoodFactsService');
const mongoose = require('mongoose');

class UniversalAnalyzer {
  constructor() {
    this.analyzers = {
      food: foodAnalyzer,
      cosmetic: cosmeticAnalyzer,
      detergent: detergentAnalyzer
    };
    
    this.categoryDetectors = {
      food: [
        'alimentaire', 'food', 'aliment', 'nourriture', 'boisson', 'beverage',
        'snack', 'breakfast', 'dairy', 'meat', 'fruit', 'vegetable'
      ],
      cosmetic: [
        'cosmétique', 'cosmetic', 'beauté', 'beauty', 'soin', 'care',
        'shampoo', 'savon', 'soap', 'crème', 'cream', 'maquillage', 'makeup',
        'déodorant', 'deodorant', 'parfum', 'perfume'
      ],
      detergent: [
        'détergent', 'detergent', 'lessive', 'laundry', 'nettoyant', 'cleaner',
        'vaisselle', 'dish', 'ménager', 'household', 'javel', 'bleach'
      ]
    };
  }

  /**
   * Analyse universelle - détermine automatiquement la catégorie si nécessaire
   */
  async analyze(data) {
    try {
      const { 
        barcode, 
        name, 
        ingredients, 
        category: providedCategory,
        userId,
        method = 'manual'
      } = data;

      // 1. Déterminer la catégorie
      let category = providedCategory;
      let product = null;

      // Si on a un code-barres, chercher le produit
      if (barcode) {
        product = await this.findProductByBarcode(barcode);
        if (product) {
          category = category || product.category;
        }
      }

      // Si pas de catégorie, essayer de la détecter
      if (!category) {
        category = await this.detectCategory(name, ingredients, barcode);
      }

      if (!category) {
        throw new Error('Impossible de déterminer la catégorie du produit');
      }

      // 2. Préparer les données selon la catégorie
      const analysisData = await this.prepareAnalysisData(
        category,
        { barcode, name, ingredients, product }
      );

      // 3. Lancer l'analyse appropriée
      const analyzer = this.analyzers[category];
      if (!analyzer) {
        throw new Error(`Analyseur non disponible pour la catégorie: ${category}`);
      }

      let result;
      switch (category) {
        case 'food':
          result = await foodAnalyzer.analyze(barcode || analysisData.barcode, userId);
          break;
          
        case 'cosmetic':
          result = await cosmeticAnalyzer.analyzeProduct(analysisData);
          break;
          
        case 'detergent':
          result = await detergentAnalyzer.analyzeProduct(analysisData);
          break;
          
        default:
          throw new Error(`Catégorie non supportée: ${category}`);
      }

      // 4. Enrichir le résultat avec des métadonnées
      return this.enrichResult(result, category, analysisData);

    } catch (error) {
      console.error('Erreur analyse universelle:', error);
      throw error;
    }
  }

  /**
   * Trouve un produit par code-barres dans toutes les sources
   */
  async findProductByBarcode(barcode) {
    try {
      // 1. Chercher dans notre base
      const Product = mongoose.model('Product');
      let product = await Product.findOne({ barcode });
      
      if (product) {
        return product;
      }

      // 2. Chercher dans Open Food Facts
      const offProduct = await OpenFoodFactsService.getProduct(barcode);
      if (offProduct) {
        // Sauvegarder en base pour la prochaine fois
        product = await this.saveExternalProduct(offProduct, 'food');
        return product;
      }

      // 3. TODO: Chercher dans Open Beauty Facts
      // 4. TODO: Chercher dans EU Ecolabel Database

      return null;

    } catch (error) {
      console.error('Erreur recherche produit:', error);
      return null;
    }
  }

  /**
   * Détecte automatiquement la catégorie d'un produit
   */
  async detectCategory(name, ingredients, barcode) {
    // Score pour chaque catégorie
    const scores = {
      food: 0,
      cosmetic: 0,
      detergent: 0
    };

    // Analyser le nom
    if (name) {
      const nameLower = name.toLowerCase();
      
      for (const [category, keywords] of Object.entries(this.categoryDetectors)) {
        for (const keyword of keywords) {
          if (nameLower.includes(keyword)) {
            scores[category] += 10;
          }
        }
      }
    }

    // Analyser les ingrédients
    if (ingredients) {
      const ingredientsLower = ingredients.toLowerCase();
      
      // Mots-clés spécifiques aux catégories
      if (ingredientsLower.includes('e' + /\d{3}/.source)) scores.food += 5; // Additifs E
      if (ingredientsLower.includes('protéines') || ingredientsLower.includes('glucides')) scores.food += 5;
      if (ingredientsLower.includes('inci') || ingredientsLower.includes('aqua')) scores.cosmetic += 5;
      if (ingredientsLower.includes('sodium lauryl') || ingredientsLower.includes('paraben')) scores.cosmetic += 5;
      if (ingredientsLower.includes('tensioactif') || ingredientsLower.includes('enzyme')) scores.detergent += 5;
      if (ingredientsLower.includes('phosphate') || ingredientsLower.includes('percarbonate')) scores.detergent += 5;
    }

    // Analyser le format du code-barres (certains préfixes sont spécifiques)
    if (barcode) {
      // Les cosmétiques ont souvent des codes commençant par certains préfixes
      if (barcode.startsWith('3') && barcode.length === 13) {
        // Préfixe courant pour produits européens
        scores.food += 1;
        scores.cosmetic += 1;
        scores.detergent += 1;
      }
    }

    // Retourner la catégorie avec le score le plus élevé
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return null;

    return Object.entries(scores)
      .find(([_, score]) => score === maxScore)[0];
  }

  /**
   * Prépare les données pour l'analyse selon la catégorie
   */
  async prepareAnalysisData(category, rawData) {
    const { barcode, name, ingredients, product } = rawData;

    // Si on a déjà un produit complet, l'utiliser
    if (product) {
      return {
        ...product.toObject(),
        barcode: product.barcode,
        name: product.name,
        ingredients: product.ingredients?.text || ingredients
      };
    }

    // Sinon, créer une structure minimale
    const baseData = {
      barcode: barcode || this.generateTemporaryId(),
      name: name || 'Produit sans nom',
      category,
      ingredients: ingredients || '',
      temporary: !barcode // Marquer comme temporaire si pas de code-barres
    };

    // Enrichissement spécifique par catégorie
    switch (category) {
      case 'food':
        return {
          ...baseData,
          ingredients_text: ingredients,
          nutriments: {}, // Sera complété si possible
          categories_tags: [],
          additives_tags: [],
          allergens_tags: []
        };

      case 'cosmetic':
        return {
          ...baseData,
          ingredients: ingredients,
          labels: [],
          categories: []
        };

      case 'detergent':
        return {
          ...baseData,
          ingredients: ingredients,
          labels: [],
          categories: []
        };

      default:
        return baseData;
    }
  }

  /**
   * Enrichit le résultat avec des métadonnées supplémentaires
   */
  enrichResult(result, category, analysisData) {
    return {
      ...result,
      metadata: {
        category,
        analyzedAt: new Date().toISOString(),
        temporary: analysisData.temporary || false,
        confidence: this.calculateConfidence(result, analysisData),
        dataCompleteness: this.calculateDataCompleteness(analysisData)
      },
      tips: this.generateTips(category, result),
      comparisons: this.generateComparisons(category, result)
    };
  }

  /**
   * Calcule la confiance dans l'analyse
   */
  calculateConfidence(result, data) {
    let confidence = 0.5; // Base

    // Plus de données = plus de confiance
    if (data.barcode) confidence += 0.2;
    if (data.ingredients && data.ingredients.length > 50) confidence += 0.15;
    if (data.nutriments && Object.keys(data.nutriments).length > 5) confidence += 0.15;

    // Ajuster selon les scores
    if (result.scores) {
      const scores = Object.values(result.scores).filter(s => s !== null && s !== 'N/A');
      if (scores.length > 0) {
        confidence = Math.min(1, confidence + (scores.length * 0.05));
      }
    }

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Calcule la complétude des données
   */
  calculateDataCompleteness(data) {
    const requiredFields = {
      food: ['name', 'ingredients', 'nutriments', 'categories_tags'],
      cosmetic: ['name', 'ingredients', 'labels'],
      detergent: ['name', 'ingredients', 'labels']
    };

    const required = requiredFields[data.category] || ['name', 'ingredients'];
    const present = required.filter(field => 
      data[field] && 
      (typeof data[field] === 'string' ? data[field].length > 0 : Object.keys(data[field]).length > 0)
    );

    return Math.round((present.length / required.length) * 100);
  }

  /**
   * Génère des conseils selon la catégorie
   */
  generateTips(category, result) {
    const tips = [];

    switch (category) {
      case 'food':
        if (result.scores?.nova === 4) {
          tips.push({
            type: 'warning',
            message: 'Produit ultra-transformé : à limiter dans votre alimentation'
          });
        }
        if (result.scores?.nutriscore === 'A' || result.scores?.nutriscore === 'B') {
          tips.push({
            type: 'success',
            message: 'Bonne qualité nutritionnelle, à privilégier'
          });
        }
        break;

      case 'cosmetic':
        if (result.scores?.safety < 50) {
          tips.push({
            type: 'warning',
            message: 'Contient des ingrédients préoccupants, recherchez des alternatives'
          });
        }
        if (result.scores?.naturalness > 80) {
          tips.push({
            type: 'success',
            message: 'Composition majoritairement naturelle'
          });
        }
        break;

      case 'detergent':
        if (result.scores?.ecological > 80) {
          tips.push({
            type: 'success',
            message: 'Bon choix écologique'
          });
        }
        if (result.details?.phosphates) {
          tips.push({
            type: 'warning',
            message: 'Contient des phosphates, nocifs pour l\'environnement aquatique'
          });
        }
        break;
    }

    return tips;
  }

  /**
   * Génère des comparaisons avec des moyennes
   */
  generateComparisons(category, result) {
    // TODO: Implémenter avec des vraies moyennes depuis la base
    const averages = {
      food: { nova: 3, nutriscore: 'C', health: 50 },
      cosmetic: { safety: 70, naturalness: 40, effectiveness: 60 },
      detergent: { ecological: 50, efficiency: 70, safety: 60 }
    };

    return {
      category: averages[category] || {},
      interpretation: this.interpretComparison(category, result, averages[category])
    };
  }

  /**
   * Interprète les comparaisons
   */
  interpretComparison(category, result, average) {
    if (!average || !result.scores) return null;

    const mainScore = category === 'food' ? result.scores.health :
                     category === 'cosmetic' ? result.scores.safety :
                     result.scores.ecological;

    const avgScore = category === 'food' ? average.health :
                    category === 'cosmetic' ? average.safety :
                    average.ecological;

    if (mainScore > avgScore + 20) {
      return 'Bien au-dessus de la moyenne';
    } else if (mainScore > avgScore) {
      return 'Au-dessus de la moyenne';
    } else if (mainScore < avgScore - 20) {
      return 'Bien en dessous de la moyenne';
    } else if (mainScore < avgScore) {
      return 'En dessous de la moyenne';
    } else {
      return 'Dans la moyenne';
    }
  }

  /**
   * Génère un ID temporaire pour les produits sans code-barres
   */
  generateTemporaryId() {
    return 'TEMP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Sauvegarde un produit externe en base
   */
  async saveExternalProduct(externalProduct, category) {
    const Product = mongoose.model('Product');
    
    const productData = {
      barcode: externalProduct.barcode || externalProduct.code,
      name: externalProduct.name,
      category,
      brand: externalProduct.brand,
      ingredients: {
        text: externalProduct.composition || externalProduct.ingredients
      },
      images: {
        front: externalProduct.image_url
      },
      source: 'external_import',
      metadata: {
        lastSyncedAt: new Date(),
        verified: false
      }
    };

    try {
      const product = await Product.create(productData);
      return product;
    } catch (error) {
      console.error('Erreur sauvegarde produit externe:', error);
      return null;
    }
  }

  /**
   * Analyse par lot de plusieurs produits
   */
  async analyzeBatch(products, userId) {
    const results = [];
    const errors = [];

    for (const product of products) {
      try {
        const result = await this.analyze({
          ...product,
          userId
        });
        results.push({
          success: true,
          product: product.name || product.barcode,
          result
        });
      } catch (error) {
        errors.push({
          success: false,
          product: product.name || product.barcode,
          error: error.message
        });
      }
    }

    return {
      total: products.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
      summary: this.generateBatchSummary(results)
    };
  }

  /**
   * Génère un résumé pour une analyse par lot
   */
  generateBatchSummary(results) {
    const summary = {
      byCategory: {},
      averageScores: {},
      recommendations: []
    };

    // Grouper par catégorie
    results.forEach(r => {
      if (!r.success) return;
      
      const category = r.result.metadata?.category;
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = {
          count: 0,
          averageScore: 0
        };
      }
      
      summary.byCategory[category].count++;
      
      // Calculer les moyennes des scores
      if (r.result.scores) {
        Object.entries(r.result.scores).forEach(([key, value]) => {
          if (typeof value === 'number') {
            if (!summary.averageScores[key]) {
              summary.averageScores[key] = { sum: 0, count: 0 };
            }
            summary.averageScores[key].sum += value;
            summary.averageScores[key].count++;
          }
        });
      }
    });

    // Calculer les moyennes finales
    Object.keys(summary.averageScores).forEach(key => {
      const data = summary.averageScores[key];
      summary.averageScores[key] = Math.round(data.sum / data.count);
    });

    // Générer des recommandations globales
    if (summary.byCategory.food?.count > 0) {
      const avgHealth = summary.averageScores.health;
      if (avgHealth < 50) {
        summary.recommendations.push({
          type: 'warning',
          message: 'Vos produits alimentaires ont un score santé moyen faible. Privilégiez des aliments moins transformés.'
        });
      }
    }

    if (summary.byCategory.cosmetic?.count > 0) {
      const avgSafety = summary.averageScores.safety;
      if (avgSafety < 60) {
        summary.recommendations.push({
          type: 'warning',
          message: 'Plusieurs produits cosmétiques contiennent des ingrédients préoccupants.'
        });
      }
    }

    if (summary.byCategory.detergent?.count > 0) {
      const avgEco = summary.averageScores.ecological;
      if (avgEco < 50) {
        summary.recommendations.push({
          type: 'info',
          message: 'Considérez des alternatives écologiques pour vos produits ménagers.'
        });
      }
    }

    return summary;
  }

  /**
   * Recherche des alternatives pour un produit
   */
  async findAlternatives(productId, options = {}) {
    const {
      limit = 5,
      betterScoreOnly = true,
      sameCategory = true,
      maxPriceDiff = 50 // %
    } = options;

    try {
      const Product = mongoose.model('Product');
      const Analysis = mongoose.model('Analysis');

      // Récupérer le produit et son analyse
      const product = await Product.findById(productId);
      if (!product) throw new Error('Produit non trouvé');

      const analysis = await Analysis.findOne({ productId }).sort({ timestamp: -1 });
      if (!analysis) throw new Error('Analyse non trouvée');

      // Construire la requête pour les alternatives
      const query = {
        _id: { $ne: productId },
        category: product.category,
        status: 'active'
      };

      if (sameCategory && product.subCategories.length > 0) {
        query.subCategories = { $in: product.subCategories };
      }

      // Récupérer les candidats
      const candidates = await Product.find(query)
        .limit(limit * 3) // Prendre plus pour filtrer ensuite
        .sort({ 'metadata.scanCount': -1 }); // Popularité

      // Analyser et filtrer les candidats
      const alternatives = [];
      
      for (const candidate of candidates) {
        if (alternatives.length >= limit) break;

        // Récupérer l'analyse du candidat
        const candidateAnalysis = await Analysis.findOne({ 
          productId: candidate._id 
        }).sort({ timestamp: -1 });

        if (!candidateAnalysis) continue;

        // Comparer les scores
        const currentScore = this.getMainScore(analysis.results, product.category);
        const candidateScore = this.getMainScore(candidateAnalysis.results, product.category);

        if (!betterScoreOnly || candidateScore > currentScore) {
          alternatives.push({
            product: {
              id: candidate._id,
              name: candidate.name,
              brand: candidate.brand,
              image: candidate.images?.front
            },
            scores: candidateAnalysis.results.scores,
            improvement: candidateScore - currentScore,
            reason: this.getAlternativeReason(
              analysis.results,
              candidateAnalysis.results,
              product.category
            )
          });
        }
      }

      // Trier par amélioration décroissante
      alternatives.sort((a, b) => b.improvement - a.improvement);

      return alternatives.slice(0, limit);

    } catch (error) {
      console.error('Erreur recherche alternatives:', error);
      return [];
    }
  }

  /**
   * Obtient le score principal selon la catégorie
   */
  getMainScore(results, category) {
    switch (category) {
      case 'food':
        return results.scores?.health || 0;
      case 'cosmetic':
        return results.scores?.safety || 0;
      case 'detergent':
        return results.scores?.ecological || 0;
      default:
        return results.scores?.overall || 0;
    }
  }

  /**
   * Génère la raison de recommander une alternative
   */
  getAlternativeReason(currentResults, alternativeResults, category) {
    const reasons = [];

    switch (category) {
      case 'food':
        if (currentResults.scores.nova > alternativeResults.scores.nova) {
          reasons.push('Moins transformé');
        }
        if (currentResults.scores.nutriscore > alternativeResults.scores.nutriscore) {
          reasons.push('Meilleur Nutri-Score');
        }
        if (alternativeResults.details?.additives?.controversial?.length === 0) {
          reasons.push('Sans additifs controversés');
        }
        break;

      case 'cosmetic':
        if (alternativeResults.details?.concerns?.length === 0) {
          reasons.push('Sans substances préoccupantes');
        }
        if (alternativeResults.scores.naturalness > 80) {
          reasons.push('Composition naturelle');
        }
        break;

      case 'detergent':
        if (alternativeResults.details?.phosphates === false) {
          reasons.push('Sans phosphates');
        }
        if (alternativeResults.certifications?.eco?.length > 0) {
          reasons.push('Certifié écologique');
        }
        break;
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Meilleur score global';
  }

  /**
   * Obtient des statistiques sur les analyses
   */
  async getAnalysisStats(userId, period = '30d') {
    const Analysis = mongoose.model('Analysis');
    
    const dateLimit = new Date();
    switch (period) {
      case '7d':
        dateLimit.setDate(dateLimit.getDate() - 7);
        break;
      case '30d':
        dateLimit.setDate(dateLimit.getDate() - 30);
        break;
      case '90d':
        dateLimit.setDate(dateLimit.getDate() - 90);
        break;
      case 'all':
        dateLimit.setFullYear(2020);
        break;
    }

    const analyses = await Analysis.find({
      userId,
      timestamp: { $gte: dateLimit }
    });

    const stats = {
      total: analyses.length,
      byCategory: {},
      byMethod: {},
      averageScores: {},
      trends: []
    };

    // Calculer les statistiques
    analyses.forEach(analysis => {
      const category = analysis.results.category;
      const method = analysis.method;

      // Par catégorie
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = { count: 0, scores: {} };
      }
      stats.byCategory[category].count++;

      // Par méthode
      if (!stats.byMethod[method]) {
        stats.byMethod[method] = 0;
      }
      stats.byMethod[method]++;

      // Scores moyens
      if (analysis.results.scores) {
        Object.entries(analysis.results.scores).forEach(([key, value]) => {
          if (typeof value === 'number') {
            if (!stats.averageScores[key]) {
              stats.averageScores[key] = { sum: 0, count: 0 };
            }
            stats.averageScores[key].sum += value;
            stats.averageScores[key].count++;
          }
        });
      }
    });

    // Finaliser les moyennes
    Object.keys(stats.averageScores).forEach(key => {
      const data = stats.averageScores[key];
      stats.averageScores[key] = Math.round(data.sum / data.count);
    });

    return stats;
  }
}

module.exports = new UniversalAnalyzer();
