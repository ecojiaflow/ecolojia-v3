/**
 * ============================================
 * AI ROUTES - ECOLOJIA V3.1 (FIXED)
 * ============================================
 * Routes pour l'assistant IA intelligent
 * 
 * Note : aiService chargé en lazy loading pour éviter
 * les erreurs si le module 'openai' n'est pas installé.
 */

const express = require('express');
const router = express.Router();
const aiOrchestrator = require('../services/aiOrchestrator.service');
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
  // Si pas de middleware auth, on laisse passer
  authMiddleware = (req, res, next) => next();
}

// ============================================
// ROUTE PRINCIPALE : POST /api/ai/query
// ============================================

router.post('/query', /* authMiddleware */ async (req, res) => {
  try {
    const { query, userContext = {} } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Requête invalide. Le champ "query" est obligatoire.'
      });
    }

    console.log('[AI Query] Nouvelle requête:', { query, userContext });

    // Détection intention
    const intentResult = await aiOrchestrator.detectIntent(query, userContext);
    console.log('[AI Query] Intention détectée:', intentResult);

    // Génération filtres
    const filters = aiOrchestrator.generateSearchFilters(
      intentResult.intent,
      query,
      userContext
    );
    console.log('[AI Query] Filtres générés:', filters);

    // Recherche MongoDB
    let results = [];
    
    try {
      const mongoQuery = {
        $text: { $search: filters.query }
      };

      if (filters.filters) {
        Object.assign(mongoQuery, filters.filters);
      }

      results = await Product.find(mongoQuery)
        .sort({ 'scores.overallScore': -1 })
        .limit(filters.hitsPerPage || 10)
        .lean();

      console.log(`[AI Query] ${results.length} résultats trouvés`);

    } catch (searchError) {
      console.error('[AI Query] Erreur recherche:', searchError);
      
      // Fallback : recherche simple
      results = await Product.find({
        name: { $regex: query, $options: 'i' }
      })
        .sort({ 'scores.overallScore': -1 })
        .limit(10)
        .lean();
    }

    // Explication simple
    let explanation = '';
    if (results.length > 0) {
      const count = results.length;
      const topScore = results[0]?.scores?.overallScore || 0;
      explanation = `J'ai trouvé ${count} produit(s) pour "${query}". Le mieux noté obtient ${topScore}/100.`;
    } else {
      explanation = `Aucun produit trouvé pour "${query}". Essayez une recherche plus générale.`;
    }

    // Actions suggérées
    const actions = [];
    if (results.length > 0) {
      actions.push({
        type: 'view_product',
        label: 'Voir le détail',
        productId: results[0]._id
      });
      actions.push({
        type: 'add_to_list',
        label: 'Ajouter à ma liste',
        productId: results[0]._id
      });
    }

    // Réponse
    return res.json({
      success: true,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      query: query,
      filters: filters,
      resultsCount: results.length,
      results: results.slice(0, 5),
      explanation: explanation,
      actions: actions,
      debug: {
        extractedEntities: intentResult.extractedEntities,
        userContext: userContext
      }
    });

  } catch (error) {
    console.error('[AI Query] Erreur:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de votre requête.',
      message: error.message
    });
  }
});

// ============================================
// ROUTES LEGACY (avec aiService si disponible)
// ============================================

router.post('/chat', authMiddleware, async (req, res) => {
  const aiSvc = getAIService();
  
  if (!aiSvc) {
    return res.status(503).json({
      success: false,
      error: 'Service IA non disponible.'
    });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message requis'
      });
    }

    const response = await aiSvc.generateCompletion(message);

    return res.json({
      success: true,
      response: response
    });

  } catch (error) {
    console.error('[AI Chat] Erreur:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/analyze', authMiddleware, async (req, res) => {
  const aiSvc = getAIService();
  
  if (!aiSvc) {
    return res.status(503).json({
      success: false,
      error: 'Service IA non disponible.'
    });
  }

  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'productId requis'
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    const analysis = `Analyse du produit ${product.name} (score: ${product.scores?.overallScore || 'N/A'}/100)`;

    return res.json({
      success: true,
      analysis: analysis,
      product: product
    });

  } catch (error) {
    console.error('[AI Analyze] Erreur:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ============================================
// ENRICHISSEMENT IA (POST /api/ai/enrich)
// ============================================
router.post('/enrich', enrichHandler);

module.exports = router;
