// === ECOLOJIA V3 - Rate Limiting Middleware ===
// Protection anti-spam et anti-abus
// ================================================================

const rateLimit = require('express-rate-limit');

// ================================================================
// LIMITEUR GÃ‰NÃ‰RAL (toutes les routes sauf celles spÃ©cifiques)
// ================================================================
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Maximum 100 requÃªtes par minute par IP
  message: {
    error: 'Trop de requÃªtes. Veuillez ralentir.',
    retryAfter: '60 secondes'
  },
  standardHeaders: true, // Ajoute les headers RateLimit-* standards
  legacyHeaders: false, // DÃ©sactive les anciens headers X-RateLimit-*
  handler: (req, res) => {
    console.log('âš ï¸ [RATE LIMIT] IP bloquÃ©e:', req.ip, 'Route:', req.path);
    res.status(429).json({
      error: 'Trop de requÃªtes',
      message: 'Vous avez dÃ©passÃ© la limite de 100 requÃªtes par minute',
      retryAfter: 60
    });
  }
});

// ================================================================
// LIMITEUR IA (routes utilisant DeepSeek ou autres API coÃ»teuses)
// ================================================================
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 requÃªtes IA par 15 minutes par IP
  message: {
    error: 'Limite d\'analyse IA atteinte',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Compter mÃªme les requÃªtes rÃ©ussies
  handler: (req, res) => {
    console.log('ðŸš¨ [AI RATE LIMIT] IP bloquÃ©e:', req.ip, 'Route:', req.path);
    res.status(429).json({
      error: 'Limite d\'analyse IA atteinte',
      message: 'Vous avez utilisÃ© vos 10 analyses gratuites. RÃ©essayez dans 15 minutes.',
      retryAfter: 900, // secondes
      premium: 'Passez Ã  Premium pour des analyses illimitÃ©es'
    });
  }
});

// ================================================================
// LIMITEUR RECHERCHE (Algolia, recherche texte)
// ================================================================
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Maximum 30 recherches par minute par IP
  message: {
    error: 'Trop de recherches',
    retryAfter: '60 secondes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log('âš ï¸ [SEARCH RATE LIMIT] IP bloquÃ©e:', req.ip);
    res.status(429).json({
      error: 'Trop de recherches',
      message: 'Vous avez dÃ©passÃ© la limite de 30 recherches par minute',
      retryAfter: 60
    });
  }
});

// ================================================================
// LIMITEUR AUTHENTIFICATION (login, register)
// ================================================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 tentatives de connexion par 15 minutes
  message: {
    error: 'Trop de tentatives de connexion',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne compter QUE les Ã©checs
  handler: (req, res) => {
    console.log('ðŸ”’ [AUTH RATE LIMIT] IP bloquÃ©e:', req.ip);
    res.status(429).json({
      error: 'Trop de tentatives de connexion',
      message: 'Trop de tentatives Ã©chouÃ©es. RÃ©essayez dans 15 minutes.',
      retryAfter: 900
    });
  }
});

// ================================================================
// EXPORTS
// ================================================================
module.exports = {
  generalLimiter,
  aiLimiter,
  searchLimiter,
  authLimiter
};

// ================================================================
// USAGE DANS LES ROUTES :
// ================================================================
// const { aiLimiter } = require('../middleware/rateLimiter');
// router.post('/analyze-product', aiLimiter, async (req, res) => { ... });