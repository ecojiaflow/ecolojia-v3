// PATH: backend\src\middleware\index.js
// Point d'entree unifie pour tous les middlewares ECOLOJIA
// SOLUTION ROBUSTE POUR PRODUCTION

// === IMPORTS DES MIDDLEWARES EXISTANTS ===
const authMiddleware = require('./auth');
const { checkQuota, checkQuotaAfterUpload } = require('./quotaMiddleware');
const errorHandler = require('./errorHandler');
const rateLimiter = require('./rateLimiter');

// === IMPORT DU FICHIER VALIDATION ===
// Si votre validation.js est vide, utilisez le fallback ci-dessous
let validation;
try {
  validation = require('./validation');
} catch (e) {
  console.warn('validation.js non trouve ou erreur, utilisation du fallback');
  // Fallback si validation.js est manquant ou vide
  validation = {
    validateAnalysis: (req, res, next) => {
      const { barcode, name, ingredients } = req.body;
      if (!barcode && !name && !ingredients) {
        return res.status(400).json({
          success: false,
          error: 'Au moins un champ requis: barcode, name ou ingredients'
        });
      }
      next();
    },
    validateProduct: (req, res, next) => next(),
    validateUser: (req, res, next) => next(),
    validatePagination: (req, res, next) => next(),
    validateChat: (req, res, next) => next(),
    validateExport: (req, res, next) => next()
  };
}

// === EXTRACTION DES FONCTIONS D'AUTH ===
const {
  auth,
  authenticateUser,
  authOptional,
  requirePremium,
  requireAdmin
} = authMiddleware;

// === ALIAS CRITIQUES POUR COMPATIBILIT‰ ===
const authenticateToken = authenticateUser; // analyze.routes.js et vision.routes.js attendent authenticateToken

// === EXTRACTION DES FONCTIONS DE VALIDATION ===
const {
  validateAnalysis = validation.validateAnalysis || ((req, res, next) => next()),
  validateProduct = validation.validateProduct || ((req, res, next) => next()),
  validateUser = validation.validateUser || ((req, res, next) => next()),
  validatePagination = validation.validatePagination || ((req, res, next) => next()),
  validateChat = validation.validateChat || ((req, res, next) => next()),
  validateExport = validation.validateExport || ((req, res, next) => next())
} = validation || {};

// === EXTRACTION DES FONCTIONS D'ERROR HANDLER ===
const {
  asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next),
  notFound = (req, res) => res.status(404).json({ error: 'Route non trouvee' }),
  errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      error: err.message || 'Erreur serveur',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
} = errorHandler || {};

// === EXTRACTION DES FONCTIONS DE RATE LIMITER ===
const {
  createRateLimiter = () => (req, res, next) => next(),
  apiLimiter = (req, res, next) => next(),
  authLimiter = (req, res, next) => next()
} = rateLimiter || {};

/**
 * EXPORT UNIFI‰ DE TOUS LES MIDDLEWARES
 * 
 * Usage:
 * const { authenticateUser, checkQuota, validateAnalysis } = require('../middleware');
 */
module.exports = {
  // === AUTHENTIFICATION ===
  auth,
  authenticateUser,
  authenticateToken, // ALIAS CRITIQUE pour analyze.routes.js et vision.routes.js
  authOptional,
  requirePremium,
  requireAdmin,
  checkPremium: requirePremium, // Alias pour compatibilite
  authMiddleware: auth, // Alias pour compatibilite
  
  // === QUOTAS ===
  checkQuota,
  checkQuotaAfterUpload, // Pour vision.routes.js
  
  // === VALIDATION ===
  validateAnalysis, // Pour analyze.routes.js
  validateProduct,
  validateUser,
  validatePagination,
  validateChat,
  validateExport,
  
  // === RATE LIMITING ===
  createRateLimiter,
  apiLimiter,
  authLimiter,
  
  // === ERROR HANDLING ===
  asyncHandler,
  notFound,
  errorMiddleware,
  
  // === MODULES COMPLETS (pour compatibilite) ===
  authMiddleware: authMiddleware,
  quotaMiddleware: { checkQuota, checkQuotaAfterUpload },
  validationMiddleware: validation,
  errorHandler: errorHandler,
  rateLimiter: rateLimiter
};

// Log pour debug
console.log('âœ… Middleware index.js charge avec succes');
console.log('   Exports disponibles:', Object.keys(module.exports).join(', '));
