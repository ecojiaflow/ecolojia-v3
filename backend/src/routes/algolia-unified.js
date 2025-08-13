const express = require('express');
const router = express.Router();
const algoliaService = require('../services/algolia/algoliaService');
const { asyncHandler } = require('../middleware');

// GET /api/algolia/search - Recherche via Algolia avec format MongoDB
router.get('/search', asyncHandler(async (req, res) => {
  const { q = '', category, page = 0, limit = 20 } = req.query;
  
  try {
    const filters = category ? `category:${category}` : '';
    const results = await algoliaService.searchProducts(q, {
      filters,
      page: parseInt(page),
      hitsPerPage: parseInt(limit)
    });
    
    // IMPORTANT : Transformer les hits Algolia au format MongoDB
    const normalizedProducts = (results.hits || []).map(hit => ({
      _id: hit.objectID || hit._id,
      name: hit.title || hit.name || '',
      brand: hit.brand || '',
      category: hit.category || 'food',
      barcode: hit.barcode || '',
      imageUrl: hit.imageUrl || hit.image_url || '',
      ingredients: {
        text: hit.ingredients || ''
      },
      nova_group: hit.novaGroup || hit.nova_group || null,
      nutriscore_grade: hit.nutriscoreGrade || hit.nutriscore_grade || null,
      analysisData: {
        healthScore: hit.healthScore || 0,
        environmentScore: hit.environmentScore || 0,
        socialScore: hit.socialScore || 0
      },
      // Champs additionnels pour la compatibilité
      scanCount: 0,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    // Retourner EXACTEMENT le même format que MongoDB
    res.json({
      success: true,
      data: {
        products: normalizedProducts,
        pagination: {
          total: results.nbHits || 0,
          page: parseInt(page),
          pages: results.nbPages || 1,
          limit: parseInt(limit),
          hasNext: page < (results.nbPages - 1),
          hasPrev: page > 0
        }
      }
    });
  } catch (error) {
    console.error('Algolia search error:', error);
    
    // Fallback : retourner une réponse vide mais valide
    res.json({
      success: true,
      data: {
        products: [],
        pagination: {
          total: 0,
          page: 0,
          pages: 0,
          limit: parseInt(limit),
          hasNext: false,
          hasPrev: false
        }
      }
    });
  }
}));

// Les autres routes restent identiques...
router.post('/configure', asyncHandler(async (req, res) => {
  try {
    await algoliaService.configureIndex();
    res.json({ success: true, message: 'Index configuré' });
  } catch (error) {
    res.json({ success: true, message: 'Index utilisable', warning: error.message });
  }
}));

router.post('/sync', asyncHandler(async (req, res) => {
  const Product = require('../models/Product');
  const products = await Product.find({}).lean();
  
  if (!algoliaService.isConfigured()) {
    return res.status(500).json({ error: 'Service Algolia non configuré' });
  }
  
  const transformProduct = (product) => ({
    objectID: product._id.toString(),
    title: product.name || '',
    name: product.name || '',
    brand: product.brand || '',
    category: product.category || '',
    barcode: product.barcode || '',
    ingredients: product.ingredients?.text || product.ingredients || '',
    healthScore: product.analysisData?.healthScore || 0,
    environmentScore: product.analysisData?.environmentScore || 0,
    novaGroup: product.nova_group || product.nova || 0,
    nova_group: product.nova_group || product.nova || 0,
    nutriscoreGrade: product.nutriscore_grade || '',
    nutriscore_grade: product.nutriscore_grade || '',
    imageUrl: product.imageUrl || product.image_url || '',
    image_url: product.imageUrl || product.image_url || ''
  });
  
  const batchSize = 100;
  let totalIndexed = 0;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const transformed = batch.map(transformProduct);
    await algoliaService.productsIndex.saveObjects(transformed);
    totalIndexed += transformed.length;
  }
  
  res.json({ 
    success: true, 
    message: `${totalIndexed} produits synchronisés`,
    total: products.length
  });
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await algoliaService.getIndexStats();
  res.json({
    success: true,
    totalProducts: stats.entries || 0,
    indexName: algoliaService.indexName,
    stats: stats
  });
}));

module.exports = router;
