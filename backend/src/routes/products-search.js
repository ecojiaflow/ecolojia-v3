/**
 * ECOLOJIA — Search Routes V1.0.0
 * Remplace l ancien products-search.js
 * @version 1.0.0
 * @date 2026-01-03
 */

const express = require('express');
const router = express.Router();
const searchService = require('../services/search.service');

router.get('/', async (req, res) => {
  try {
    const { q, limit, skip, category, sort } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le parametre "q" est requis',
        products: [],
        total: 0
      });
    }

    const results = await searchService.searchProducts(q, {
      limit: parseInt(limit) || 20,
      skip: parseInt(skip) || 0,
      categoryType: category || null,
      sortBy: sort || 'relevance'
    });

    if (results.error) {
      return res.status(400).json({
        success: false,
        error: results.error,
        products: [],
        total: 0
      });
    }

    res.json({
      success: true,
      query: results.query,
      method: results.method,
      total: results.total,
      count: results.products.length,
      products: results.products
    });

  } catch (error) {
    console.error('[Search Route] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche',
      products: [],
      total: 0
    });
  }
});

router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        error: 'Code-barres requis'
      });
    }

    const product = await searchService.searchByBarcode(barcode);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouve',
        barcode
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('[Search Route] Barcode error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche'
    });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const suggestions = await searchService.getSuggestions(
      q.trim(),
      parseInt(limit) || 10
    );

    res.json({
      success: true,
      query: q.trim(),
      suggestions
    });

  } catch (error) {
    console.error('[Search Route] Suggestions error:', error.message);
    res.json({
      success: true,
      suggestions: []
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    const hasTextIndex = await searchService.checkTextIndex();

    res.json({
      success: true,
      textIndexAvailable: hasTextIndex,
      config: {
        maxLimit: searchService.SEARCH_CONFIG.MAX_LIMIT,
        minQueryLength: searchService.SEARCH_CONFIG.MIN_QUERY_LENGTH
      }
    });

  } catch (error) {
    console.error('[Search Route] Status error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la verification'
    });
  }
});

router.post('/ensure-index', async (req, res) => {
  try {
    const result = await searchService.ensureTextIndex();

    res.json({
      success: result,
      message: result 
        ? 'Index text disponible' 
        : 'Erreur lors de la creation de l index'
    });

  } catch (error) {
    console.error('[Search Route] Ensure index error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la creation de l index'
    });
  }
});

module.exports = router;
