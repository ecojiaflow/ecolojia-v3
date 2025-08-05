// backend/src/routes/analysis.routes.js
// Routes pour l'analyse universelle de produits

const express = require('express');
const router = express.Router();
const universalAnalyzer = require('../services/analysis/universalAnalyzer');
const { authenticateToken } = require('../middleware/auth');
const { validateAnalysis } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting selon le tier d'abonnement
const createRateLimiter = (tier) => {
  const limits = {
    free: { windowMs: 60 * 60 * 1000, max: 30 },      // 30 analyses/heure
    premium: { windowMs: 60 * 60 * 1000, max: 500 },   // 500 analyses/heure
    family: { windowMs: 60 * 60 * 1000, max: 1000 }    // 1000 analyses/heure
  };

  return rateLimit({
    ...limits[tier] || limits.free,
    keyGenerator: (req) => req.user.id,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Limite d\'analyses atteinte',
        upgradeRequired: tier === 'free',
        resetTime: req.rateLimit.resetTime
      });
    }
  });
};

// Middleware pour vérifier les quotas
const checkQuota = async (req, res, next) => {
  try {
    const user = req.user;
    const User = require('mongoose').model('User');
    
    const dbUser = await User.findById(user.id);
    
    // Vérifier les quotas selon le plan
    if (dbUser.subscription.tier === 'free') {
      if (dbUser.quotas.scansUsed >= dbUser.quotas.scansLimit) {
        return res.status(403).json({
          success: false,
          error: 'Quota mensuel atteint',
          upgradeRequired: true,
          quotas: {
            used: dbUser.quotas.scansUsed,
            limit: dbUser.quotas.scansLimit,
            resetDate: dbUser.quotas.scansResetDate
          }
        });
      }
    }
    
    // Incrémenter le compteur
    await User.findByIdAndUpdate(user.id, {
      $inc: { 'quotas.scansUsed': 1, 'quotas.totalScansAllTime': 1 }
    });
    
    next();
  } catch (error) {
    console.error('Erreur vérification quota:', error);
    next(error);
  }
};

/**
 * POST /api/v1/analyses
 * Analyse un produit (auto-détection de catégorie)
 */
router.post('/',
  authenticateToken,
  checkQuota,
  validateAnalysis,
  async (req, res) => {
    try {
      const {
        barcode,
        name,
        ingredients,
        category,
        method = 'manual'
      } = req.body;

      // Validation basique
      if (!barcode && !name && !ingredients) {
        return res.status(400).json({
          success: false,
          error: 'Au moins un paramètre requis: barcode, name ou ingredients'
        });
      }

      // Lancer l'analyse
      const result = await universalAnalyzer.analyze({
        barcode,
        name,
        ingredients,
        category,
        userId: req.user.id,
        method
      });

      // Log pour statistiques
      console.log(`✅ Analyse réussie: ${result.product?.name || barcode} (${result.metadata.category})`);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Erreur analyse:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de l\'analyse'
      });
    }
  }
);

/**
 * POST /api/v1/analyses/batch
 * Analyse plusieurs produits en une fois
 */
router.post('/batch',
  authenticateToken,
  checkQuota,
  async (req, res) => {
    try {
      const { products } = req.body;

      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Liste de produits requise'
        });
      }

      // Limiter le nombre de produits selon le tier
      const limits = {
        free: 10,
        premium: 50,
        family: 100
      };
      
      const userTier = req.user.subscription?.tier || 'free';
      const limit = limits[userTier];

      if (products.length > limit) {
        return res.status(400).json({
          success: false,
          error: `Limite de ${limit} produits pour votre abonnement`,
          upgradeRequired: userTier === 'free'
        });
      }

      // Lancer l'analyse batch
      const results = await universalAnalyzer.analyzeBatch(products, req.user.id);

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Erreur analyse batch:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de l\'analyse batch'
      });
    }
  }
);

/**
 * GET /api/v1/analyses
 * Récupère l'historique des analyses
 */
router.get('/',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        sort = '-timestamp'
      } = req.query;

      const Analysis = require('mongoose').model('Analysis');
      
      const query = { userId: req.user.id };
      if (category) {
        query['results.category'] = category;
      }

      const skip = (page - 1) * limit;
      
      const [analyses, total] = await Promise.all([
        Analysis.find(query)
          .populate('productId', 'name brand images.front barcode')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Analysis.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: analyses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Erreur récupération analyses:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des analyses'
      });
    }
  }
);

/**
 * GET /api/v1/analyses/:id
 * Récupère une analyse spécifique
 */
router.get('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const Analysis = require('mongoose').model('Analysis');
      
      const analysis = await Analysis.findOne({
        _id: req.params.id,
        userId: req.user.id
      }).populate('productId');

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Analyse non trouvée'
        });
      }

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Erreur récupération analyse:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'analyse'
      });
    }
  }
);

/**
 * DELETE /api/v1/analyses/:id
 * Supprime une analyse
 */
router.delete('/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const Analysis = require('mongoose').model('Analysis');
      
      const result = await Analysis.findOneAndDelete({
        _id: req.params.id,
        userId: req.user.id
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Analyse non trouvée'
        });
      }

      res.json({
        success: true,
        message: 'Analyse supprimée'
      });

    } catch (error) {
      console.error('Erreur suppression analyse:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression'
      });
    }
  }
);

/**
 * GET /api/v1/analyses/:id/alternatives
 * Trouve des alternatives pour un produit analysé
 */
router.get('/:id/alternatives',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        limit = 5,
        betterScoreOnly = true,
        sameCategory = true
      } = req.query;

      const Analysis = require('mongoose').model('Analysis');
      
      // Vérifier que l'analyse appartient à l'utilisateur
      const analysis = await Analysis.findOne({
        _id: req.params.id,
        userId: req.user.id
      });

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Analyse non trouvée'
        });
      }

      // Chercher des alternatives
      const alternatives = await universalAnalyzer.findAlternatives(
        analysis.productId,
        {
          limit: parseInt(limit),
          betterScoreOnly: betterScoreOnly === 'true',
          sameCategory: sameCategory === 'true'
        }
      );

      res.json({
        success: true,
        data: alternatives
      });

    } catch (error) {
      console.error('Erreur recherche alternatives:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche d\'alternatives'
      });
    }
  }
);

/**
 * GET /api/v1/analyses/stats
 * Statistiques des analyses de l'utilisateur
 */
router.get('/stats/summary',
  authenticateToken,
  async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      const stats = await universalAnalyzer.getAnalysisStats(
        req.user.id,
        period
      );

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Erreur statistiques:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul des statistiques'
      });
    }
  }
);

/**
 * POST /api/v1/analyses/:id/feedback
 * Donner un feedback sur une analyse
 */
router.post('/:id/feedback',
  authenticateToken,
  async (req, res) => {
    try {
      const { helpful, rating, comment, reportedIssue } = req.body;
      
      const Analysis = require('mongoose').model('Analysis');
      
      const analysis = await Analysis.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.user.id
        },
        {
          feedback: {
            helpful,
            rating,
            comment,
            reportedIssue,
            submittedAt: new Date()
          }
        },
        { new: true }
      );

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Analyse non trouvée'
        });
      }

      res.json({
        success: true,
        message: 'Merci pour votre feedback'
      });

    } catch (error) {
      console.error('Erreur feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'enregistrement du feedback'
      });
    }
  }
);

module.exports = router;
