const express = require('express');
const router = express.Router();
const scoringUnified = require('../services/scoringUnified');
const DataNormalizer = require('../services/DataNormalizer');
const ScoringEngineV3 = require('../services/ScoringEngineV3');
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

// POST /api/scoring/calculate-all - Recalculer TOUS les produits (TOUTES catégories)
router.post('/calculate-all', asyncHandler(async (req, res) => {
  console.log('[BATCH] 🚀 Début recalcul complet de la base...');
  
  const startTime = Date.now();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const errors = [];
  
  try {
    // Récupérer TOUS les produits (food + cosmetics + detergents)
    const products = await Product.find({});
    const total = products.length;
    
    console.log(`[BATCH] 📊 ${total} produits à traiter`);
    
    // Traiter un par un (pas de batch pour éviter surcharge mémoire)
    for (const product of products) {
      try {
        processed++;
        
        // NOUVELLE ARCHITECTURE : Normaliser + Scorer
        const normalized = DataNormalizer.normalizeProduct(product.toObject ? product.toObject() : product, 'DATABASE');
        const scoringResult = ScoringEngineV3.calculateScore(normalized);
        
        // Vérifier si on peut scorer
        if (!scoringResult.canScore) {
          failed++;
          errors.push({
            barcode: product.barcode,
            name: product.name,
            error: 'Données insuffisantes pour calculer un score'
          });
          continue;
        }
        
        // Préparer l'objet scores pour MongoDB
        const scores = {
          globalScore: scoringResult.overallScore,
          overallScore: scoringResult.overallScore,
          healthScore: Math.round(scoringResult.overallScore), // Pour compatibilité
          environmentScore: null, // À calculer séparément si besoin
          confidence: scoringResult.confidence, // Déjà normalisé 0-1
          dataCompleteness: scoringResult.completenessLevel,
          breakdown: scoringResult.breakdown,
          scoringMetadata: scoringResult.metadata,
          calculatedAt: new Date()
        };
        
        // Sauvegarder avec updateOne explicite
        await Product.updateOne(
          { _id: product._id },
          {
            $set: {
              'scores.globalScore': scores.globalScore,
              'scores.overallScore': scores.overallScore,
              'scores.healthScore': scores.healthScore,
              'scores.environmentScore': scores.environmentScore,
              'scores.confidence': scores.confidence,
              'scores.dataCompleteness': scores.dataCompleteness,
              'scores.breakdown': scores.breakdown,
              'scores.scoringMetadata': scores.scoringMetadata,
              'scores.calculatedAt': new Date(),
              'lastScoreUpdate': new Date()
            }
          }
        );
        
        succeeded++;
        
        // Log progression tous les 100 produits
        if (processed % 100 === 0) {
          const percent = Math.round(processed/total*100);
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          const eta = Math.round((elapsed / processed) * (total - processed));
          console.log(`[BATCH] ⏳ ${processed}/${total} (${percent}%) - ETA: ${eta}s`);
        }
        
      } catch (error) {
        failed++;
        errors.push({
          barcode: product.barcode,
          name: product.name,
          error: error.message
        });
        
        if (errors.length <= 10) {
          console.error(`[BATCH] ❌ Erreur sur ${product.barcode}:`, error.message);
        }
      }
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`[BATCH] ✅ Terminé en ${duration}s`);
    console.log(`[BATCH] 📊 Traités: ${processed} | Succès: ${succeeded} | Échecs: ${failed}`);
    
    res.json({
      success: true,
      message: 'Recalcul batch terminé',
      stats: {
        total: processed,
        succeeded,
        failed,
        duration: `${duration}s`,
        errorsCount: errors.length,
        firstErrors: errors.slice(0, 10)
      }
    });
    
  } catch (error) {
    console.error('[BATCH] ❌ Erreur critique:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      processed,
      succeeded,
      failed
    });
  }
}));

// GET /api/scoring/barcode/:barcode - Obtenir les scores par code-barres
router.get('/barcode/:barcode', asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  
  const product = await Product.findOne({ barcode }).lean();
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

// POST /api/scoring/:productId/recalculate - Recalculer avec nouveau système
router.post('/:productId/recalculate', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }
    
    console.log('⚡ [DEBUG] Recalcul avec ScoringEngineV3...');
    
    // ÉTAPE 1 : Normaliser
    const rawData = product.toObject();
    const normalized = DataNormalizer.normalizeProduct(rawData, 'DATABASE');
    console.log('✅ [DEBUG] Normalized:', JSON.stringify(normalized, null, 2));
    
    // ÉTAPE 2 : Scorer
    const newScores = ScoringEngineV3.calculateScore(normalized);
    console.log('✅ [DEBUG] New scores:', JSON.stringify(newScores, null, 2));
    
    // ÉTAPE 3 : Sauvegarder dans MongoDB
    product.scores = newScores;
    product.scoringVersion = newScores.scoringMetadata?.version || '3.1.0';
    product.lastScoreUpdate = new Date();
    console.log('⏳ [DEBUG] AVANT SAVE - product.scores.scoringMetadata:', JSON.stringify(product.scores.scoringMetadata, null, 2));
    console.log('⏳ [DEBUG] AVANT SAVE - product.scores.dataQualityInfo:', JSON.stringify(product.scores.dataQualityInfo, null, 2));
    
    // FIX : Utiliser updateOne avec $set explicite pour forcer MongoDB
    await Product.updateOne(
      { _id: product._id },
      {
        $set: {
          'scores.overallScore': newScores.overallScore,
          'scores.healthScore': newScores.healthScore,
          'scores.environmentScore': newScores.environmentScore,
          'scores.confidence': newScores.confidence,
          'scores.dataCompleteness': newScores.dataCompleteness,
          'scores.breakdown': newScores.breakdown,
          'scores.scoringMetadata': newScores.scoringMetadata,
          'scores.dataQualityInfo': newScores.dataQualityInfo,
          'scores.missingData': newScores.missingData,
          'scores.calculatedAt': new Date(),
          'scoringVersion': newScores.scoringMetadata?.version || '3.1.0',
          'lastScoreUpdate': new Date()
        }
      }
    );
    
    console.log('✅ [DEBUG] APRÈS SAVE - Relecture de la DB...');
    const reloaded = await Product.findById(product._id);
    console.log('✅ [DEBUG] APRÈS SAVE - reloaded.scores.scoringMetadata:', JSON.stringify(reloaded.scores.scoringMetadata, null, 2));
    console.log('✅ [DEBUG] APRÈS SAVE - reloaded.scores.dataQualityInfo:', JSON.stringify(reloaded.scores.dataQualityInfo, null, 2));
    
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


// POST /api/scoring/:barcode/ai-enrich - Enrichir avec IA et recalculer scores
router.post('/:barcode/ai-enrich', asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  console.log(`[AI-ENRICH] Enrichissement IA demandé pour barcode: ${barcode}`);

  // 1. Trouver produit
  const product = await Product.findOne({ barcode }).lean();
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Produit introuvable',
      barcode
    });
  }

  try {
    // 2. Enrichir avec IA (le service fait TOUT : enrichir + scorer + sauvegarder)
    const aiEnrichment = require('../services/aiEnrichment.service');
    await aiEnrichment.enrichProductWithAI(product, product.category || 'food', { force: true });

    // 3. Recharger le produit depuis la base (pour avoir les scores frais)
    const freshProduct = await Product.findById(product._id).lean();

    console.log(`[AI-ENRICH] ✅ Enrichissement réussi - Score: ${freshProduct.scores?.overallScore}/100`);

    // 4. Retourner le produit enrichi
    res.json({
      success: true,
      product: freshProduct,
      scores: freshProduct.scores
    });

  } catch (error) {
    console.error('[AI-ENRICH] Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur enrichissement IA',
      details: error.message
    });
  }
}));

module.exports = router;
