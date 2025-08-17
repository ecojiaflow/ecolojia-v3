// backend/src/routes/analyze.routes.js
// Routes pour l'analyse universelle de produits - IMPORTS CORRIG‰S

const express = require('express');
const router = express.Router();
const universalAnalyzer = require('../services/analysis/universalAnalyzer');

// Import unifie depuis middleware/index.js
const { 
  authenticateToken, 
  checkQuota,
  validateAnalysis 
} = require('../middleware');

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

// Middleware pour verifier les quotas (utilise maintenant checkQuota du middleware unifie)
const checkAnalysisQuota = checkQuota('scan');

/**
 * POST /api/v1/analyses
 * Analyse un produit (auto-detection de categorie)
 */
router.post('/',
  authenticateToken,
  checkAnalysisQuota,
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
          error: 'Au moins un parametre requis: barcode, name ou ingredients'
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

      // Decrementer le quota apres succes
      if (req.decrementQuota) {
        await req.decrementQuota();
      }

      // Log pour statistiques
      console.log(`âœ… Analyse reussie: ${result.product?.name || barcode} (${result.metadata.category})`);

      res.json({
        success: true,
        data: result,
        quotaInfo: req.quota
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
  checkAnalysisQuota,
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

      // Decrementer le quota apres succes
      if (req.decrementQuota) {
        await req.decrementQuota();
      }

      res.json({
        success: true,
        data: results,
        quotaInfo: req.quota
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
 * Recupere l'historique des analyses
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
      console.error('Erreur recuperation analyses:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recuperation des analyses'
      });
    }
  }
);

/**
 * GET /api/v1/analyses/:id
 * Recupere une analyse specifique
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
          error: 'Analyse non trouvee'
        });
      }

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Erreur recuperation analyse:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recuperation de l\'analyse'
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
          error: 'Analyse non trouvee'
        });
      }

      res.json({
        success: true,
        message: 'Analyse supprimee'
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
 * Trouve des alternatives pour un produit analyse
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
      
      // Verifier que l'analyse appartient   l'utilisateur
      const analysis = await Analysis.findOne({
        _id: req.params.id,
        userId: req.user.id
      });

      if (!analysis) {
        return res.status(404).json({
          success: false,
          error: 'Analyse non trouvee'
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
          error: 'Analyse non trouvee'
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
