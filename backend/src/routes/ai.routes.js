/**
 * ============================================
 * AI ROUTES - ECOLOJIA V3.1 (WITH SEARCHLAYER)
 * ============================================
 * Routes pour l'assistant IA intelligent
 * 
 * UPGRADE V2 :
 * - Integration searchLayer (hybride Algolia + MongoDB)
 * - Métadonnées complètes (source, temps, cache)
 * - Meilleure gestion des résultats
 */

const express = require('express');
const router = express.Router();
const aiOrchestrator = require('../services/aiOrchestrator.service');
const searchLayer = require('../services/searchLayer.service');
const Product = require('../models/Product');
const { enrichHandler } = require('../controllers/ai.controller');

// ============================================
// LAZY LOADING aiService (optionnel)
// ============================================
let aiService = null;
function getAIService() {
  if (!aiService) {
    try {
      aiService = require('../services/aiService');
      console.log('[AI Routes] ✅ aiService chargé');
    } catch (error) {
      console.warn('[AI Routes] ⚠️ aiService non disponible:', error.message);
      aiService = null;
    }
  }
  return aiService;
}

// ============================================
// MIDDLEWARE AUTH (optionnel)
// ============================================
let authMiddleware;
try {
  authMiddleware = require('../middleware').auth;
} catch (err) {
  authMiddleware = (req, res, next) => next();
}

// ============================================
// ROUTE PRINCIPALE : POST /api/ai/query (V2 - WITH SEARCHLAYER)
// ============================================

router.post('/query', async (req, res) => {
  try {
    const { query, userContext = {} } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Requête invalide. Le champ "query" est obligatoire.'
      });
    }

    console.log('\n[AI Query] 🚀 Nouvelle requête:', { query, userContext });

    // ÉTAPE 1 : Détection intention
    const intentResult = await aiOrchestrator.detectIntent(query, userContext);
    console.log('[AI Query] 🎯 Intention:', intentResult.intent, `(${(intentResult.confidence * 100).toFixed(0)}%)`);

    // ÉTAPE 2 : Génération filtres
    const filters = aiOrchestrator.generateSearchFilters(
      intentResult.intent,
      query,
      userContext
    );
    console.log('[AI Query] 🔍 Filtres:', JSON.stringify(filters, null, 2));

    // ÉTAPE 3 : Recherche avec searchLayer (NOUVEAU !)
    let searchResult;
    
    try {
      searchResult = await searchLayer.search(query, filters);
      console.log(`[AI Query] ✅ Recherche: ${searchResult.results.length} résultats (${searchResult.source}, ${searchResult.executionTime}ms)`);
    } catch (searchError) {
      console.error('[AI Query] ❌ Erreur searchLayer:', searchError.message);
      
      // Fallback : recherche simple MongoDB
      const fallbackResults = await Product.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { productName: { $regex: query, $options: 'i' } }
        ]
      })
        .sort({ 'scores.overallScore': -1 })
        .limit(10)
        .lean();
      
      searchResult = {
        success: true,
        source: 'fallback',
        results: fallbackResults,
        total: fallbackResults.length,
        executionTime: 0,
        cached: false
      };
    }

    // ÉTAPE 4 : Formatage réponse
    const resultsCount = searchResult.results.length;
    
    // Explication simple
    let explanation = '';
    if (resultsCount > 0) {
      const topScore = searchResult.results[0]?.scores?.overallScore || 0;
      explanation = `J'ai trouvé ${resultsCount} produit(s) pour "${query}". Le mieux noté obtient ${topScore}/100.`;
      
      if (userContext.diet) {
        explanation += ` Filtré pour régime ${userContext.diet}.`;
      }
    } else {
      explanation = `Aucun produit trouvé pour "${query}". Essayez une recherche plus générale.`;
    }

    // Actions suggérées
    const actions = [];
    if (resultsCount > 0) {
      actions.push({
        type: 'view_product',
        label: 'Voir le détail',
        productId: searchResult.results[0]._id
      });
      
      if (resultsCount > 1) {
        actions.push({
          type: 'compare',
          label: 'Comparer',
          productIds: searchResult.results.slice(0, 3).map(p => p._id)
        });
      }
      
      actions.push({
        type: 'add_to_list',
        label: 'Ajouter à ma liste',
        productId: searchResult.results[0]._id
      });
    } else {
      actions.push({
        type: 'broaden_search',
        label: 'Élargir la recherche',
        query: query
      });
    }

    // ÉTAPE 5 : Réponse finale avec métadonnées complètes
    return res.json({
      success: true,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      query: query,
      filters: filters,
      resultsCount: resultsCount,
      results: searchResult.results.slice(0, 10),
      explanation: explanation,
      actions: actions,
      metadata: {
        source: searchResult.source,
        cached: searchResult.cached || false,
        executionTime: searchResult.executionTime || 0,
        extractedEntities: intentResult.extractedEntities,
        userContext: userContext,
        version: 'v2-searchlayer'
      }
    });

  } catch (error) {
    console.error('[AI Query] ❌ Erreur:', error);

    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de votre requête.',
      message: error.message
    });
  }
});

// ============================================
// ROUTES DEBUG
// ============================================

router.get('/cache-stats', (req, res) => {
  try {
    const stats = searchLayer.getCacheStats();
    return res.json({ success: true, cache: stats });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/clear-cache', (req, res) => {
  try {
    searchLayer.clearCache();
    return res.json({ success: true, message: 'Cache vidé' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ROUTES LEGACY
// ============================================

router.post('/chat', authMiddleware, async (req, res) => {
  const aiSvc = getAIService();
  if (!aiSvc) {
    return res.status(503).json({ success: false, error: 'Service IA non disponible.' });
  }

  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message requis' });
    }

    const response = await aiSvc.generateCompletion(message);
    return res.json({ success: true, response: response });

  } catch (error) {
    console.error('[AI Chat] Erreur:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analyze', authMiddleware, async (req, res) => {
  const aiSvc = getAIService();
  if (!aiSvc) {
    return res.status(503).json({ success: false, error: 'Service IA non disponible.' });
  }

  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId requis' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Produit non trouvé' });
    }

    const analysis = `Analyse du produit ${product.name} (score: ${product.scores?.overallScore || 'N/A'}/100)`;
    return res.json({ success: true, analysis: analysis, product: product });

  } catch (error) {
    console.error('[AI Analyze] Erreur:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/enrich', enrichHandler);

module.exports = router;
