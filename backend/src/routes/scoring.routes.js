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

  // 1. Trouver produit par barcode
  const product = await Product.findOne({ barcode });
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Produit introuvable',
      barcode
    });
  }

  console.log(`[AI-ENRICH] Enrichissement IA demandé pour ${product.name} (${barcode})`);

  try {
    // 2. Calculer scores actuels
    // Préparer données format scoringUnified
    const initialScoringData = {
      category: product.category,
      product_name: product.name || '',
      brands: product.brand || '',
      ingredients_text: product.foodData?.ingredients || '',
      novaGroup: product.foodData?.novaGroup,
      nutriScore: product.foodData?.nutriScore,
      ecoScore: product.foodData?.ecoScore,
      additives: product.foodData?.additives || [],
      labels: product.foodData?.labels || [],
      nutriments: {
        sugars_100g: product.foodData?.nutritionalInfo?.sugars,
        'saturated-fat_100g': product.foodData?.nutritionalInfo?.saturatedFat,
        salt_100g: product.foodData?.nutritionalInfo?.salt
      }
    };
    const currentScores = scoringUnified.calculateFoodScores(initialScoringData);

    // 💾 SAUVEGARDER LE SCORE AVANT ENRICHISSEMENT (pour UX delta)
    const scoresBefore = {
      overallScore: currentScores.overallScore,
      healthScore: currentScores.healthScore,
      confidence: currentScores.confidence,
      dataCompleteness: currentScores.dataCompleteness,
      breakdown: currentScores.breakdown
    };
    console.log('[AI-ENRICH] 📊 Score AVANT enrichissement:', {
      score: scoresBefore.overallScore,
      confidence: Math.round(scoresBefore.confidence * 100) + '%',
      completeness: scoresBefore.dataCompleteness
    });
    
    // 3. GARDE-FOUS RENFORCÉS : 4 niveaux de vérification
    
    // Niveau 1 : Données EXCELLENTES + Confidence HAUTE → Refus
    if (currentScores.dataCompleteness === 'Excellente' && currentScores.confidence >= 0.85) {
      console.log('[AI-ENRICH] ❌ REFUS: Données excellentes (confidence: '+ (currentScores.confidence * 100).toFixed(1) + '%)');
      
      // Sauvegarder les scores existants quand même
      await Product.updateOne(
        { _id: product._id },
        {
          $set: {
            'scores.overallScore': currentScores.overallScore,
            'scores.globalScore': currentScores.overallScore,
            'scores.healthScore': currentScores.healthScore,
            'scores.environmentScore': currentScores.environmentScore,
            'scores.confidence': currentScores.confidence,
            'scores.dataCompleteness': currentScores.dataCompleteness,
            'scores.breakdown': currentScores.breakdown,
            'lastScoreUpdate': new Date()
          }
        }
      );
      
      return res.json({
        success: false,
        reason: 'ALREADY_EXCELLENT',
        message: 'Ce produit a déjà des données excellentes et fiables. Enrichissement non nécessaire.',
        product: {
          ...product.toObject(),
          scores: currentScores
        },
        confidence: currentScores.confidence,
        dataCompleteness: currentScores.dataCompleteness
      });
    }
    
    // Niveau 2 : Score ÉLEVÉ + Confidence BONNE → Refus
    if (currentScores.overallScore >= 75 && currentScores.confidence >= 0.8) {
      console.log('[AI-ENRICH] ❌ REFUS: Score élevé (' + currentScores.overallScore + '/100) et confiance bonne (' + (currentScores.confidence * 100).toFixed(1) + '%)');
      
      await Product.updateOne(
        { _id: product._id },
        { $set: {
            'scores.overallScore': currentScores.overallScore,
            'scores.confidence': currentScores.confidence,
            'scores.breakdown': currentScores.breakdown,
            'lastScoreUpdate': new Date()
        }}
      );
      
      return res.json({
        success: false,
        reason: 'HIGH_SCORE',
        message: 'Ce produit a un excellent score (' + currentScores.overallScore + '/100). Enrichissement non nécessaire.',
        product: { ...product.toObject(), scores: currentScores },
        confidence: currentScores.confidence
      });
    }
    
    // Niveau 3 : Rate limiting - Enrichi récemment ? → Refus
    if (product.lastAIEnrichment) {
      const hoursSinceLastEnrich = (Date.now() - new Date(product.lastAIEnrichment).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastEnrich < 24) {
        console.log('[AI-ENRICH] ❌ REFUS: Enrichi il y a ' + hoursSinceLastEnrich.toFixed(1) + 'h (< 24h)');
        return res.json({
          success: false,
          reason: 'RATE_LIMITED',
          message: 'Ce produit a déjà été enrichi récemment. Réessayez dans ' + Math.ceil(24 - hoursSinceLastEnrich) + 'h.',
          product: product.toObject(),
          lastEnrichment: product.lastAIEnrichment
        });
      }
    }
    
    // Niveau 4 : Confidence suffisante (>= 80%) mais pas excellente → Message informatif
    if (currentScores.confidence >= 0.8 && currentScores.confidence < 0.85) {
      console.log('[AI-ENRICH] ⚠️ Confidence bonne mais enrichissement autorisé (' + (currentScores.confidence * 100).toFixed(1) + '%)');
    }
    
    // ✅ SI ON ARRIVE ICI : Enrichissement JUSTIFIÉ
    console.log('[AI-ENRICH] ✅ AUTORISATION: Confidence ' + (currentScores.confidence * 100).toFixed(1) + '%, complétude: ' + currentScores.dataCompleteness);

    // 4. Enrichir avec IA
    const aiEnrichment = require('../services/aiEnrichment.service');
    const enrichedScores = await aiEnrichment.enrichProductWithAI(product, product.category || 'food', { force: true });
      console.log('[DEBUG] enrichedScores:', JSON.stringify(enrichedScores, null, 2));

    // 5. Merger estimations IA dans le produit
      console.log('[DEBUG] Vérification estimations...');
    if (enrichedScores.estimations) {
      console.log('[DEBUG] enrichedScores.estimations:', enrichedScores.estimations);
      const estimations = enrichedScores.estimations;
      
      // Merger selon catégorie
      if (product.category === 'food') {
        if (estimations.sugars !== undefined && estimations.sugars !== null && !isNaN(estimations.sugars)) {
          product.foodData = product.foodData || {};
          product.foodData.nutritionalInfo = product.foodData.nutritionalInfo || {};
          product.foodData.nutritionalInfo.sugars = estimations.sugars;
        }
        if (estimations.saturatedFat !== undefined && estimations.saturatedFat !== null && !isNaN(estimations.saturatedFat)) {
          product.foodData.nutritionalInfo.saturatedFat = estimations.saturatedFat;
        }
        if (estimations.salt !== undefined && estimations.salt !== null && !isNaN(estimations.salt)) {
          product.foodData.nutritionalInfo.salt = estimations.salt;
        }
        if (estimations.novaGroup !== undefined) {
          product.foodData.novaGroup = estimations.novaGroup;
        }
      }

      // Recalculer scores avec données enrichies
      // Préparer les données au format attendu par calculateScores
      const scoringData = {
        category: product.category,
        product_name: product.name || '',
        brands: product.brand || '',
        ingredients_text: product.foodData?.ingredients || '',
        novaGroup: product.foodData?.novaGroup,
        nutriScore: product.foodData?.nutriScore,
        ecoScore: product.foodData?.ecoScore,
        additives: product.foodData?.additives || [],
        labels: product.foodData?.labels || [],
        nutriments: {
          sugars_100g: product.foodData?.nutritionalInfo?.sugars || product.foodData?.nutrition?.per100g?.sugars,
          'saturated-fat_100g': product.foodData?.nutritionalInfo?.saturatedFat || product.foodData?.nutrition?.per100g?.saturatedFat,
          salt_100g: product.foodData?.nutritionalInfo?.salt || product.foodData?.nutrition?.per100g?.salt,
          sugars: product.foodData?.nutritionalInfo?.sugars || product.foodData?.nutrition?.per100g?.sugars,
          saturated_fat: product.foodData?.nutritionalInfo?.saturatedFat || product.foodData?.nutrition?.per100g?.saturatedFat,
          salt: product.foodData?.nutritionalInfo?.salt || product.foodData?.nutrition?.per100g?.salt
        }
      };
      const recalculatedScores = scoringUnified.calculateFoodScores(scoringData);
      console.log('[AI-ENRICH] scoringData envoyé:', JSON.stringify(scoringData, null, 2));
      console.log('[AI-ENRICH] recalculatedScores reçu:', JSON.stringify(recalculatedScores, null, 2));
      product.scores = recalculatedScores;
    } else {
      product.scores = enrichedScores;
    }

    // 6. Sauvegarder EXPLICITEMENT avec updateOne pour forcer la persistence MongoDB
    product.lastScoreUpdate = new Date();
    
    // Logs AVANT sauvegarde
    console.log('[AI-ENRICH] 💾 Tentative sauvegarde scores:', {
      overallScore: product.scores?.overallScore,
      healthScore: product.scores?.healthScore,
      confidence: product.scores?.confidence,
      hasBreakdown: !!product.scores?.breakdown
    });

    // ✅ CORRECTION CRITIQUE : updateOne au lieu de .save()
    const updateResult = await Product.updateOne(
      { _id: product._id },
      {
        $set: {
          'scores.overallScore': product.scores.overallScore,
          'scores.globalScore': product.scores.overallScore, // Alias pour compatibilité
          'scores.healthScore': product.scores.healthScore,
          'scores.environmentScore': product.scores.environmentScore,
          'scores.confidence': product.scores.confidence,
          'scores.dataCompleteness': product.scores.dataCompleteness,
          'scores.breakdown': product.scores.breakdown,
          'lastScoreUpdate': product.lastScoreUpdate,
          'foodData.nutritionalInfo': product.foodData?.nutritionalInfo,
          'foodData.novaGroup': product.foodData?.novaGroup
        }
      }
    );

    console.log('[AI-ENRICH] 💾 Résultat updateOne:', {
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged
    });

    // 7. Recharger le produit depuis la base pour garantir les données fraîches
    const freshProduct = await Product.findById(product._id).lean();

    // Logs APRÈS rechargement
    console.log('[AI-ENRICH] ✅ Produit rechargé - Scores:', {
      overallScore: freshProduct.scores?.overallScore,
      healthScore: freshProduct.scores?.healthScore,
      confidence: freshProduct.scores?.confidence,
      hasBreakdown: !!freshProduct.scores?.breakdown
    });

    console.log(`[AI-ENRICH] Enrichissement réussi - Confiance: ${(enrichedScores.confidence || 0.75) * 100}%`);

    // 8. Retourner produit enrichi avec données fraîches

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
