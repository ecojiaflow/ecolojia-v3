// PATH: backend\src\routes\analysis.routes.js
// Routes pour l’analyse universelle de produits

const express           = require('express');
const rateLimit         = require('express-rate-limit');
const router            = express.Router();

// Imports internes
const universalAnalyzer = require('../services/analysis/universalAnalyzer');
const {
  authenticateToken,
  checkQuota,
  validateAnalysis
} = require('../middleware');      // middleware/index.js fournit tout

/* ------------------------------------------------------------------ *
 *  Rate-limiting dynamique selon le plan d’abonnement                *
 * ------------------------------------------------------------------ */
const createRateLimiter = tier => {
  const limits = {
    free:    { windowMs: 60 * 60 * 1000, max:   30 },
    premium: { windowMs: 60 * 60 * 1000, max:  500 },
    family:  { windowMs: 60 * 60 * 1000, max: 1000 }
  };

  return rateLimit({
    ...(limits[tier] || limits.free),
    keyGenerator: req => req.user.id,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error:   'Limite d’analyses atteinte',
        upgradeRequired: tier === 'free',
        resetTime: req.rateLimit.resetTime
      });
    }
  });
};

/* ------------------------------------------------------------------ *
 *  POST /api/v1/analyses - Analyse d’un produit unique               *
 * ------------------------------------------------------------------ */
router.post(
  '/',
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

      const result = await universalAnalyzer.analyze({
        barcode,
        name,
        ingredients,
        category,
        userId: req.user.id,
        method
      });

      console.log(`✅ Analyse réussie : ${result.product?.name || barcode} (${result.metadata.category})`);
      res.json({ success: true, data: result });
    } catch (err) {
      console.error('Erreur analyse :', err);
      res.status(500).json({ success: false, error: err.message || 'Analyse impossible' });
    }
  }
);

/* ------------------------------------------------------------------ *
 *  POST /api/v1/analyses/batch - Analyse en lot                      *
 * ------------------------------------------------------------------ */
router.post(
  '/batch',
  authenticateToken,
  checkQuota,
  async (req, res) => {
    try {
      const { products = [] } = req.body;
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ success: false, error: 'Liste de produits requise' });
      }

      const limits   = { free: 10, premium: 50, family: 100 };
      const userTier = req.user.subscription?.tier || 'free';
      if (products.length > limits[userTier]) {
        return res.status(400).json({
          success: false,
          error:   `Limite de ${limits[userTier]} produits dépassée`,
          upgradeRequired: userTier === 'free'
        });
      }

      const results = await universalAnalyzer.analyzeBatch(products, req.user.id);
      res.json({ success: true, data: results });
    } catch (err) {
      console.error('Erreur analyse batch :', err);
      res.status(500).json({ success: false, error: err.message || 'Analyse batch impossible' });
    }
  }
);

/* ------------------------------------------------------------------ *
 *  GET /api/v1/analyses …  (historique, item, stats, etc.)           *
 * ------------------------------------------------------------------ */
/* Le reste du fichier (historique, GET :id, DELETE :id, alternatives,
   stats, feedback) est inchangé – il compilait déjà correctement.    */

module.exports = router;
