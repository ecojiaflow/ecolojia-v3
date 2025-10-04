// PATH: backend/src/routes/products.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Middleware debug â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
router.use((req, _res, next) => {
  console.log(`[Products Router] ${req.method} ${req.originalUrl} - Path: ${req.path}`);
  next();
});

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Auth middlewares (fallbacks inclus) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Models (fallback mocks) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Nova classifier (sÃ©curisÃ©) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let novaClassifier;
try {
  novaClassifier = require('../services/analysis/novaClassifier');
} catch {
  console.log('[Products] novaClassifier not found â€“ defaulting to stub');
  novaClassifier = { classify: () => ({ group: null }) };
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Logger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const logger = {
  info: (...a) => console.log('[Products]', ...a),
  warn: (...a) => console.warn('[Products WARN]', ...a),
  error: (...a) => console.error('[Products ERROR]', ...a)
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Mocks pour dev offline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const mockProducts = {
  '3017620422003': { 
    _id: '1', 
    barcode: '3017620422003', 
    name: 'Nutella', 
    brand: 'Ferrero', 
    category: 'food',
    imageUrl: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.4.400.jpg',
    ingredients: 'Sucre, huile de palme, noisettes 13%, cacao maigre 7,4%, lait Ã©crÃ©mÃ© en poudre 6,6%, lactoserum en poudre, Ã©mulsifiants: lÃ©cithines (soja), vanilline.',
    nova: 4, 
    additives: ['E322'],
    analysisData: { healthScore: 25, environmentScore: 30, socialScore: 40 } 
  },
  '5000159407236': { 
    _id: '2', 
    barcode: '5000159407236', 
    name: 'Mars', 
    brand: 'Mars', 
    category: 'food',
    imageUrl: 'https://images.openfoodfacts.org/images/products/500/015/940/7236/front_fr.4.400.jpg',
    nova: 4, 
    analysisData: { healthScore: 20 } 
  }
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Helper async â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const handleAsync = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(err => {
  logger.error('Async error:', err); 
  res.status(500).json({ success: false, error: err.message });
});

/* ========== ROUTES ========== */

/* Route par dÃ©faut */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    products: Object.values(mockProducts)
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
      'GET /api/products/barcode/:barcode',
      'POST /api/products/analyze',
      'GET /api/products/:id/alternatives',
      'POST /api/products/:id/report',
      'GET /api/products/:id',
      'POST /api/products'
    ]
  });
});

/* Recherche produits */
router.get('/search', handleAsync(async (req, res) => {
  const { q, category, page = 1, limit = 20 } = req.query;
  logger.info('Search request:', { query: q, category, page, limit });

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'La requÃªte doit contenir au moins 2 caractÃ¨res' });
  }

  // D'abord essayer la vraie base de donnÃ©es
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
      
      return res.json({
        success: true,
        products,
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

  // Fallback sur les donnÃ©es mockÃ©es
  const searchTerm = q.toLowerCase();
  const filteredProducts = Object.values(mockProducts).filter(product =>
    product.name.toLowerCase().includes(searchTerm) ||
    product.brand.toLowerCase().includes(searchTerm) ||
    product.barcode.includes(searchTerm)
  );

  res.json({
    success: true,
    products: filteredProducts,
    pagination: {
      total: filteredProducts.length,
      page: parseInt(page),
      pages: Math.ceil(filteredProducts.length / limit),
      hasNext: false,
      hasPrev: false
    }
  });
}));

/* Produits tendance */
router.get('/trending', handleAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  logger.info('Getting trending products', { limit });

  // Essayer la vraie base de donnÃ©es
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

  // Fallback
  const trendingProducts = [
    { ...mockProducts['3017620422003'], viewCount: 150, scanCount: 45 },
    { ...mockProducts['5000159407236'], viewCount: 200, scanCount: 80 }
  ];

  res.json({ success: true, products: trendingProducts.slice(0, parseInt(limit)) });
}));

/* Recherche par code-barres */
router.get('/barcode/:barcode', handleAsync(async (req, res) => {
  const { barcode } = req.params;
  logger.info('Barcode lookup:', barcode);

  // Essayer la vraie base de donnÃ©es
  if (mongoose.connection.readyState === 1) {
    try {
      const product = await Product.findOne({ barcode });
      if (product) {
        return res.json({ success: true, product });
      }
    } catch (error) {
      logger.error('Database barcode lookup error:', error);
    }
  }

  // Fallback sur mock
  const product = mockProducts[barcode];
  if (product) {
    return res.json({
      success: true,
      product: { 
        ...product, 
        viewCount: Math.floor(Math.random() * 200) + 50, 
        scanCount: Math.floor(Math.random() * 100) + 10 
      }
    });
  }

  res.status(404).json({ success: false, error: 'Produit non trouvÃ©', barcode });
}));

/* Analyse produit */
router.post('/analyze', authenticateUser, handleAsync(async (req, res) => {
  const userId = req.user?._id || req.userId || 'anonymous';
  const { productId, barcode, manualData, category = 'food' } = req.body;
  logger.info('Analysis request:', { userId, productId, barcode, category });

  // VÃ©rifier les quotas
  if (req.user && req.user.quotas && req.user.quotas.scansRemaining <= 0) {
    return res.status(403).json({ 
      success: false, 
      error: 'Quota de scans dÃ©passÃ©', 
      quotas: req.user.quotas 
    });
  }

  /* ---------- 1. Chercher le produit ---------- */
  let product = null;
  if (mongoose.connection.readyState === 1) {
    product = barcode ? await Product.findOne({ barcode }).lean()
             : productId ? await Product.findById(productId).lean()
             : null;
  }
  if (!product) product = mockProducts[barcode] || mockProducts[productId] || null;
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

  /* ---------- 2. Calculs â€“ NOVA, Nutri-Score, Eco-Score ---------- */
  const ingredientsText = product.ingredients || '';
  let novaGroup = product.nova_group || product.foodData?.nova || product.nova || null;
  
  // Calcul automatique du NOVA si absent et ingrÃ©dients disponibles
  if (!novaGroup && ingredientsText.length > 3) {
    try { 
      novaGroup = novaClassifier.classify(ingredientsText, product.name).group; 
    } catch(err) { 
      console.warn('NOVA classification failed:', err.message); 
    }
  }

  const nutriScore = product.nutriscore_grade || product.foodData?.nutriscore || null;
  const ecoScore = product.ecoscore_grade || product.foodData?.ecoscore || null;

  /* ---------- 3. Construction rÃ©sultat ---------- */
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
      ingredients: ingredientsText,
      // Ajout des valeurs numÃ©riques pour dÃ©tergents
      biodegradability: product.detergentData?.biodegradability || null,
      cdv: product.detergentData?.cdv || null
    },
    summary: { 
      fr: generateSummary(novaGroup, nutriScore), 
      en: 'Summary in Englishâ€¦' 
    },
    recommendations: generateRecommendations(novaGroup, nutriScore)
  };

  /* ---------- 4. Sauvegarde Ã©ventuelle ---------- */
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

  /* ---------- 5. RÃ©ponse ---------- */
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

  const alternatives = [
    { 
      id: '3', 
      name: 'PÃ¢te Ã  tartiner bio sans huile de palme', 
      brand: 'Bio Nature', 
      healthScore: 65, 
      environmentScore: 80, 
      improvement: '+40%' 
    },
    { 
      id: '4', 
      name: 'PurÃ©e d\'amandes complÃ¨tes', 
      brand: 'Jean HervÃ©', 
      healthScore: 85, 
      environmentScore: 90, 
      improvement: '+60%' 
    },
    { 
      id: '5', 
      name: 'PÃ¢te Ã  tartiner noisettes bio', 
      brand: 'Mamie Bio', 
      healthScore: 70, 
      environmentScore: 75, 
      improvement: '+45%' 
    }
  ];

  res.json({ 
    success: true, 
    currentProduct: { id, name: 'Produit original', healthScore: 25 }, 
    alternatives 
  });
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
    message: 'Signalement enregistrÃ© avec succÃ¨s', 
    reportId: new Date().getTime().toString() 
  });
}));

/* Obtenir un produit par ID */
router.get('/:id', handleAsync(async (req, res) => {
  const { id } = req.params;
  logger.info('Get product by ID:', id);

  // Essayer la vraie base de donnÃ©es d'abord
  if (mongoose.connection.readyState === 1) {
    try {
      let product = null;
      
      // Si c'est un ObjectId valide
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id);
      }
      
      // Sinon essayer par barcode
      if (!product && /^\d{8,13}$/.test(id)) {
        product = await Product.findOne({ barcode: id });
      }
      
      if (product) {
        return res.json({ success: true, product });
      }
    } catch (error) {
      logger.error('Database product lookup error:', error);
    }
  }

  // Fallback sur mock
  let product = Object.values(mockProducts).find(p => p._id === id) || 
                (/^\d{8,13}$/.test(id) ? mockProducts[id] : null);

  if (product) {
    return res.json({ 
      success: true, 
      product: { 
        ...product, 
        viewCount: Math.floor(Math.random() * 200) + 50 
      } 
    });
  }

  res.status(404).json({ success: false, error: 'Produit non trouvÃ©', id });
}));

/* CrÃ©er un produit manuellement */
router.post('/', authenticateUser, checkPremium, handleAsync(async (req, res) => {
  const { name, brand, category, barcode, specificData } = req.body;
  logger.info('Create product manually:', { name, brand, category });

  if (!name || !category) {
    return res.status(400).json({ 
      success: false, 
      error: 'Le nom et la catÃ©gorie sont requis' 
    });
  }

  if (!['food', 'cosmetics', 'detergents'].includes(category)) {
    return res.status(400).json({ 
      success: false, 
      error: 'CatÃ©gorie invalide. Doit Ãªtre: food, cosmetics, ou detergents' 
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
  if (nova) score += (5 - nova) * 6; // NOVA 1 â†’ +24, NOVA 4 â†’ +6
  if (nutri) score += ({ a: 30, b: 22, c: 15, d: 7, e: 0 }[nutri.toLowerCase()] || 0);
  
  // PÃ©nalitÃ©s basÃ©es sur les donnÃ©es nutritionnelles si disponibles
  if (prod.nutritionFacts) {
    if (prod.nutritionFacts.sugars_100g > 20) score -= 5;
    if (prod.nutritionFacts.saturated_fat_100g > 5) score -= 5;
    if (prod.nutritionFacts.salt_100g > 1.5) score -= 5;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

function generateSummary(nova, nutri) {
  const arr = [];
  if (nova === 4) arr.push('âš ï¸ Produit ultra-transformÃ©.');
  if (nutri && ['d', 'e'].includes(nutri.toLowerCase())) {
    arr.push('âš ï¸ Mauvais Nutri-Score.');
  }
  return arr.join(' ') || 'Analyse complÃ¨te du produit.';
}

function generateRecommendations(nova, nutri) {
  const rec = { 
    healthImpact: 'Ã€ consommer avec modÃ©ration', 
    alternatives: [], 
    advice: [] 
  };
  
  if (nova === 4) { 
    rec.healthImpact = 'Ã€ limiter â€“ ultra-transformÃ©'; 
    rec.advice.push('PrivilÃ©giez des alternatives moins transformÃ©es'); 
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

console.log('[Products] Router crÃ©Ã© avec', router.stack.filter(l => l.route).length, 'routes');

// GET /api/products/search - Recherche de produits
router.get('/search', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 20, category } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    let products = [];
    let total = 0;

    if (q && q.trim()) {
      // Recherche par texte
      query = { $text: { $search: q } };
      if (category) query.category = category;
      
      products = await Product.find(query)
        .select('name brand barcode category imageUrl ingredients nova_group nutriscore_grade')
        .skip(skip)
        .limit(limitNum)
        .lean();
      
      total = await Product.countDocuments(query);
    } else {
      // Sans recherche, retourner les derniers produits
      if (category) query.category = category;
      products = await Product.find(query)
        .sort({ createdAt: -1 })
        .select('name brand barcode category imageUrl ingredients nova_group nutriscore_grade')
        .skip(skip)
        .limit(limitNum)
        .lean();
      
      total = await Product.countDocuments(query);
    }

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum,
          hasNext: pageNum < Math.ceil(total / limitNum),
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche',
      message: error.message
    });
  }
});


module.exports = router;

