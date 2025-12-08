// ═══════════════════════════════════════════════════════════════════
// ECOLOJIA V3.2 - ROUTES API ALTERNATIVES
// ═══════════════════════════════════════════════════════════════════
//
// ENDPOINTS :
// - GET /api/alternatives/health (health check)
// - GET /api/alternatives/barcode/:barcode
// - GET /api/alternatives/:productId
// - GET /api/products/:productId/alternatives (compatibilité frontend)
//
// ⚠️ ORDRE IMPORTANT : Routes spécifiques AVANT routes paramétrées
// ═══════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const alternativesService = require('../services/alternatives.service');

// ═══════════════════════════════════════════════════════════════════
// MIDDLEWARE : Validation ProductID (ObjectID OU Barcode)
// ═══════════════════════════════════════════════════════════════════

function validateProductId(req, res, next) {
  const productId = req.params.productId || req.params.barcode;

  if (!productId) {
    return res.status(400).json({
      success: false,
      error: 'Missing product identifier'
    });
  }

  // Accepter soit ObjectID MongoDB (24 hex) soit Barcode EAN-13 (13 chiffres)
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(productId);
  const isBarcode = /^\d{8,13}$/.test(productId); // EAN-8 à EAN-13

  if (!isObjectId && !isBarcode) {
    return res.status(400).json({
      success: false,
      error: 'Invalid product identifier format',
      message: 'Expected MongoDB ObjectID (24 hex chars) or Barcode (8-13 digits)',
      received: productId
    });
  }

  // Stocker le type pour usage ultérieur
  req.productIdType = isObjectId ? 'objectId' : 'barcode';
  next();
}

// ═══════════════════════════════════════════════════════════════════
// ROUTE 1 : GET /api/alternatives/health (Health Check)
// ⚠️ DOIT ÊTRE EN PREMIER (avant /:productId)
// ═══════════════════════════════════════════════════════════════════

/**
 * Health check de l'API alternatives
 *
 * @route GET /api/alternatives/health
 * @returns {Object} { status: 'ok', config: {...} }
 */
router.get('/alternatives/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'alternatives',
    version: '3.2',
    config: {
      minResultsBeforeAI: alternativesService.CONFIG.MIN_RESULTS_BEFORE_AI,
      maxResults: alternativesService.CONFIG.MAX_RESULTS,
      minScoreImprovement: alternativesService.CONFIG.MIN_SCORE_IMPROVEMENT,
      aiEnabled: alternativesService.CONFIG.ENABLE_AI_FALLBACK
    },
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════════
// ROUTE 2 : GET /api/alternatives/barcode/:barcode
// ⚠️ DOIT ÊTRE AVANT /:productId
// ═══════════════════════════════════════════════════════════════════

/**
 * Recherche alternatives par code-barres (fallback)
 *
 * @route GET /api/alternatives/barcode/:barcode
 * @param {string} barcode - Code-barres du produit (EAN-13, etc.)
 * @returns {Object} { success: true, alternatives: [...] }
 */
router.get('/alternatives/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode || barcode.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Invalid barcode',
        message: 'Le code-barres doit contenir au moins 8 caractères'
      });
    }

    console.log('[ROUTE] GET /api/alternatives/barcode/' + barcode);

    const result = await alternativesService.findAlternatives({
      barcode,
      maxResults: parseInt(req.query.maxResults) || 5
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('[ROUTE] Erreur GET /api/alternatives/barcode/:barcode:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ROUTE 3 : GET /api/alternatives/:productId
// ⚠️ Route paramétrée, doit être APRÈS routes spécifiques
// ═══════════════════════════════════════════════════════════════════

/**
 * Trouve des alternatives pour un produit donné
 *
 * @route GET /api/alternatives/:productId
 * @param {string} productId - ID MongoDB du produit OU Barcode
 * @query {number} [maxResults=5] - Nombre maximum de résultats
 * @query {string} [allergens] - Allergènes à éviter (comma-separated)
 * @query {string} [labels] - Labels souhaités (comma-separated, ex: bio,vegan)
 * @query {number} [maxPrice] - Budget maximum
 * @returns {Object} { success: true, alternatives: [...], source: '...', metrics: {...} }
 */
router.get('/alternatives/:productId', validateProductId, async (req, res) => {
  const startTime = Date.now();

  try {
    const { productId } = req.params;

    // Parser query params
    const maxResults = parseInt(req.query.maxResults) || 5;
    const allergens = req.query.allergens ? req.query.allergens.split(',') : [];
    const labels = req.query.labels ? req.query.labels.split(',') : [];
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;

    // Construire userPreferences
    const userPreferences = {};
    if (allergens.length > 0) userPreferences.allergens = allergens;
    if (labels.length > 0) userPreferences.labels = labels;
    if (maxPrice) userPreferences.maxPrice = maxPrice;

    console.log('[ROUTE] GET /api/alternatives/' + productId + ' (type: ' + req.productIdType + ')');
    console.log('[ROUTE] Params:', { maxResults, allergens, labels, maxPrice });

    // Appeler le service (avec barcode si c'est un barcode)
    const serviceParams = {
      maxResults,
      userPreferences: Object.keys(userPreferences).length > 0 ? userPreferences : null
    };

    if (req.productIdType === 'objectId') {
      serviceParams.productId = productId;
    } else {
      serviceParams.barcode = productId;
    }

    const result = await alternativesService.findAlternatives(serviceParams);

    // Logger métriques
    const altCount = result?.alternatives?.length || 0;
    const source = result?.source || 'unknown';
    const duration = Date.now() - startTime;
    console.log('[ROUTE] ✅ ' + altCount + ' alternatives trouvées (source: ' + source + ', ' + duration + 'ms)');

    // Réponse succès
    res.json({
      success: true,
      ...result,
      meta: {
        requestDuration: duration,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[ROUTE] Erreur GET /api/alternatives/:productId:', error);

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: "Erreur lors de la recherche d'alternatives",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ROUTE 4 : GET /api/products/:productId/alternatives
// Route principale appelée par le frontend
// ═══════════════════════════════════════════════════════════════════

/**
 * Compatibilité avec frontend existant (ProductPage.tsx)
 *
 * @route GET /api/products/:productId/alternatives
 * @param {string} productId - Barcode du produit (ex: 4056489728849)
 * @returns {Array} Liste d'alternatives (format attendu par frontend)
 */
router.get('/products/:productId/alternatives', validateProductId, async (req, res) => {
  try {
    const { productId } = req.params;
    const Product = require('../models/Product');


    console.log('[ROUTE] GET /api/products/' + productId + '/alternatives (type: ' + req.productIdType + ')');

    // CHARGER LE PRODUIT depuis MongoDB
    let product;
    if (req.productIdType === 'objectId') {
      product = await Product.findById(productId).lean();
    } else {
      product = await Product.findOne({ barcode: productId }).lean();
    }

    if (!product) {
      return res.status(404).json([]);
    }


    // Appeler le service avec l'OBJET produit complet
    const result = await alternativesService.findAlternatives({
      product: product,
      maxResults: parseInt(req.query.maxResults) || 5
    });


    // Vérifier que result.alternatives existe
    const alternatives = result?.alternatives || [];
    const source = result?.source || 'unknown';
    console.log('[ROUTE] ✅ ' + alternatives.length + ' alternatives trouvées (source: ' + source + ')');
    
    // Format attendu par le frontend (Array direct)
    res.json(alternatives);

  } catch (error) {
    console.error('[ROUTE] Erreur GET /api/products/:productId/alternatives:', error);
    res.status(500).json([]);
  }
});

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = router;
