const express = require('express');
const router = express.Router();
const algoliaService = require('../services/algolia/algoliaService');
const { asyncHandler } = require('../middleware');

// GET /api/algolia/search - Recherche via Algolia
router.get('/search', asyncHandler(async (req, res) => {
  const { q = '', category, page = 0, limit = 20 } = req.query;
  
  const filters = category ? `category:${category}` : '';
  const results = await algoliaService.searchProducts(q, {
    filters,
    page: parseInt(page),
    hitsPerPage: parseInt(limit)
  });
  
  res.json({
    success: true,
    data: {
      products: results.hits || [],
      pagination: {
        total: results.nbHits || 0,
        page: results.page || 0,
        pages: results.nbPages || 0,
        limit: parseInt(limit)
      }
    }
  });
}));

// POST /api/algolia/configure - Configurer l'index
router.post('/configure', asyncHandler(async (req, res) => {
  try {
    await algoliaService.configureIndex();
    res.json({ success: true, message: 'Index configuré' });
  } catch (error) {
    console.log('Configuration partielle:', error.message);
    res.json({ 
      success: true, 
      message: 'Index utilisable',
      warning: error.message 
    });
  }
}));

// POST /api/algolia/sync - Synchroniser MongoDB -> Algolia
router.post('/sync', asyncHandler(async (req, res) => {
  const Product = require('../models/Product');
  const products = await Product.find({}).lean();
  
  // Vérifier que le service est configuré
  if (!algoliaService.isConfigured()) {
    return res.status(500).json({ 
      error: 'Service Algolia non configuré',
      details: 'Vérifiez les variables ALGOLIA_APP_ID et ALGOLIA_ADMIN_API_KEY'
    });
  }
  
  // Transformer les produits pour Algolia
  const transformProduct = (product) => ({
    objectID: product._id.toString(),
    title: product.name || '',
    brand: product.brand || '',
    category: product.category || '',
    barcode: product.barcode || '',
    ingredients: product.ingredients?.text || product.ingredients || '',
    healthScore: product.analysisData?.healthScore || 0,
    environmentScore: product.analysisData?.environmentScore || 0,
    novaGroup: product.nova_group || product.nova || 0,
    nutriscoreGrade: product.nutriscore_grade || '',
    imageUrl: product.imageUrl || product.image_url || ''
  });
  
  // Indexer par batch de 100
  const batchSize = 100;
  let totalIndexed = 0;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const transformed = batch.map(transformProduct);
    // Utiliser productsIndex au lieu de index
    await algoliaService.productsIndex.saveObjects(transformed);
    totalIndexed += transformed.length;
    console.log(`Indexé: ${totalIndexed}/${products.length}`);
  }
  
  res.json({ 
    success: true, 
    message: `${totalIndexed} produits synchronisés`,
    total: products.length
  });
}));

// GET /api/algolia/stats - Statistiques de l'index
router.get('/stats', asyncHandler(async (req, res) => {
  // Utiliser la méthode du service
  const stats = await algoliaService.getIndexStats();
  
  if (!stats.configured) {
    return res.status(500).json({ 
      error: 'Service Algolia non configuré' 
    });
  }
  
  res.json({
    success: true,
    totalProducts: stats.entries || 0,
    indexName: algoliaService.indexName,
    stats: stats
  });
}));

module.exports = router;
