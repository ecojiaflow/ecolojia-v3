// PATH: backend\src\routes\analysis.routes.js
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
  console.warn('[analysis.routes] middleware non trouve â†’ fallbacks no-op');
}

// -------- Chargement du service d'analyse orchestre --------
let analysisService;
let usingFallback = false;

try {
  // Essayer de charger le nouvel orchestrateur
  analysisService = require('../services/analysis/index');
  console.log('[analysis.routes] âœ… Service Analysis orchestre charge');
} catch (e) {
  console.warn('[analysis.routes] âš ï¸ Service orchestre non trouve, essai de l\'ancien service...');
  
  try {
    // Fallback sur l'ancien service si present
    analysisService = require('../services/analysis/analysisService');
    console.log('[analysis.routes] âœ… analysisService legacy charge');
  } catch (e2) {
    // Fallback ultime avec service minimal
    usingFallback = true;
    console.error('[analysis.routes] âŒ Aucun service trouve, activation fallback minimal');
    
    analysisService = {
      async analyzeProduct(productData) {
        const txt = typeof productData.ingredients === 'string'
          ? productData.ingredients
          : (productData.ingredients?.text || '');
        const t = String(txt || '').toLowerCase();
        const addCount = (t.match(/\be ?\d{3,4}[a-z]?\b/g) || []).length;
        const up = /(sirop de (glucose|fructose|glucose-fructose)|maltodextrine|amidon modifi|hydrog|isolat de proteine|agent de charge)/.test(t);
        const proc = /(ar[oo]me|colorant|conservateur|emulsifiant|emulsifiant|stabilisant|correcteur d.?acidit|edulcorant|edulcorant)/.test(t);
        let nova = 1;
        if (up || addCount >= 3 || (addCount >= 1 && proc)) nova = 4;
        else if (addCount >= 1 || proc) nova = 3;
        else if (t.split(/,|;|\bet\b/gi).map(s => s.trim()).filter(Boolean).length > 1) nova = 2;
        const healthByNova = { 1: 85, 2: 70, 3: 55, 4: 45 };
        
        // Adapter selon la categorie
        const category = productData.category || 'food';
        
        if (category === 'cosmetics') {
          return {
            category: 'cosmetics',
            timestamp: new Date(),
            scores: {
              healthScore: Math.max(20, Math.random() * 80),
              environmentScore: Math.max(30, Math.random() * 70)
            },
            details: {
              inciTextRaw: txt,
              riskFlags: addCount > 2 ? ['allergen'] : [],
              notableIngredients: [],
              riskLevel: addCount > 3 ? 'high' : addCount > 1 ? 'medium' : 'low'
            },
            globalScore: 50,
            confidence: 0.5,
            recommendations: ['Analyse basique - donnees limitees']
          };
        } else if (category === 'detergents') {
          return {
            category: 'detergents',
            timestamp: new Date(),
            scores: {
              healthScore: Math.max(30, Math.random() * 70),
              environmentScore: Math.max(20, Math.random() * 60)
            },
            details: {
              clpPictograms: [],
              surfactants: ['unknown'],
              allergens: [],
              biodegradability: 'unknown'
            },
            globalScore: 45,
            confidence: 0.5,
            recommendations: ['Analyse basique - donnees limitees']
          };
        }
        
        // Par defaut: food
        return {
          category: 'food',
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
            nova,
            novaLabel: nova === 4 ? 'Ultra-transforme' : nova === 3 ? 'Transforme' : nova === 2 ? 'Transformation simple' : 'Non transforme',
            novaReason: `${addCount} additif(s) detecte(s)`,
            novaConfidence: 0.8,
            ecoscore: 'C',
            ultraProcessed: nova === 4
          },
          globalScore: Math.round((healthByNova[nova] ?? 55) * 0.4 + 60 * 0.3 + 50 * 0.3),
          confidence: nova === 4 ? 0.85 : 0.8,
          recommendations: []
        };
      }
    };
  }
}

// -------- util: toujours repondre en UTF-8 --------
function sendJson(res, data) {
  res.set('Content-Type', 'application/json; charset=utf-8');
  return res.json(data);
}

// -------- debug chronometrage --------
function startTimer(label) {
  const start = process.hrtime.bigint();
  return () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`â±ï¸  ${label}: ${ms.toFixed(1)} ms`);
  };
}

/**
 * GET /api/analysis/_service/status
 * â†’ Savoir si on utilise le VRAI service ou le fallback
 */
router.get(
  '/_service/status',
  authOptional,
  asyncHandler(async (_req, res) => {
    const status = {
      service: usingFallback ? 'fallback' : 'analysis',
      usingFallback,
      version: '1.0.0'
    };
    
    // Si le service a une methode pour lister les categories
    if (analysisService.getSupportedCategories) {
      status.supportedCategories = analysisService.getSupportedCategories();
    }
    
    return sendJson(res, status);
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
 * Corps minimal : { name?, category: "food"|"cosmetics"|"detergents", ingredients }
 */
router.post(
  '/manual',
  authOptional,
  validateAnalysis,
  asyncHandler(async (req, res) => {
    const stop = startTimer('POST /api/analysis/manual');
    const { name, brand, category = 'food', ingredients, barcode } = req.body || {};
    
    // Validation de la categorie
    const validCategories = ['food', 'cosmetic', 'detergent'];
    const normalizedCategory = category.toLowerCase().trim();
    
    if (!validCategories.includes(normalizedCategory)) {
      return res.status(400).json({
        error: 'Categorie invalide',
        message: `La categorie doit etre l'une des suivantes : ${validCategories.join(', ')}`,
        received: category
      });
    }
    
    // Preparer les donnees pour l'analyse
    const productData = {
      name: name || 'Sans nom',
      brand: brand || null,
      category: normalizedCategory,
      ingredients: typeof ingredients === 'string' ? ingredients : (ingredients?.text || ''),
      barcode: barcode || null
    };
    
    // Lancer l'analyse
    const analysis = await analysisService.analyzeProduct(productData, {
      updateDatabase: false,
      updateAlgolia: false,
      userId: req.user?.id || null
    });
    
    stop();
    return sendJson(res, analysis);
  })
);

/**
 * POST /api/analysis
 * Corps flexible : product object ou donnees directes
 */
router.post(
  '/',
  authOptional,
  asyncHandler(async (req, res) => {
    const stop = startTimer('POST /api/analysis');
    const body = req.body || {};
    
    // Extraire les donnees du produit (flexible)
    const productData = body.product || {
      name: body.name || 'Sans nom',
      category: body.category || 'food',
      ingredients: body.ingredients
        ? (typeof body.ingredients === 'string'
            ? body.ingredients
            : body.ingredients.text || '')
        : '',
      barcode: body.barcode || null,
      brand: body.brand || null
    };
    
    // Validation de la categorie
    const validCategories = ['food', 'cosmetic', 'detergent'];
    const normalizedCategory = (productData.category || 'food').toLowerCase().trim();
    
    if (!validCategories.includes(normalizedCategory)) {
      productData.category = 'food'; // Fallback sur food si categorie invalide
    } else {
      productData.category = normalizedCategory;
    }
    
    // Lancer l'analyse
    const analysis = await analysisService.analyzeProduct(productData, {
      updateDatabase: body.updateDatabase || false,
      updateAlgolia: body.updateAlgolia || false,
      userId: req.user?.id || null
    });
    
    stop();
    return sendJson(res, analysis);
  })
);

/**
 * POST /api/analysis/barcode
 * Corps : { barcode }
 */
router.post(
  '/barcode',
  authOptional,
  asyncHandler(async (req, res) => {
    const stop = startTimer('POST /api/analysis/barcode');
    const { barcode } = req.body || {};
    
    if (!barcode) {
      return res.status(400).json({
        error: 'Code-barres manquant',
        message: 'Le champ "barcode" est requis'
      });
    }
    
    // Pour l'analyse par code-barres, on laisse le service determiner la categorie
    const productData = {
      barcode,
      name: null,
      category: null, // Sera determine automatiquement
      ingredients: null
    };
    
    const analysis = await analysisService.analyzeProduct(productData, {
      updateDatabase: true, // On peut sauvegarder les produits trouves
      updateAlgolia: false,
      userId: req.user?.id || null
    });
    
    stop();
    return sendJson(res, analysis);
  })
);

/**
 * POST /api/analysis/batch
 * Analyse par lot de plusieurs produits
 * Corps : { products: [...] }
 */
router.post(
  '/batch',
  authOptional,
  asyncHandler(async (req, res) => {
    const stop = startTimer('POST /api/analysis/batch');
    const { products } = req.body || {};
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: 'Produits manquants',
        message: 'Le champ "products" doit etre un tableau non vide'
      });
    }
    
    if (products.length > 50) {
      return res.status(400).json({
        error: 'Trop de produits',
        message: 'Maximum 50 produits par lot'
      });
    }
    
    // Utiliser la methode batch si disponible
    let results;
    if (analysisService.analyzeBatch) {
      results = await analysisService.analyzeBatch(products, req.user?.id || null);
    } else {
      // Fallback : analyser un par un
      const analysisResults = [];
      const errors = [];
      
      for (const product of products) {
        try {
          const result = await analysisService.analyzeProduct(product, {
            updateDatabase: false,
            updateAlgolia: false,
            userId: req.user?.id || null
          });
          analysisResults.push({
            success: true,
            product: product.name || product.barcode || 'Sans nom',
            result
          });
        } catch (error) {
          errors.push({
            success: false,
            product: product.name || product.barcode || 'Sans nom',
            error: error.message
          });
        }
      }
      
      results = {
        total: products.length,
        successful: analysisResults.length,
        failed: errors.length,
        results: analysisResults,
        errors
      };
    }
    
    stop();
    return sendJson(res, results);
  })
);

/**
 * GET /api/analysis/categories
 * Liste les categories supportees
 */
router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = analysisService.getSupportedCategories 
      ? analysisService.getSupportedCategories()
      : {
          main: ['food', 'cosmetics', 'detergents'],
          aliases: {
            'alimentaire': 'food',
            'cosmetique': 'cosmetics',
            'detergent': 'detergents'
          }
        };
    
    return sendJson(res, categories);
  })
);

module.exports = router;
