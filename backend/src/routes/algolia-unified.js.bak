const express = require('express');
const router = express.Router();
const algoliaService = require('../services/algolia/algoliaService');
const { asyncHandler } = require('../middleware');

// GET /api/algolia/search - avec normalisation complète
router.get('/search', asyncHandler(async (req, res) => {
  const { q = '', category, page = 0, limit = 20 } = req.query;
  
  try {
    const filters = category ? `category:${category}` : '';
    const results = await algoliaService.searchProducts(q, {
      filters,
      page: parseInt(page),
      hitsPerPage: parseInt(limit)
    });
    
    // Normaliser TOUS les champs
    const normalizedProducts = (results.hits || []).map(hit => ({
      _id: hit.objectID || hit._id,
      name: hit.name || hit.title || hit.brand || 'Produit sans nom',
      brand: hit.brand || '',
      category: hit.category || 'food',
      barcode: hit.barcode || '',
      imageUrl: hit.imageUrl || hit.image_url || '/images/default-product.jpg',
      ingredients: {
        text: hit.ingredients || ''
      },
      nova_group: hit.nova_group || hit.novaGroup || null,
      nutriscore_grade: hit.nutriscore_grade || hit.nutriscoreGrade || null,
      analysisData: {
        healthScore: hit.healthScore || 0,
        environmentScore: hit.environmentScore || 0,
        socialScore: hit.socialScore || 0
      },
      scanCount: 0,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
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

// POST /api/algolia/sync - CORRIGÉ pour inclure TOUS les champs
router.post('/sync', asyncHandler(async (req, res) => {
  const Product = require('../models/Product');
  const products = await Product.find({}).lean();
  
  if (!algoliaService.isConfigured()) {
    return res.status(500).json({ error: 'Service Algolia non configuré' });
  }
  
  // Transformation complète avec TOUS les champs
  const transformProduct = (product) => {
    const obj = {
      objectID: product._id.toString(),
      // Dupliquer les champs pour la compatibilité
      name: product.name || '',
      title: product.name || '',
      brand: product.brand || '',
      category: product.category || '',
      barcode: product.barcode || '',
      // Inclure le texte des ingrédients directement
      ingredients: product.ingredients?.text || product.ingredients || '',
      // Scores
      healthScore: product.analysisData?.healthScore || 0,
      environmentScore: product.analysisData?.environmentScore || 0,
      nova_group: product.nova_group || product.nova || 0,
      novaGroup: product.nova_group || product.nova || 0,
      nutriscore_grade: product.nutriscore_grade || '',
      nutriscoreGrade: product.nutriscore_grade || '',
      // Images
      imageUrl: product.imageUrl || product.image_url || product.images?.front || '',
      image_url: product.imageUrl || product.image_url || product.images?.front || ''
    };
    
    // Log pour debug
    if (!obj.name) {
      console.log('⚠️ Produit sans nom:', product._id, product);
    }
    
    return obj;
  };
  
  const batchSize = 100;
  let totalIndexed = 0;
  let productsWithoutName = 0;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const transformed = batch.map(transformProduct);
    
    // Compter les produits sans nom
    productsWithoutName += transformed.filter(p => !p.name).length;
    
    await algoliaService.productsIndex.saveObjects(transformed);
    totalIndexed += transformed.length;
    console.log(`Indexé: ${totalIndexed}/${products.length}`);
  }
  
  res.json({ 
    success: true, 
    message: `${totalIndexed} produits synchronisés`,
    total: products.length,
    warnings: productsWithoutName > 0 ? `${productsWithoutName} produits sans nom` : null
  });
}));

// Les autres routes...
router.post('/configure', asyncHandler(async (req, res) => {
  try {
    await algoliaService.configureIndex();
    res.json({ success: true, message: 'Index configuré' });
  } catch (error) {
    res.json({ success: true, message: 'Index utilisable', warning: error.message });
  }
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
