const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { calculateFoodScores } = require('../services/scoringUnified');

// Helper pour préparer les données de scoring
function prepareScoringData(product) {
  // Convertir objet Mongoose en objet JS simple
  const productObj = product.toObject ? product.toObject() : product;
  const foodData = productObj.foodData || {};
  const nutriments = (foodData && foodData.nutrition && foodData.nutrition.per100g) 
    || (productObj && productObj.nutrition && productObj.nutrition.per100g) 
    || {};
  
  // FORMAT OPENFOODFACTS attendu par calculateFoodScores
  return {
    product_name: productObj.name,
    brands: productObj.brand,
    ingredients_text: foodData.ingredients,
    nova_group: foodData.novaGroup || productObj.nova_group,
    nutriscore_grade: foodData.nutriScore || productObj.nutriscore_grade,
    ecoscore_grade: foodData.ecoScore || productObj.ecoscore_grade,
    additives_tags: foodData.additives || productObj.additives_tags || [],
    labels_tags: foodData.labels || productObj.labels_tags || [],
    nutriments: nutriments
  };
}

/**
 * POST /api/ocr-analyze/:barcode
 * Calcule les scores pour un produit existant
 */
router.post('/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;// 1. Récupérer le produit
    let product = await Product.findOne({ barcode });
    console.log('[OCR-Analyze/:barcode] PRODUCT COMPLET:', JSON.stringify({
      barcode: product?.barcode,
      foodData: product?.foodData,
      nutrition: product?.nutrition
    }, null, 2));
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    // 2. Calculer les scores avec les données existantes
    const scoringData = prepareScoringData(product);
    console.log('[OCR-Analyze/:barcode] prepareScoringData INPUT:', JSON.stringify({
      novaGroup: product.foodData?.novaGroup,
      nutriScore: product.foodData?.nutriScore,
      nutrition: product.nutrition?.per100g
    }, null, 2));const scores = calculateFoodScores(scoringData);console.log('[OCR-Analyze/:barcode] Scores calculated:', {
      overallScore: scores.overallScore,
      confidence: scores.dataQuality?.confidence
    });

    // 3. Enrichir avec IA si confiance < 70%
    if (!scores.overallScore || (scores.dataQuality && scores.dataQuality.confidence < 70)) {try {
        const aiEnrichment = require('../services/aiEnrichment.service');
        product.scores = await aiEnrichment.enrichProductWithAI(product, scores);
      } catch (aiError) {product.scores = scores;
      }
    } else {
      product.scores = scores;
    }

    // 4. Sauvegarder
    product.scores.calculatedAt = new Date();
    product.scores.scoringVersion = '3.0.0';
    product.status = 'analyzed';
    product.updatedAt = new Date();
    await product.save();

    // 5. Synchroniser Algolia
    try {
      const algoliaService = require('../services/algolia.service');
      await algoliaService.indexProduct(product);
    } catch (algoliaError) {
      console.error('[OCR-Analyze/:barcode] Algolia sync failed:', algoliaError.message);
    }res.json({
      success: true,
      product,
      message: 'Analyse terminée avec succès'
    });

  } catch (error) {
    console.error('[OCR-Analyze/:barcode] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;