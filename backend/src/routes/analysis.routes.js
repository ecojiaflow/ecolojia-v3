// PATH: backend/src/routes/analysis.routes.js
const express = require('express');
const router = express.Router();

// -------- Middlewares (robustes si absents) --------
let authOptional = (req, _res, next) => next();
let validateAnalysis = (_req, _res, next) => next();
let asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

try {
  const mw = require('../middleware');
  authOptional = mw.authOptional || authOptional;
  validateAnalysis = mw.validateAnalysis || validateAnalysis;
  asyncHandler = mw.asyncHandler || asyncHandler;
} catch {
  console.warn('[analysis.routes] middleware non trouvé → fallbacks no-op');
}

// -------- Chargement du vrai service (avec trace d’erreur) --------
let analysisService;
let usingFallback = false;
try {
  analysisService = require('../services/analysis/analysisService');
  console.log('[analysis.routes] ✅ analysisService chargé (réel)');
} catch (e) {
  usingFallback = true;
  console.error('[analysis.routes] ❌ Échec require(analysisService):\n', e.stack || e);
  console.warn('[analysis.routes] → activation d’un fallback minimal pour ne pas casser les routes');
  analysisService = {
    async analyzeProduct(productData) {
      const txt = typeof productData.ingredients === 'string'
        ? productData.ingredients
        : (productData.ingredients?.text || '');
      const t = String(txt || '').toLowerCase();
      const addCount = (t.match(/\be ?\d{3,4}[a-z]?\b/g) || []).length;
      const up = /(sirop de (glucose|fructose|glucose-fructose)|maltodextrine|amidon modifi|hydrog|isolat de proteine|agent de charge)/.test(t);
      const proc = /(ar[oô]me|colorant|conservateur|emulsifiant|émulsifiant|stabilisant|correcteur d.?acidit|edulcorant|édulcorant)/.test(t);
      let nova = 1;
      if (up || addCount >= 3 || (addCount >= 1 && proc)) nova = 4;
      else if (addCount >= 1 || proc) nova = 3;
      else if (t.split(/,|;|\bet\b/gi).map(s => s.trim()).filter(Boolean).length > 1) nova = 2;
      const healthByNova = { 1: 85, 2: 70, 3: 55, 4: 45 };
      return {
        category: productData.category || 'food',
        timestamp: new Date(),
        scores: {
          nova,
          nutriscore: 'C',
          ecoscore: 'C',
          healthScore: healthByNova[nova] ?? 55,
          environmentScore: 60
        },
        details: {
          ingredientsTextRaw: txt || null,
          ultraProcessed: nova === 4
        },
        recommendations: [],
        globalScore: Math.round((healthByNova[nova] ?? 55) * 0.4 + 60 * 0.3 + 50 * 0.3),
        confidence: nova === 4 ? 0.85 : 0.8
      };
    }
  };
}

// -------- util: toujours répondre en UTF-8 --------
function sendJson(res, data) {
  res.set('Content-Type', 'application/json; charset=utf-8');
  return res.json(data);
}

// -------- debug chronométrage --------
function startTimer(label) {
  const start = process.hrtime.bigint();
  return () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`⏱️  ${label}: ${ms.toFixed(1)} ms`);
  };
}

/**
 * GET /api/analysis/_service/status
 * → Savoir si on utilise le VRAI service ou le fallback
 */
router.get(
  '/_service/status',
  authOptional,
  asyncHandler(async (_req, res) => {
    return sendJson(res, { usingFallback, service: usingFallback ? 'fallback' : 'real' });
  })
);

/**
 * POST /api/analysis/ping
 */
router.post(
  '/ping',
  authOptional,
  asyncHandler(async (req, res) => {
    return sendJson(res, {
      ok: true,
      now: new Date().toISOString(),
      received: req.body || null,
      user: req.user || {},
      note: 'Route ping OK'
    });
  })
);

/**
 * POST /api/analysis/manual
 */
router.post(
  '/manual',
  authOptional,
  validateAnalysis,
  asyncHandler(async (req, res) => {
    const stop = startTimer('POST /api/analysis/manual');
    const { name, category = 'food', ingredients } = req.body || {};
    const tempProduct = {
      name: name || 'Sans nom',
      category,
      ingredients: { text: typeof ingredients === 'string' ? ingredients : (ingredients?.text || '') }
    };
    const analysis = await analysisService.analyzeProduct(tempProduct, {
      updateDatabase: false,
      updateAlgolia: false
    });
    stop();
    return sendJson(res, analysis);
  })
);

/**
 * POST /api/analysis
 */
router.post(
  '/',
  authOptional,
  asyncHandler(async (req, res) => {
    const stop = startTimer('POST /api/analysis');
    const body = req.body || {};
    const productLike = body.product || {
      name: body.name || 'Sans nom',
      category: body.category || 'food',
      ingredients: body.ingredients
        ? (typeof body.ingredients === 'string'
            ? { text: body.ingredients }
            : { text: body.ingredients.text || '' })
        : { text: '' },
      barcode: body.barcode || null,
      brand: body.brand || null
    };
    const analysis = await analysisService.analyzeProduct(productLike, {
      updateDatabase: false,
      updateAlgolia: false
    });
    stop();
    return sendJson(res, analysis);
  })
);

module.exports = router;
