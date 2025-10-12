// PATH: backend/src/routes/products.js
const express = require('express');
const router = express.Router();
// const enrichProduct = require('../middleware/enrichProduct');
const mongoose = require('mongoose');

// Middleware enrichissement métadonnées global
// router.use(enrichProduct);

// SCORING ENGINE SCIENTIFIQUE
const imageEnrichment = require('../services/imageEnrichment.service');

const scoringUnified = require('../services/scoringUnified');

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

/* Route par défaut */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Products API - Use /test to see available routes'
  });
});

/* Test simple */
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

      // Enrichir les produits avec images OpenFoodFacts
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
      additives: product.additives_tags || product.additives || [],
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

/* Obtenir alternatives - CORRIGÉ */
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

  // FIX: Support scores.global OU scores.overallScore
  const currentScore = product.scores?.overallScore || product.scores?.global || 0;

  if (currentScore >= 70) {
    return res.json({ success: true, alternatives: [], message: 'Ce produit est déjà excellent' });
  }

  // FIX: Requête flexible avec subcategory optionnelle
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

  // FIX: Mapping score avec fallback
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

/* GET PRODUCT BY ID - Accepte barcode OU _id MongoDB */
router.get('/:id', handleAsync(async (req, res) => {
  const { id } = req.params;
  logger.info('Get product by ID:', id);

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

  // PHASE 4 - Utiliser scores persistés MongoDB (migration v3.0.0 effectuée)
  const scores = product.scores || {
    overallScore: 50,
    healthScore: 50,
    environmentScore: 50
  };

  const productObj = product.toObject ? product.toObject() : product;
  
  res.json({ 
    success: true, 
    product: { 
      ...productObj,
      scores
    } 
  });
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
