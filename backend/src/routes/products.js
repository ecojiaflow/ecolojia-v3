// backend/src/routes/products.js
const express = require('express');
const router = express.Router();
const { authenticateUser, checkPremium } = require('../middleware/auth');
const Product = require('../models/Product');
const Analysis = require('../models/Analysis');

// Logger simple
const logger = {
  info: (...args) => console.log('[ProductRoutes]', ...args),
  error: (...args) => console.error('[ProductRoutes ERROR]', ...args),
  warn: (...args) => console.warn('[ProductRoutes WARN]', ...args)
};

// GET /api/products/search - Recherche de produits
router.get('/search', async (req, res) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 2 characters'
      });
    }
    
    logger.info('Product search', { query: q, category });
    
    // Pour l'instant, retourner des données mockées
    // TODO: Implémenter la vraie recherche quand MongoDB sera configuré
    const mockProducts = [
      {
        _id: '1',
        name: 'Nutella',
        brand: 'Ferrero',
        barcode: '3017620422003',
        category: 'food',
        imageUrl: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.4.400.jpg',
        analysisData: {
          healthScore: 25
        }
      }
    ];
    
    res.json({
      success: true,
      products: mockProducts,
      pagination: {
        total: 1,
        page: parseInt(page),
        pages: 1,
        hasNext: false,
        hasPrev: false
      }
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/products/trending - Produits populaires
router.get('/trending', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    logger.info('Getting trending products', { category, limit });
    
    // Données mockées pour l'instant
    const trendingProducts = [
      {
        _id: '1',
        name: 'Nutella',
        brand: 'Ferrero',
        imageUrl: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.4.400.jpg',
        category: 'food',
        analysisData: { healthScore: 25 },
        viewCount: 150,
        scanCount: 45
      },
      {
        _id: '2',
        name: 'Coca-Cola',
        brand: 'The Coca-Cola Company',
        imageUrl: 'https://images.openfoodfacts.org/images/products/544/900/000/0996/front_fr.4.400.jpg',
        category: 'food',
        analysisData: { healthScore: 15 },
        viewCount: 200,
        scanCount: 80
      }
    ];
    
    res.json({
      success: true,
      products: trendingProducts
    });
  } catch (error) {
    logger.error('Trending error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/products/barcode/:barcode - Recherche par code-barres
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    
    logger.info('Barcode lookup', { barcode });
    
    // Mock pour Nutella
    if (barcode === '3017620422003') {
      const product = {
        _id: '1',
        barcode: '3017620422003',
        name: 'Nutella',
        brand: 'Ferrero',
        category: 'food',
        imageUrl: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.4.400.jpg',
        viewCount: 150,
        scanCount: 45,
        analysisData: {
          healthScore: 25,
          environmentScore: 30,
          socialScore: 40
        }
      };
      
      return res.json({
        success: true,
        product
      });
    }
    
    // Produit non trouvé
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  } catch (error) {
    logger.error('Barcode lookup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/products/analyze - Analyser un produit
router.post('/analyze', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    const { productId, barcode, manualData, category = 'food' } = req.body;
    
    logger.info('Product analysis request', { userId, productId, barcode, category });
    
    // Vérifier les quotas basiques
    const user = req.user;
    if (user && user.quotas && user.quotas.scansRemaining <= 0) {
      return res.status(403).json({
        success: false,
        error: 'Quota exceeded',
        quotas: user.quotas
      });
    }
    
    // Analyse mockée
    const analysisResult = {
      healthScore: Math.floor(Math.random() * 40) + 60,
      environmentScore: Math.floor(Math.random() * 40) + 60,
      socialScore: Math.floor(Math.random() * 40) + 60,
      concerns: ['Sucre élevé', 'Additifs'],
      benefits: ['Source d\'énergie'],
      recommendations: ['Consommer avec modération'],
      confidence: 0.85
    };
    
    // Créer une analyse mockée
    const analysis = {
      _id: new Date().getTime().toString(),
      userId,
      productId: productId || '1',
      results: analysisResult,
      createdAt: new Date()
    };
    
    res.json({
      success: true,
      product: {
        _id: productId || '1',
        name: 'Produit analysé',
        analysisData: analysisResult
      },
      analysis: {
        id: analysis._id,
        results: analysisResult,
        createdAt: analysis.createdAt
      }
    });
  } catch (error) {
    logger.error('Analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/products/:id - Détails d'un produit
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data
    if (id === '1') {
      const product = {
        _id: '1',
        name: 'Nutella',
        brand: 'Ferrero',
        barcode: '3017620422003',
        category: 'food',
        imageUrl: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.4.400.jpg',
        viewCount: 151,
        analysisData: {
          healthScore: 25,
          environmentScore: 30,
          socialScore: 40
        }
      };
      
      return res.json({
        success: true,
        product
      });
    }
    
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/products/:id/report - Signaler un problème sur un produit
router.post('/:id/report', authenticateUser, async (req, res) => {
  try {
    const { reason, description } = req.body;
    const productId = req.params.id;
    const userId = req.userId || req.user?._id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Report reason is required'
      });
    }
    
    logger.info('Product reported', { productId, userId, reason });
    
    res.json({
      success: true,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    logger.error('Report error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/products/:id/alternatives - Alternatives plus saines
router.get('/:id/alternatives', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Mock alternatives
    const alternatives = [
      {
        id: '2',
        name: 'Pâte à tartiner bio sans huile de palme',
        brand: 'Bio Nature',
        imageUrl: 'https://via.placeholder.com/150',
        healthScore: 65,
        improvement: 40
      },
      {
        id: '3',
        name: 'Purée d\'amandes complètes',
        brand: 'Jean Hervé',
        imageUrl: 'https://via.placeholder.com/150',
        healthScore: 85,
        improvement: 60
      }
    ];
    
    res.json({
      success: true,
      currentProduct: {
        id: productId,
        name: 'Nutella',
        healthScore: 25
      },
      alternatives
    });
  } catch (error) {
    logger.error('Alternatives error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/products - Créer un produit manuellement (premium)
router.post('/', authenticateUser, checkPremium, async (req, res) => {
  try {
    const { name, brand, category, barcode, specificData } = req.body;
    
    // Validation
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: 'Name and category are required'
      });
    }
    
    if (!['food', 'cosmetics', 'detergents'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category. Must be: food, cosmetics, or detergents'
      });
    }
    
    // Créer un produit mocké
    const product = {
      _id: new Date().getTime().toString(),
      name,
      brand,
      category,
      barcode,
      viewCount: 0,
      scanCount: 0,
      createdAt: new Date()
    };
    
    logger.info('Product created manually', { 
      productId: product._id, 
      name, 
      category,
      userId: req.userId 
    });
    
    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;