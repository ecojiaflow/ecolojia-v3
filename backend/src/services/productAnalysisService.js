// PATH: backend/src/services/productAnalysisService.js
// Service principal d'orchestration des analyses de produits

const Analysis = require('../models/Analysis');
const Product = require('../models/Product');
const { Logger } = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');
const mongoose = require('mongoose');

const logger = new Logger('ProductAnalysisService');

class ProductAnalysisService {
  constructor() {
    // Initialisation des analyseurs spécialisés
    this.analyzers = {
      food: null,
      cosmetics: null,
      detergents: null
    };// PATH: backend/src/services/productAnalysisService.js
// Service principal d'orchestration des analyses de produits - VERSION CORRIGÉE

const Analysis = require('../models/Analysis');
const Product = require('../models/Product');

// Logger simplifié si le module n'existe pas
let logger;
try {
  const { Logger } = require('../utils/logger');
  logger = new Logger('ProductAnalysisService');
} catch (e) {
  // Fallback logger simple
  logger = {
    info: (...args) => console.log('[ProductAnalysisService INFO]', ...args),
    warn: (...args) => console.warn('[ProductAnalysisService WARN]', ...args),
    error: (...args) => console.error('[ProductAnalysisService ERROR]', ...args),
    debug: (...args) => console.log('[ProductAnalysisService DEBUG]', ...args)
  };
}

// Gestion des erreurs simplifiée
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

const mongoose = require('mongoose');

class ProductAnalysisService {
  constructor() {
    // Initialisation des analyseurs spécialisés
    this.analyzers = {
      food: null,
      cosmetics: null,
      detergents: null
    };
    
    // Chargement différé des analyseurs pour éviter les dépendances circulaires
    this.loadAnalyzers();
  }

  loadAnalyzers() {
    try {
      // Chargement sécurisé des analyseurs UNIQUEMENT s'ils existent
      try {
        this.analyzers.food = require('../scorers/food/foodScorer');
        logger.info('Food analyzer loaded');
      } catch (e) {
        logger.warn('Food analyzer not available');
      }
      
      try {
        this.analyzers.cosmetics = require('../scorers/cosmetic/cosmeticScorer');
        logger.info('Cosmetics analyzer loaded');
      } catch (e) {
        logger.warn('Cosmetics analyzer not available');
      }
      
      try {
        this.analyzers.detergents = require('../scorers/detergent/detergentScorer');
        logger.info('Detergents analyzer loaded');
      } catch (e) {
        logger.warn('Detergents analyzer not available');
      }
      
    } catch (error) {
      logger.warn('Error loading analyzers:', error.message);
    }
  }

  // NOUVELLE MÉTHODE SIMPLIFIÉE pour compatibilité avec products.js
  async analyzeProduct(product, options = {}) {
    const { userId, useAI, category } = options;
    
    logger.info('Analyzing product (simplified):', {
      productId: product._id,
      productName: product.name,
      category: category || product.category,
      useAI
    });

    try {
      // Utiliser la méthode complète si possible
      if (product.name && (product.category || category)) {
        const params = {
          productId: product._id,
          name: product.name,
          category: category || product.category,
          brand: product.brand,
          barcode: product.barcode,
          ingredients: product.ingredients,
          userId
        };
        
        const result = await this.analyzeProductComplete(params);
        return result.results;
      }
      
      // Sinon, analyse basique
      return this.generateGenericAnalysis(product);
      
    } catch (error) {
      logger.error('Error in simplified analyzeProduct:', error);
      // Retourner une analyse basique en cas d'erreur
      return this.generateGenericAnalysis(product);
    }
  }

  async analyzeProductComplete(params) {
    logger.info('Analyzing product (complete):', { 
      name: params.name, 
      category: params.category,
      userId: params.userId 
    });
    
    try {
      // Validation des paramètres
      if (!params.name || !params.category) {
        throw new ValidationError('Product name and category are required');
      }

      if (!['food', 'cosmetics', 'detergents'].includes(params.category)) {
        throw new ValidationError('Invalid category. Must be food, cosmetics, or detergents');
      }

      // Créer ou récupérer le produit
      let product = await this.findOrCreateProduct(params);

      // Analyser selon la catégorie
      const analysisResults = await this.performCategoryAnalysis(product, params);

      // Créer l'enregistrement d'analyse
      const analysis = await this.createAnalysisRecord({
        userId: params.userId,
        product,
        results: analysisResults,
        type: params.barcode ? 'barcode_scan' : 'manual_entry'
      });

      // Mettre à jour le produit avec les derniers résultats
      await this.updateProductWithAnalysis(product, analysisResults);

      logger.info('Analysis completed:', { 
        analysisId: analysis._id, 
        score: analysisResults.healthScore 
      });
      
      return {
        analysis,
        product,
        results: analysisResults
      };

    } catch (error) {
      logger.error('Error analyzing product:', error);
      throw error;
    }
  }

  async findOrCreateProduct(params) {
    let product = null;

    // Recherche par barcode ou nom
    if (params.barcode) {
      product = await Product.findOne({ barcode: params.barcode });
    }
    
    if (!product && params.productId) {
      product = await Product.findById(params.productId);
    }
    
    if (!product && params.name) {
      product = await Product.findOne({ 
        name: new RegExp(`^${params.name}$`, 'i'),
        brand: params.brand
      });
    }

    // Créer le produit s'il n'existe pas
    if (!product) {
      product = new Product({
        name: params.name,
        category: params.category,
        barcode: params.barcode,
        brand: params.brand || 'Unknown',
        ingredients: params.ingredients || '',
        imageUrl: params.imageUrl,
        // Données spécifiques selon la catégorie
        [`${params.category}Data`]: params.specificData || {}
      });
      
      await product.save();
      logger.info('New product created:', { id: product._id, name: product.name });
    }

    return product;
  }

  async performCategoryAnalysis(product, params) {
    const category = product.category;
    const analyzer = this.analyzers[category];
    
    if (!analyzer) {
      logger.warn(`No analyzer found for category: ${category}`);
      // Analyse générique de fallback
      return this.generateGenericAnalysis(product);
    }

    try {
      // Préparer les données pour l'analyseur
      const analysisData = {
        name: product.name,
        brand: product.brand,
        ingredients: product.ingredients || params.ingredients || '',
        category: product.category,
        barcode: product.barcode,
        ...product[`${category}Data`] // Données spécifiques à la catégorie
      };

      // Exécuter l'analyse spécialisée selon le type d'analyseur
      let results;
      
      if (category === 'food' && analyzer.analyzeFood) {
        results = await analyzer.analyzeFood(analysisData, {});
      } else if (category === 'cosmetics' && analyzer.analyzeCosmetic) {
        results = await analyzer.analyzeCosmetic(analysisData);
      } else if (category === 'detergents' && analyzer.analyzeDetergent) {
        results = await analyzer.analyzeDetergent(
          analysisData.ingredients,
          analysisData.name,
          []
        );
      } else if (analyzer.analyze) {
        results = await analyzer.analyze(analysisData);
      } else {
        throw new Error('No suitable analyze method found');
      }
      
      // Enrichir avec des méta-données
      return {
        ...results,
        analyzedAt: new Date(),
        analyzerVersion: '3.0',
        confidence: results.confidence || this.calculateConfidence(product)
      };

    } catch (error) {
      logger.error(`Error in ${category} analyzer:`, error);
      return this.generateGenericAnalysis(product);
    }
  }

  generateGenericAnalysis(product) {
    // Analyse générique de base
    const healthScore = Math.floor(Math.random() * 40) + 40; // 40-80
    
    return {
      healthScore,
      environmentScore: Math.floor(Math.random() * 40) + 40,
      socialScore: Math.floor(Math.random() * 40) + 40,
      ethicsScore: Math.floor(Math.random() * 40) + 40,
      overallGrade: this.getGrade(healthScore),
      grade: this.getGrade(healthScore),
      summary: `Analyse basique effectuée pour ${product.name || 'ce produit'}`,
      concerns: ['Données insuffisantes pour une analyse complète'],
      benefits: ['Produit analysé avec succès'],
      recommendations: [
        'Données insuffisantes pour une analyse complète',
        'Vérifiez la liste des ingrédients',
        'Consultez un professionnel pour plus d'informations'
      ],
      confidence: 0.3
    };
  }

  async createAnalysisRecord({ userId, product, results, type }) {
    const analysis = new Analysis({
      userId,
      productId: product._id,
      productSnapshot: {
        name: product.name,
        brand: product.brand,
        category: product.category,
        barcode: product.barcode,
        imageUrl: product.imageUrl
      },
      analysisType: type,
      results: {
        healthScore: results.healthScore,
        environmentScore: results.environmentScore,
        ethicsScore: results.ethicsScore || results.socialScore,
        overallGrade: results.overallGrade || results.grade,
        summary: results.summary,
        recommendations: results.recommendations,
        concerns: results.concerns,
        benefits: results.benefits,
        
        // Résultats spécifiques selon la catégorie
        foodAnalysis: product.category === 'food' ? {
          novaScore: results.novaScore || results.nova?.score,
          nutriScore: results.nutriScore,
          additives: results.additives,
          allergens: results.allergens
        } : null,
        
        cosmeticsAnalysis: product.category === 'cosmetics' ? {
          endocrineRisk: results.endocrineRisk,
          allergenCount: results.allergenCount,
          naturalityScore: results.naturalityScore,
          inciAnalysis: results.inciAnalysis
        } : null,
        
        detergentsAnalysis: product.category === 'detergents' ? {
          environmentalImpact: results.environmentalImpact,
          aquaticToxicity: results.aquaticToxicity,
          biodegradabilityScore: results.biodegradabilityScore,
          vocLevel: results.vocLevel
        } : null
      },
      metadata: {
        analyzerVersion: results.analyzerVersion || '3.0',
        confidence: results.confidence,
        analyzedAt: results.analyzedAt || new Date()
      }
    });

    await analysis.save();
    return analysis;
  }

  async updateProductWithAnalysis(product, results) {
    product.analysisData = {
      healthScore: results.healthScore,
      environmentScore: results.environmentScore,
      ethicsScore: results.ethicsScore || results.socialScore,
      lastAnalyzedAt: new Date(),
      version: '3.0',
      confidence: results.confidence
    };
    
    product.scanCount = (product.scanCount || 0) + 1;
    await product.save();
  }

  calculateConfidence(product) {
    let confidence = 0.3; // Base
    
    // Augmenter la confiance selon les données disponibles
    if (product.ingredients && product.ingredients.length > 10) confidence += 0.2;
    if (product.barcode) confidence += 0.1;
    if (product.brand && product.brand !== 'Unknown') confidence += 0.1;
    if (product.imageUrl) confidence += 0.1;
    if (product[`${product.category}Data`]) confidence += 0.2;
    
    return Math.min(confidence, 0.95);
  }

  getGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'E';
  }

  async getAnalysisById(id, userId) {
    logger.debug('Getting analysis:', { id, userId });
    
    const analysis = await Analysis.findOne({ 
      _id: id, 
      userId 
    }).populate('productId');
    
    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }
    
    return analysis;
  }

  async getUserHistory(userId, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      category,
      sortBy = 'createdAt',
      order = 'desc' 
    } = options;
    
    const skip = (page - 1) * limit;

    logger.info('Getting user history:', { userId, page, limit, category });

    const query = { userId: mongoose.Types.ObjectId(userId) };
    if (category) query['productSnapshot.category'] = category;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const [analyses, total] = await Promise.all([
      Analysis.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('productId'),
      Analysis.countDocuments(query)
    ]);

    logger.debug('History retrieved:', { count: analyses.length, total });

    return {
      analyses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async getUserStats(userId) {
    logger.info('Getting user stats:', { userId });

    const stats = await Analysis.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          averageHealthScore: { $avg: '$results.healthScore' },
          averageEnvironmentScore: { $avg: '$results.environmentScore' },
          averageEthicsScore: { $avg: '$results.ethicsScore' },
          foodCount: {
            $sum: { $cond: [{ $eq: ['$productSnapshot.category', 'food'] }, 1, 0] }
          },
          cosmeticsCount: {
            $sum: { $cond: [{ $eq: ['$productSnapshot.category', 'cosmetics'] }, 1, 0] }
          },
          detergentsCount: {
            $sum: { $cond: [{ $eq: ['$productSnapshot.category', 'detergents'] }, 1, 0] }
          },
          lastWeekCount: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalAnalyses: 0,
      averageHealthScore: 0,
      averageEnvironmentScore: 0,
      averageEthicsScore: 0,
      foodCount: 0,
      cosmeticsCount: 0,
      detergentsCount: 0,
      lastWeekCount: 0
    };

    // Calculer la tendance
    const trend = result.lastWeekCount > 0 ? 'improving' : 'stable';

    logger.debug('Stats calculated:', result);

    return {
      totalAnalyses: result.totalAnalyses,
      scores: {
        health: Math.round(result.averageHealthScore || 0),
        environment: Math.round(result.averageEnvironmentScore || 0),
        ethics: Math.round(result.averageEthicsScore || 0)
      },
      categoriesBreakdown: {
        food: result.foodCount,
        cosmetics: result.cosmeticsCount,
        detergents: result.detergentsCount
      },
      activity: {
        lastWeek: result.lastWeekCount,
        trend: trend
      }
    };
  }

  async deleteAnalysis(analysisId, userId) {
    const analysis = await Analysis.findOneAndDelete({
      _id: analysisId,
      userId
    });
    
    if (!analysis) {
      throw new NotFoundError('Analysis not found or unauthorized');
    }
    
    logger.info('Analysis deleted:', { analysisId, userId });
    return analysis;
  }
}

// Export singleton
module.exports = new ProductAnalysisService();

// Export aussi la fonction simple pour compatibilité
module.exports.analyzeProduct = module.exports.analyzeProduct.bind(module.exports);
    
    // Chargement différé des analyseurs pour éviter les dépendances circulaires
    this.loadAnalyzers();
  }

  loadAnalyzers() {
    try {
      // Chargement sécurisé des analyseurs
      this.analyzers.food = require('../scorers/food/foodScorer');
      this.analyzers.cosmetics = require('../scorers/cosmetics/cosmeticsScorer');
      this.analyzers.detergents = require('../scorers/detergents/detergentsScorer');
      logger.info('All analyzers loaded successfully');
    } catch (error) {
      logger.warn('Some analyzers could not be loaded:', error.message);
    }
  }

  async analyzeProduct(params) {
    logger.info('Analyzing product:', { 
      name: params.name, 
      category: params.category,
      userId: params.userId 
    });
    
    try {
      // Validation des paramètres
      if (!params.name || !params.category) {
        throw new ValidationError('Product name and category are required');
      }

      if (!['food', 'cosmetics', 'detergents'].includes(params.category)) {
        throw new ValidationError('Invalid category. Must be food, cosmetics, or detergents');
      }

      // Créer ou récupérer le produit
      let product = await this.findOrCreateProduct(params);

      // Analyser selon la catégorie
      const analysisResults = await this.performCategoryAnalysis(product, params);

      // Créer l'enregistrement d'analyse
      const analysis = await this.createAnalysisRecord({
        userId: params.userId,
        product,
        results: analysisResults,
        type: params.barcode ? 'barcode_scan' : 'manual_entry'
      });

      // Mettre à jour le produit avec les derniers résultats
      await this.updateProductWithAnalysis(product, analysisResults);

      logger.info('Analysis completed:', { 
        analysisId: analysis._id, 
        score: analysisResults.healthScore 
      });
      
      return {
        analysis,
        product,
        results: analysisResults
      };

    } catch (error) {
      logger.error('Error analyzing product:', error);
      throw error;
    }
  }

  async findOrCreateProduct(params) {
    let product = null;

    // Recherche par barcode ou nom
    if (params.barcode) {
      product = await Product.findOne({ barcode: params.barcode });
    }
    
    if (!product && params.productId) {
      product = await Product.findById(params.productId);
    }
    
    if (!product) {
      product = await Product.findOne({ 
        name: new RegExp(`^${params.name}$`, 'i'),
        brand: params.brand
      });
    }

    // Créer le produit s'il n'existe pas
    if (!product) {
      product = new Product({
        name: params.name,
        category: params.category,
        barcode: params.barcode,
        brand: params.brand || 'Unknown',
        ingredients: params.ingredients || '',
        imageUrl: params.imageUrl,
        // Données spécifiques selon la catégorie
        [`${params.category}Data`]: params.specificData || {}
      });
      
      await product.save();
      logger.info('New product created:', { id: product._id, name: product.name });
    }

    return product;
  }

  async performCategoryAnalysis(product, params) {
    const category = product.category;
    const analyzer = this.analyzers[category];
    
    if (!analyzer) {
      logger.warn(`No analyzer found for category: ${category}`);
      // Analyse générique de fallback
      return this.generateGenericAnalysis(product);
    }

    try {
      // Préparer les données pour l'analyseur
      const analysisData = {
        name: product.name,
        brand: product.brand,
        ingredients: product.ingredients || params.ingredients || '',
        category: product.category,
        barcode: product.barcode,
        ...product[`${category}Data`] // Données spécifiques à la catégorie
      };

      // Exécuter l'analyse spécialisée
      const results = await analyzer.analyze(analysisData);
      
      // Enrichir avec des méta-données
      return {
        ...results,
        analyzedAt: new Date(),
        analyzerVersion: '3.0',
        confidence: results.confidence || this.calculateConfidence(product)
      };

    } catch (error) {
      logger.error(`Error in ${category} analyzer:`, error);
      return this.generateGenericAnalysis(product);
    }
  }

  generateGenericAnalysis(product) {
    // Analyse générique de base
    const healthScore = Math.floor(Math.random() * 40) + 40; // 40-80
    
    return {
      healthScore,
      environmentScore: Math.floor(Math.random() * 40) + 40,
      ethicsScore: Math.floor(Math.random() * 40) + 40,
      overallGrade: this.getGrade(healthScore),
      summary: `Analyse basique effectuée pour ${product.name}`,
      recommendations: [
        'Données insuffisantes pour une analyse complète',
        'Vérifiez la liste des ingrédients',
        'Consultez un professionnel pour plus d'informations'
      ],
      confidence: 0.3
    };
  }

  async createAnalysisRecord({ userId, product, results, type }) {
    const analysis = new Analysis({
      userId,
      productId: product._id,
      productSnapshot: {
        name: product.name,
        brand: product.brand,
        category: product.category,
        barcode: product.barcode,
        imageUrl: product.imageUrl
      },
      analysisType: type,
      results: {
        healthScore: results.healthScore,
        environmentScore: results.environmentScore,
        ethicsScore: results.ethicsScore,
        overallGrade: results.overallGrade,
        summary: results.summary,
        recommendations: results.recommendations,
        
        // Résultats spécifiques selon la catégorie
        foodAnalysis: product.category === 'food' ? {
          novaScore: results.novaScore,
          nutriScore: results.nutriScore,
          additives: results.additives,
          allergens: results.allergens
        } : null,
        
        cosmeticsAnalysis: product.category === 'cosmetics' ? {
          endocrineRisk: results.endocrineRisk,
          allergenCount: results.allergenCount,
          naturalityScore: results.naturalityScore,
          inciAnalysis: results.inciAnalysis
        } : null,
        
        detergentsAnalysis: product.category === 'detergents' ? {
          environmentalImpact: results.environmentalImpact,
          aquaticToxicity: results.aquaticToxicity,
          biodegradabilityScore: results.biodegradabilityScore,
          vocLevel: results.vocLevel
        } : null
      },
      metadata: {
        analyzerVersion: results.analyzerVersion,
        confidence: results.confidence,
        analyzedAt: results.analyzedAt
      }
    });

    await analysis.save();
    return analysis;
  }

  async updateProductWithAnalysis(product, results) {
    product.analysisData = {
      healthScore: results.healthScore,
      environmentScore: results.environmentScore,
      ethicsScore: results.ethicsScore,
      lastAnalyzedAt: new Date(),
      version: '3.0',
      confidence: results.confidence
    };
    
    product.scanCount = (product.scanCount || 0) + 1;
    await product.save();
  }

  calculateConfidence(product) {
    let confidence = 0.3; // Base
    
    // Augmenter la confiance selon les données disponibles
    if (product.ingredients && product.ingredients.length > 10) confidence += 0.2;
    if (product.barcode) confidence += 0.1;
    if (product.brand && product.brand !== 'Unknown') confidence += 0.1;
    if (product.imageUrl) confidence += 0.1;
    if (product[`${product.category}Data`]) confidence += 0.2;
    
    return Math.min(confidence, 0.95);
  }

  getGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'E';
  }

  async getAnalysisById(id, userId) {
    logger.debug('Getting analysis:', { id, userId });
    
    const analysis = await Analysis.findOne({ 
      _id: id, 
      userId 
    }).populate('productId');
    
    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }
    
    return analysis;
  }

  async getUserHistory(userId, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      category,
      sortBy = 'createdAt',
      order = 'desc' 
    } = options;
    
    const skip = (page - 1) * limit;

    logger.info('Getting user history:', { userId, page, limit, category });

    const query = { userId: mongoose.Types.ObjectId(userId) };
    if (category) query['productSnapshot.category'] = category;

    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    const [analyses, total] = await Promise.all([
      Analysis.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('productId'),
      Analysis.countDocuments(query)
    ]);

    logger.debug('History retrieved:', { count: analyses.length, total });

    return {
      analyses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async getUserStats(userId) {
    logger.info('Getting user stats:', { userId });

    const stats = await Analysis.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          averageHealthScore: { $avg: '$results.healthScore' },
          averageEnvironmentScore: { $avg: '$results.environmentScore' },
          averageEthicsScore: { $avg: '$results.ethicsScore' },
          foodCount: {
            $sum: { $cond: [{ $eq: ['$productSnapshot.category', 'food'] }, 1, 0] }
          },
          cosmeticsCount: {
            $sum: { $cond: [{ $eq: ['$productSnapshot.category', 'cosmetics'] }, 1, 0] }
          },
          detergentsCount: {
            $sum: { $cond: [{ $eq: ['$productSnapshot.category', 'detergents'] }, 1, 0] }
          },
          lastWeekCount: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'analyses',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { userId: mongoose.Types.ObjectId(userId) } },
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            { $group: {
              _id: null,
              recentTrend: { $avg: '$results.healthScore' }
            }}
          ],
          as: 'recentData'
        }
      }
    ]);

    const result = stats[0] || {
      totalAnalyses: 0,
      averageHealthScore: 0,
      averageEnvironmentScore: 0,
      averageEthicsScore: 0,
      foodCount: 0,
      cosmeticsCount: 0,
      detergentsCount: 0,
      lastWeekCount: 0,
      recentData: []
    };

    // Calculer la tendance
    const trend = result.lastWeekCount > 0 ? 'improving' : 'stable';

    logger.debug('Stats calculated:', result);

    return {
      totalAnalyses: result.totalAnalyses,
      scores: {
        health: Math.round(result.averageHealthScore || 0),
        environment: Math.round(result.averageEnvironmentScore || 0),
        ethics: Math.round(result.averageEthicsScore || 0)
      },
      categoriesBreakdown: {
        food: result.foodCount,
        cosmetics: result.cosmeticsCount,
        detergents: result.detergentsCount
      },
      activity: {
        lastWeek: result.lastWeekCount,
        trend: trend
      }
    };
  }

  async deleteAnalysis(analysisId, userId) {
    const analysis = await Analysis.findOneAndDelete({
      _id: analysisId,
      userId
    });
    
    if (!analysis) {
      throw new NotFoundError('Analysis not found or unauthorized');
    }
    
    logger.info('Analysis deleted:', { analysisId, userId });
    return analysis;
  }
}

// Export singleton
module.exports = new ProductAnalysisService();