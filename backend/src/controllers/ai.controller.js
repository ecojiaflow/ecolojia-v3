'use strict';

const enrichment = require('../services/aiEnrichment.service');
const Product = require('../models/Product');

/**
 * Mapper le breakdown technique vers format UX frontend
 */
function mapBreakdownToUX(breakdown, category = 'food') {
  if (!breakdown) return null;
  
  const uxBreakdown = {};
  
  if (category === 'food') {
    // NOVA → Processing
    if (breakdown.nova) {
      uxBreakdown.processing = {
        score: breakdown.nova.score,
        weight: breakdown.nova.adjustedWeight || breakdown.nova.originalWeight || 0.15,
        label: breakdown.nova.label,
        explanation: breakdown.nova.explanation,
        value: breakdown.nova.value
      };
    }
    
    // Additifs → Additives (direct)
    if (breakdown.additives) {
      uxBreakdown.additives = {
        score: breakdown.additives.score,
        weight: breakdown.additives.adjustedWeight || breakdown.additives.originalWeight || 0.15,
        label: breakdown.additives.label,
        explanation: breakdown.additives.explanation,
        count: breakdown.additives.count,
        dangerous: breakdown.additives.dangerous
      };
    }
    
    // Eco-Score → Sustainability
    if (breakdown.ecoScore) {
      uxBreakdown.sustainability = {
        score: breakdown.ecoScore.score,
        weight: breakdown.ecoScore.adjustedWeight || breakdown.ecoScore.originalWeight || 0.15,
        label: breakdown.ecoScore.label,
        explanation: breakdown.ecoScore.explanation,
        value: breakdown.ecoScore.value
      };
    }
    
    // Labels → Transparency
    if (breakdown.labels) {
      uxBreakdown.transparency = {
        score: breakdown.labels.score,
        weight: breakdown.labels.adjustedWeight || breakdown.labels.originalWeight || 0.05,
        label: breakdown.labels.label,
        explanation: breakdown.labels.explanation,
        isBio: breakdown.labels.isBio
      };
    }
    
    // Nutri-Score → Nutrition Quality
    if (breakdown.nutriScore) {
      uxBreakdown.nutritionQuality = {
        score: breakdown.nutriScore.score,
        weight: breakdown.nutriScore.adjustedWeight || breakdown.nutriScore.originalWeight || 0.20,
        label: breakdown.nutriScore.label,
        explanation: breakdown.nutriScore.explanation,
        value: breakdown.nutriScore.value
      };
    }
    
    // Sucres → Sugars
    if (breakdown.sugars) {
      uxBreakdown.sugars = {
        score: breakdown.sugars.score,
        weight: breakdown.sugars.adjustedWeight || breakdown.sugars.originalWeight || 0.10,
        label: breakdown.sugars.label,
        explanation: breakdown.sugars.explanation,
        value: breakdown.sugars.value,
        equivalent: breakdown.sugars.equivalent
      };
    }
    
    // Graisses saturées → Saturated Fat
    if (breakdown.saturatedFat) {
      uxBreakdown.saturatedFat = {
        score: breakdown.saturatedFat.score,
        weight: breakdown.saturatedFat.adjustedWeight || breakdown.saturatedFat.originalWeight || 0.10,
        label: breakdown.saturatedFat.label,
        explanation: breakdown.saturatedFat.explanation,
        value: breakdown.saturatedFat.value,
        equivalent: breakdown.saturatedFat.equivalent
      };
    }
    
    // Sel → Salt
    if (breakdown.salt) {
      uxBreakdown.salt = {
        score: breakdown.salt.score,
        weight: breakdown.salt.adjustedWeight || breakdown.salt.originalWeight || 0.10,
        label: breakdown.salt.label,
        explanation: breakdown.salt.explanation,
        value: breakdown.salt.value,
        equivalent: breakdown.salt.equivalent
      };
    }
  }
  
  return uxBreakdown;
}

/**
 * ✅ ECOLOJIA V3 - AI Controller (CORRIGÉ V2)
 * POST /api/ai/enrich
 * Body: { product: {...}, category: 'food'|'cosmetics'|'detergents' }
 */
async function enrichHandler(req, res) {
  try {
    console.log('[AI CONTROLLER] ════════════════════════════════════════');
    console.log('[AI CONTROLLER] Nouvelle requête enrichissement');
    
    const userId = req.userId || 'anonymous';
    const { product: productInput, category } = req.body;
    
    // ============================================================================
    // VALIDATION INPUT
    // ============================================================================
    
    if (!productInput) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "product" est requis dans le body'
      });
    }
    
    if (!category || !['food', 'cosmetics', 'detergents'].includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Catégorie invalide. Valeurs acceptées: food, cosmetics, detergents'
      });
    }
    
    const barcode = productInput.barcode || `TEMP_${Date.now()}`;
    console.log('[AI CONTROLLER] Barcode:', barcode);
    console.log('[AI CONTROLLER] Category:', category);
    
    // ============================================================================
    // RECHERCHE PRODUIT EN BASE
    // ============================================================================
    
    let product = await Product.findOne({ barcode });
    
    if (product) {
      console.log('[AI CONTROLLER] ✅ Produit trouvé en base (ID:', product._id + ')');
    } else {
      console.log('[AI CONTROLLER] ⚠️  Produit non trouvé → Création minimal');
      
      // Créer produit minimal pour enrichissement
      const newProduct = {
        barcode,
        product_name: productInput.name || productInput.product_name || 'Produit sans nom',
        brands: productInput.brand || productInput.brands || 'Marque inconnue',
        categoryType: category,
        ingredients_text: productInput.ingredients_text || '',
        
        // Données catégorie spécifique (vides pour enrichissement)
        foodData: category === 'food' ? {
          nutritionalInfo: productInput.nutriments || {},
          ingredients: [],
          allergens: [],
          labels: []
        } : undefined,
        
        cosmeticsData: category === 'cosmetics' ? {
          ingredients: [],
          allergens: []
        } : undefined,
        
        detergentsData: category === 'detergents' ? {
          composition: [],
          surfactants: []
        } : undefined,
        
        // Scores vides (seront calculés après enrichissement)
        scores: {
          overallScore: null,
          healthScore: null,
          environmentScore: null,
          confidence: 0,
          dataCompleteness: 'Faible'
        },
        
        // Metadata
        metadata: {
          source: 'ai_enrichment',
          createdBy: userId,
          createdAt: new Date()
        }
      };
      
      product = await Product.create(newProduct);
      console.log('[AI CONTROLLER] ✅ Produit créé (ID:', product._id + ')');
    }
    
    // ============================================================================
    // ENRICHISSEMENT IA
    // ============================================================================
    
    console.log('[AI CONTROLLER] 🤖 Appel service enrichissement...');
    
    const enrichmentResult = await enrichment.enrichProductWithAI(
      product,
      category,
      { userId, force: !!req.body.force }
    );
    
    if (!enrichmentResult.success) {
      console.error('[AI CONTROLLER] ❌ Enrichissement échoué:', enrichmentResult.error);
      return res.status(500).json({
        success: false,
        error: enrichmentResult.error
      });
    }
    
    console.log('[AI CONTROLLER] ✅ Enrichissement réussi');
    
    // ============================================================================
    // RECHARGER PRODUIT AVEC DONNÉES FRAÎCHES
    // ============================================================================
    
    const freshProduct = await Product.findById(product._id);
    
    if (!freshProduct) {
      return res.status(500).json({
        success: false,
        error: 'Produit enrichi non trouvé après sauvegarde'
      });
    }
    
    // ============================================================================
    // MAPPER BREAKDOWN VERS FORMAT UX
    // ============================================================================
    
    const uxBreakdown = mapBreakdownToUX(freshProduct.scores?.breakdown, category);
    
    console.log('[AI CONTROLLER] 📊 Breakdown mappé:', Object.keys(uxBreakdown || {}).length, 'composantes');
    
    // ============================================================================
    // CONSTRUIRE RÉPONSE FRONTEND
    // ============================================================================
    
    const response = {
      success: true,
      
      // ✅ NOUVEAU : Objet enrichedData complet pour frontend
      enrichedData: {
        // Informations produit
        product: {
          id: freshProduct._id,
          barcode: freshProduct.barcode,
          name: freshProduct.product_name,
          brand: freshProduct.brands,
          category: freshProduct.categoryType
        },
        
        // Nutrition (food only)
        nutrition: category === 'food' ? {
          calories: freshProduct.foodData?.nutritionalInfo?.energy || null,
          protein: freshProduct.foodData?.nutritionalInfo?.proteins || null,
          carbs: freshProduct.foodData?.nutritionalInfo?.carbohydrates || null,
          sugars: freshProduct.foodData?.nutritionalInfo?.sugars || null,
          fat: freshProduct.foodData?.nutritionalInfo?.fat || null,
          saturatedFat: freshProduct.foodData?.nutritionalInfo?.saturatedFat || null,
          fiber: freshProduct.foodData?.nutritionalInfo?.fiber || null,
          salt: freshProduct.foodData?.nutritionalInfo?.salt || null
        } : undefined,
        
        // NOVA Group (food only)
        novaGroup: category === 'food' ? freshProduct.foodData?.novaGroup : undefined,
        
        // Nutri-Score (food only)
        nutriScore: category === 'food' ? freshProduct.foodData?.nutriScore : undefined,
        
        // Eco-Score
        ecoScore: category === 'food' ? freshProduct.foodData?.ecoScore : undefined,
        
        // Scores calculés
        scores: {
          global: freshProduct.scores?.overallScore || null,
          health: freshProduct.scores?.healthScore || null,
          environment: freshProduct.scores?.environmentScore || null,
          breakdown: uxBreakdown,  // ✅ NOUVEAU : Breakdown mappé UX
          confidence: freshProduct.scores?.confidence || 0,
          dataCompleteness: freshProduct.scores?.dataCompleteness || 'Faible'
        },
        
        // Metadata enrichissement
        aiEnriched: true,
        enrichedAt: freshProduct.metadata?.lastEnriched || new Date(),
        enrichmentVersion: freshProduct.metadata?.aiEnrichmentVersion || '3.3'
      },
      
      // Infos supplémentaires (debug/log)
      _meta: {
        estimations: enrichmentResult.estimations || null,
        newScore: enrichmentResult.newScore || null,
        productId: freshProduct._id,
        breakdownKeys: Object.keys(uxBreakdown || {})
      }
    };
    
    console.log('[AI CONTROLLER] 📊 Score global:', response.enrichedData.scores.global);
    console.log('[AI CONTROLLER] 📊 Composantes mappées:', response._meta.breakdownKeys.join(', '));
    console.log('[AI CONTROLLER] ════════════════════════════════════════');
    
    return res.json(response);
    
  } catch (err) {
    console.error('[AI CONTROLLER] ❌ Erreur critique:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Erreur interne enrichissement IA'
    });
  }
}


// =====================================================
// OCR HANDLER - Analyse image produit
// =====================================================

/**
 * POST /api/ai/ocr
 * Body: { imageBase64: string }
 * Response: { ingredients, nutrition, category, rawText, confidence }
 */
async function ocrHandler(req, res) {
  try {
    console.log('[OCR CONTROLLER] ════════════════════════════════════════');
    console.log('[OCR CONTROLLER] Nouvelle requête OCR');

    const userId = req.userId || 'anonymous';
    const { imageBase64 } = req.body;

    // ============================================================================
    // VALIDATION INPUT
    // ============================================================================

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Le champ "imageBase64" est requis (string)'
      });
    }

    // Validation format base64 basique
    if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
      return res.status(400).json({
        success: false,
        error: 'Format base64 invalide'
      });
    }

    console.log('[OCR CONTROLLER] Image size:', Math.round(imageBase64.length / 1024), 'KB');

    // ============================================================================
    // APPEL SERVICE OCR
    // ============================================================================

    const ocrService = require('../services/ocr.service');
    
    const result = await ocrService.extractFromImage(imageBase64);

    console.log('[OCR CONTROLLER] ✅ Extraction réussie');
    console.log('[OCR CONTROLLER] - Ingrédients:', result.ingredients.length);
    console.log('[OCR CONTROLLER] - Nutrition:', Object.keys(result.nutrition).length, 'valeurs');
    console.log('[OCR CONTROLLER] - Catégorie:', result.category);
    console.log('[OCR CONTROLLER] - Confiance:', result.confidence + '%');

    // ============================================================================
    // CONSTRUIRE RÉPONSE
    // ============================================================================

    const response = {
      success: true,
      data: {
        ingredients: result.ingredients,
        nutrition: result.nutrition,
        category: result.category,
        rawText: result.rawText,
        confidence: result.confidence,
        processingTime: result.processingTime
      },
      metadata: {
        userId,
        timestamp: new Date().toISOString()
      }
    };

    console.log('[OCR CONTROLLER] ════════════════════════════════════════');

    return res.json(response);

  } catch (err) {
    console.error('[OCR CONTROLLER] ❌ Erreur OCR:', err.message);
    
    // Erreurs spécifiques
    if (err.message.includes('trop lourde')) {
      return res.status(413).json({
        success: false,
        error: err.message
      });
    }

    if (err.message.includes('Format base64')) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    // Erreur générique
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse OCR : ' + err.message
    });
  }
}

module.exports = { enrichHandler, ocrHandler };
