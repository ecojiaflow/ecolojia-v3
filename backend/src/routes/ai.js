// backend/src/routes/ai.js
const express = require('express');
const router = express.Router();

// Import des middlewares auth avec fallback
let authenticateUser, checkQuota;
try {
  const authModule = require('../middleware/auth');
  authenticateUser = authModule.authenticateUser || authModule.auth || authModule;
  checkQuota = authModule.checkQuota || ((type) => (req, res, next) => {
    req.quotaRemaining = 5;
    req.decrementQuota = async () => {};
    next();
  });
} catch (error) {
  console.log('[AI] Auth middleware not found, using fallback');
  authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      req.userId = 'test-user-id';
      req.user = { _id: 'test-user-id', tier: 'free' };
    }
    next();
  };
  checkQuota = (type) => (req, res, next) => {
    req.quotaRemaining = req.user?.tier === 'premium' ? 500 : 5;
    req.decrementQuota = async () => {};
    next();
  };
}

// Logger simple
const logger = {
  info: (...args) => console.log('[AI]', ...args),
  error: (...args) => console.error('[AI ERROR]', ...args),
  warn: (...args) => console.warn('[AI WARN]', ...args)
};

// Helper pour gérer les erreurs async
const handleAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    logger.error('Async error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur serveur'
    });
  });
};

// Base de connaissances mockée
const knowledgeBase = {
  nova: {
    '1': 'Aliments non transformés ou minimalement transformés',
    '2': 'Ingrédients culinaires transformés',
    '3': 'Aliments transformés',
    '4': 'Aliments ultra-transformés'
  },
  additives: {
    'E322': {
      name: 'Lécithines',
      risk: 'low',
      description: 'Émulsifiant naturel souvent extrait du soja'
    },
    'E471': {
      name: 'Mono- et diglycérides d\'acides gras',
      risk: 'medium',
      description: 'Émulsifiant synthétique'
    }
  },
  recommendations: {
    lowScore: 'Je recommande de chercher des alternatives avec moins d\'additifs et un degré de transformation plus faible.',
    highScore: 'Excellent choix ! Ce produit présente un bon profil nutritionnel.',
    alternatives: 'Voici quelques alternatives plus saines que vous pourriez considérer...'
  }
};

// Générateur de réponses IA
const generateAIResponse = (message, context = {}) => {
  const lowerMessage = message.toLowerCase();
  
  // Réponses contextuelles basées sur le message
  if (lowerMessage.includes('nova')) {
    return `La classification NOVA est un système qui catégorise les aliments selon leur degré de transformation:\n\n` +
           `• Groupe 1: ${knowledgeBase.nova['1']}\n` +
           `• Groupe 2: ${knowledgeBase.nova['2']}\n` +
           `• Groupe 3: ${knowledgeBase.nova['3']}\n` +
           `• Groupe 4: ${knowledgeBase.nova['4']}\n\n` +
           `Les aliments du groupe 4 sont à limiter car ils contiennent souvent de nombreux additifs et sont associés à des risques pour la santé.`;
  }
  
  if (lowerMessage.includes('additif') || lowerMessage.includes('e322') || lowerMessage.includes('e471')) {
    return `Les additifs alimentaires sont des substances ajoutées aux aliments pour améliorer leur conservation, texture ou goût.\n\n` +
           `Par exemple:\n` +
           `• E322 (Lécithines): ${knowledgeBase.additives.E322.description}\n` +
           `• E471: ${knowledgeBase.additives.E471.description}\n\n` +
           `Il est préférable de privilégier les produits avec peu ou pas d'additifs.`;
  }
  
  if (lowerMessage.includes('alternative')) {
    return knowledgeBase.recommendations.alternatives + '\n\n' +
           `1. Purée d'amandes ou de noisettes bio\n` +
           `2. Pâte à tartiner maison\n` +
           `3. Confiture de fruits sans sucre ajouté\n` +
           `4. Beurre de cacahuète naturel`;
  }
  
  // Réponse générale
  return `Je suis votre assistant nutritionnel ECOLOJIA. Je peux vous aider à:\n\n` +
         `• Comprendre les analyses de produits\n` +
         `• Expliquer la classification NOVA\n` +
         `• Décoder les additifs alimentaires\n` +
         `• Suggérer des alternatives plus saines\n` +
         `• Répondre à vos questions nutritionnelles\n\n` +
         `Que souhaitez-vous savoir?`;
};

// POST /api/ai/chat - Chat avec l'IA
router.post('/chat', authenticateUser, checkQuota('chat'), handleAsync(async (req, res) => {
  const userId = req.userId;
  const { message, context, conversationId } = req.body;
  
  logger.info('AI chat request:', { userId, message: message?.substring(0, 50) });
  
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
  
  try {
    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Générer la réponse
    const response = generateAIResponse(message, context);
    
    // Décrémenter le quota
    if (req.decrementQuota) {
      await req.decrementQuota();
    }
    
    res.json({
      success: true,
      response,
      conversationId: conversationId || `conv-${Date.now()}`,
      quotaRemaining: req.quotaRemaining || 4,
      usage: {
        promptTokens: Math.floor(message.length / 4),
        completionTokens: Math.floor(response.length / 4),
        totalTokens: Math.floor((message.length + response.length) / 4)
      }
    });
  } catch (error) {
    logger.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération de la réponse'
    });
  }
}));

// GET /api/ai/suggestions - Suggestions contextuelles
router.get('/suggestions', authenticateUser, handleAsync(async (req, res) => {
  const { productId, category } = req.query;
  
  logger.info('AI suggestions requested:', { productId, category });
  
  const suggestions = {
    questions: [
      'Qu\'est-ce que la classification NOVA ?',
      'Ce produit contient-il des additifs préoccupants ?',
      'Quelles sont les alternatives plus saines ?',
      'Comment améliorer mon alimentation ?'
    ],
    tips: [
      'Privilégiez les aliments du groupe NOVA 1 et 2',
      'Évitez les produits avec plus de 5 additifs',
      'Lisez toujours la liste des ingrédients',
      'Préférez les produits bio quand possible'
    ],
    relatedTopics: [
      'Comprendre les étiquettes nutritionnelles',
      'Les additifs à éviter',
      'Alimentation équilibrée',
      'Impact environnemental des aliments'
    ]
  };
  
  res.json({
    success: true,
    suggestions
  });
}));

// POST /api/ai/analyze-text - Analyser un texte (ingrédients, etc)
router.post('/analyze-text', authenticateUser, handleAsync(async (req, res) => {
  const { text, type = 'ingredients' } = req.body;
  
  logger.info('Text analysis requested:', { type, textLength: text?.length });
  
  if (!text) {
    return res.status(400).json({
      success: false,
      error: 'Texte requis'
    });
  }
  
  // Analyse mockée
  const analysis = {
    type,
    detectedItems: [],
    concerns: [],
    score: 0
  };
  
  if (type === 'ingredients') {
    // Détecter quelques ingrédients courants
    const ingredients = text.toLowerCase();
    
    if (ingredients.includes('sucre') || ingredients.includes('sugar')) {
      analysis.detectedItems.push('Sucre');
      analysis.concerns.push('Teneur élevée en sucre');
    }
    
    if (ingredients.includes('huile de palme') || ingredients.includes('palm oil')) {
      analysis.detectedItems.push('Huile de palme');
      analysis.concerns.push('Impact environnemental');
    }
    
    if (ingredients.includes('e322')) {
      analysis.detectedItems.push('E322 - Lécithines');
    }
    
    analysis.score = analysis.concerns.length > 0 ? 60 : 80;
  }
  
  res.json({
    success: true,
    analysis
  });
}));

// GET /api/ai/faq - FAQ intelligente
router.get('/faq', handleAsync(async (req, res) => {
  const { topic } = req.query;
  
  logger.info('FAQ requested:', { topic });
  
  const faq = [
    {
      category: 'NOVA',
      questions: [
        {
          q: 'Qu\'est-ce que la classification NOVA ?',
          a: 'La classification NOVA est un système qui catégorise les aliments selon leur degré de transformation, de 1 (non transformés) à 4 (ultra-transformés).'
        },
        {
          q: 'Pourquoi éviter les aliments NOVA 4 ?',
          a: 'Les aliments ultra-transformés (NOVA 4) contiennent souvent de nombreux additifs et sont associés à des risques accrus d\'obésité et de maladies chroniques.'
        }
      ]
    },
    {
      category: 'Additifs',
      questions: [
        {
          q: 'Les additifs E sont-ils dangereux ?',
          a: 'Tous les additifs E ne sont pas dangereux. Certains sont naturels (E322 - lécithines) tandis que d\'autres sont à éviter en excès.'
        },
        {
          q: 'Comment reconnaître les additifs à éviter ?',
          a: 'Privilégiez les produits avec peu d\'additifs. Évitez particulièrement les colorants artificiels (E102-E180) et certains conservateurs.'
        }
      ]
    }
  ];
  
  const filteredFaq = topic 
    ? faq.filter(f => f.category.toLowerCase() === topic.toLowerCase())
    : faq;
  
  res.json({
    success: true,
    faq: filteredFaq
  });
}));

// Route de test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'AI routes are working!',
    routes: [
      'POST /api/ai/chat',
      'GET /api/ai/suggestions',
      'POST /api/ai/analyze-text',
      'GET /api/ai/faq'
    ],
    quotas: {
      free: '5 questions/jour',
      premium: '500 questions/mois'
    }
  });
});

module.exports = router;