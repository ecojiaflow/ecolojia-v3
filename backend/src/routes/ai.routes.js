// backend/src/routes/ai.routes.js
// Routes AI avec mode dev sans auth

const express = require('express');
const router = express.Router();
const { authenticateUser, checkQuota } = require('../middleware/auth');

// Mode dev sans auth si ALLOW_UNAUTH_AI=1
const isDev = process.env.NODE_ENV === 'development' || process.env.ALLOW_UNAUTH_AI === '1';

// Middleware conditionnel pour dev
const authMiddleware = isDev ? (req, res, next) => {
  // En dev, créer un utilisateur fictif
  req.userId = 'dev-user';
  req.user = {
    _id: 'dev-user',
    email: 'dev@ecolojia.com',
    tier: 'premium',
    quotas: {
      aiQuestionsLimit: 999,
      aiQuestionsUsed: 0
    }
  };
  next();
} : authenticateUser;

// Service de chat simplifié pour dev si NutritionistChatService n'existe pas
let chatService;
try {
  chatService = require('../services/ai/NutritionistChatService');
} catch (err) {
  console.log('[AI Routes] NutritionistChatService not found, using fallback');
  
  // Service fallback pour dev
  chatService = {
    async sendMessage(userId, message, context) {
      // Si DeepSeek configuré
      if (process.env.DEEPSEEK_API_KEY) {
        const axios = require('axios');
        try {
          const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
              model: 'deepseek-chat',
              messages: [
                {
                  role: 'system',
                  content: `Tu es ECOLOJIA, assistant expert en nutrition. ${context?.productName ? `Contexte: ${context.productName}` : ''}`
                },
                { role: 'user', content: message }
              ],
              temperature: 0.7,
              max_tokens: 500
            },
            {
              headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          return {
            response: response.data.choices[0].message.content,
            conversationId: 'conv-' + Date.now(),
            quotaRemaining: 999
          };
        } catch (error) {
          console.error('[DeepSeek] Error:', error.message);
          throw error;
        }
      }
      
      // Mode démo sans API
      return {
        response: `Je suis ECOLOJIA. Vous demandez: "${message}". ${context?.productName ? `Pour ${context.productName}, ` : ''}je recommande de privilégier les produits NOVA 1-2 et Nutri-Score A-B.`,
        conversationId: 'demo-' + Date.now(),
        quotaRemaining: 999
      };
    },
    
    async answerProductQuestion(userId, productId, question) {
      return this.sendMessage(userId, question, { productId });
    },
    
    async compareProducts(userId, productIds) {
      return {
        response: `Comparaison de ${productIds.length} produits: Privilégiez toujours les produits avec le meilleur score NOVA et Nutri-Score.`,
        quotaRemaining: 999
      };
    },
    
    async getQuestionSuggestions(userId, context) {
      return [
        "Qu'est-ce que la classification NOVA ?",
        "Comment lire un Nutri-Score ?",
        "Quels additifs éviter ?",
        "Ce produit est-il bon pour la santé ?",
        "Quelle est la différence entre bio et conventionnel ?"
      ];
    },
    
    async generateSuggestions(userId) {
      return {
        suggestions: [
          "Privilégiez les aliments bruts et peu transformés",
          "Lisez toujours la liste des ingrédients",
          "Méfiez-vous des produits avec plus de 5 additifs"
        ]
      };
    },
    
    async getFullConversation(userId, conversationId) {
      return [{
        role: 'user',
        message: 'Question de test',
        timestamp: new Date()
      }, {
        role: 'assistant',
        message: 'Réponse de test',
        timestamp: new Date()
      }];
    },
    
    async clearConversation(userId) {
      return { message: 'Conversation réinitialisée' };
    }
  };
}

/**
 * POST /api/ai/chat
 * Envoyer un message au chat IA
 */
router.post('/chat', authMiddleware, async (req, res) => {
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
        error: 'Message trop long (max 1000 caractères)'
      });
    }
    
    console.log('[AI] Chat request:', { userId, message: message.substring(0, 50) + '...' });
    
    // Appeler le service de chat
    const result = await chatService.sendMessage(
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
    
    if (error.message?.includes('Quota')) {
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
 * POST /api/ai/product-question
 * Poser une question sur un produit spécifique
 */
router.post('/product-question', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, question } = req.body;
    
    if (!productId || !question) {
      return res.status(400).json({
        success: false,
        error: 'ProductId et question requis'
      });
    }
    
    const result = await chatService.answerProductQuestion(
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
router.post('/compare-products', authMiddleware, async (req, res) => {
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
    
    const result = await chatService.compareProducts(
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
 * Obtenir des suggestions personnalisées
 */
router.get('/suggestions', authMiddleware, async (req, res) => {
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
      
      const suggestions = await chatService.getQuestionSuggestions(
        userId,
        context
      );
      
      result = { suggestions };
      
    } else {
      // Conseils personnalisés
      result = await chatService.generateSuggestions(userId);
    }
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('[AI] Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération des suggestions'
    });
  }
});

/**
 * GET /api/ai/conversation/:conversationId
 * Récupérer une conversation complète
 */
router.get('/conversation/:conversationId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    
    const conversation = await chatService.getFullConversation(
      userId,
      conversationId
    );
    
    if (!conversation || conversation.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation non trouvée'
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
      error: 'Erreur lors de la récupération de la conversation'
    });
  }
});

/**
 * DELETE /api/ai/conversation
 * Réinitialiser la conversation
 */
router.delete('/conversation', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await chatService.clearConversation(userId);
    
    res.json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('[AI] Clear conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la réinitialisation'
    });
  }
});

/**
 * GET /api/ai/quota-status
 * Obtenir le statut des quotas IA
 */
router.get('/quota-status', authMiddleware, async (req, res) => {
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
      error: 'Erreur lors de la récupération du quota'
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
          answer: "NOVA est un système qui classe les aliments en 4 groupes selon leur degré de transformation : 1) Non transformés, 2) Ingrédients culinaires, 3) Transformés, 4) Ultra-transformés. Les aliments du groupe 4 sont Ã  limiter.",
          keywords: ['nova', 'classification', 'transformation']
        },
        {
          question: "Pourquoi éviter les aliments NOVA 4 ?",
          answer: "Les aliments ultra-transformés contiennent souvent de nombreux additifs, du sucre et du sel en excès. Ils sont associés Ã  un risque accru d'obésité, de diabète et de maladies cardiovasculaires.",
          keywords: ['nova 4', 'ultra-transformé', 'santé']
        }
      ],
      additifs: [
        {
          question: "Tous les additifs E sont-ils dangereux ?",
          answer: "Non, tous les additifs ne sont pas dangereux. Certains sont naturels (E100 - curcumine, E322 - lécithines). D'autres sont plus controversés. L'important est leur quantité et fréquence de consommation.",
          keywords: ['additifs', 'e', 'dangereux']
        },
        {
          question: "Quels additifs éviter absolument ?",
          answer: "Les plus controversés incluent : E102, E110, E124 (colorants azoïques), E320-E321 (BHA/BHT), E249-E252 (nitrites/nitrates). Ils peuvent causer hyperactivité, allergies ou être cancérogènes.",
          keywords: ['additifs', 'éviter', 'dangereux']
        }
      ],
      nutrition: [
        {
          question: "Comment lire une étiquette nutritionnelle ?",
          answer: "Vérifiez d'abord la liste d'ingrédients (ordre décroissant). Regardez les valeurs pour 100g : sucres (<5g idéal), graisses saturées (<2g), sel (<1g). Méfiez-vous des portions trompeuses.",
          keywords: ['étiquette', 'nutritionnel', 'lire']
        },
        {
          question: "Qu'est-ce que le Nutri-Score ?",
          answer: "Le Nutri-Score est un logo qui note la qualité nutritionnelle de A (meilleur) Ã  E. Il prend en compte les nutriments favorables (fibres, protéines) et défavorables (sucre, sel, graisses saturées).",
          keywords: ['nutriscore', 'score', 'nutritionnel']
        }
      ]
    };
    
    // Filtrer par catégorie si spécifiée
    let results = category && faq[category] ? faq[category] : Object.values(faq).flat();
    
    // Recherche par mots-clés si spécifiée
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
      error: 'Erreur lors de la récupération de la FAQ'
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
    mode: isDev ? 'development' : 'production',
    authRequired: !isDev,
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
    },
    timestamp: new Date()
  });
});

module.exports = router;