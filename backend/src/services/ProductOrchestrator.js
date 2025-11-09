// === ECOLOJIA V3 - Product Orchestrator ===
// Gère l'obtention complète d'un produit avec :
// - Fetch depuis OFF ou DB
// - Gère enrichissement automatique et cache IA
// - Scoring unifié
// CORRECTION CRITIQUE : Support dual format barcode (STRING ou OBJET)

const mongoose = require('mongoose');
const Product = require('../models/Product');
const ScoringEngineV3 = require('./ScoringEngineV3');
const DataNormalizer = require('./DataNormalizer');
const logger = require('../utils/logger');
const offClient = require('./offClient');
const aiEnrichment = require('./aiEnrichment.service');
const visionService = require('./vision/VisionService');

// ============================================================================
// FONCTION UTILITAIRE : DÉTECTION PRODUIT INCOMPLET (ENRICHISSEMENT IA AUTO)
// ============================================================================

/**
 * Détermine si un produit nécessite un enrichissement IA automatique.
 * 
 * Critères de déclenchement (ordre de priorité) :
 * 1. Scoring impossible (canScore = false)
 * 2. Confiance scoring très faible (< 70%)
 * 3. Confiance scoring moyenne (70-85%) ET données incomplètes
 * 4. Complétude faible ou moyenne
 * 5. Score global bas (< 60) dû à des données manquantes
 * 
 * @param {Object} scoringResult - Résultat du scoring initial
 * @param {Object} normalizedProduct - Produit normalisé
 * @param {Object} existingProduct - Produit en base (si existe)
 * @returns {Object} { shouldEnrich: boolean, reasons: string[] }
 */
function shouldEnrichProduct(scoringResult, normalizedProduct, existingProduct = null) {
  const reasons = [];
  
  // ============================================================================
  // CAS 1 : Scoring impossible (CRITIQUE)
  // ============================================================================
  
  if (!scoringResult.canScore) {
    reasons.push('Scoring impossible (canScore = false)');
    return { 
      shouldEnrich: true, 
      reasons,
      priority: 'CRITICAL',
      estimatedImprovement: '+40 points'
    };
  }
  
  // ============================================================================
  // CAS 2 : Confiance très faible (< 70%)
  // ============================================================================
  
  if (scoringResult.confidence < 70) {
    reasons.push(`Confiance très faible (${scoringResult.confidence}% < 70%)`);
    
    // Identifier les composantes manquantes
    const missing = scoringResult.missingComponents || [];
    if (missing.length > 0) {
      reasons.push(`${missing.length} composante(s) manquante(s): ${missing.slice(0, 3).join(', ')}`);
    }
    
    return { 
      shouldEnrich: true, 
      reasons,
      priority: 'HIGH',
      estimatedImprovement: '+30 points'
    };
  }
  
  // ============================================================================
  // CAS 3 : Confiance moyenne (70-85%) + Complétude faible/moyenne
  // ============================================================================
  
  if (scoringResult.confidence >= 70 && scoringResult.confidence < 85) {
    const completeness = scoringResult.dataCompleteness || 
                        existingProduct?.scores?.dataCompleteness || 
                        'Inconnue';
    
    if (completeness === 'Faible' || completeness === 'Moyenne') {
      reasons.push(`Confiance moyenne (${scoringResult.confidence}%)`);
      reasons.push(`Complétude: ${completeness}`);
      
      return { 
        shouldEnrich: true, 
        reasons,
        priority: 'MEDIUM',
        estimatedImprovement: '+15 points'
      };
    }
  }
  
  // ============================================================================
  // CAS 4 : Score global bas (< 60) + Données nutritionnelles manquantes
  // ============================================================================
  
  const currentScore = scoringResult.overallScore || 
                       existingProduct?.scores?.overallScore || 
                       0;
  
  if (currentScore < 60) {
    // Vérifier si c'est dû à des données manquantes (pas un mauvais produit)
    const hasNutrition = normalizedProduct.nutritionalInfo && 
                        Object.keys(normalizedProduct.nutritionalInfo).length > 3;
    
    const hasIngredients = normalizedProduct.ingredients && 
                          normalizedProduct.ingredients.length > 0;
    
    if (!hasNutrition || !hasIngredients) {
      reasons.push(`Score bas (${currentScore}/100) dû à données manquantes`);
      
      if (!hasNutrition) {
        reasons.push('Informations nutritionnelles absentes');
      }
      if (!hasIngredients) {
        reasons.push('Liste ingrédients absente');
      }
      
      return { 
        shouldEnrich: true, 
        reasons,
        priority: 'MEDIUM',
        estimatedImprovement: '+20 points'
      };
    }
  }
  
  // ============================================================================
  // CAS 5 : Produit existant avec dataCompleteness = 'Faible'
  // ============================================================================
  
  if (existingProduct?.scores?.dataCompleteness === 'Faible') {
    reasons.push('Produit en base avec complétude "Faible"');
    
    return { 
      shouldEnrich: true, 
      reasons,
      priority: 'LOW',
      estimatedImprovement: '+10 points'
    };
  }
  
  // ============================================================================
  // CAS 6 : Pas d'enrichissement nécessaire
  // ============================================================================
  
  return { 
    shouldEnrich: false, 
    reasons: [
      `Confiance: ${scoringResult.confidence}% (≥85%)`,
      `Score: ${currentScore}/100 (≥60)`,
      'Données suffisantes pour scoring fiable'
    ],
    priority: 'NONE'
  };
}

// ============================================================================
// FONCTION PRINCIPALE : GET PRODUCT
// ============================================================================

/**
 * Point d'entrée unique pour obtenir un produit (avec enrichissement IA si nécessaire)
 * SUPPORT DUAL FORMAT : barcode en string OU objet { barcode, source }
 */
async function getProductByBarcode(barcodeOrOptions, options = {}) {
  try {
    // ============================================================================
    // RÉTROCOMPATIBILITÉ : Accepter STRING ou OBJET
    // ============================================================================
    
    let barcode;
    let source = options.source || 'OFF';
    
    if (typeof barcodeOrOptions === 'string') {
      // Format moderne : getProductByBarcode('3017620422003', { source: 'OFF' })
      barcode = barcodeOrOptions;
    } else if (typeof barcodeOrOptions === 'object' && barcodeOrOptions !== null && barcodeOrOptions.barcode) {
      // Format legacy : getProductByBarcode({ barcode: '3017620422003', source: 'OFF' })
      barcode = barcodeOrOptions.barcode;
      source = barcodeOrOptions.source || 'OFF';
      
      // Fusionner les options de l'objet avec les options passées
      options = { ...barcodeOrOptions, ...options };
      
      console.log('[Orchestrator] ⚠️  Format legacy détecté - Migration recommandée vers string');
    } else {
      throw new Error('Invalid barcode parameter: must be string or object with barcode property');
    }
    
    console.log(`\n[Orchestrator] 🔍 Recherche produit: ${barcode}`);

    // ============================================================================
    // ÉTAPE 1 : Vérifier si produit existe en base
    // ============================================================================

    let product = await Product.findOne({ barcode }).lean();

    if (product) {
      console.log('[Orchestrator] ✅ Produit trouvé en base MongoDB');
      
      // Vérifier si le produit en base nécessite un enrichissement
      const existingScore = product.scores?.overallScore || 0;
      const existingCompleteness = product.scores?.dataCompleteness || 'Inconnue';
      
      console.log(`[Orchestrator] 📊 Score actuel: ${existingScore}/100, Complétude: ${existingCompleteness}`);
      
      // Si produit complet et récent (< 30 jours), le retourner directement
      const ageInDays = product.scores?.calculatedAt 
        ? (Date.now() - new Date(product.scores.calculatedAt).getTime()) / (1000 * 60 * 60 * 24)
        : 999;
      
      if (existingScore >= 60 && existingCompleteness === 'Excellente' && ageInDays < 30) {
        console.log('[Orchestrator] ✅ Produit complet et récent - Retour direct');
        return {
          product,
          source: 'db_complete',
          cached: true
        };
      }
    }

    // ============================================================================
    // ÉTAPE 2 : Fetch depuis Open Food Facts
    // ============================================================================

    console.log('[Orchestrator] 🌐 Tentative fetch Open Food Facts...');

    let offData;
    try {
      offData = await offClient.fetchFromOpenFoodFacts(barcode);
    } catch (error) {
      console.log('[Orchestrator] ⚠️  Erreur OFF:', error.message);
      offData = null;
    }

    let normalizedProduct;

    if (!offData) {
      console.log('[Orchestrator] ⚠️  OFF échoué - Création produit minimal pour enrichissement IA');

      // Créer un objet produit minimal (cosmétique par défaut)
      normalizedProduct = {
        barcode,
        product_name: product?.name || 'Produit inconnu',
        brands: product?.brand || '',
        category: product?.category || 'cosmetics',
        source: 'MINIMAL',
        ingredients: product?.ingredients || [],
        nutritionalInfo: product?.nutritionalInfo || {},
        allergens: product?.allergens || [],
        labels: product?.labels || [],
        packaging: product?.packaging || '',
        origin: product?.origin || ''
      };

      console.log('[Orchestrator] ✅ Produit minimal créé, enrichissement IA va suivre');
    } else {
      // Mapper données OFF → format ECOLOJIA
      normalizedProduct = DataNormalizer.normalizeProduct(offData, 'OFF');
      console.log('[Orchestrator] ✅ Données OFF normalisées');
    }

    // ============================================================================
    // ÉTAPE 3 : Scoring initial
    // ============================================================================

    console.log('[Orchestrator] 🔢 Calcul scoring initial...');

    const scoringResult = ScoringEngineV3.calculateScore(normalizedProduct);

    console.log('[Orchestrator] 📊 Scoring initial:', {
      canScore: scoringResult.canScore,
      overallScore: scoringResult.overallScore || 'N/A',
      confidence: scoringResult.confidence,
      dataCompleteness: scoringResult.dataCompleteness,
      available: scoringResult.availableComponents?.length || 0,
      missing: scoringResult.missingComponents?.length || 0
    });

    let finalScores = scoringResult;
    let aiUsed = false;

    // ============================================================================
    // ÉTAPE 4 : DÉCISION ENRICHISSEMENT IA (LOGIQUE INTELLIGENTE)
    // ============================================================================

    const enrichmentDecision = shouldEnrichProduct(scoringResult, normalizedProduct, product);

    if (enrichmentDecision.shouldEnrich) {
      console.log('\n🤖 [Orchestrator] ENRICHISSEMENT IA DÉCLENCHÉ');
      console.log(`   Priorité: ${enrichmentDecision.priority}`);
      console.log(`   Raisons:`);
      enrichmentDecision.reasons.forEach(reason => {
        console.log(`     → ${reason}`);
      });
      console.log(`   Amélioration estimée: ${enrichmentDecision.estimatedImprovement}\n`);

      // ✅ Si le produit n'existe pas en base, le créer MAINTENANT
      if (!product) {
        console.log('[Orchestrator] 💾 Création produit en base AVANT enrichissement IA...');

        const tempProduct = new Product({
          barcode,
          name: normalizedProduct.product_name || 'Produit inconnu',
          brand: normalizedProduct.brands || '',
          category: normalizedProduct.category || 'cosmetics',
          source: 'OFF',
          scores: {
            overallScore: scoringResult.overallScore || 50,
            confidence: scoringResult.confidence || 0.3,
            dataCompleteness: scoringResult.dataCompleteness || 'Faible',
            calculatedAt: new Date()
          },
          // Préserver les données OFF/normalized
          ...normalizedProduct
        });

        product = await tempProduct.save();
        console.log('[Orchestrator] ✅ Produit créé avec _id:', product._id);

        // Mettre à jour normalizedProduct avec l'_id
        normalizedProduct._id = product._id;
      }

      // Enrichissement IA
      console.log('[Orchestrator] 🚀 Appel service enrichissement IA...');
      
      const aiResult = await aiEnrichment.enrichProductWithAI(normalizedProduct, normalizedProduct.category || 'food');

      console.log('[Orchestrator] ✅ Enrichissement IA terminé');
      console.log(`   Champs enrichis: ${Object.keys(aiResult.estimations || {}).length}`);

      // Re-normaliser avec données IA
      const enrichedProduct = DataNormalizer.normalizeProduct({
        ...normalizedProduct,
        ...aiResult.estimations
      }, 'AI');

      // Re-calculer scores
      finalScores = ScoringEngineV3.calculateScore(enrichedProduct);
      
      console.log('[Orchestrator] 📊 Nouveau score après enrichissement:', {
        ancien: scoringResult.overallScore || 'N/A',
        nouveau: finalScores.overallScore || 'N/A',
        gain: finalScores.overallScore && scoringResult.overallScore 
          ? `+${finalScores.overallScore - scoringResult.overallScore} points`
          : 'N/A'
      });

      aiUsed = true;
    } else {
      console.log('\n✅ [Orchestrator] Enrichissement IA NON nécessaire');
      console.log('   Raisons:');
      enrichmentDecision.reasons.forEach(reason => {
        console.log(`     → ${reason}`);
      });
      console.log('');
    }

    // ============================================================================
    // ÉTAPE 5 : Sauvegarde en base avec scores finaux
    // ============================================================================

    // ✅ CORRECTION : Préserver dataCompleteness depuis MongoDB si disponible
    const dataCompletenessToSave = product?.scores?.dataCompleteness || 
                                   finalScores.dataCompleteness || 
                                   'Moyenne';

    const productData = {
      barcode,
      name: normalizedProduct.product_name || product?.name || 'Produit inconnu',
      brand: normalizedProduct.brands || product?.brand || '',
      category: normalizedProduct.category || product?.category || 'food',
      source: normalizedProduct.source || 'OFF',
      
      // Scores finaux (avec ou sans IA)
      scores: {
        overallScore: finalScores.overallScore || 50,
        healthScore: finalScores.healthScore || 50,
        environmentScore: finalScores.environmentScore || 50,
        confidence: finalScores.confidence || 0.5,
        dataCompleteness: dataCompletenessToSave,
        breakdown: finalScores.breakdown || {},
        calculatedAt: new Date()
      },

      // Données produit
      ingredients: normalizedProduct.ingredients || [],
      nutritionalInfo: normalizedProduct.nutritionalInfo || {},
      allergens: normalizedProduct.allergens || [],
      labels: normalizedProduct.labels || [],
      packaging: normalizedProduct.packaging || '',
      origin: normalizedProduct.origin || '',
      image: normalizedProduct.image_url || '',

      // Métadonnées IA
      aiEnriched: aiUsed,
      aiEnrichedAt: aiUsed ? new Date() : product?.aiEnrichedAt,

      updatedAt: new Date()
    };

    // Sauvegarder ou mettre à jour
    if (product && product._id) {
      await Product.findByIdAndUpdate(product._id, productData, { new: true });
      console.log('[Orchestrator] ✅ Produit mis à jour en base');
    } else {
      product = await new Product(productData).save();
      console.log('[Orchestrator] ✅ Nouveau produit créé en base');
    }

    // ============================================================================
    // ÉTAPE 6 : Retour final
    // ============================================================================

    return {
      product: await Product.findOne({ barcode }).lean(),
      source: aiUsed ? 'off_enriched' : 'off',
      cached: false,
      aiUsed,
      enrichmentDecision: aiUsed ? enrichmentDecision : null
    };

  } catch (error) {
    logger.error('[Orchestrator] Erreur getProductByBarcode:', error);
    throw error;
  }
}

// ============================================================================
// SCAN PHOTO (OCR) - Pour produits inconnus
// ============================================================================

/**
 * Scan photo étiquette → OCR → Enrichissement IA → Création produit
 */
async function scanProductFromPhoto(photoBase64, options = {}) {
  try {
    console.log('[Orchestrator] 📸 Analyse photo produit...');

    // OCR via Google Vision
    const ocrResult = await visionService.extractProductInfo(photoBase64);

    if (!ocrResult.success) {
      throw new Error('OCR échoué: ' + ocrResult.error);
    }

    console.log('[Orchestrator] ✅ OCR réussi:', {
      ingredients: ocrResult.ingredients?.length || 0,
      nutrition: Object.keys(ocrResult.nutrition || {}).length,
      labels: ocrResult.labels?.length || 0
    });

    // Créer produit minimal avec données OCR
    const minimalProduct = {
      product_name: ocrResult.productName || 'Produit scanné',
      brands: ocrResult.brand || '',
      category: ocrResult.category || 'food',
      source: 'OCR',
      ingredients: ocrResult.ingredients || [],
      nutritionalInfo: ocrResult.nutrition || {},
      allergens: ocrResult.allergens || [],
      labels: ocrResult.labels || []
    };

    // Normaliser
    const normalizedProduct = DataNormalizer.normalizeProduct(minimalProduct, 'OCR');

    // Scoring initial
    const scoringResult = ScoringEngineV3.calculateScore(normalizedProduct);

    // Enrichissement IA (toujours nécessaire pour OCR)
    console.log('[Orchestrator] 🤖 Enrichissement IA du produit scanné...');
    
    const aiResult = await aiEnrichment.enrichProductWithAI(normalizedProduct, normalizedProduct.category || 'food');

    // Créer produit en base
    const productData = {
      barcode: ocrResult.barcode || `OCR_${Date.now()}`,
      name: normalizedProduct.product_name,
      brand: normalizedProduct.brands,
      category: normalizedProduct.category,
      source: 'OCR',
      scores: aiResult.scores || scoringResult,
      ingredients: normalizedProduct.ingredients,
      nutritionalInfo: normalizedProduct.nutritionalInfo,
      aiEnriched: true,
      aiEnrichedAt: new Date(),
      image: options.imageUrl || ''
    };

    const product = await new Product(productData).save();

    console.log('[Orchestrator] ✅ Produit OCR créé avec _id:', product._id);

    return {
      product: product.toObject(),
      source: 'ocr',
      cached: false,
      aiUsed: true
    };

  } catch (error) {
    logger.error('[Orchestrator] Erreur scanProductFromPhoto:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  getProductByBarcode,
  getOrCreateProduct: getProductByBarcode, // Alias pour rétrocompatibilité
  scanProductFromPhoto,
  shouldEnrichProduct // Export pour tests
};
