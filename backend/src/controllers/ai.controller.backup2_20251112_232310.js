'use strict';

const enrichment = require('../services/aiEnrichment.service');
const Product = require('../models/Product');

/**
 * ✅ ECOLOJIA V3 - AI Controller (CORRIGÉ)
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
          breakdown: freshProduct.scores?.breakdown || null,
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
        productId: freshProduct._id
      }
    };
    
    console.log('[AI CONTROLLER] 📊 Score global:', response.enrichedData.scores.global);
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

module.exports = { enrichHandler };
