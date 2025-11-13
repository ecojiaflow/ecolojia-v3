const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Middleware centralisé
const { authOptional } = require('../middleware');

// Handlers IA
const { enrichHandler, ocrHandler } = require('../controllers/ai.controller');

// =====================================================
// RATE LIMITING OCR (10 requêtes/heure/user)
// =====================================================

const ocrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 requêtes max par fenêtre
  message: {
    success: false,
    error: 'Limite OCR atteinte (10 analyses/heure). Réessayez plus tard.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Identification par IP (ou userId si authOptional fourni)
  keyGenerator: (req) => {
    return req.userId || req.ip;
  }
});

// =====================================================
// ROUTES
// =====================================================

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'ai',
    routes: ['POST /', 'POST /enrich', 'POST /ocr']
  });
});

// Enrichissement IA universel (barcode/category/name)
router.post('/', authOptional, enrichHandler);
router.post('/enrich', authOptional, enrichHandler);

// OCR - Analyse image produit (avec rate limiting)
router.post('/ocr', ocrLimiter, ocrHandler); // authOptional retiré temporairement

module.exports = router;