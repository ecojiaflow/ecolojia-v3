/**
 * aiEnrich.routes.js
 * Route Premium pour enrichissement IA
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const PremiumInsightsService = require('../services/premiumInsights.service');
const { authMiddleware, requirePremium } = require('../middleware/authMiddleware');
const { premiumRateLimit } = require('../middleware/premiumRateLimit.middleware');

const logger = {
  info: (...args) => console.log('[AI-ENRICH-ROUTE]', ...args),
  error: (...args) => console.error('[AI-ENRICH-ROUTE ERROR]', ...args)
};

/**
 * @route   POST /api/ai-enrich/:barcode
 * @desc    Enrichir un produit avec insights IA (Premium uniquement)
 * @access  Premium
 */
router.post('/:barcode', authMiddleware, requirePremium, premiumRateLimit, async (req, res) => {
  const startTime = Date.now();
  const { barcode } = req.params;

  try {
    logger.info(`Enrichissement IA demandé pour: ${barcode} par user: ${req.user?.email}`);

    // 1. Trouver le produit
    let product = await Product.findOne({ barcode }).lean();
    
    if (!product) {
      // Essayer par _id
      product = await Product.findById(barcode).lean();
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé',
        barcode
      });
    }

    // 2. Générer les insights Premium
    const insightsResult = await PremiumInsightsService.generateInsights(product);

    if (!insightsResult.success) {
      return res.status(500).json({
        success: false,
        error: insightsResult.error || 'Erreur génération insights',
        barcode
      });
    }

    // 3. Retourner le produit + insights séparés
    const responseTime = Date.now() - startTime;
    logger.info(`Enrichissement IA terminé pour ${barcode} en ${responseTime}ms`);

    return res.json({
      success: true,
      barcode,
      product: {
        _id: product._id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        subcategory: product.subcategory,
        image_url: product.image_url
      },
      aiEnrichment: {
        version: insightsResult.version,
        generatedAt: insightsResult.generatedAt,
        processingTime: insightsResult.processingTime,
        knownData: insightsResult.knownData,
        estimatedData: insightsResult.estimatedData,
        needsEnrichment: insightsResult.needsEnrichment,
        disclaimer: 'Donnees estimees par IA. Verifiez toujours l etiquette.'
      },
      responseTime
    });

  } catch (error) {
    logger.error(`Erreur enrichissement IA ${barcode}:`, error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/ai-enrich/status
 * @desc    Vérifier si l'utilisateur peut utiliser l'enrichissement IA
 * @access  Authenticated
 */
router.get('/status', authMiddleware, async (req, res) => {
  const isPremium = req.user?.tier === 'premium' || req.user?.plan?.code === 'premium';
  
  return res.json({
    success: true,
    canUseAiEnrich: isPremium,
    tier: req.user?.tier || req.user?.plan?.code || 'free',
    message: isPremium 
      ? 'Enrichissement IA disponible' 
      : 'Fonctionnalité réservée aux membres Premium'
  });
});

module.exports = router;







