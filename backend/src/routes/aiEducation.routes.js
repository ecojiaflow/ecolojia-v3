const express = require('express');
const router = express.Router();

// ========================================
// ENDPOINT TEST (à supprimer après debug)
// ============================================================================
// ROUTES EDUCATION STATIQUE (Principes + Pratiques par univers)
// Ajouté le 06/01/2026 - Flow "Comprendre ce que je consomme"
// ============================================================================

// Charger donnees education statique
let educationData = null;

function loadEducationData() {
  if (!educationData) {
    try {
      educationData = require('../knowledge/education.json');
      console.log('[Education] Donnees chargees:', Object.keys(educationData.universes).length, 'univers');
    } catch (error) {
      console.error('[Education] Erreur chargement education.json:', error.message);
      educationData = { universes: {} };
    }
  }
  return educationData;
}

/**
 * GET /api/education/universes
 * Liste des 3 univers (summary pour affichage)
 */
router.get('/universes', (req, res) => {
  try {
    const data = loadEducationData();
    
    const universes = Object.values(data.universes).map(u => ({
      id: u.id,
      name: u.name,
      icon: u.icon,
      color: u.color,
      tagline: u.tagline,
      principlesCount: u.principles.length,
      practicesCount: u.practices.length,
      sources: u.sources
    }));
    
    res.json({
      success: true,
      version: data.version,
      universes
    });
  } catch (error) {
    console.error('[Education] Erreur GET /universes:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

/**
 * GET /api/education/universes/:universeId
 * Detail complet d un univers (principes + pratiques)
 */
router.get('/universes/:universeId', (req, res) => {
  try {
    const data = loadEducationData();
    const { universeId } = req.params;
    
    const universe = data.universes[universeId];
    
    if (!universe) {
      return res.status(404).json({
        success: false,
        error: 'Univers non trouve',
        availableUniverses: Object.keys(data.universes)
      });
    }
    
    res.json({
      success: true,
      universe: {
        ...universe,
        displayConfig: data.displayConfig
      }
    });
  } catch (error) {
    console.error('[Education] Erreur GET /universes/:universeId:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ========================================
router.get('/test', (req, res) => {
  console.log('[AI Education] GET /test appelé !');
  res.json({
    success: true,
    message: 'Route AI Education fonctionne !',
    timestamp: new Date().toISOString()
  });
});

const aiEducationService = require('../services/aiEducation.service');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware');
const rateLimit = require('express-rate-limit');

/**
 * AI EDUCATION ROUTES - ECOLOJIA V3.1
 * Routes API pour fonctionnalités IA éducatives (cosmétiques/détergents)
 */

// ============================================================================
// RATE LIMITERS (Freemium vs Premium)
// ============================================================================

// Rate limiter gratuit : 3 questions IA / jour
const freeQuestionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24h
  max: 3,
  message: {
    success: false,
    error: 'Limite gratuite atteinte (3 questions/jour)',
    upgrade: {
      message: 'Passez Premium pour questions illimitées',
      price: '4,99€/mois',
      benefits: [
        'Questions IA illimitées',
        'Plans repas personnalisés',
        'Export liste courses',
        'Dashboard avancé'
      ]
    }
  },
  // Skip si utilisateur Premium
  skip: (req) => req.user?.isPremium === true,
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================================================
// ROUTE 1 : EXPLIQUER SCORE PRODUIT
// ============================================================================

/**
 * POST /api/education/explain
 * Explique pourquoi un produit a ce score (4 blocs pédagogiques)
 * 
 * Body :
 * {
 *   productId: "string",
 *   userProfile?: { diet, allergens, goals, sensitiveSkin }
 * }
 * 
 * Response :
 * {
 *   success: true,
 *   explanation: "string (markdown formaté)",
 *   sources: [{ organization: "ANSES", mentioned: true }],
 *   disclaimerShown: true
 * }
 */
router.post('/explain', async (req, res) => {
  try {
    const { productId, userProfile } = req.body;
    
    // Validation
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'productId requis'
      });
    }
    
    // Récupérer produit
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit introuvable'
      });
    }
    
    // Vérifier catégorie (uniquement cosmétique/détergent)
    if (product.categoryType !== 'cosmetic' && product.categoryType !== 'detergent') {
      return res.status(400).json({
        success: false,
        error: 'Cette fonctionnalité est réservée aux produits cosmétiques et détergents'
      });
    }
    
    console.log(`[API Education] Explication demandée : ${product.name}`);
    
    // Appeler service IA
    const result = await aiEducationService.explainProductScore(
      product,
      userProfile || {}
    );
    
    // Log analytics (optionnel)
    if (req.user) {
      // Sauvegarder interaction pour améliorer IA (RGPD compliant)
    }
    
    return res.json(result);
    
  } catch (error) {
    console.error('[API Education] Erreur /explain :', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération de l\'explication'
    });
  }
});

// ============================================================================
// ROUTE 2 : COMPARER PRODUITS
// ============================================================================

/**
 * POST /api/education/compare
 * Compare 2-3 produits scientifiquement
 * 
 * Body :
 * {
 *   productIds: ["id1", "id2", "id3?"],
 *   userProfile?: { diet, allergens, budget, sensitiveSkin },
 *   criteria?: "overall" | "health" | "eco"
 * }
 * 
 * Response :
 * {
 *   success: true,
 *   comparison: "string (markdown formaté)",
 *   productsCompared: [{ id, name }],
 *   disclaimerShown: true
 * }
 */
router.post('/compare', async (req, res) => {
  try {
    const { productIds, userProfile, criteria } = req.body;
    
    // Validation
    if (!productIds || !Array.isArray(productIds) || productIds.length < 2 || productIds.length > 3) {
      return res.status(400).json({
        success: false,
        error: 'Fournir 2-3 productIds à comparer'
      });
    }
    
    // Récupérer produits
    const products = await Product.find({ _id: { $in: productIds } });
    
    if (products.length !== productIds.length) {
      return res.status(404).json({
        success: false,
        error: 'Un ou plusieurs produits introuvables'
      });
    }
    
    // Vérifier que tous sont cosmétiques ou détergents
    const validCategories = products.every(p => 
      p.categoryType === 'cosmetic' || p.categoryType === 'detergent'
    );
    
    if (!validCategories) {
      return res.status(400).json({
        success: false,
        error: 'Tous les produits doivent être cosmétiques ou détergents'
      });
    }
    
    console.log(`[API Education] Comparaison demandée : ${products.length} produits`);
    
    // Appeler service IA
    const result = await aiEducationService.compareProducts(
      products,
      userProfile || {},
      criteria || 'overall'
    );
    
    return res.json(result);
    
  } catch (error) {
    console.error('[API Education] Erreur /compare :', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la comparaison'
    });
  }
});

// ============================================================================
// ROUTE 3 : POSER QUESTION LIBRE (RATE-LIMITED)
// ============================================================================

/**
 * POST /api/education/ask
 * Pose une question libre à l'IA éducative
 * 
 * RATE-LIMITED : 3/jour gratuit, illimité premium
 * 
 * Body :
 * {
 *   question: "string (5-500 caractères)",
 *   context?: {
 *     productId?: "string",
 *     categoryType?: "cosmetic" | "detergent"
 *   }
 * }
 * 
 * Response :
 * {
 *   success: true,
 *   answer: "string (markdown formaté)",
 *   question: "string",
 *   sources: [{ organization, mentioned }],
 *   disclaimerShown: true
 * }
 */
router.post(
  '/ask',
  authenticateToken, // Auth obligatoire (pour rate limiting)
  freeQuestionLimiter, // 3/jour gratuit
  async (req, res) => {
    try {
      const { question, context } = req.body;
      
      // Validation
      if (!question || typeof question !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Question requise'
        });
      }
      
      if (question.length < 5 || question.length > 500) {
        return res.status(400).json({
          success: false,
          error: 'Question doit faire entre 5 et 500 caractères'
        });
      }
      
      console.log(`[API Education] Question posée par ${req.user.email} : "${question.substring(0, 50)}..."`);
      
      // Enrichir contexte si productId fourni
      let enrichedContext = { ...context };
      
      if (context?.productId) {
        const product = await Product.findById(context.productId);
        if (product) {
          enrichedContext.product = product;
        }
      }
      
      // Appeler service IA
      const result = await aiEducationService.answerQuestion(
        question,
        enrichedContext
      );
      
      // Log analytics (RGPD compliant)
      // await UserInteraction.create({
      //   userId: req.user._id,
      //   type: 'ai_question',
      //   question: question.substring(0, 100), // Tronquer pour RGPD
      //   category: context?.categoryType || 'general'
      // });
      
      return res.json(result);
      
    } catch (error) {
      console.error('[API Education] Erreur /ask :', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération de la réponse'
      });
    }
  }
);

// ============================================================================
// ROUTE 4 : SUGGÉRER ALTERNATIVES
// ============================================================================

/**
 * GET /api/education/alternatives/:productId
 * Suggère alternatives adaptées au profil utilisateur
 * 
 * Query params :
 * ?count=3 (nombre d'alternatives, défaut 3)
 * 
 * Response :
 * {
 *   success: true,
 *   alternatives: [{ product, reason, scoreImprovement }]
 * }
 */
router.get('/alternatives/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const count = parseInt(req.query.count) || 3;
    
    // Récupérer produit
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Produit introuvable'
      });
    }
    
    console.log(`[API Education] Alternatives demandées : ${product.name}`);
    
    // Récupérer profil utilisateur si auth
    const userProfile = req.user ? {
      diet: req.user.profile?.diet,
      allergens: req.user.profile?.allergens,
      budget: req.user.profile?.budget,
      sensitiveSkin: req.user.profile?.sensitiveSkin
    } : {};
    
    // Appeler service IA
    const result = await aiEducationService.suggestAlternatives(
      product,
      userProfile,
      count
    );
    
    return res.json(result);
    
  } catch (error) {
    console.error('[API Education] Erreur /alternatives :', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche d\'alternatives'
    });
  }
});

// ============================================================================
// ROUTE 5 : STATS IA (Admin/Debug)
// ============================================================================

/**
 * GET /api/education/stats
 * Retourne statistiques usage IA éducative
 * (Réservé admin ou debug)
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Vérifier si admin (optionnel)
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ error: 'Accès réservé admin' });
    // }
    
    return res.json({
      success: true,
      stats: {
        message: 'Stats IA en cours d\'implémentation',
        endpoints: [
          'POST /explain',
          'POST /compare',
          'POST /ask (rate-limited)',
          'GET /alternatives/:id'
        ]
      }
    });
    
  } catch (error) {
    console.error('[API Education] Erreur /stats :', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur récupération stats'
    });
  }
});

module.exports = router;
