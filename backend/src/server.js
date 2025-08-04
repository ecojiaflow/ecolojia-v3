// Logger simple
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn
};
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
// backend/src/server.js
// VERSION PRODUCTION COMPLÃˆTE ECOLOJIA V3 - AVEC RATE LIMITING ROBUSTE

const fs = require('fs');
const path = require('path');

// Debug des chemins
console.log('Current directory:', __dirname);
console.log('Quota file exists?', fs.existsSync(path.join(__dirname, 'routes', 'quota.js')));

// require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const redis = require('redis');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import des utils
// const { logger } = require('./utils/logger');
// const { asyncHandler } = require('./utils/errors');

// Import du middleware de quotas
const { checkQuota, checkQuotaMiddleware } = require('./middleware/quotaMiddleware');

// Import du systÃ¨me de rate limiting robuste
let rateLimiters = {};
try {
  const rateLimiterModule = require('./middleware/rateLimiter');
  rateLimiters = {
    globalLimiter: rateLimiterModule.globalLimiter,
    loginLimiter: rateLimiterModule.loginLimiter,
    registerLimiter: rateLimiterModule.registerLimiter,
    dashboardLimiter: rateLimiterModule.dashboardLimiter,
    analysisLimiter: rateLimiterModule.analysisLimiter,
    aiLimiter: rateLimiterModule.aiLimiter,
    exportLimiter: rateLimiterModule.exportLimiter,
    addQuotaHeaders: rateLimiterModule.addQuotaHeaders,
    getRateLimitStats: rateLimiterModule.getRateLimitStats,
    resetUserRateLimits: rateLimiterModule.resetUserRateLimits
  };
  logger.info('âœ… Rate limiter module loaded successfully');
} catch (error) {
  logger.warn('âš ï¸ Custom rate limiter not found, using fallback');
  // Fallback rate limiter simple
  const rateLimit = require('express-rate-limit');
  
  const createFallbackLimiter = (windowMs, max, message) => {
    return rateLimit({
      windowMs,
      max,
      message,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
    });
  };
  
  rateLimiters = {
    globalLimiter: createFallbackLimiter(15 * 60 * 1000, 1000, 'Trop de requÃªtes, veuillez rÃ©essayer plus tard'),
    loginLimiter: createFallbackLimiter(15 * 60 * 1000, 5, 'Trop de tentatives de connexion'),
    registerLimiter: createFallbackLimiter(60 * 60 * 1000, 3, 'Trop de crÃ©ations de compte'),
    dashboardLimiter: createFallbackLimiter(60 * 1000, 60, 'Trop de requÃªtes au dashboard'),
    analysisLimiter: createFallbackLimiter(60 * 60 * 1000, 30, 'Limite d\'analyses atteinte'),
    aiLimiter: createFallbackLimiter(60 * 60 * 1000, 5, 'Limite de questions IA atteinte'),
    exportLimiter: createFallbackLimiter(24 * 60 * 60 * 1000, 5, 'Limite d\'exports atteinte'),
    addQuotaHeaders: (req, res, next) => next(),
    getRateLimitStats: async () => ({ error: 'Stats not available' }),
    resetUserRateLimits: async () => ({ error: 'Reset not available' })
  };
}

// Initialisation Express
const app = express();
const PORT = process.env.PORT || 5001;

// Configuration
app.set('trust proxy', 1);
const JWT_SECRET = process.env.JWT_SECRET || 'ecolojia-secret-key-2024-super-secure';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'admin-secret-key-2024';

// Redis client global - EXPORTÃ‰ pour usage dans d'autres modules
let redisClient;

// ========== MIDDLEWARES DE SÃ‰CURITÃ‰ ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.algolia.com", "https://api.deepseek.com", "https://api.lemonsqueezy.com"]
    }
  }
}));

// CORS
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.CORS_ORIGIN?.split(',') || []).concat([
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'https://frontendvf.netlify.app',
      'https://app.ecolojia.app'
    ]);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Compression
app.use(compression());

// ========== IMPORTANT: Webhooks AVANT body parser ==========
const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Body parsing pour les autres routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== RATE LIMITING PRODUCTION ==========
// Middleware global pour ajouter les headers de quota
app.use(rateLimiters.addQuotaHeaders);

// Rate limiting global (appliquÃ© Ã  toutes les routes)
app.use(rateLimiters.globalLimiter);

// Rate limiting spÃ©cifique pour l'authentification
app.use('/api/auth/login', rateLimiters.loginLimiter);
app.use('/api/auth/register', rateLimiters.registerLimiter);

// ========== CONNEXIONS DB ==========
async function connectMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      logger.warn('MONGODB_URI not configured, running without database');
      return false;
    }

    await mongoose.connect(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000
    });

    logger.info('âœ… MongoDB Atlas connected successfully');

    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.info(`ðŸ“¦ Collections: ${collections.map(c => c.name).join(', ')}`);

    return true;
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

async function connectRedis() {
  try {
    if (process.env.REDIS_URL) {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis: Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      redisClient.on('error', (err) => logger.error('Redis error:', err));
      redisClient.on('connect', () => logger.info('Redis: Connecting...'));
      redisClient.on('ready', () => logger.info('Redis: Ready'));
      redisClient.on('reconnecting', () => logger.warn('Redis: Reconnecting...'));

      await redisClient.connect();
      logger.info('âœ… Redis connected successfully');
      
      // Exporter le client Redis pour usage global
      global.redisClient = redisClient;
      module.exports.redisClient = redisClient;
    } else {
      logger.info('â„¹ï¸ Redis not configured');
    }
  } catch (error) {
    logger.warn('Redis connection failed:', error.message);
  }
}

// ========== ROUTES HEALTH ==========
app.get('/api/health', async (req, res) => {
  const checks = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '3.0.0',
    services: {
      api: 'operational',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.isReady ? 'connected' : 'disconnected',
      rateLimiting: redisClient?.isReady ? 'redis' : 'memory',
      deepseek: process.env.DEEPSEEK_API_KEY ? 'configured' : 'not configured',
      algolia: process.env.ALGOLIA_APP_ID ? 'configured' : 'not configured',
      lemonsqueezy: process.env.LEMONSQUEEZY_STORE_ID ? 'configured' : 'not configured'
    }
  };

  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.db.admin().ping();
      checks.services.mongodb = 'healthy';
    } catch (error) {
      checks.services.mongodb = 'unhealthy';
    }
  }

  res.status(checks.services.mongodb !== 'unhealthy' ? 200 : 503).json(checks);
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'ECOLOJIA Backend V3 is running!',
    version: '3.0.0',
    features: [
      'Product Analysis (Food, Cosmetics, Detergents)',
      'AI Chat Assistant',
      'Secure API Proxy',
      'GDPR Compliance',
      'Payment Processing',
      'Quota Management',
      'Advanced Rate Limiting'
    ],
    timestamp: new Date().toISOString()
  });
});

// ========== ROUTES AUTH DIRECTES ==========
let User;
try {
  User = require('./models/User');
} catch (error) {
  logger.warn('User model not found, using mock');
  User = null;
}

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    if (User && mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non trouvÃ©'
        });
      }
      req.user = user;
      req.userId = user._id;
    } else {
      req.user = decoded;
      req.userId = decoded.userId;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token invalide ou expirÃ©'
    });
  }
};

// Routes d'authentification
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: 'Tous les champs sont requis'
    });
  }

  if (!User || mongoose.connection.readyState !== 1) {
    const fakeToken = jwt.sign(
      { email, firstName, lastName, tier: 'free' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Mode test - MongoDB non connectÃ©',
      user: { email, firstName, lastName, tier: 'free' },
      token: fakeToken
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'Cet email est dÃ©jÃ  utilisÃ©'
    });
  }

  const user = new User({
    email: email.toLowerCase(),
    password: password,
    name: `${firstName} ${lastName}`,
    profile: { firstName, lastName },
    tier: 'free',
    status: 'active',
    emailVerified: true,
    quotas: {
      scansRemaining: 30,
      scansResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      aiChatsRemaining: 5,
      aiChatsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    gdpr: {
      consentDate: new Date(),
      consentVersion: '1.0',
      consentIP: req.ip,
      marketingConsent: false,
      dataProcessingConsent: true,
      cookieConsent: true
    }
  });

  await user.save();

  const token = jwt.sign(
    { userId: user._id, email: user.email, tier: user.tier },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    user: userResponse,
    token,
    accessToken: token,
    refreshToken: token
  });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email et mot de passe requis'
    });
  }

  if (!User || mongoose.connection.readyState !== 1) {
    if (email === 'test@example.com' && password === 'password123') {
      const fakeToken = jwt.sign(
        { email, tier: 'free', userId: 'test-user-id' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Mode test - Login simulÃ©',
        user: { email, tier: 'free' },
        token: fakeToken,
        accessToken: fakeToken,
        refreshToken: fakeToken
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects (test mode)'
      });
    }
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Email ou mot de passe incorrect'
    });
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: 'Email ou mot de passe incorrect'
    });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign(
    { userId: user._id, email: user.email, tier: user.tier },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const userResponse = user.toObject();
  delete userResponse.password;

  res.json({
    success: true,
    user: userResponse,
    token,
    accessToken: token,
    refreshToken: token
  });
}));

app.get('/api/auth/profile', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Token requis'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const newToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, tier: decoded.tier },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      accessToken: newToken,
      refreshToken: newToken
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token invalide ou expirÃ©'
    });
  }
});

// ========== ROUTES ADMIN RATE LIMITING ==========
app.get('/api/admin/rate-limits/stats', authMiddleware, async (req, res) => {
  // VÃ©rifier que c'est un admin
  if (req.user.role !== 'admin' && req.headers['x-admin-key'] !== ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const stats = await rateLimiters.getRateLimitStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/rate-limits/reset/:userId', authMiddleware, async (req, res) => {
  // VÃ©rifier que c'est un admin
  if (req.user.role !== 'admin' && req.headers['x-admin-key'] !== ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const { userId } = req.params;
    const { endpoint } = req.body;
    const result = await rateLimiters.resetUserRateLimits(userId, endpoint);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CHARGEMENT DES ROUTES ==========
function setupRoutes() {
  logger.info('ðŸ”„ Chargement des routes...');

  // Routes cosmÃ©tiques
  try {
    const cosmeticRoutes = require('./routes/cosmetic.routes');
    app.use('/api/cosmetic', authMiddleware, cosmeticRoutes);
    logger.info('  âœ… Cosmetic routes loaded');
  } catch (error) {
    logger.error('  âŒ Cosmetic routes error:', error.message);
  }

  // Routes dÃ©tergents
  try {
    const detergentRoutes = require('./routes/detergent.routes');
    app.use('/api/detergent', authMiddleware, detergentRoutes);
    logger.info('  âœ… Detergent routes loaded');
  } catch (error) {
    logger.error('  âŒ Detergent routes error:', error.message);
  }

  // Routes dashboard avec rate limiter spÃ©cifique
  try {
    const dashboardRoutes = require('./routes/dashboard');
    app.use('/api/dashboard', authMiddleware, rateLimiters.dashboardLimiter, dashboardRoutes);
    logger.info('  âœ… Dashboard routes loaded with rate limiting');
  } catch (error) {
    logger.error('  âŒ Dashboard routes error:', error.message);
  }

  try {
    const productRoutes = require('./routes/products');
    app.use('/api/products', productRoutes);
    logger.info('  âœ… Product routes loaded');
  } catch (error) {
    logger.error('  âŒ Product routes error:', error.message);
  }

  // Routes d'analyse avec rate limiter et middleware de quotas
  try {
    const analysisRoutes = require('./routes/analysis');
    app.use('/api/analysis', authMiddleware, rateLimiters.analysisLimiter, checkQuotaMiddleware, analysisRoutes);
    logger.info('  âœ… Analysis routes loaded with rate limiting and quota check');
  } catch (error) {
    logger.warn('  âš ï¸ Analysis routes not found, creating minimal routes');
    
    // Routes minimales si le fichier n'existe pas
    const analysisRouter = express.Router();
    
    // Import des analyseurs
    let cosmeticAnalyzer, detergentAnalyzer;
    try {
      cosmeticAnalyzer = require('./services/analysis/cosmeticAnalyzer');
      detergentAnalyzer = require('./services/analysis/detergentAnalyzer');
      logger.info('  âœ… Analyzers loaded successfully');
    } catch (err) {
      logger.error('  âŒ Error loading analyzers:', err.message);
    }
    
    // Route analyse cosmÃ©tique
    analysisRouter.post('/cosmetic', asyncHandler(async (req, res) => {
      const { productName, ingredients } = req.body;
      
      if (!productName || !ingredients) {
        return res.status(400).json({
          success: false,
          error: 'Nom du produit et ingrÃ©dients requis'
        });
      }
      
      if (cosmeticAnalyzer) {
        const analysis = await cosmeticAnalyzer.analyze(productName, ingredients, req.userId);
        res.json({ success: true, data: analysis });
      } else {
        res.status(500).json({
          success: false,
          error: 'Service d\'analyse cosmÃ©tique non disponible'
        });
      }
    }));
    
    // Route analyse dÃ©tergent
    analysisRouter.post('/detergent', asyncHandler(async (req, res) => {
      const { productName, ingredients } = req.body;
      
      if (!productName || !ingredients) {
        return res.status(400).json({
          success: false,
          error: 'Nom du produit et composition requis'
        });
      }
      
      if (detergentAnalyzer) {
        const analysis = await detergentAnalyzer.analyze(productName, ingredients, req.userId);
        res.json({ success: true, data: analysis });
      } else {
        res.status(500).json({
          success: false,
          error: 'Service d\'analyse dÃ©tergent non disponible'
        });
      }
    }));
    
    app.use('/api/analysis', authMiddleware, rateLimiters.analysisLimiter, checkQuotaMiddleware, analysisRouter);
  }

  try {
    const analyzeRoutes = require('./routes/analyze.routes');
    app.use('/api/analyze', authMiddleware, rateLimiters.analysisLimiter, checkQuotaMiddleware, analyzeRoutes);
    logger.info('  âœ… Analyze routes loaded with rate limiting and quota check');
  } catch (error) {
    logger.warn('  âš ï¸ Analyze routes not found');
  }

  // QUOTA ROUTES
  try {
    const quotaRoutes = require('./routes/quota');
    app.use('/api/quota', quotaRoutes);
    logger.info('  âœ… Quota routes loaded');
  } catch (error) {
    logger.warn('  âš ï¸ Quota routes not found, creating minimal routes');
    
    // Routes minimales de quota si le fichier n'existe pas
    const quotaRouter = express.Router();
    
    // Route status des quotas
    quotaRouter.get('/status', authMiddleware, async (req, res) => {
      try {
        if (User && mongoose.connection.readyState === 1) {
          const user = await User.findById(req.userId).select('quotas tier subscription');
          
          if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvÃ©' });
          }

          // Calculer les limites selon le tier
          const limits = {
            free: { scans: 30, aiQuestions: 5 },
            premium: { scans: -1, aiQuestions: 500 },
            family: { scans: -1, aiQuestions: 500 }
          };

          const userLimits = limits[user.tier || 'free'];

          res.json({
            quotas: {
              scansUsed: user.quotas?.scansUsed || 0,
              scansLimit: userLimits.scans,
              scansRemaining: userLimits.scans === -1 ? -1 : (userLimits.scans - (user.quotas?.scansUsed || 0)),
              aiQuestionsUsed: user.quotas?.aiChatsUsed || 0,
              aiQuestionsLimit: userLimits.aiQuestions,
              aiQuestionsRemaining: userLimits.aiQuestions - (user.quotas?.aiChatsUsed || 0)
            },
            scan: {
              used: user.quotas?.scansUsed || 0,
              limit: userLimits.scans,
              unlimited: userLimits.scans === -1
            },
            aiQuestion: {
              used: user.quotas?.aiChatsUsed || 0,
              limit: userLimits.aiQuestions,
              unlimited: false
            }
          });
        } else {
          // Mode test sans DB
          res.json({
            quotas: {
              scansUsed: 5,
              scansLimit: 30,
              scansRemaining: 25,
              aiQuestionsUsed: 2,
              aiQuestionsLimit: 5,
              aiQuestionsRemaining: 3
            }
          });
        }
      } catch (error) {
        logger.error('Error fetching quotas:', error);
        res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration des quotas' });
      }
    });
    
    app.use('/api/quota', quotaRouter);
    logger.info('  âœ… Quota routes created (minimal)');
  }

  // NOUVELLES ROUTES
  try {
    const proxyRoutes = require('./routes/proxy');
    app.use('/api/proxy', authMiddleware, proxyRoutes);
    logger.info('  âœ… Proxy routes loaded');
  } catch (error) {
    logger.error('  âŒ Proxy routes error:', error.message);
  }

  try {
    const gdprRoutes = require('./routes/gdpr');
    app.use('/api/gdpr', authMiddleware, gdprRoutes);
    logger.info('  âœ… GDPR routes loaded');
  } catch (error) {
    logger.error('  âŒ GDPR routes error:', error.message);
  }

  // AI Routes avec rate limiter et quota check
  try {
    const aiRoutes = require('./routes/ai');
    app.use('/api/ai', authMiddleware, rateLimiters.aiLimiter, checkQuotaMiddleware, aiRoutes);
    app.use('/api/v1/ai', authMiddleware, rateLimiters.aiLimiter, checkQuotaMiddleware, aiRoutes);
    logger.info('  âœ… AI routes loaded with rate limiting and quota check');
  } catch (error) {
    logger.warn('  âš ï¸ AI routes not found');
  }

  // Autres routes
  try {
    const partnerRoutes = require('./routes/partner.routes');
    app.use('/api/partner', partnerRoutes);
    logger.info('  âœ… Partner routes loaded');
  } catch (error) {
    logger.warn('  âš ï¸ Partner routes not found');
  }

  try {
    const paymentRoutes = require('./routes/payment');
    app.use('/api/payment', authMiddleware, paymentRoutes);
    logger.info('  âœ… Payment routes loaded');
  } catch (error) {
    logger.warn('  âš ï¸ Payment routes not found');
  }

  try {
    const algoliaRoutes = require('./routes/algolia');
    app.use('/api/algolia', algoliaRoutes);
    logger.info('  âœ… Algolia routes loaded');
  } catch (error) {
    logger.warn('  âš ï¸ Algolia routes not found');
  }

  // Route export avec rate limiter spÃ©cifique
  app.post('/api/export/*', authMiddleware, rateLimiters.exportLimiter, (req, res) => {
    res.status(501).json({ error: 'Export functionality not yet implemented' });
  });

  logger.info('âœ… Routes setup completed\n');
}

// ========== JOBS CRON ==========
function setupCronJobs() {
  const cron = require('node-cron');
  
  // Reset des quotas quotidiens Ã  minuit
  cron.schedule('0 0 * * *', async () => {
    logger.info('ðŸ”„ Running daily quota reset...');
    try {
      if (User && mongoose.connection.readyState === 1) {
        const result = await User.updateMany(
          { 
            'quotas.scansResetDate': { $lte: new Date() },
            tier: 'free'
          },
          {
            $set: {
              'quotas.scansRemaining': 30,
              'quotas.scansResetDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          }
        );
        logger.info(`âœ… Reset quotas for ${result.modifiedCount} users`);
      }
    } catch (error) {
      logger.error('âŒ Quota reset error:', error);
    }
  });

  // Nettoyage des logs anciens (90 jours)
  cron.schedule('0 3 * * 0', async () => {
    logger.info('ðŸ”„ Running log cleanup...');
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      if (mongoose.connection.readyState === 1) {
        const WebhookLog = require('./models/WebhookLog');
        const result = await WebhookLog.cleanupOldLogs(90);
        logger.info(`âœ… Cleaned up old webhook logs`);
      }
    } catch (error) {
      logger.error('âŒ Log cleanup error:', error);
    }
  });

  // Stats de rate limiting toutes les heures (en production)
  if (process.env.NODE_ENV === 'production') {
    cron.schedule('0 * * * *', async () => {
      try {
        const stats = await rateLimiters.getRateLimitStats();
        logger.info('ðŸ“Š Hourly rate limit stats:', JSON.stringify(stats));
      } catch (error) {
        logger.error('âŒ Rate limit stats error:', error);
      }
    });
  }
}

// ========== DÃ‰MARRAGE SERVEUR ==========
async function startServer() {
  try {
    await connectMongoDB();
    await connectRedis();
    setupRoutes();
    setupCronJobs();

    // 404 Handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
        method: req.method
      });
    });

    // Error handler
    app.use((err, req, res, next) => {
      logger.error('Error:', err);
      
      // Gestion spÃ©ciale pour les erreurs de rate limit
      if (err.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: err.message || 'Trop de requÃªtes',
          retryAfter: err.retryAfter || 60
        });
      }
      
      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    app.listen(PORT, () => {
      logger.info('â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
      logger.info('â•‘             ECOLOJIA V3 SERVER STARTED                     â•‘');
      logger.info('â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£');
      logger.info(`â•‘ ðŸš€ Server:       http://localhost:${PORT}                      â•‘`);
      logger.info(`â•‘ ðŸ“Š Environment:  ${(process.env.NODE_ENV || 'development').padEnd(41)}â•‘`);
      logger.info(`â•‘ ðŸ”— Frontend:     ${(process.env.FRONTEND_URL || 'http://localhost:3000').padEnd(41)}â•‘`);
      logger.info('â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£');
      logger.info(`â•‘ ðŸ—„ï¸  MongoDB:      ${mongoose.connection.readyState === 1 ? 'âœ… Connected' : 'âŒ Not connected'}                              â•‘`);
      logger.info(`â•‘ ðŸ’¾ Redis:        ${redisClient?.isReady ? 'âœ… Connected' : 'âŒ Not connected'}                              â•‘`);
      logger.info(`â•‘ ðŸš¦ Rate Limit:   ${redisClient?.isReady ? 'âœ… Redis' : 'âš ï¸  Memory'}                                 â•‘`);
      logger.info(`â•‘ ðŸ” Algolia:      ${process.env.ALGOLIA_APP_ID ? 'âœ… Configured' : 'âŒ Not configured'}                             â•‘`);
      logger.info(`â•‘ ðŸ’³ LemonSqueezy: ${process.env.LEMONSQUEEZY_STORE_ID ? 'âœ… Configured' : 'âŒ Not configured'}                             â•‘`);
      logger.info(`â•‘ ðŸ¤– DeepSeek AI:  ${process.env.DEEPSEEK_API_KEY ? 'âœ… Configured' : 'âŒ Not configured'}                             â•‘`);
      logger.info('â• â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•£');
      logger.info('â•‘ ðŸ“¦ Features:                                               â•‘');
      logger.info('â•‘   â€¢ Food Analysis (NOVA, Nutri-Score)                     â•‘');
      logger.info('â•‘   â€¢ Cosmetic Analysis (INCI, Safety)                      â•‘');
      logger.info('â•‘   â€¢ Detergent Analysis (Eco, CDV)                         â•‘');
      logger.info('â•‘   â€¢ AI Chat Assistant with Quotas                         â•‘');
      logger.info('â•‘   â€¢ Advanced Rate Limiting (Per Tier)                     â•‘');
      logger.info('â•‘   â€¢ Secure API Proxy                                      â•‘');
      logger.info('â•‘   â€¢ GDPR Compliance                                       â•‘');
      logger.info('â•‘   â€¢ Payment Processing                                    â•‘');
      logger.info('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
    });

  } catch (error) {
    logger.error('âŒ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  if (redisClient?.isReady) {
    await redisClient.quit();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  if (redisClient?.isReady) {
    await redisClient.quit();
  }
  process.exit(0);
});

startServer();

// Export pour les tests
module.exports = { app, redisClient };
