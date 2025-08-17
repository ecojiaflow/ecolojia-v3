// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { logger } = require('../utils/logger');

/**
 * Configuration des limites par type d'endpoint et tier utilisateur
 */
const RATE_LIMITS = {
  // Limites par tier d'utilisateur
  tiers: {
    free: {
      global: { windowMs: 15 * 60 * 1000, max: 200 },
      dashboard: { windowMs: 60 * 1000, max: 30 },
      analysis: { windowMs: 60 * 60 * 1000, max: 30 },
      ai: { windowMs: 60 * 60 * 1000, max: 5 },
      export: { windowMs: 24 * 60 * 60 * 1000, max: 3 }
    },
    premium: {
      global: { windowMs: 15 * 60 * 1000, max: 2000 },
      dashboard: { windowMs: 60 * 1000, max: 120 },
      analysis: { windowMs: 60 * 60 * 1000, max: -1 }, // illimite
      ai: { windowMs: 60 * 60 * 1000, max: 500 },
      export: { windowMs: 24 * 60 * 60 * 1000, max: 50 }
    },
    family: {
      global: { windowMs: 15 * 60 * 1000, max: 3000 },
      dashboard: { windowMs: 60 * 1000, max: 180 },
      analysis: { windowMs: 60 * 60 * 1000, max: -1 }, // illimite
      ai: { windowMs: 60 * 60 * 1000, max: 500 },
      export: { windowMs: 24 * 60 * 60 * 1000, max: 100 }
    }
  },
  
  // Limites speciales
  auth: {
    login: { windowMs: 15 * 60 * 1000, max: 5, skipSuccessfulRequests: true },
    register: { windowMs: 60 * 60 * 1000, max: 3 },
    passwordReset: { windowMs: 60 * 60 * 1000, max: 3 }
  },
  
  // Routes publiques
  public: {
    health: { windowMs: 60 * 1000, max: 60 },
    webhooks: null // pas de limite pour les webhooks
  }
};

/**
 * Creer un key generator personnalise selon le contexte
 */
const createKeyGenerator = (prefix) => {
  return (req) => {
    // Pour les routes authentifiees, utiliser l'ID utilisateur
    if (req.user && req.user._id) {
      return `${prefix}:${req.user._id}`;
    }
    // Pour les routes publiques, utiliser l'IP
    return `${prefix}:${req.ip}`;
  };
};

/**
 * Creer un rate limiter avec gestion d'erreurs
 */
const createRateLimiter = (config, keyPrefix, options = {}) => {
  const limiterConfig = {
    windowMs: config.windowMs,
    max: config.max,
    message: options.message || 'Trop de requetes, veuillez reessayer plus tard.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: createKeyGenerator(keyPrefix),
    handler: (req, res) => {
      console.warn('Rate limit exceeded', {
        ip: req.ip,
        userId: req.user?._id,
        path: req.path,
        keyPrefix
      });
      
      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: limiterConfig.message,
        retryAfter: Math.ceil(config.windowMs / 1000),
        tier: req.user?.tier || 'anonymous'
      });
    },
    skip: (req) => {
      // Skip si limite illimitee (-1)
      if (config.max === -1) return true;
      
      // Skip pour les admins
      if (req.headers['x-admin-key'] === process.env.ADMIN_API_KEY) return true;
      
      // Skip custom
      if (options.skip) return options.skip(req);
      
      return false;
    },
    ...options
  };
  
  // Utiliser Redis si disponible
  if (global.redisClient?.isReady) {
    limiterConfig.store = new RedisStore({
      client: global.redisClient,
      prefix: `rl:${keyPrefix}:`,
      sendCommand: (...args) => global.redisClient.sendCommand(args)
    });
  } else {
    console.warn(`Rate limiter ${keyPrefix} using memory store (Redis not available)`);
  }
  
  return rateLimit(limiterConfig);
};

/**
 * Middleware dynamique qui applique differentes limites selon le tier
 */
const createDynamicRateLimiter = (endpoint) => {
  const limiters = {};
  
  // Pre-creer les limiters pour chaque tier
  ['free', 'premium', 'family'].forEach(tier => {
    const config = RATE_LIMITS.tiers[tier][endpoint];
    if (config) {
      limiters[tier] = createRateLimiter(
        config,
        `${endpoint}:${tier}`,
        {
          message: `Limite atteinte pour les utilisateurs ${tier}. ${
            tier === 'free' ? 'Passez   Premium pour plus de requetes.' : ''
          }`
        }
      );
    }
  });
  
  // Limiter par defaut pour les non-authentifies
  const defaultConfig = RATE_LIMITS.tiers.free[endpoint];
  limiters.anonymous = createRateLimiter(
    { ...defaultConfig, max: Math.floor(defaultConfig.max / 2) }, // 50% de la limite free
    `${endpoint}:anonymous`,
    { message: 'Connectez-vous pour augmenter vos limites.' }
  );
  
  return (req, res, next) => {
    const userTier = req.user?.tier || 'anonymous';
    const limiter = limiters[userTier] || limiters.anonymous;
    
    // Ajouter des headers informatifs
    res.setHeader('X-RateLimit-Tier', userTier);
    res.setHeader('X-RateLimit-Endpoint', endpoint);
    
    limiter(req, res, next);
  };
};

/**
 * Rate limiters specifiques pre-configures
 */
const rateLimiters = {
  // Auth endpoints
  login: createRateLimiter(
    RATE_LIMITS.auth.login,
    'auth:login',
    { 
      skipSuccessfulRequests: true,
      message: 'Trop de tentatives de connexion. Veuillez attendre 15 minutes.'
    }
  ),
  
  register: createRateLimiter(
    RATE_LIMITS.auth.register,
    'auth:register',
    { message: 'Trop de creations de compte. Veuillez reessayer dans 1 heure.' }
  ),
  
  passwordReset: createRateLimiter(
    RATE_LIMITS.auth.passwordReset,
    'auth:reset',
    { message: 'Trop de demandes de reinitialisation. Veuillez reessayer dans 1 heure.' }
  ),
  
  // Dynamic limiters
  global: createDynamicRateLimiter('global'),
  dashboard: createDynamicRateLimiter('dashboard'),
  analysis: createDynamicRateLimiter('analysis'),
  ai: createDynamicRateLimiter('ai'),
  export: createDynamicRateLimiter('export')
};

/**
 * Middleware pour ajouter des informations de quota dans les headers
 */
const addQuotaHeaders = (req, res, next) => {
  if (req.user) {
    res.setHeader('X-User-Tier', req.user.tier || 'free');
    res.setHeader('X-User-Id', req.user._id);
    
    // Ajouter les quotas restants si disponibles
    if (req.user.quotas) {
      res.setHeader('X-Quota-Scans-Remaining', req.user.quotas.scansRemaining || 0);
      res.setHeader('X-Quota-AI-Remaining', req.user.quotas.aiChatsRemaining || 0);
    }
  }
  next();
};

/**
 * Fonction pour reinitialiser les limites d'un utilisateur (admin only)
 */
const resetUserRateLimits = async (userId, endpoint = null) => {
  if (!global.redisClient?.isReady) {
    throw new Error('Redis not available for rate limit reset');
  }
  
  const pattern = endpoint 
    ? `rl:${endpoint}:*:${userId}`
    : `rl:*:${userId}`;
    
  const keys = await global.redisClient.keys(pattern);
  
  if (keys.length > 0) {
    await global.redisClient.del(...keys);
    logger.info(`Reset rate limits for user ${userId}`, { 
      endpoint, 
      keysDeleted: keys.length 
    });
  }
  
  return { success: true, keysDeleted: keys.length };
};

/**
 * Monitoring des rate limits (admin only)
 */
const getRateLimitStats = async () => {
  if (!global.redisClient?.isReady) {
    return { error: 'Redis not available for stats' };
  }
  
  const keys = await global.redisClient.keys('rl:*');
  const stats = {
    total: keys.length,
    byEndpoint: {},
    byTier: {},
    topUsers: []
  };
  
  // Analyser les cles pour extraire les stats
  for (const key of keys) {
    const [, endpoint, tier, userId] = key.split(':');
    
    // Stats par endpoint
    stats.byEndpoint[endpoint] = (stats.byEndpoint[endpoint] || 0) + 1;
    
    // Stats par tier
    stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;
    
    // Recuperer le compte pour les top users
    const count = await global.redisClient.get(key);
    if (count && parseInt(count) > 50) {
      stats.topUsers.push({
        userId,
        endpoint,
        tier,
        count: parseInt(count)
      });
    }
  }
  
  // Trier les top users
  stats.topUsers.sort((a, b) => b.count - a.count);
  stats.topUsers = stats.topUsers.slice(0, 10);
  
  return stats;
};

module.exports = {
  rateLimiters,
  addQuotaHeaders,
  createDynamicRateLimiter,
  resetUserRateLimits,
  getRateLimitStats,
  
  // Export pour usage direct
  globalLimiter: rateLimiters.global,
  loginLimiter: rateLimiters.login,
  registerLimiter: rateLimiters.register,
  dashboardLimiter: rateLimiters.dashboard,
  analysisLimiter: rateLimiters.analysis,
  aiLimiter: rateLimiters.ai,
  exportLimiter: rateLimiters.export
};
