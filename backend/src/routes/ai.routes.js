// backend/src/routes/ai.routes.js
// Routes AI utilisant le NutritionistChatService cree

const express = require('express');
const router = express.Router();
const { authenticateUser, checkQuota } = require('../middleware/auth');
const NutritionistChatService = require('../services/ai/NutritionistChatService');

/**
 * POST /api/ai/chat
 * Envoyer un message au chat IA
 */
router.post('/chat', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { message, context, conversationId } = req.body;
    
    // Validation
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message requis'
      });
    }
    
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message trop long (max 1000 caracteres)'
      });
    }
    
    console.log('[AI] Chat request from user:', userId);
    
    // Appeler le service de chat
    const result = await NutritionistChatService.sendMessage(
      userId,
      message,
      context
    );
    
    res.json({
      success: true,
      response: result.response,
      conversationId: result.conversationId,
      quotaRemaining: result.quotaRemaining,
      actions: result.actions
    });
    
  } catch (error) {
    console.error('[AI] Chat error:', error);
    
    if (error.message.includes('Quota')) {
      return res.status(403).json({
        success: false,
        error: error.message,
        upgradeUrl: '/pricing'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la generation de la reponse'
    });
  }
});

/**
 * POST /api/ai/product-question
 * Poser une question sur un produit specifique
 */
router.post('/product-question', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, question } = req.body;
    
    if (!productId || !question) {
      return res.status(400).json({
        success: false,
        error: 'ProductId et question requis'
      });
    }
    
    const result = await NutritionistChatService.answerProductQuestion(
      userId,
      productId,
      question
    );
    
    res.json({
      success: true,
      response: result.response,
      quotaRemaining: result.quotaRemaining
    });
    
  } catch (error) {
    console.error('[AI] Product question error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'analyse du produit'
    });
  }
});

/**
 * POST /api/ai/compare-products
 * Comparer plusieurs produits
 */
router.post('/compare-products', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Au moins 2 produits requis pour la comparaison'
      });
    }
    
    if (productIds.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 produits pour la comparaison'
      });
    }
    
    const result = await NutritionistChatService.compareProducts(
      userId,
      productIds
    );
    
    res.json({
      success: true,
      response: result.response,
      quotaRemaining: result.quotaRemaining
    });
    
  } catch (error) {
    console.error('[AI] Compare products error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la comparaison'
    });
  }
});

/**
 * GET /api/ai/suggestions
 * Obtenir des suggestions personnalisees
 */
router.get('/suggestions', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { type = 'general' } = req.query;
    
    let result;
    
    if (type === 'questions') {
      // Suggestions de questions
      const context = {
        lastProduct: req.query.lastProduct,
        userHasAllergies: req.user.preferences?.allergies?.length > 0
      };
      
      const suggestions = await NutritionistChatService.getQuestionSuggestions(
        userId,
        context
      );
      
      result = { suggestions };
      
    } else {
      // Conseils personnalises
      result = await NutritionistChatService.generateSuggestions(userId);
    }
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('[AI] Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la generation des suggestions'
    });
  }
});

/**
 * GET /api/ai/conversation/:conversationId
 * Recuperer une conversation complete
 */
router.get('/conversation/:conversationId', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    
    const conversation = await NutritionistChatService.getFullConversation(
      userId,
      conversationId
    );
    
    if (!conversation || conversation.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation non trouvee'
      });
    }
    
    res.json({
      success: true,
      conversation,
      messageCount: conversation.length
    });
    
  } catch (error) {
    console.error('[AI] Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation de la conversation'
    });
  }
});

/**
 * DELETE /api/ai/conversation
 * Reinitialiser la conversation
 */
router.delete('/conversation', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await NutritionistChatService.clearConversation(userId);
    
    res.json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('[AI] Clear conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la reinitialisation'
    });
  }
});

/**
 * GET /api/ai/quota-status
 * Obtenir le statut des quotas IA
 */
router.get('/quota-status', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    const limit = user.tier === 'premium' 
      ? (user.quotas?.aiQuestionsLimit || 500)
      : (user.quotas?.aiQuestionsLimit || 5);
      
    const used = user.quotas?.aiQuestionsUsed || 0;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - used);
    
    res.json({
      success: true,
      quota: {
        tier: user.tier,
        limit,
        used,
        remaining,
        unlimited: limit === -1,
        resetDate: user.tier === 'premium' 
          ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          : new Date(new Date().setHours(24, 0, 0, 0))
      }
    });
    
  } catch (error) {
    console.error('[AI] Quota status error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation du quota'
    });
  }
});

/**
 * GET /api/ai/faq
 * FAQ intelligente
 */
router.get('/faq', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    const faq = {
      nova: [
        {
          question: "Qu'est-ce que la classification NOVA ?",
          answer: "NOVA est un systeme qui classe les aliments en 4 groupes selon leur degre de transformation : 1) Non transformes, 2) Ingredients culinaires, 3) Transformes, 4) Ultra-transformes. Les aliments du groupe 4 sont   limiter.",
          keywords: ['nova', 'classification', 'transformation']
        },
        {
          question: "Pourquoi eviter les aliments NOVA 4 ?",
          answer: "Les aliments ultra-transformes contiennent souvent de nombreux additifs, du sucre et du sel en exces. Ils sont associes   un risque accru d'obesite, de diabete et de maladies cardiovasculaires.",
          keywords: ['nova 4', 'ultra-transforme', 'sante']
        }
      ],
      additifs: [
        {
          question: "Tous les additifs E sont-ils dangereux ?",
          answer: "Non, tous les additifs ne sont pas dangereux. Certains sont naturels (E100 - curcumine, E322 - lecithines). D'autres sont plus controverses. L'important est leur quantite et frequence de consommation.",
          keywords: ['additifs', 'e', 'dangereux']
        },
        {
          question: "Quels additifs eviter absolument ?",
          answer: "Les plus controverses incluent : E102, E110, E124 (colorants azoiques), E320-E321 (BHA/BHT), E249-E252 (nitrites/nitrates). Ils peuvent causer hyperactivite, allergies ou etre cancerigenes.",
          keywords: ['additifs', 'eviter', 'dangereux']
        }
      ],
      nutrition: [
        {
          question: "Comment lire une etiquette nutritionnelle ?",
          answer: "Verifiez d'abord la liste d'ingredients (ordre decroissant). Regardez les valeurs pour 100g : sucres (<5g ideal), graisses saturees (<2g), sel (<1g). Mefiez-vous des portions trompeuses.",
          keywords: ['etiquette', 'nutritionnel', 'lire']
        },
        {
          question: "Qu'est-ce que le Nutri-Score ?",
          answer: "Le Nutri-Score est un logo qui note la qualite nutritionnelle de A (meilleur)   E. Il prend en compte les nutriments favorables (fibres, proteines) et defavorables (sucre, sel, graisses saturees).",
          keywords: ['nutriscore', 'score', 'nutritionnel']
        }
      ]
    };
    
    // Filtrer par categorie si specifiee
    let results = category && faq[category] ? faq[category] : Object.values(faq).flat();
    
    // Recherche par mots-cles si specifiee
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(item => 
        item.question.toLowerCase().includes(searchLower) ||
        item.answer.toLowerCase().includes(searchLower) ||
        item.keywords.some(k => k.includes(searchLower))
      );
    }
    
    res.json({
      success: true,
      faq: results,
      categories: Object.keys(faq)
    });
    
  } catch (error) {
    console.error('[AI] FAQ error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation de la FAQ'
    });
  }
});

/**
 * GET /api/ai/health
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'ai',
    status: 'operational',
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
      premium: '500 questions/mois'
    },
    timestamp: new Date()
  });
});

module.exports = router;
