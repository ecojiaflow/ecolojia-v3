// backend/src/server.js
// VERSION PRODUCTION COMPLï¿½TE ECOLOJIA V3 - AVEC VISION SERVICE & BULLMQ

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const redis = require('redis');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import des services Queue et Workers
const queueService = require('./services/queue/QueueService');
const imageProcessingWorker = require('./workers/ImageProcessingWorker');
const cloudinaryService = require('./services/upload/CloudinaryService');
const ProductOCRService = require('./services/vision/ProductOCRService');

// Logger simple
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Debug des chemins
console.log('Current directory:', __dirname);
console.log('Quota file exists?', fs.existsSync(path.join(__dirname, 'routes', 'quota.js')));

// Import du middleware de quotas
const { checkQuota, checkQuotaMiddleware } = require('./middleware/quotaMiddleware');

// Import du systï¿½me de rate limiting robuste
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
  logger.info('? Rate limiter module loaded successfully');
} catch (error) {
  console.warn('?? Custom rate limiter not found, using fallback');
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
    globalLimiter: createFallbackLimiter(15 * 60 * 1000, 1000, 'Trop de requï¿½tes, veuillez rï¿½essayer plus tard'),
    loginLimiter: createFallbackLimiter(15 * 60 * 1000, 5, 'Trop de tentatives de connexion'),
    registerLimiter: createFallbackLimiter(60 * 60 * 1000, 3, 'Trop de crï¿½ations de compte'),
    dashboardLimiter: createFallbackLimiter(60 * 1000, 60, 'Trop de requï¿½tes au dashboard'),
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

// Redis client global - EXPORTï¿½ pour usage dans d'autres modules
let redisClient;
let server; // Pour le graceful shutdown

// ========== MIDDLEWARES DE Sï¿½CURITï¿½ ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "*.cloudinary.com"],
      connectSrc: ["'self'", "https://api.algolia.com", "https://api.deepseek.com", "https://api.lemonsqueezy.com", "https://vision.googleapis.com"]
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

// Rate limiting global (appliquï¿½ ï¿½ toutes les routes)
app.use(rateLimiters.globalLimiter);

// Rate limiting spï¿½cifique pour l'authentification
app.use('/api/auth/login', rateLimiters.loginLimiter);
app.use('/api/auth/register', rateLimiters.registerLimiter);

// ========== CONNEXIONS DB ==========
async function connectMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn('MONGODB_URI not configured, running without database');
      return false;
    }

    await mongoose.connect(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000
    });

    logger.info('? MongoDB Atlas connected successfully');

    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.info(`?? Collections: ${collections.map(c => c.name).join(', ')}`);

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
      redisClient.on('reconnecting', () => console.warn('Redis: Reconnecting...'));

      await redisClient.connect();
      logger.info('? Redis connected successfully');
      
      // Exporter le client Redis pour usage global
      global.redisClient = redisClient;
      module.exports.redisClient = redisClient;
      
      // Initialiser le service de queues
      if (redisClient.isReady) {
        await queueService.initialize();
        logger.info('? Queue service initialized');
        
        // Dï¿½marrer les workers
        if (process.env.NODE_ENV !== 'test') {
          await imageProcessingWorker.start();
          logger.info('? Image processing worker started');
        }
      }
    } else {
      logger.info('?? Redis not configured');
    }
  } catch (error) {
    console.warn('Redis connection failed:', error.message);
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
      lemonsqueezy: process.env.LEMONSQUEEZY_STORE_ID ? 'configured' : 'not configured',
      cloudinary: cloudinaryService.initialized ? 'configured' : 'not configured',
      googleVision: process.env.GOOGLE_VISION_ENABLED === 'true' ? 'configured' : 'not configured',
      visionService: 'ready',
      productOCRService: ProductOCRService.initialized ? 'ready' : 'not initialized',
      queueService: queueService.queues['image-analysis'] ? 'running' : 'not running',
      workers: {
        imageProcessing: 'active'
      }
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
      'Advanced Rate Limiting',
      'Vision Analysis (OCR & Image Processing)',
      'Queue System (BullMQ)',
      'Cloud Storage (Cloudinary)'
    ],
    timestamp: new Date().toISOString()
  });
});

// ========== ROUTES AUTH DIRECTES ==========
let User;
try {
  User = require('./models/User');
} catch (error) {
  console.warn('User model not found, using mock');
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
          error: 'Utilisateur non trouvï¿½'
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
      error: 'Token invalide ou expirï¿½'
    });
  }
};

  // Routes d'analyse avec rate limiter et middleware de quotas
  try {
    const analysisRoutes = require('./routes/analysis-simple');
    app.use('/api/analysis', authMiddleware, rateLimiters.analysisLimiter, checkQuotaMiddleware, analysisRoutes);
    logger.info('  ? Analysis routes loaded with rate limiting and quota check');
  } catch (error) {
    console.warn('  ?? Analysis routes error:', error.message);
    
    // Créer des routes minimales de fallback
    const fallbackRouter = express.Router();
    
    fallbackRouter.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Analysis service is running (fallback mode)',
        endpoints: ['/barcode', '/manual', '/food']
      });
    });
    
    fallbackRouter.post('/barcode', (req, res) => {
      res.json({
        success: false,
        error: 'Service temporairement indisponible',
        fallback: true
      });
    });
    
    fallbackRouter.post('/manual', (req, res) => {
      res.json({
        success: false,
        error: 'Service temporairement indisponible',
        fallback: true
      });
    });
    
    app.use('/api/analysis', authMiddleware, rateLimiters.analysisLimiter, checkQuotaMiddleware, fallbackRouter);
    logger.info('  ? Analysis routes loaded (fallback mode)');
  }
    // Route analyse cosmï¿½tique
    analysisRouter.post('/cosmetic', asyncHandler(async (req, res) => {
      const { productName, ingredients } = req.body;
      
      if (!productName || !ingredients) {
        return res.status(400).json({
          success: false,
          error: 'Nom du produit et ingrï¿½dients requis'
        });
      }
      
      if (cosmeticAnalyzer) {
        const analysis = await cosmeticAnalyzer.analyze(productName, ingredients, req.userId);
        res.json({ success: true, data: analysis });
      } else {
        res.status(500).json({
          success: false,
          error: 'Service d\'analyse cosmï¿½tique non disponible'
        });
      }
    }));
    
    // Route analyse dï¿½tergent
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
          error: 'Service d\'analyse dï¿½tergent non disponible'
        });
      }
    }));
    
        // Créer le router ici si pas déjà fait
    if (typeof analysisRouter === 'undefined') {
      const analysisRouter = express.Router();
      analysisRouter.get('/', (req, res) => res.json({ message: 'Analysis routes temporary' }));
    }
    app.use('/api/analysis', authMiddleware, rateLimiters.analysisLimiter, checkQuotaMiddleware, analysisRouter);
  }

  // Routes Vision (NOUVEAU)
  try {
    const visionRoutes = require('./routes/vision.routes');
    app.use('/api/vision', authMiddleware, visionRoutes);
    logger.info('  ? Vision routes loaded');
  } catch (error) {
    logger.error('  ? Vision routes error:', error.message);
  }

  // Routes Upload (NOUVEAU)
  try {
    const uploadRoutes = require('./routes/upload.routes');
    app.use('/api/upload', authMiddleware, uploadRoutes);
    logger.info('  ? Upload routes loaded');
  } catch (error) {
    console.warn('  ?? Upload routes not found, creating minimal routes');
    
    const uploadRouter = express.Router();
    
    // Route pour gï¿½nï¿½rer une signature Cloudinary
    uploadRouter.post('/signature', asyncHandler(async (req, res) => {
      try {
        const { folder, tags, context } = req.body;
        const userId = req.userId;
        
        const signature = cloudinaryService.generateUploadSignature({
          userId,
          folder: folder || `users/${userId}/products`,
          tags,
          context
        });
        
        res.json({
          success: true,
          ...signature
        });
      } catch (error) {
        logger.error('Upload signature error:', error);
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la gï¿½nï¿½ration de la signature'
        });
      }
    }));
    
    app.use('/api/upload', authMiddleware, uploadRouter);
  }

  try {
    const analyzeRoutes = require('./routes/analysis-simple');
    app.use('/api/analyze', authMiddleware, rateLimiters.analysisLimiter, checkQuotaMiddleware, analyzeRoutes);
    logger.info('  ? Analyze routes loaded with rate limiting and quota check');
  } catch (error) {
    console.warn('  ?? Analyze routes not found');
  }

  // QUOTA ROUTES
  try {
    const quotaRoutes = require('./routes/quota');
    app.use('/api/quota', quotaRoutes);
    logger.info('  ? Quota routes loaded');
  } catch (error) {
    console.warn('  ?? Quota routes not found, creating minimal routes');
    
    // Routes minimales de quota si le fichier n'existe pas
    const quotaRouter = express.Router();
    
    // Route status des quotas
    quotaRouter.get('/status', authMiddleware, async (req, res) => {
      try {
        if (User && mongoose.connection.readyState === 1) {
          const user = await User.findById(req.userId).select('quotas tier subscription');
          
          if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvï¿½' });
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
        res.status(500).json({ message: 'Erreur lors de la rï¿½cupï¿½ration des quotas' });
      }
    });
    
    app.use('/api/quota', quotaRouter);
    logger.info('  ? Quota routes created (minimal)');
  }

  // NOUVELLES ROUTES
  try {
    const proxyRoutes = require('./routes/proxy');
    app.use('/api/proxy', authMiddleware, proxyRoutes);
    logger.info('  ? Proxy routes loaded');
  } catch (error) {
    logger.error('  ? Proxy routes error:', error.message);
  }

  try {
    const gdprRoutes = require('./routes/gdpr');
    app.use('/api/gdpr', authMiddleware, gdprRoutes);
    logger.info('  ? GDPR routes loaded');
  } catch (error) {
    logger.error('  ? GDPR routes error:', error.message);
  }

  // AI Routes avec rate limiter et quota check
  try {
    const aiRoutes = require('./routes/ai');
    app.use('/api/ai', authMiddleware, rateLimiters.aiLimiter, checkQuotaMiddleware, aiRoutes);
    app.use('/api/v1/ai', authMiddleware, rateLimiters.aiLimiter, checkQuotaMiddleware, aiRoutes);
    logger.info('  ? AI routes loaded with rate limiting and quota check');
  } catch (error) {
    console.warn('  ?? AI routes not found');
  }

  // Autres routes
  try {
    const partnerRoutes = require('./routes/partner.routes');
    app.use('/api/partner', partnerRoutes);
    logger.info('  ? Partner routes loaded');
  } catch (error) {
    console.warn('  ?? Partner routes not found');
  }

  try {
    const paymentRoutes = require('./routes/payment');
    app.use('/api/payment', authMiddleware, paymentRoutes);
    logger.info('  ? Payment routes loaded');
  } catch (error) {
    console.warn('  ?? Payment routes not found');
  }

  try {
    const algoliaRoutes = require('./routes/algolia');
    app.use('/api/algolia', algoliaRoutes);
    logger.info('  ? Algolia routes loaded');
  } catch (error) {
    console.warn('  ?? Algolia routes not found');
  }

  // Route export avec rate limiter spï¿½cifique
  app.post('/api/export/*', authMiddleware, rateLimiters.exportLimiter, (req, res) => {
    res.status(501).json({ error: 'Export functionality not yet implemented' });
  });

  logger.info('? Routes setup completed\n');
}

// ========== JOBS CRON ==========
function setupCronJobs() {
  const cron = require('node-cron');
  
  // Reset des quotas quotidiens ï¿½ minuit
  cron.schedule('0 0 * * *', async () => {
    logger.info('?? Running daily quota reset...');
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
        logger.info(`? Reset quotas for ${result.modifiedCount} users`);
      }
    } catch (error) {
      logger.error('? Quota reset error:', error);
    }
  });

  // Nettoyage des logs anciens (90 jours)
  cron.schedule('0 3 * * 0', async () => {
    logger.info('?? Running log cleanup...');
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      if (mongoose.connection.readyState === 1) {
        const WebhookLog = require('./models/WebhookLog');
        const result = await WebhookLog.cleanupOldLogs(90);
        logger.info(`? Cleaned up old webhook logs`);
      }
    } catch (error) {
      logger.error('? Log cleanup error:', error);
    }
  });

  // Stats de rate limiting toutes les heures (en production)
  if (process.env.NODE_ENV === 'production') {
    cron.schedule('0 * * * *', async () => {
      try {
        const stats = await rateLimiters.getRateLimitStats();
        logger.info('?? Hourly rate limit stats:', JSON.stringify(stats));
      } catch (error) {
        logger.error('? Rate limit stats error:', error);
      }
    });
  }
}

// ========== GRACEFUL SHUTDOWN ==========
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received, starting graceful shutdown`);
  
  // Arrï¿½ter d'accepter de nouvelles connexions
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }
  
  // Arrï¿½ter les workers
  try {
    await queueService.shutdown();
    logger.info('Queue service shut down');
  } catch (error) {
    logger.error('Error shutting down queue service:', error);
  }
  
  // Fermer les connexions DB
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
  
  if (redisClient?.isReady) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
  
  // Arrï¿½ter VisionService
  try {
    const visionService = require('./services/vision/VisionService');
    await visionService.shutdown();
    logger.info('Vision service shut down');
  } catch (error) {
    logger.error('Error shutting down vision service:', error);
  }

  // Arreter ProductOCRService
try {
  await ProductOCRService.shutdown();
  logger.info('ProductOCRService shut down');
} catch (error) {
  logger.error('Error shutting down ProductOCRService:', error);
}
  
  process.exit(0);
};

// ========== Dï¿½MARRAGE SERVEUR ==========
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
      
      // Gestion spï¿½ciale pour les erreurs de rate limit
      if (err.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: err.message || 'Trop de requï¿½tes',
          retryAfter: err.retryAfter || 60
        });
      }
      
      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    server = app.listen(PORT, () => {
      logger.info('+------------------------------------------------------------+');
      logger.info('ï¿½             ECOLOJIA V3 SERVER STARTED                     ï¿½');
      logger.info('ï¿½------------------------------------------------------------ï¿½');
      logger.info(`ï¿½ ?? Server:       http://localhost:${PORT}                      ï¿½`);
      logger.info(`ï¿½ ?? Environment:  ${(process.env.NODE_ENV || 'development').padEnd(41)}ï¿½`);
      logger.info(`ï¿½ ?? Frontend:     ${(process.env.FRONTEND_URL || 'http://localhost:3000').padEnd(41)}ï¿½`);
      logger.info('ï¿½------------------------------------------------------------ï¿½');
      logger.info(`ï¿½ ???  MongoDB:      ${mongoose.connection.readyState === 1 ? '? Connected' : '? Not connected'}                              ï¿½`);
      logger.info(`ï¿½ ?? Redis:        ${redisClient?.isReady ? '? Connected' : '? Not connected'}                              ï¿½`);
      logger.info(`ï¿½ ?? Rate Limit:   ${redisClient?.isReady ? '? Redis' : '??  Memory'}                                 ï¿½`);
      logger.info(`ï¿½ ?? Algolia:      ${process.env.ALGOLIA_APP_ID ? '? Configured' : '? Not configured'}                             ï¿½`);
      logger.info(`ï¿½ ?? LemonSqueezy: ${process.env.LEMONSQUEEZY_STORE_ID ? '? Configured' : '? Not configured'}                             ï¿½`);
      logger.info(`ï¿½ ?? DeepSeek AI:  ${process.env.DEEPSEEK_API_KEY ? '? Configured' : '? Not configured'}                             ï¿½`);
      logger.info(`ï¿½ ?? Cloudinary:   ${process.env.CLOUDINARY_CLOUD_NAME ? '? Configured' : '? Not configured'}                             ï¿½`);
      logger.info(`ï¿½ ???  Google Vision:${process.env.GOOGLE_VISION_ENABLED === 'true' ? '? Configured' : '? Not configured'}                             ï¿½`);
      logger.info('ï¿½------------------------------------------------------------ï¿½');
      logger.info('ï¿½ ?? Features:                                               ï¿½');
      logger.info('ï¿½   ï¿½ Food Analysis (NOVA, Nutri-Score)                     ï¿½');
      logger.info('ï¿½   ï¿½ Cosmetic Analysis (INCI, Safety)                      ï¿½');
      logger.info('ï¿½   ï¿½ Detergent Analysis (Eco, CDV)                         ï¿½');
      logger.info('ï¿½   ï¿½ AI Chat Assistant with Quotas                         ï¿½');
      logger.info('ï¿½   ï¿½ Advanced Rate Limiting (Per Tier)                     ï¿½');
      logger.info('ï¿½   ï¿½ Vision Analysis (OCR & Image Processing)              ï¿½');
      logger.info('ï¿½   ï¿½ Queue System (BullMQ)                                 ï¿½');
      logger.info('ï¿½   ï¿½ Cloud Storage (Cloudinary)                            ï¿½');
      logger.info('ï¿½   ï¿½ Secure API Proxy                                      ï¿½');
      logger.info('ï¿½   ï¿½ GDPR Compliance                                       ï¿½');
      logger.info('ï¿½   ï¿½ Payment Processing                                    ï¿½');
      logger.info('+------------------------------------------------------------+');
    });

  } catch (error) {
    logger.error('? Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

// Export pour les tests
module.exports = { app, redisClient };




