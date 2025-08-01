// backend/src/server.js
// VERSION PRODUCTION COMPLÈTE ECOLOJIA V3

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const redis = require('redis');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import des utils
const { logger } = require('./utils/logger');
const { asyncHandler } = require('./utils/errors');

// Initialisation Express
const app = express();
const PORT = process.env.PORT || 5001;

// Configuration
app.set('trust proxy', 1);
const JWT_SECRET = process.env.JWT_SECRET || 'ecolojia-secret-key-2024-super-secure';

// Redis client global
let redisClient;

// ========== MIDDLEWARES DE SÉCURITÉ ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.algolia.com", "https://api.deepseek.com"]
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

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Trop de tentatives de connexion',
  skipSuccessfulRequests: true
});

app.use(globalLimiter);
app.use('/api/auth', authLimiter);

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

    logger.info('✅ MongoDB Atlas connected successfully');

    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.info(`📦 Collections: ${collections.map(c => c.name).join(', ')}`);

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
        url: process.env.REDIS_URL
      });

      redisClient.on('error', (err) => logger.error('Redis error:', err));

      await redisClient.connect();
      logger.info('✅ Redis connected successfully');
    } else {
      logger.info('ℹ️ Redis not configured');
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
    services: {
      api: 'operational',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.isReady ? 'connected' : 'disconnected'
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
          error: 'Utilisateur non trouvé'
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
      error: 'Token invalide ou expiré'
    });
  }
};

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
      message: 'Mode test - MongoDB non connecté',
      user: { email, firstName, lastName, tier: 'free' },
      token: fakeToken
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'Cet email est déjà utilisé'
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = new User({
    email: email.toLowerCase(),
    password: hashedPassword,
    name: `${firstName} ${lastName}`,
    profile: { firstName, lastName },
    tier: 'free',
    status: 'active',
    quotas: {
      scansRemaining: 30,
      scansResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      aiChatsRemaining: 5,
      aiChatsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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
        message: 'Mode test - Login simulé',
        user: { email, tier: 'free' },
        token: fakeToken
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

  const isValidPassword = await bcrypt.compare(password, user.password);
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
      error: 'Token invalide ou expiré'
    });
  }
});

// ========== CHARGEMENT DES ROUTES ==========
function setupRoutes() {
  logger.info('🔄 Chargement des routes...');

  try {
    const dashboardRoutes = require('./routes/dashboard');
    app.use('/api/dashboard', dashboardRoutes);
    logger.info('  ✅ Dashboard routes loaded');
  } catch (error) {
    logger.error('  ❌ Dashboard routes error:', error.message);
  }

  try {
    const productRoutes = require('./routes/products');
    app.use('/api/products', productRoutes);
    logger.info('  ✅ Product routes loaded');
  } catch (error) {
    logger.error('  ❌ Product routes error:', error.message);
  }

  try {
    const analyzeRoutes = require('./routes/analyze.routes');
    app.use('/api/analyze', analyzeRoutes);
    logger.info('  ✅ Analyze routes loaded');
  } catch (error) {
    logger.warn('  ⚠️ Analyze routes not found');
  }

  try {
    const partnerRoutes = require('./routes/partner.routes');
    app.use('/api/partner', partnerRoutes);
    logger.info('  ✅ Partner routes loaded');
  } catch (error) {
    logger.warn('  ⚠️ Partner routes not found');
  }

  try {
    const aiRoutes = require('./routes/ai');
    app.use('/api/ai', aiRoutes);
    logger.info('  ✅ AI routes loaded');
  } catch (error) {
    logger.warn('  ⚠️ AI routes not found');
  }

  try {
    const paymentRoutes = require('./routes/payment');
    app.use('/api/payment', paymentRoutes);
    logger.info('  ✅ Payment routes loaded');
  } catch (error) {
    logger.warn('  ⚠️ Payment routes not found');
  }

  try {
    const algoliaRoutes = require('./routes/algolia');
    app.use('/api/algolia', algoliaRoutes);
    logger.info('  ✅ Algolia routes loaded');
  } catch (error) {
    logger.warn('  ⚠️ Algolia routes not found');
  }

  logger.info('✅ Routes setup completed\n');
}

// ========== DÉMARRAGE SERVEUR ==========
async function startServer() {
  try {
    await connectMongoDB();
    await connectRedis();
    setupRoutes();

    // 404 Handler déplacé ici, après setupRoutes
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
      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      logger.info(`🗄️  MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected'}`);
      logger.info(`💾 Redis: ${redisClient?.isReady ? 'Connected' : 'Not connected'}`);
      logger.info(`🔍 Algolia: ${process.env.ALGOLIA_APP_ID ? 'Configured' : 'Not configured'}`);
      logger.info(`💳 LemonSqueezy: ${process.env.LEMONSQUEEZY_STORE_ID ? 'Configured' : 'Not configured'}`);
      logger.info(`🤖 DeepSeek AI: ${process.env.DEEPSEEK_API_KEY ? 'Configured' : 'Not configured'}`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

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
module.exports = app;
