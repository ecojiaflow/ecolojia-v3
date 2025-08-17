const express = require('express');
const router = express.Router();

// Import des middlewares - on va tester s'ils existent
let authOptional = (req, res, next) => next(); // Fallback si non trouvé
let analysisLimiter = (req, res, next) => next(); // Fallback si non trouvé

try {
  const middleware = require('../middleware');
  if (middleware.authOptional) authOptional = middleware.authOptional;
  if (middleware.analysisLimiter) analysisLimiter = middleware.analysisLimiter;
  console.log('[COSMETICS] Middlewares loaded:', Object.keys(middleware));
} catch (e) {
  console.log('[COSMETICS] Using fallback middlewares');
}

// Import du controller
let analyzeCosmeticController;
try {
  const controller = require('../controllers/cosmeticController');
  analyzeCosmeticController = controller.analyzeCosmeticController;
  console.log('[COSMETICS] Controller loaded');
} catch (e) {
  console.log('[COSMETICS] Using fallback controller');
  analyzeCosmeticController = (req, res) => {
    res.json({
      success: true,
      data: {
        category: 'cosmetic',
        product: { name: req.body.name || 'Test' },
        score: { value: 75, label: 'B' },
        ingredients: req.body.ingredients,
        message: 'Fallback cosmetics analysis'
      }
    });
  };
}

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'cosmetics', timestamp: new Date().toISOString() });
});

router.post('/analyze',
  authOptional,
  analysisLimiter,
  analyzeCosmeticController
);

module.exports = router;
