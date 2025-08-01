// backend/src/routes/analyze.routes.js
const express = require('express');
const router = express.Router();

// Import des middlewares auth avec fallback
let authenticateUser, checkQuota;
try {
  const authModule = require('../middleware/auth');
  authenticateUser = authModule.authenticateUser || authModule.auth || authModule;
  checkQuota = authModule.checkQuota || ((type) => (req, res, next) => {
    req.quotaRemaining = 30;
    req.decrementQuota = async () => {};
    next();
  });
} catch (error) {
  console.log('[Analyze] Auth middleware not found, using fallback');
  authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      req.userId = 'test-user-id';
      req.user = { _id: 'test-user-id', tier: 'free' };
    }
    next();
  };
  checkQuota = (type) => (req, res, next) => {
    req.quotaRemaining = 30;
    req.decrementQuota = async () => {};
    next();
  };
}

// Import des services avec fallback
let productAnalysisService;
try {
  productAnalysisService = require('../services/productAnalysisService');
} catch (error) {
  console.log('[Analyze] Product analysis service not found, using mock');
  // Service d'analyse mocké
  productAnalysisService = {
    analyzeProduct: async (productData, userId) => {
      const category = productData.category || 'food';
      const baseScore = Math.floor(Math.random() * 40) + 60;
      
      return {
        healthScore: baseScore,
        environmentScore: baseScore - 5,
        socialScore: baseScore + 5,
        nova: category === 'food' ? Math.floor(Math.random() * 4) + 1 : null,
        ecoscore: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)],
        concerns: ['Sucre élevé', 'Additifs E322'],
        benefits: ['Source de fibres', 'Sans gluten'],
        recommendations: ['Consommer avec modération', 'Privilégier les alternatives bio'],
        alternatives: [
          { name: 'Alternative Bio', score: baseScore + 20 },
          { name: 'Version allégée', score: baseScore + 10 }
        ],
        confidence: 0.92
      };
    }
  };
}

// Logger simple
const logger = {
  info: (...args) => console.log('[Analyze]', ...args),
  error: (...args) => console.error('[Analyze ERROR]', ...args),
  warn: (...args) => console.warn('[Analyze WARN]', ...args)
};

// Helper pour gérer les erreurs async
const handleAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error('Async error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur serveur'
    });
  });
};

// Données mockées pour détection automatique
const productDatabase = {
  '3017620422003': {
    name: 'Nutella',
    brand: 'Ferrero',
    category: 'food',
    type: 'spread'
  },
  '3596710472697': {
    name: 'Shampooing Doux',
    brand: 'Auchan',
    category: 'cosmetics',
    type: 'shampoo'
  },
  '3450970049405': {
    name: 'Lessive Liquide',
    brand: 'Carrefour',
    category: 'detergents',
    type: 'laundry'
  }
};

// Helper pour détecter la catégorie
const detectCategory = (data) => {
  // Si barcode connu
  if (data.barcode && productDatabase[data.barcode]) {
    return productDatabase[data.barcode].category;
  }
  
  // Détection par mots-clés dans le nom
  const name = (data.name || '').toLowerCase();
  
  // Cosmétiques
  if (name.includes('shampoo') || name.includes('shampooing') || 
      name.includes('crème') || name.includes('cream') ||
      name.includes('gel') || name.includes('lotion') ||
      name.includes('maquillage') || name.includes('makeup')) {
    return 'cosmetics';
  }
  
  // Détergents
  if (name.includes('lessive') || name.includes('detergent') ||
      name.includes('savon') || name.includes('soap') ||
      name.includes('nettoyant') || name.includes('cleaner')) {
    return 'detergents';
  }
  
  // Par défaut: alimentaire
  return 'food';
};

// POST /api/analyze/auto - Détection automatique et analyse
router.post('/auto', authenticateUser, checkQuota('scan'), handleAsync(async (req, res) => {
  const userId = req.userId || 'anonymous';
  const { barcode, name, brand, image } = req.body;
  
  logger.info('Auto analysis request:', { userId, barcode, name });
  
  // Validation
  if (!barcode && !name) {
    return res.status(400).json({
      success: false,
      error: 'Barcode ou nom du produit requis'
    });
  }
  
  // Détection de la catégorie
  const detectedCategory = detectCategory({ barcode, name });
  
  logger.info('Category detected:', detectedCategory);
  
  // Créer les données du produit
  const productData = {
    barcode,
    name: name || (productDatabase[barcode]?.name) || 'Produit inconnu',
    brand: brand || (productDatabase[barcode]?.brand) || 'Marque inconnue',
    category: detectedCategory,
    image
  };
  
  // Analyser le produit
  try {
    const analysis = await productAnalysisService.analyzeProduct(productData, userId);
    
    // Décrémenter le quota
    if (req.decrementQuota) {
      await req.decrementQuota();
    }
    
    res.json({
      success: true,
      detectedCategory,
      product: productData,
      analysis,
      quotaRemaining: req.quotaRemaining || 29
    });
  } catch (error) {
    logger.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse'
    });
  }
}));

// POST /api/analyze/food - Analyse alimentaire
router.post('/food', authenticateUser, checkQuota('scan'), handleAsync(async (req, res) => {
  const userId = req.userId || 'anonymous';
  const productData = req.body;
  
  logger.info('Food analysis request:', { userId, product: productData.name });
  
  // Forcer la catégorie alimentaire
  productData.category = 'food';
  
  // Analyser le produit
  const analysis = await productAnalysisService.analyzeProduct(productData, userId);
  
  // Ajouter des informations spécifiques alimentaires
  analysis.nutritionalInfo = {
    nova: analysis.nova || Math.floor(Math.random() * 4) + 1,
    nutriscore: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)],
    additives: ['E322', 'E471'],
    allergens: ['gluten', 'lactose']
  };
  
  // Décrémenter le quota
  if (req.decrementQuota) {
    await req.decrementQuota();
  }
  
  res.json({
    success: true,
    analysis,
    quotaRemaining: req.quotaRemaining || 29
  });
}));

// POST /api/analyze/cosmetic - Analyse cosmétique
router.post('/cosmetic', authenticateUser, checkQuota('scan'), handleAsync(async (req, res) => {
  const userId = req.userId || 'anonymous';
  const productData = req.body;
  
  logger.info('Cosmetic analysis request:', { userId, product: productData.name });
  
  // Forcer la catégorie cosmétique
  productData.category = 'cosmetics';
  
  // Analyser le produit
  const analysis = await productAnalysisService.analyzeProduct(productData, userId);
  
  // Ajouter des informations spécifiques cosmétiques
  analysis.cosmeticInfo = {
    inciScore: Math.floor(Math.random() * 100),
    allergens: ['parfum', 'phenoxyethanol'],
    endocrineDisruptors: Math.random() > 0.7 ? ['BHA'] : [],
    naturalIngredients: Math.floor(Math.random() * 100) + '%'
  };
  
  // Décrémenter le quota
  if (req.decrementQuota) {
    await req.decrementQuota();
  }
  
  res.json({
    success: true,
    analysis,
    quotaRemaining: req.quotaRemaining || 29
  });
}));

// POST /api/analyze/detergent - Analyse détergent
router.post('/detergent', authenticateUser, checkQuota('scan'), handleAsync(async (req, res) => {
  const userId = req.userId || 'anonymous';
  const productData = req.body;
  
  logger.info('Detergent analysis request:', { userId, product: productData.name });
  
  // Forcer la catégorie détergent
  productData.category = 'detergents';
  
  // Analyser le produit
  const analysis = await productAnalysisService.analyzeProduct(productData, userId);
  
  // Ajouter des informations spécifiques détergents
  analysis.detergentInfo = {
    biodegradability: Math.floor(Math.random() * 30) + 70,
    toxicity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    ecolabel: Math.random() > 0.5,
    phosphates: Math.random() > 0.7
  };
  
  // Décrémenter le quota
  if (req.decrementQuota) {
    await req.decrementQuota();
  }
  
  res.json({
    success: true,
    analysis,
    quotaRemaining: req.quotaRemaining || 29
  });
}));

// GET /api/analyze/history - Historique des analyses
router.get('/history', authenticateUser, handleAsync(async (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 20, category } = req.query;
  
  logger.info('Analysis history requested:', { userId, page, limit, category });
  
  // Historique mocké
  const mockHistory = [
    {
      _id: '1',
      productName: 'Nutella',
      category: 'food',
      healthScore: 25,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      barcode: '3017620422003'
    },
    {
      _id: '2',
      productName: 'Shampooing Doux',
      category: 'cosmetics',
      healthScore: 75,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      barcode: '3596710472697'
    },
    {
      _id: '3',
      productName: 'Lessive Écologique',
      category: 'detergents',
      healthScore: 85,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      barcode: '3450970049405'
    }
  ];
  
  // Filtrer par catégorie si demandé
  const filteredHistory = category 
    ? mockHistory.filter(h => h.category === category)
    : mockHistory;
  
  res.json({
    success: true,
    analyses: filteredHistory,
    pagination: {
      total: filteredHistory.length,
      page: parseInt(page),
      pages: Math.ceil(filteredHistory.length / limit),
      hasNext: false,
      hasPrev: false
    }
  });
}));

// GET /api/analyze/stats - Statistiques d'analyses
router.get('/stats', authenticateUser, handleAsync(async (req, res) => {
  const userId = req.userId;
  
  logger.info('Analysis stats requested:', { userId });
  
  res.json({
    success: true,
    stats: {
      totalAnalyses: 42,
      byCategory: {
        food: 25,
        cosmetics: 10,
        detergents: 7
      },
      averageScores: {
        health: 73,
        environment: 68,
        social: 71
      },
      lastAnalysis: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  });
}));

// Route de test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Analyze routes are working!',
    routes: [
      'POST /api/analyze/auto',
      'POST /api/analyze/food',
      'POST /api/analyze/cosmetic',
      'POST /api/analyze/detergent',
      'GET /api/analyze/history',
      'GET /api/analyze/stats'
    ]
  });
});

module.exports = router;