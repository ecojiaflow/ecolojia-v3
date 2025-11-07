const express = require('express');
const router = express.Router();
const { enrichHandler } = require\('../controllers/ai.controller'\');
const { authenticateUser, checkQuota } = require('../middleware/auth');
const conversationalAI = require('../services/ai/conversationalAI');

// Mode dev sans auth si ALLOW_UNAUTH_AI=1
const isDev = process.env.NODE_ENV === 'development' || process.env.ALLOW_UNAUTH_AI === '1';

// Middleware conditionnel pour dev
const authMiddleware = isDev ? (req, res, next) => {
  req.userId = 'dev-user';
  req.user = {
    _id: 'dev-user',
    email: 'dev@ecolojia.com',
    tier: 'premium',
    quotas: {
      aiQuestionsLimit: 999,
      aiQuestionsUsed: 0
    },
    profile: {
      diet: 'omnivore',
      allergens: [],
      goal: 'health',
      labels: { bioPriority: true }
    }
  };
  next();
} : authenticateUser;

/**
 * POST /api/ai/enrich
 * Alias de /api/ai pour compat mobile
 */
router.post('/enrich', authMiddleware, enrichHandler);

/**
 * POST /api/ai
 * Enrichissement IA universel (barcode/category/name + OCR)
 */
router.post('/', authMiddleware, enrichHandler);

/**
 * POST /api/ai/chat
 * Chat IA contextuel + profil utilisateur
 */
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { message, context } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message requis'
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message trop long (max 1000 caractères)'
      });
    }

    console.log('[AI] Chat request:', { userId, message: message.substring(0, 50) + '...' });

    // ⭐ NOUVEAU : Appel conversationalAI avec contexte + profil
    const result = await conversationalAI.chat(
      userId,
      message,
      context || { pageType: 'general' }
    );

    res.json({
      success: true,
      response: result.response,
      suggestions: result.suggestions,
      cached: result.cached,
      cost: result.cost,
      disclaimer: "💡 Je suis un assistant IA, pas un professionnel de santé. Pour avis médical, consultez un médecin."
    });

  } catch (error) {
    console.error('[AI] Chat error:', error);

    if (error.message?.includes('Quota') || error.message?.includes('User not found')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        upgradeUrl: '/pricing'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération de la réponse'
    });
  }
});

/**
 * GET /api/ai/suggestions
 * Suggestions contextuelles + profil
 */
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const { pageType, category, entityId } = req.query;
    
    const context = {
      pageType,
      category,
      entityId
    };

    const suggestions = conversationalAI.generateSuggestions(context, req.user);
    
    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('[AI] Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/health
 * Health check du service IA
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    mode: process.env.NODE_ENV || 'production',
    timestamp: new Date(),
    deepseek: {
      configured: !!process.env.DEEPSEEK_API_KEY,
      endpoint: 'https://api.deepseek.com/v1/chat/completions'
    },
    features: {
      chat: true,
      productAnalysis: true,
      comparison: true,
      suggestions: true,
      faq: true
    },
    quotas: {
      free: '5 questions/jour',
      premium: '500 questions/mois',
      dev: 'Illimité'
    }
  });
});

module.exports = router;
