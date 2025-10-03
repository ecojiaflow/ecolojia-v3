const express = require('express');
const router = express.Router();
const scoringService = require('../services/scoring.service');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/scoring/:productId - Obtenir les scores d'un produit
router.get('/:productId', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ 
      success: false, 
      error: 'Product not found' 
    });
  }

  const scores = await scoringService.calculateScores(product);
  
  res.json({
    success: true,
    productId,
    productName: product.name,
    scores
  });
}));

// POST /api/scoring/:productId/calculate - Recalculer les scores
router.post('/:productId/calculate', asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ 
      success: false, 
      error: 'Product not found' 
    });
  }

  const enrichedProduct = await scoringService.enrichProductWithScores(product);
  
  res.json({
    success: true,
    message: 'Scores calculated and saved',
    product: enrichedProduct
  });
}));

// POST /api/scoring/calculate-all - Calculer tous les scores (admin)
router.post('/calculate-all', asyncHandler(async (req, res) => {
  const result = await scoringService.calculateAllProductScores();
  
  res.json({
    success: true,
    message: `Scores calculated for ${result.updated} products`,
    result
  });
}));

// GET /api/scoring/barcode/:barcode - Obtenir les scores par code-barres
router.get('/barcode/:barcode', asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  
  const product = await Product.findOne({ barcode });
  if (!product) {
    return res.status(404).json({ 
      success: false, 
      error: 'Product not found' 
    });
  }

  const scores = product.scores || await scoringService.calculateScores(product);
  
  res.json({
    success: true,
    barcode,
    productName: product.name,
    scores
  });
}));

module.exports = router;
