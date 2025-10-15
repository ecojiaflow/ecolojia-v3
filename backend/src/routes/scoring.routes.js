const express = require('express');
const router = express.Router();
const scoringUnified = require('../services/scoringUnified');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

// Helper pour convertir Product -> format scoringUnified
function prepareScoringData(product) {
  return {
    novaGroup: product.nova_group || product.foodData?.novaGroup,
    nutriScore: product.nutriscore_grade || product.foodData?.nutriScore,
    ecoScore: product.ecoscore_grade || product.foodData?.ecoScore,
    additives: product.additives_tags || product.foodData?.additives || [],
    labels: product.labels_tags || product.foodData?.labels || [],
    nutriments: product.nutriments || product.foodData?.nutritionalInfo || product.foodData?.nutrition?.per100g || {}
  };
}

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

  const scoringData = prepareScoringData(product);
  const scores = scoringUnified.calculateFoodScores(scoringData);
  
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

  const scoringData = prepareScoringData(product);
  const scores = scoringUnified.calculateFoodScores(scoringData);
  
  product.scores = scores;
  const enrichedProduct = await product.save();
  
  res.json({
    success: true,
    message: 'Scores calculated and saved',
    product: enrichedProduct
  });
}));

// POST /api/scoring/calculate-all - Calculer tous les scores (admin)
router.post('/calculate-all', asyncHandler(async (req, res) => {
  const products = await Product.find({ category: 'food' });
  let updated = 0;
  
  for (const product of products) {
    const scoringData = prepareScoringData(product);
    const scores = scoringUnified.calculateFoodScores(scoringData);
    product.scores = scores;
    await product.save();
    updated++;
  }
  
  const result = { updated };
  
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

  let scores = product.scores;
  if (!scores || !scores.overallScore) {
    const scoringData = prepareScoringData(product);
    scores = scoringUnified.calculateFoodScores(scoringData);
  }
  
  res.json({
    success: true,
    barcode,
    productName: product.name,
    scores
  });
}));


// Route de recalcul forcé
router.post('/:productId/recalculate', async (req, res) => {
  try {
    const { productId } = req.params;
    const Product = require('../models/Product');
    const scoringUnified = require('../services/scoringUnified');
    
    // Trouver le produit
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Préparer les données pour le scoring (format attendu par calculateDataConfidence)
    const scoringData = {
      product_name: product.name || '',
      brands: product.brand || '',
      ingredients_text: product.foodData?.ingredients || '',
      novaGroup: product.foodData?.novaGroup,
      nutriScore: product.foodData?.nutriScore,
      ecoScore: product.foodData?.ecoScore,
      additives: product.foodData?.additives?.map(a => a.code) || [],
      labels: product.foodData?.labels || [],
      categories: product.categories_tags || [],
      packaging: product.packaging || '',
      nutriments: {
        sugars_100g: product.foodData?.nutrition?.per100g?.sugars || product.foodData?.nutritionalInfo?.sugars,
        sugars: product.foodData?.nutrition?.per100g?.sugars || product.foodData?.nutritionalInfo?.sugars,
        'saturated-fat_100g': product.foodData?.nutrition?.per100g?.saturatedFat || product.foodData?.nutritionalInfo?.saturatedFat,
        saturated_fat: product.foodData?.nutrition?.per100g?.saturatedFat || product.foodData?.nutritionalInfo?.saturatedFat,
        salt_100g: product.foodData?.nutrition?.per100g?.salt || product.foodData?.nutritionalInfo?.salt,
        salt: product.foodData?.nutrition?.per100g?.salt || product.foodData?.nutritionalInfo?.salt
      }
    };
    
    console.log('?? Données envoyées au scoring:', JSON.stringify(scoringData, null, 2));
    
    // FORCER le recalcul avec le nouveau système
    const newScores = scoringUnified.calculateFoodScores(scoringData);
    console.log('?? [RESULT] newScores:', JSON.stringify(newScores, null, 2));
    
    // Sauvegarder avec markModified pour les champs imbriqués
    product.scores = newScores;
    product.scoringVersion = newScores.scoringMetadata?.version || '3.1.0';
    product.lastScoreUpdate = new Date();
    
    console.log('?? [DEBUG] AVANT SAVE - product.scores.scoringMetadata:', JSON.stringify(product.scores.scoringMetadata, null, 2));
    console.log('?? [DEBUG] AVANT SAVE - product.scores.dataQualityInfo:', JSON.stringify(product.scores.dataQualityInfo, null, 2));
    
    // CRITIQUE : Forcer Mongoose à détecter les changements dans scores
    product.markModified('scores');
    await product.save();
    
    console.log('?? [DEBUG] APRÈS SAVE - Relecture de la DB...');
    const reloaded = await Product.findById(product._id);
    console.log('?? [DEBUG] APRÈS SAVE - reloaded.scores.scoringMetadata:', JSON.stringify(reloaded.scores.scoringMetadata, null, 2));
    console.log('?? [DEBUG] APRÈS SAVE - reloaded.scores.dataQualityInfo:', JSON.stringify(reloaded.scores.dataQualityInfo, null, 2));
    
    res.json({
      success: true,
      message: 'Score recalculé avec le nouveau système',
      product: product,
      oldVersion: '3.0.0',
      newVersion: newScores.scoringMetadata?.version || '3.1.0'
    });
  } catch (error) {
    console.error('Erreur recalcul:', error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
