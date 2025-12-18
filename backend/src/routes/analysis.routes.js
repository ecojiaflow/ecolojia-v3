// ============================================================================
// ECOLOJIA V3.1 - ANALYSIS ROUTES AVEC SYSTÈME HYBRIDE
// Route d'analyse produit intégrant Knowledge Base + DeepSeek
// Version : 3.1-hybrid
// Date : 2025-11-16
// ============================================================================

const express = require('express');
const router = express.Router();

// ──────────────────────────────────────────────────────────
// SERVICES
// ──────────────────────────────────────────────────────────

let analyzeService;
try {
  analyzeService = require('../services/analyzeService');
  console.log('[AnalysisRoutes] ✅ AnalyzeService chargé');
} catch (err) {
  console.error('[AnalysisRoutes] ❌ Erreur chargement analyzeService:', err.message);
}

// ⭐ NOUVEAU : Import du système hybride
const aiEnrichment = require('../services/aiEnrichment.service');
console.log('[AnalysisRoutes] ✅ AIEnrichment Service chargé (v3.1-hybrid)');

// ──────────────────────────────────────────────────────────
// ROUTE INFO
// ──────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  res.json({
    service: 'analysis',
    status: 'operational',
    version: '3.1-hybrid',
    features: {
      knowledgeBase: true,
      aiEnrichment: true,
      deepSeek: true
    },
    endpoints: [
      'POST / - Analyser un produit (barcode ou image)',
      'POST /barcode - Analyse par code-barre',
      'POST /image - Analyse par image'
    ],
    timestamp: new Date().toISOString()
  });
});

// ──────────────────────────────────────────────────────────
// ROUTE PRINCIPALE : POST /api/analysis
// ──────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { barcode, name, category = 'food', ingredients_text } = req.body;
    
    console.log('[AnalysisRoutes] 📥 Requête reçue:', { 
      barcode, 
      name, 
      category,
      hasIngredients: !!ingredients_text 
    });

    // ────────────────────────────────────────────────────────
    // 1️⃣ ANALYSE BASIQUE (analyzeService existant)
    // ────────────────────────────────────────────────────────
    
    let basicAnalysis = null;
    
    if (analyzeService && analyzeService.analyzeAutoSvc) {
      try {
        basicAnalysis = await analyzeService.analyzeAutoSvc({ 
          barcode, 
          name, 
          category 
        });
        console.log('[AnalysisRoutes] ✅ Analyse basique réussie');
      } catch (err) {
        console.warn('[AnalysisRoutes] ⚠️  Analyse basique échouée:', err.message);
      }
    }

    // ────────────────────────────────────────────────────────
    // 2️⃣ CONSTRUCTION OBJET PRODUIT POUR ENRICHISSEMENT
    // ────────────────────────────────────────────────────────
    
    const productForEnrichment = {
      name: name || basicAnalysis?.product?.name || 'Produit inconnu',
      barcode: barcode || basicAnalysis?.product?.barcode,
      brand: basicAnalysis?.product?.brand || null,
      category: category,
      ingredients_text: ingredients_text || basicAnalysis?.product?.ingredients_text || '',
      foodData: basicAnalysis?.product?.foodData || {},
      scores: basicAnalysis?.scores || {}
    };

    // ────────────────────────────────────────────────────────
    // 3️⃣ ENRICHISSEMENT HYBRIDE (Knowledge Base + DeepSeek)
    // ────────────────────────────────────────────────────────
    
    let enrichedProduct = null;
    let enrichmentSuccess = false;
    
    if (productForEnrichment.ingredients_text) {
      try {
        console.log('[AnalysisRoutes] 🔬 Début enrichissement hybride...');
        
        enrichedProduct = await aiEnrichment.enrichProductWithAI(productForEnrichment);
        
        enrichmentSuccess = true;
        
        console.log('[AnalysisRoutes] ✅ Enrichissement hybride réussi');
        console.log('[AnalysisRoutes] 📊 Knowledge base utilisée:', enrichedProduct.knowledgeBaseUsed);
        console.log('[AnalysisRoutes] 📊 Score impact:', enrichedProduct.knowledgeAnalysis?.scoreImpact);
        
      } catch (err) {
        console.error('[AnalysisRoutes] ❌ Erreur enrichissement hybride:', err.message);
        enrichedProduct = productForEnrichment; // Fallback sur produit de base
      }
    } else {
      console.warn('[AnalysisRoutes] ⚠️  Pas d\'ingrédients → Enrichissement hybride ignoré');
      enrichedProduct = productForEnrichment;
    }

    // ────────────────────────────────────────────────────────
    // 4️⃣ CONSTRUCTION RÉPONSE FINALE
    // ────────────────────────────────────────────────────────
    
    const finalProduct = enrichedProduct || productForEnrichment;
    
    // Extraction sécurisée des scores
    const scores = finalProduct.scores || {};
    const health = scores.healthScore || scores.health || 50;
    const eco = scores.environmentScore || scores.eco || 50;
    const global = scores.overallScore || scores.global || scores.globalScore || 50;

    // Construction réponse
    const response = {
      product: {
        _id: finalProduct._id || basicAnalysis?.product?._id,
        barcode: finalProduct.barcode,
        name: finalProduct.name,
        brand: finalProduct.brand,
        category: finalProduct.category
      },
      scores: {
        health: Math.round(health),
        healthScore: Math.round(health),
        environmentScore: Math.round(eco),
        overallScore: Math.round(global),
        ...scores // Inclure tous les scores détaillés si disponibles
      },
      summary: finalProduct.summary || generateSummary(global),
      globalScore: Math.round(global),
      dataSource: basicAnalysis?.dataSource || 'user_input',
      details: finalProduct.details || {}
    };

    // ⭐ AJOUT DES DONNÉES HYBRIDES SI DISPONIBLES
    if (enrichmentSuccess && finalProduct.knowledgeAnalysis) {
      response.knowledgeAnalysis = finalProduct.knowledgeAnalysis;
      response.aiEnriched = true;
      response.knowledgeBaseUsed = finalProduct.knowledgeBaseUsed || false;
      response.aiEnrichmentVersion = finalProduct.aiEnrichmentVersion || '3.1-hybrid';
      response.aiEnrichmentDate = finalProduct.aiEnrichmentDate;
    }

    const duration = Date.now() - startTime;
    console.log(`[AnalysisRoutes] ✅ Analyse terminée en ${duration}ms`);

    res.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[AnalysisRoutes] ❌ Erreur analyse:', error.message);
    console.error('[AnalysisRoutes] Stack:', error.stack);

    // Réponse d'erreur gracieuse
    res.status(500).json({
      product: { 
        name: req.body.name || 'Erreur',
        barcode: req.body.barcode 
      },
      scores: { 
        health: 50, 
        healthScore: 50, 
        environmentScore: 50 
      },
      summary: 'Erreur lors de l\'analyse du produit',
      globalScore: 50,
      error: true,
      message: error.message,
      duration: duration
    });
  }
});

// ──────────────────────────────────────────────────────────
// ROUTE ALTERNATIVE : POST /api/analysis/barcode
// ──────────────────────────────────────────────────────────

router.post('/barcode', async (req, res) => {
  // Rediriger vers la route principale
  req.body.barcode = req.body.barcode || req.params.barcode;
  return router.handle(req, res);
});

// ──────────────────────────────────────────────────────────
// HELPER : Générer un résumé basé sur le score
// ──────────────────────────────────────────────────────────

function generateSummary(score) {
  if (score >= 80) {
    return 'Excellent produit, recommandé pour une consommation régulière';
  } else if (score >= 60) {
    return 'Bon produit, consommation modérée recommandée';
  } else if (score >= 40) {
    return 'Produit à consommer avec modération';
  } else if (score >= 20) {
    return 'Produit déconseillé pour une consommation régulière';
  } else {
    return 'Produit fortement déconseillé';
  }
}

module.exports = router;
