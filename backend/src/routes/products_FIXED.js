// PATH: backend/src/routes/products.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// SERVICES
const imageEnrichment = require('../services/imageEnrichment.service');
const scoringUnified = require('../services/scoringUnified');
const aiEnrichment = require('../services/aiEnrichment.service');
const ProductOrchestrator = require('../services/ProductOrchestrator');
const alternativesService = require('../services/alternatives.service');
const recipeAdapter = require('../services/recipeAdapter.service');
const contextualService = require('../services/contextual.service');
const algoliaService = require('../services/algolia/algoliaService'); // ✨ NOUVEAU

/* Middleware debug */
router.use((req, _res, next) => {
  console.log(`[Products Router] ${req.method} ${req.originalUrl} - Path: ${req.path}`);
  next();
});

/* Auth middlewares (fallbacks inclus) */
let authenticateUser, checkPremium;
try {
  const auth = require('../middleware/auth');
  authenticateUser = auth.authenticateUser || auth.auth || auth;
  checkPremium = auth.checkPremium || auth.requirePremium || ((_req, _res, next) => next());
} catch {
  console.log('[Products] Auth middleware not found, using fallback');
  authenticateUser = (_req, _res, next) => {
    const authHeader = _req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      _req.userId = 'test-user-id';
      _req.user = { _id: 'test-user-id', tier: 'free' };
    }
    next();
  };
  checkPremium = (_req, _res, next) => { next(); };
}

/* Models (fallback mocks) */
let Product, Analysis;
try {
  Product = require('../models/Product');
} catch (error) {
  console.log('[Products] Product model not found, using mock');
  Product = mockModel();
}

try {
  Analysis = require('../models/Analysis');
} catch (error) {
  console.log('[Products] Analysis model not found, using mock');
  Analysis = mockModel();
}

/* Nova classifier (sécurisé) */
let novaClassifier;
try {
  novaClassifier = require('../services/analysis/novaClassifier');
} catch {
  console.log('[Products] novaClassifier not found – defaulting to stub');
  novaClassifier = { classify: () => ({ group: null }) };
}

/* Logger */
const logger = {
  info: (...a) => console.log('[Products]', ...a),
  warn: (...a) => console.warn('[Products WARN]', ...a),
  error: (...a) => console.error('[Products ERROR]', ...a)
};

/* Helper async */
const handleAsync = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(err => {
  logger.error('Async error:', err);
  res.status(500).json({ success: false, error: err.message });
});

/* ========== ROUTES ========== */

// === FONCTION ENRICHISSEMENT RÉPONSE ===
async function enrichProductResponse(product, source = 'DIRECT', cached = false, aiEnrichmentUsed = false, knowledgeData = null) {
  try {
    let plainProduct = product.toObject ? product.toObject() : product;
    // ============================================================================
    // 🔧 RECALCUL AUTOMATIQUE DU BREAKDOWN SI ABSENT (V3.1)
    // ============================================================================
    // Si le produit n'a pas de breakdown (ancien format), on recalcule
    if (product.scores && (!product.scores.breakdown || product.scores.scoringVersion !== '3.1.0')) {
      logger.info('[SCORING] Recalcul breakdown pour produit ancien format');
      
      try {
        // Préparer les données pour le scoring
        const scoringData = {
          // Nom et marque (requis pour calculateDataConfidence)
          product_name: plainProduct.name,
          brands: plainProduct.brand,
          
          // NOVA Group
          novaGroup: plainProduct.nova_group || plainProduct.foodData?.novaGroup,
          
          // Nutri-Score
          nutriScore: plainProduct.nutriscore_grade || plainProduct.foodData?.nutriScore,
          
          // Eco-Score
          ecoScore: plainProduct.ecoscore_grade || plainProduct.foodData?.ecoScore,
          
          // Additifs
          additives: plainProduct.additives_tags || plainProduct.foodData?.additivesTags || [],
          
          // Labels
          labels: plainProduct.labels || plainProduct.labels_tags || plainProduct.foodData?.labels || [],
          
          // Nutriments (CRITICAL)
          nutriments: plainProduct.nutriments || plainProduct.foodData?.nutritionFacts || {},
          
          // Catégorie
          category: plainProduct.categoryType || plainProduct.category
        };

        // Recalculer avec scoringUnified
        const newScores = scoringUnified.calculateFoodScores(scoringData);
        
        if (newScores && newScores.breakdown) {
          logger.info('[SCORING] ✅ Breakdown recalculé avec succès');
          
          // Mettre à jour le produit
          product.scores = {
            ...product.scores,
            ...newScores,
            scoringVersion: '3.1.0',
            recalculatedAt: new Date()
          };
          
          // Sauvegarder en base ET attendre
          if (product.save) {
            // product.markModified('scores'); // SKIP - on utilise updateOne à la place
            // await product.save(); // SKIP - save() écrase les scores !
            
            // CRITICAL: Recharger depuis DB pour forcer la mise à jour
            await product.constructor.updateOne(
              { _id: product._id },
              { $set: { scores: product.scores } }
            );
            logger.info('[SCORING] ✅ Scores forcés en DB via updateOne');
            logger.info('[SCORING] Produit sauvegardé en base avec breakdown');
            
            // Mettre à jour plainProduct
            plainProduct = product.toObject ? product.toObject() : product;
          }
        }
      } catch (scoringError) {
        logger.error('[SCORING] Erreur recalcul:', scoringError.message);
      }
    }
    // ============================================================================

    const currentScore = plainProduct.scores?.overallScore || plainProduct.scores?.global || 0;

    // 1. Alternatives IA (3 max)
    let alternatives = [];
    try {
      const altResult = await alternativesService.findAlternatives({
        productId: plainProduct._id,
        barcode: plainProduct.barcode,
        maxResults: 3,
        userPreferences: { minScore: currentScore + 5 }
      });
      alternatives = altResult.alternatives || [];
    } catch (altError) {
      logger.error('[ALTERNATIVES] Error:', altError.message);
    }

    // 2. Recettes/Routines (food uniquement, 3 max)
    let recipes = [];
    if (plainProduct.categoryType === 'food') {
      try {
        const userProfile = {
          dietary: 'omnivore',
          targetCaloriesPerMeal: 500,
          allergens: [],
          goals: ['health']
        };
        const recipesResult = await recipeAdapter.recommendRecipesForProduct(plainProduct, {
          count: 3,
          userProfile: userProfile
        });
        recipes = recipesResult || [];
      } catch (recipeError) {
        logger.error('[RECIPES] Error:', recipeError.message);
      }
    }

    // 3. Cartes pédagogiques CIL (2 max)
    let contextCards = [];
    try {
      contextCards = contextualService.selectRelevantCards(plainProduct, 2);
    } catch (cardError) {
      logger.error('[CONTEXTUAL] Error:', cardError.message);
    }

    return {
      success: true,
      product: plainProduct,
      product: product.toObject ? product.toObject() : product,
      cached: cached,
      enrichment: {
        aiUsed: aiEnrichmentUsed,
        confidence: product.scores?.confidence || null,
        dataCompleteness: product.scores?.dataCompleteness || null
      },
      alternatives: alternatives.length > 0 ? alternatives : [],
      recipes: recipes.length > 0 ? recipes : [],
      contextCards: contextCards.length > 0 ? contextCards : []
    };
  } catch (enrichError) {
    logger.error('[ENRICH_RESPONSE] Error:', enrichError.message);
    return {
      success: true,
      product: plainProduct,
      source: source,
      cached: cached,
      aiEnrichmentUsed: aiEnrichmentUsed

      // ⭐ SYSTÈME HYBRIDE V3.1 (Compatible Node.js)
      knowledgeAnalysis: knowledgeData ? knowledgeData.knowledgeAnalysis : undefined,
      aiEnriched: knowledgeData ? knowledgeData.aiEnriched : undefined,
      knowledgeBaseUsed: knowledgeData ? knowledgeData.knowledgeBaseUsed : undefined,
      confidence: knowledgeData ? knowledgeData.confidence : undefined,
      deepseekUsed: knowledgeData ? knowledgeData.deepseekUsed : undefined,
      aiEnrichmentDate: knowledgeData ? knowledgeData.aiEnrichmentDate : undefined,
      aiEnrichmentVersion: knowledgeData ? knowledgeData.aiEnrichmentVersion : undefined
    };
  }
}

/* Route par défaut */
router.get('/stats', async (req, res) => {
  try {
    const stats = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgScore: { $avg: '$scores.overallScore' } } },
      { $sort: { count: -1 } }
    ]);
    const total = await Product.countDocuments();
    const withScores = await Product.countDocuments({ 'scores.overallScore': { $exists: true, $ne: null } });
    res.json({ success: true, total, withScores, completeness: Math.round((withScores / total) * 100), byCategory: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Products API - Use /test to see available routes'
  });
});

router.get('/test', (_req, res) => {
  logger.info('Test route called!');
  res.json({
    success: true,
    message: 'Products routes are working!',
    timestamp: new Date(),
    routes: [
      'GET /api/products/test',
      'GET /api/products/search',
      'GET /api/products/trending',
      'GET /api/products/:id/alternatives',
      'POST /api/products/:id/report',
      'GET /api/products/:id',
      'POST /api/products/analyze',
      'POST /api/products'
    ]
  });
});

/* Recherche produits */
router.get('/search', handleAsync(async (req, res) => {
  const { q, category, page = 1, limit = 20 } = req.query;
  logger.info('Search request:', { query: q, category, page, limit });

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'La requête doit contenir au moins 2 caractères' });
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const searchQuery = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { brand: { $regex: q, $options: 'i' } },
          { barcode: q }
        ]
      };

      if (category) searchQuery.category = category;

      const products = await Product.find(searchQuery)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Product.countDocuments(searchQuery);
      const enrichedProducts = await imageEnrichment.batchEnrich(products);

      return res.json({
        success: true,
        products: enrichedProducts,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      logger.error('Database search error:', error);
    }
  }

  res.status(500).json({ success: false, error: 'Database not available' });
}));

/* Produits tendance */
router.get('/trending', handleAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  logger.info('Getting trending products', { limit });

  if (mongoose.connection.readyState === 1) {
    try {
      const products = await Product.find({})
        .sort({ scanCount: -1, viewCount: -1 })
        .limit(parseInt(limit));

      if (products.length > 0) {
        return res.json({ success: true, products });
      }
    } catch (error) {
      logger.error('Database trending error:', error);
    }
  }

  res.json({ success: true, products: [] });
}));

/* Analyse produit */
router.post('/analyze', authenticateUser, handleAsync(async (req, res) => {
  const userId = req.user?._id || req.userId || 'anonymous';
  const { productId, barcode, manualData, category = 'food' } = req.body;
  logger.info('Analysis request:', { userId, productId, barcode, category });

  if (req.user && req.user.quotas && req.user.quotas.scansRemaining <= 0) {
    return res.status(403).json({
      success: false,
      error: 'Quota de scans dépassé',
      quotas: req.user.quotas
    });
  }

  let product = null;
  if (mongoose.connection.readyState === 1) {
    product = barcode ? await Product.findOne({ barcode }).lean()
             : productId ? await Product.findById(productId).lean()
             : null;
  }

  if (!product) {
    product = {
      _id: Date.now().toString(),
      name: manualData?.name || 'Produit inconnu',
      brand: manualData?.brand || 'Marque inconnue',
      category,
      barcode: barcode || 'unknown',
      ingredients: manualData?.ingredients || ''
    };
  }

  const ingredientsText = product.ingredients || '';
  let novaGroup = product.nova_group || product.foodData?.nova || product.nova || null;

  if (!novaGroup && ingredientsText.length > 3) {
    try {
      novaGroup = novaClassifier.classify(ingredientsText, product.name).group;
    } catch(err) {
      console.warn('NOVA classification failed:', err.message);
    }
  }

  const nutriScore = product.nutriscore_grade || product.foodData?.nutriscore || null;
  const ecoScore = product.ecoscore_grade || product.foodData?.ecoscore || null;

  const analysisResult = {
    scores: {
      nova: novaGroup,
      nutriscore: nutriScore,
      ecoscore: ecoScore,
      health: calculateHealthScore(product, novaGroup, nutriScore)
    },
    details: {
      additives: plainProduct.additives_tags || product.additives || [],
      allergens: product.allergens_tags || [],
      nutritionFacts: product.nutritionFacts || {},
      ingredients: ingredientsText
    },
    summary: {
      fr: generateSummary(novaGroup, nutriScore),
      en: 'Summary in English…'
    },
    recommendations: generateRecommendations(novaGroup, nutriScore)
  };

  if (Analysis && mongoose.connection.readyState === 1) {
    try {
      await Analysis.create({
        userId,
        productId: product._id,
        timestamp: new Date(),
        results: analysisResult
      });
    } catch(e) {
      console.warn('Could not save analysis:', e.message);
    }
  }

  res.json({
    success: true,
    data: {
      product: {
        name: product.name,
        brand: product.brand,
        barcode: product.barcode,
        image: product.image_url || product.imageUrl || product.images?.front
      },
      scores: analysisResult.scores,
      details: analysisResult.details,
      summary: analysisResult.summary,
      recommendations: analysisResult.recommendations
    }
  });
}));

/* Obtenir alternatives */
router.get('/:id/alternatives', handleAsync(async (req, res) => {
  const { id } = req.params;
  logger.info('Get alternatives for product:', id);

  let product = null;
  if (mongoose.connection.readyState === 1) {
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({ barcode: id });
    }
  }

  if (!product) {
    return res.status(404).json({ success: false, error: 'Produit introuvable' });
  }

  const currentScore = product.scores?.overallScore || product.scores?.global || 0;

  if (currentScore >= 70) {
    return res.json({ success: true, alternatives: [], message: 'Ce produit est déjà excellent' });
  }

  const query = {
    category: product.category,
    _id: { $ne: product._id },
    $or: [
      { 'scores.global': { $gt: currentScore } },
      { 'scores.overallScore': { $gt: currentScore } }
    ]
  };

  if (product.subcategory) {
    query.subcategory = product.subcategory;
  }

  const alternatives = await Product.find(query)
    .sort({ 'scores.global': -1, 'scores.overallScore': -1 })
    .limit(5)
    .lean();

  const formattedAlternatives = alternatives.map(alt => ({
    _id: alt._id,
    barcode: alt.barcode,
    name: alt.name,
    brand: alt.brand,
    imageUrl: alt.imageUrl || alt.images?.front,
    images: alt.images,
    scores: {
      overallScore: alt.scores?.overallScore || alt.scores?.global || 75,
      global: alt.scores?.global || alt.scores?.overallScore || 75
    }
  }));

  res.json({ success: true, alternatives: formattedAlternatives });
}));

/* Signaler un produit */
router.post('/:id/report', authenticateUser, handleAsync(async (req, res) => {
  const { reason } = req.body;
  const productId = req.params.id;
  const userId = req.userId || req.user?._id || 'anonymous';

  if (!reason) {
    return res.status(400).json({
      success: false,
      error: 'La raison du signalement est requise'
    });
  }

  res.json({
    success: true,
    message: 'Signalement enregistré avec succès',
    reportId: new Date().getTime().toString()
  });
}));

/* ============================================================================
   ✨ GET PRODUCT BY ID - AVEC RECHERCHE SIMILARITÉ
   ============================================================================ */
router.get('/:id', handleAsync(async (req, res) => {
  const { id } = req.params;
  logger.info('Get product by ID:', id);

  // Tentative 1 : Chercher par _id MongoDB
  let product = null;
  if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
    product = await Product.findById(id);

    if (product) {
      logger.info('Product found by MongoDB ID');
      // ⭐ ENRICHISSEMENT IA HYBRIDE
      let knowledgeData = null;
      try {
        const enriched = await aiEnrichment.enrichProductWithAI(product);
        knowledgeData = {
          knowledgeAnalysis: enriched.knowledgeAnalysis,
          aiEnriched: enriched.aiEnriched,
          knowledgeBaseUsed: enriched.knowledgeBaseUsed,
          confidence: enriched.scores?.confidence,
          deepseekUsed: enriched.deepseekUsed,
          aiEnrichmentDate: enriched.aiEnrichmentDate,
          aiEnrichmentVersion: enriched.aiEnrichmentVersion
        };
        logger.info('✅ Enrichissement IA hybride réussi');
      } catch (aiError) {
        logger.warn('⚠️ Enrichissement IA échoué:', aiError.message);
      }

      const enrichedResponse = await enrichProductResponse(product, 'MONGODB_ID', false, true, knowledgeData);
      return res.json(enrichedResponse);
    }
  }

  // Tentative 2 : Utiliser ProductOrchestrator (barcode)
  try {
    const result = await ProductOrchestrator.getOrCreateProduct({
      barcode: id,
      source: 'OFF'
    });

    // Cas 1 : Catégorie invalide
    if (result.source === 'INVALID_CATEGORY') {
      return res.status(400).json({
        success: false,
        error: result.error,
        detectedType: result.detectedType,
        suggestion: result.suggestion,
        redirectTo: null
      });
    }

    // ============================================================================
    // ✨ CAS 2 : PRODUIT NON TROUVÉ → RECHERCHE SIMILARITÉ (NOUVEAU)
    // ============================================================================
    if (result.source === 'NOT_FOUND') {
      logger.info('🔍 Produit non trouvé, recherche similarité...');

      // Extraire nom potentiel du barcode (si connu) ou utiliser ID
      const searchQuery = result.searchQuery || id;

      // Recherche similarité avec Algolia
      let similarProducts = [];
      try {
        similarProducts = await algoliaService.searchSimilarProducts(
          searchQuery,
          null, // Toutes catégories
          {
            limit: 5,
            minScore: 0.5, // Seuil 50% de similarité
            excludeBarcode: id
          }
        );
      } catch (algoliaError) {
        logger.error('[ALGOLIA] Erreur recherche similarité:', algoliaError.message);
      }

      // Si des produits similaires trouvés → proposer choix
      if (similarProducts && similarProducts.length > 0) {
        logger.info(`✅ ${similarProducts.length} produits similaires trouvés`);

        return res.status(200).json({
          success: false,
          productNotFound: true,
          barcode: id,
          message: 'Produit non trouvé, mais voici des produits similaires',
          similarProducts: similarProducts.map(p => ({
            _id: p.objectID || p._id,
            name: p.name || p.title,
            brand: p.brand,
            barcode: p.barcode,
            imageUrl: p.imageUrl || p.image,
            scores: {
              overallScore: p.scores?.overallScore || p.score || 75
            },
            similarityScore: p._similarityScore || 0,
            position: p._position || 0
          })),
          actions: {
            selectProduct: 'Choisir un de ces produits',
            useOCR: 'Ou scanner l\'étiquette avec OCR'
          },
          redirectTo: '/ocr' // Fallback si user refuse tous
        });
      }

      // Si AUCUN produit similaire → redirect OCR direct
      logger.info('❌ Aucun produit similaire, redirect OCR');

      return res.status(404).json({
        success: false,
        productNotFound: true,
        barcode: id,
        error: 'Produit non trouvé dans OpenFoodFacts',
        suggestion: 'Utilisez la fonctionnalité OCR pour analyser ce produit',
        redirectTo: '/ocr'
      });
    }

    // ============================================================================
    // Cas 3 : Produit trouvé et enrichi
    // ============================================================================
    if (result.product) {
      logger.info('Product found/created via Orchestrator:', result.source);
      const enrichedResponse = await enrichProductResponse(
        result.product,
        result.source,
        result.cached || false,
        result.aiEnrichmentUsed || false
      );
      return res.json(enrichedResponse);
    }

    // Cas 4 : Erreur inattendue
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du produit'
    });

  } catch (error) {
    logger.error('Error in ProductOrchestrator:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur serveur'
    });
  }
}));

/* Créer un produit manuellement */
router.post('/', authenticateUser, checkPremium, handleAsync(async (req, res) => {
  const { name, brand, category, barcode, specificData } = req.body;
  logger.info('Create product manually:', { name, brand, category });

  if (!name || !category) {
    return res.status(400).json({
      success: false,
      error: 'Le nom et la catégorie sont requis'
    });
  }

  if (!['food', 'cosmetics', 'detergents'].includes(category)) {
    return res.status(400).json({
      success: false,
      error: 'Catégorie invalide. Doit être: food, cosmetics, ou detergents'
    });
  }

  const product = {
    _id: new Date().getTime().toString(),
    name,
    brand: brand || 'Sans marque',
    category,
    barcode: barcode || `manual-${Date.now()}`,
    specificData,
    viewCount: 0,
    scanCount: 0,
    createdAt: new Date(),
    createdBy: req.userId
  };

  res.status(201).json({ success: true, product });
}));

/* ========== HELPERS ========== */
function calculateHealthScore(prod, nova, nutri) {
  let score = 50;
  if (nova) score += (5 - nova) * 6;
  if (nutri) score += ({ a: 30, b: 22, c: 15, d: 7, e: 0 }[nutri.toLowerCase()] || 0);

  if (prod.nutritionFacts) {
    if (prod.nutritionFacts.sugars_100g > 20) score -= 5;
    if (prod.nutritionFacts.saturated_fat_100g > 5) score -= 5;
    if (prod.nutritionFacts.salt_100g > 1.5) score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function generateSummary(nova, nutri) {
  const arr = [];
  if (nova === 4) arr.push('⚠ Produit ultra-transformé.');
  if (nutri && ['d', 'e'].includes(nutri.toLowerCase())) {
    arr.push('⚠ Mauvais Nutri-Score.');
  }
  return arr.join(' ') || 'Analyse complète du produit.';
}

function generateRecommendations(nova, nutri) {
  const rec = {
    healthImpact: 'À consommer avec modération',
    alternatives: [],
    advice: []
  };

  if (nova === 4) {
    rec.healthImpact = 'À limiter – ultra-transformé';
    rec.advice.push('Privilégiez des alternatives moins transformées');
  }

  if (nutri && ['d', 'e'].includes(nutri.toLowerCase())) {
    rec.advice.push('Cherchez des alternatives avec un meilleur Nutri-Score');
  }

  return rec;
}

function mockModel() {
  return {
    find: async () => [],
    findOne: async () => null,
    findById: async () => null,
    create: async d => d,
    countDocuments: async () => 0
  };
}

console.log('[Products] Router créé avec', router.stack.filter(l => l.route).length, 'routes');

module.exports = router;









