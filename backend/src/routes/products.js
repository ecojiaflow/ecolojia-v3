const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Middleware de debug pour voir toutes les requêtes
router.use((req, res, next) => {
  console.log(`[Products Router] ${req.method} ${req.originalUrl} - Path: ${req.path}`);
  next();
});

// Import des middlewares auth
let authenticateUser, checkPremium;
try {
  const authModule = require('../middleware/auth');
  authenticateUser = authModule.authenticateUser || authModule.auth || authModule;
  checkPremium = authModule.checkPremium || authModule.requirePremium || (() => (req, res, next) => next());
} catch (error) {
  console.log('[Products] Auth middleware not found, using fallback');
  authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      req.userId = 'test-user-id';
      req.user = { _id: 'test-user-id', tier: 'free' };
    }
    next();
  };
  checkPremium = (req, res, next) => next();
}

// Import des modèles avec fallback
let Product, Analysis;
try {
  Product = require('../models/Product');
} catch (error) {
  console.log('[Products] Product model not found, using mock');
  Product = {
    find: async () => [],
    findOne: async () => null,
    findById: async () => null,
    create: async (data) => ({ ...data, _id: new Date().getTime().toString() }),
    countDocuments: async () => 0
  };
}

try {
  Analysis = require('../models/Analysis');
} catch (error) {
  console.log('[Products] Analysis model not found, using mock');
  Analysis = {
    find: async () => [],
    create: async (data) => ({ ...data, _id: new Date().getTime().toString() })
  };
}

// Logger simple
const logger = {
  info: (...args) => console.log('[Products]', ...args),
  error: (...args) => console.error('[Products ERROR]', ...args),
  warn: (...args) => console.warn('[Products WARN]', ...args)
};

// Données mockées pour tests
const mockProducts = {
  '3017620422003': {
    _id: '1',
    barcode: '3017620422003',
    name: 'Nutella',
    brand: 'Ferrero',
    category: 'food',
    imageUrl: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.4.400.jpg',
    ingredients: 'Sucre, huile de palme, noisettes 13%, cacao maigre 7,4%, lait écrémé en poudre 6,6%, lactoserum en poudre, émulsifiants: lécithines (soja), vanilline.',
    nova: 4,
    additives: ['E322'],
    analysisData: {
      healthScore: 25,
      environmentScore: 30,
      socialScore: 40
    }
  },
  '5000159407236': {
    _id: '2',
    barcode: '5000159407236',
    name: 'Mars',
    brand: 'Mars',
    category: 'food',
    imageUrl: 'https://images.openfoodfacts.org/images/products/500/015/940/7236/front_fr.4.400.jpg',
    nova: 4,
    analysisData: {
      healthScore: 20,
      environmentScore: 25,
      socialScore: 35
    }
  }
};

// Helper pour gérer les erreurs async
const handleAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error('Async error:', error);
    res.status(500).json({ success: false, error: error.message || 'Erreur serveur' });
  });
};

// ✅ NOUVELLE ROUTE PAR DÉFAUT
router.get('/', (req, res) => {
  res.json({
    success: true,
    products: Object.values(mockProducts)
  });
});

// Route de test
router.get('/test', (req, res) => {
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

// GET /api/products/search
router.get('/search', handleAsync(async (req, res) => {
  const { q, category, page = 1, limit = 20 } = req.query;
  logger.info('Search request:', { query: q, category, page, limit });

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'La requête doit contenir au moins 2 caractères' });
  }

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

// GET /api/products/trending
router.get('/trending', handleAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  logger.info('Getting trending products', { limit });

  const trendingProducts = [
    { ...mockProducts['3017620422003'], viewCount: 150, scanCount: 45 },
    { ...mockProducts['5000159407236'], viewCount: 200, scanCount: 80 }
  ];

  res.json({ success: true, products: trendingProducts.slice(0, parseInt(limit)) });
}));

// GET /api/products/barcode/:barcode
router.get('/barcode/:barcode', handleAsync(async (req, res) => {
  const { barcode } = req.params;
  logger.info('Barcode lookup:', barcode);

  const product = mockProducts[barcode];
  if (product) {
    return res.json({
      success: true,
      product: { ...product, viewCount: Math.floor(Math.random() * 200) + 50, scanCount: Math.floor(Math.random() * 100) + 10 }
    });
  }

  res.status(404).json({ success: false, error: 'Produit non trouvé', barcode });
}));

// POST /api/products/analyze
router.post('/analyze', authenticateUser, handleAsync(async (req, res) => {
  const userId = req.userId || req.user?._id || 'anonymous';
  const { productId, barcode, manualData, category = 'food' } = req.body;

  logger.info('Analysis request:', { userId, productId, barcode, category });

  if (req.user && req.user.quotas && req.user.quotas.scansRemaining <= 0) {
    return res.status(403).json({ success: false, error: 'Quota de scans dépassé', quotas: req.user.quotas });
  }

  let product = mockProducts[barcode] || mockProducts[productId] || {
    _id: new Date().getTime().toString(),
    name: manualData?.name || 'Produit inconnu',
    brand: manualData?.brand || 'Marque inconnue',
    category,
    barcode: barcode || 'unknown'
  };

  const analysisResult = {
    healthScore: Math.floor(Math.random() * 40) + 60,
    environmentScore: Math.floor(Math.random() * 40) + 60,
    socialScore: Math.floor(Math.random() * 40) + 60,
    nova: category === 'food' ? Math.floor(Math.random() * 4) + 1 : null,
    concerns: ['Sucre élevé', 'Additifs'],
    benefits: ['Source d\'énergie'],
    recommendations: ['Consommer avec modération'],
    alternatives: [{ name: 'Alternative bio', healthScore: 85, improvement: '+25%' }],
    confidence: 0.85
  };

  res.json({
    success: true,
    product: { ...product, analysisData: analysisResult },
    analysis: { id: new Date().getTime().toString(), results: analysisResult, createdAt: new Date() }
  });
}));

// POST /api/products
router.post('/', authenticateUser, checkPremium, handleAsync(async (req, res) => {
  const { name, brand, category, barcode, specificData } = req.body;
  logger.info('Create product manually:', { name, brand, category });

  if (!name || !category) {
    return res.status(400).json({ success: false, error: 'Le nom et la catégorie sont requis' });
  }

  if (!['food', 'cosmetics', 'detergents'].includes(category)) {
    return res.status(400).json({ success: false, error: 'Catégorie invalide. Doit être: food, cosmetics, ou detergents' });
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

// GET /api/products/:id/alternatives
router.get('/:id/alternatives', handleAsync(async (req, res) => {
  const { id } = req.params;
  logger.info('Get alternatives for product:', id);

  const alternatives = [
    { id: '3', name: 'Pâte à tartiner bio sans huile de palme', brand: 'Bio Nature', healthScore: 65, environmentScore: 80, improvement: '+40%' },
    { id: '4', name: 'Purée d\'amandes complètes', brand: 'Jean Hervé', healthScore: 85, environmentScore: 90, improvement: '+60%' },
    { id: '5', name: 'Pâte à tartiner noisettes bio', brand: 'Mamie Bio', healthScore: 70, environmentScore: 75, improvement: '+45%' }
  ];

  res.json({ success: true, currentProduct: { id, name: 'Produit original', healthScore: 25 }, alternatives });
}));

// POST /api/products/:id/report
router.post('/:id/report', authenticateUser, handleAsync(async (req, res) => {
  const { reason } = req.body;
  const productId = req.params.id;
  const userId = req.userId || req.user?._id || 'anonymous';

  if (!reason) return res.status(400).json({ success: false, error: 'La raison du signalement est requise' });

  res.json({ success: true, message: 'Signalement enregistré avec succès', reportId: new Date().getTime().toString() });
}));

// GET /api/products/:id
router.get('/:id', handleAsync(async (req, res) => {
  const { id } = req.params;
  logger.info('Get product by ID:', id);

  let product = Object.values(mockProducts).find(p => p._id === id) || (/^\d{8,13}$/.test(id) ? mockProducts[id] : null);

  if (product) return res.json({ success: true, product: { ...product, viewCount: Math.floor(Math.random() * 200) + 50 } });

  res.status(404).json({ success: false, error: 'Produit non trouvé', id });
}));

console.log('[Products] Router créé avec', router.stack.filter(l => l.route).length, 'routes');
module.exports = router;
