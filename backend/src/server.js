// backend/src/server.js
// FICHIER COMPLET AVEC ROUTES AUTH INTÉGRÉES - VERSION CORRIGÉE

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const redis = require('redis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Initialisation Express
const app = express();
const PORT = process.env.PORT || 5001;

// IMPORTANT: Configurer trust proxy pour Render.com
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'ecolojia-secret-key-2024-super-secure';

// Variables globales
let redisClient;

// Logger unifié
const logger = {
  info: (...args) => console.log(`[${new Date().toISOString()}] [INFO]`, ...args),
  error: (...args) => console.error(`[${new Date().toISOString()}] [ERROR]`, ...args),
  warn: (...args) => console.warn(`[${new Date().toISOString()}] [WARN]`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] [DEBUG]`, ...args);
    }
  }
};

// Fonction de validation email
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Gestionnaire d'erreurs async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Configuration CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'https://frontendvf.netlify.app',
      'https://app.ecolojia.app'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// ========== MIDDLEWARES ==========

// Sécurité
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
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ET modifier les rate limiters (lignes ~95-102) :
// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  // Supprimer trustProxy: true car on utilise app.set('trust proxy')
  // Ajouter un keyGenerator personnalisé pour Render
  keyGenerator: (req) => {
    // Sur Render, l'IP réelle est dans x-forwarded-for
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.socket.remoteAddress || 
           'unknown';
  }
});

// Rate limiting strict pour auth (lignes ~105-115)
/ Remplacez la fonction authMiddleware dans server.js (vers ligne 120-150)
// par cette version corrigée :

// Middleware d'authentification
const authMiddleware = async (req, res, next) => {  // ✅ ASYNC ajouté ici
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
    
    // Si MongoDB est connecté, récupérer l'utilisateur
    if (mongoose.connection.readyState === 1) {
      const User = require('./models/User');
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }
      req.user = user;
    } else {
      // Mode test
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré'
    });
  }
};

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Si MongoDB est connecté, récupérer l'utilisateur
    if (mongoose.connection.readyState === 1) {
      const User = require('./models/User');
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }
      req.user = user;
    } else {
      // Mode test
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré'
    });
  }
};

// ========== ROUTES HEALTH & TEST ==========

// GET /api/health
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

  // Vérifier que MongoDB répond
  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.db.admin().ping();
      checks.services.mongodb = 'healthy';
    } catch (error) {
      checks.services.mongodb = 'unhealthy';
    }
  }

  const isHealthy = checks.services.mongodb !== 'unhealthy';
  res.status(isHealthy ? 200 : 503).json(checks);
});

// GET /health (legacy)
app.get('/health', async (req, res) => {
  const checks = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: 'operational',
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient?.isReady ? 'connected' : 'disconnected'
    }
  };

  const isHealthy = checks.services.mongodb !== 'unhealthy';
  res.status(isHealthy ? 200 : 503).json(checks);
});

// GET /api/test
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'ECOLOJIA Backend V3 is running!',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoose.connection.readyState === 1,
      redis: redisClient?.isReady || false,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      algolia: !!process.env.ALGOLIA_APP_ID,
      lemonSqueezy: !!process.env.LEMONSQUEEZY_API_KEY
    }
  });
});

// ========== ROUTES AUTH ==========

// GET /api/auth/test
app.get('/api/auth/test', (req, res) => {
  logger.info('🧪 Auth test route appelée');
  res.json({
    success: true,
    message: 'Auth routes fonctionnent parfaitement !',
    timestamp: new Date()
  });
});

// POST /api/auth/register
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  logger.info('📝 Register appelé:', req.body.email);
  const { email, password, firstName, lastName } = req.body;

  // Validation basique
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: 'Tous les champs sont requis'
    });
  }

  // Validation email
  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Email invalide'
    });
  }

  // Validation mot de passe
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Le mot de passe doit contenir au moins 6 caractères'
    });
  }

  // Vérifier la connexion MongoDB
  if (mongoose.connection.readyState !== 1) {
    // Si MongoDB n'est pas connecté, retourner une réponse de test
    const fakeToken = jwt.sign(
      { email, firstName, lastName, tier: 'free' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Mode test - MongoDB non connecté',
      user: { email, firstName, lastName, tier: 'free' },
      token: fakeToken,
      accessToken: fakeToken,
      refreshToken: fakeToken
    });
  }

  // Si MongoDB est connecté, utiliser le modèle User
  const User = require('./models/User');
  
  // Vérifier si l'utilisateur existe
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'Cet email est déjà utilisé'
    });
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);

  // Créer l'utilisateur
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

  // Générer le token
  const token = jwt.sign(
    { userId: user._id, email: user.email, tier: user.tier },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Retourner la réponse
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

// POST /api/auth/login
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  logger.info('🔑 Login appelé:', req.body.email);
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email et mot de passe requis'
    });
  }

  // Vérifier la connexion MongoDB
  if (mongoose.connection.readyState !== 1) {
    // Mode test
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

  // Si MongoDB est connecté
  const User = require('./models/User');
  
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

  // Mettre à jour la dernière connexion
  user.lastLoginAt = new Date();
  await user.save();

  // Générer le token
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

// GET /api/auth/profile (avec nouveau middleware)
app.get('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  // Dans une vraie app, on invaliderait le token dans Redis
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id || user.userId,
          email: user.email,
          name: user.name,
          tier: user.tier || 'free',
          profile: user.profile,
          preferences: user.preferences,
          quotas: user.quotas || {
            scansRemaining: 30,
            aiChatsRemaining: 5
          },
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

// POST /api/auth/refresh
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

logger.info('✅ Routes auth directes chargées');

// ========== CONFIGURATION ==========

// Configuration des partenaires
const AFFILIATE_PARTNERS = {
  lafourche: {
    baseUrl: 'https://www.lafourche.fr',
    affiliateId: process.env.AFFILIATE_LAFOURCHE_ID || 'ecolojia-001',
    trackingParam: 'aff',
    categories: ['bio', 'vrac', 'zero-dechet']
  },
  kazidomi: {
    baseUrl: 'https://www.kazidomi.com',
    affiliateId: process.env.AFFILIATE_KAZIDOMI_ID || 'ECO2025',
    trackingParam: 'partner',
    categories: ['bio', 'vegan', 'sans-gluten']
  },
  greenweez: {
    baseUrl: 'https://www.greenweez.com',
    affiliateId: process.env.AFFILIATE_GREENWEEZ_ID || 'partner-ecolojia',
    trackingParam: 'utm_source',
    categories: ['eco-responsable', 'bio']
  }
};

// ========== CONNEXIONS DB ==========

// Connexion MongoDB
async function connectMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI not configured');
    }

    await mongoose.connect(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000
    });

    logger.info('✅ MongoDB Atlas connected successfully');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.info(`📦 Collections disponibles: ${collections.map(c => c.name).join(', ')}`);
    
    return true;
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

// Connexion Redis
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
      logger.info('ℹ️ Redis not configured, skipping...');
    }
  } catch (error) {
    logger.warn('Redis connection failed:', error.message);
  }
}

// ========== SETUP ROUTES ==========

// Fonction pour charger les autres routes
// Remplacez la fonction setupOtherRoutes() dans server.js (vers ligne 650)
// par cette version corrigée :

function setupOtherRoutes() {
  // Dashboard routes
  try {
    const dashboardRoutes = require('./routes/dashboard');
    app.use('/api/dashboard', dashboardRoutes);
    logger.info('✅ Dashboard routes loaded');
  } catch (error) {
    logger.error('❌ Dashboard routes error:', error.message);
    // Essayer avec un chemin différent si le premier échoue
    try {
      const dashboardRoutes = require('../routes/dashboard');
      app.use('/api/dashboard', dashboardRoutes);
      logger.info('✅ Dashboard routes loaded (alternative path)');
    } catch (err2) {
      logger.warn('Dashboard routes not found');
    }
  }

  // Product routes
  try {
    const productRoutes = require('./routes/products');
    app.use('/api/products', productRoutes);
    logger.info('✅ Product routes loaded');
  } catch (error) {
    logger.error('❌ Product routes error:', error.message);
    // Essayer avec un chemin différent
    try {
      const productRoutes = require('../routes/products');
      app.use('/api/products', productRoutes);
      logger.info('✅ Product routes loaded (alternative path)');
    } catch (err2) {
      logger.warn('Product routes not found');
    }
  }

  // Analyze routes
  try {
    const analyzeRoutes = require('./routes/analyze.routes');
    app.use('/api/analyze', analyzeRoutes);
    logger.info('✅ Analyze routes loaded');
  } catch (error) {
    logger.warn('Analyze routes not found:', error.message);
  }

  // Partner routes
  try {
    const partnerRoutes = require('./routes/partner.routes');
    app.use('/api/partner', partnerRoutes);
    logger.info('✅ Partner routes loaded');
  } catch (error) {
    logger.warn('Partner routes not found:', error.message);
  }

  // AI routes
  try {
    const aiRoutes = require('./routes/ai');
    app.use('/api/ai', aiRoutes);
    logger.info('✅ AI routes loaded');
  } catch (error) {
    logger.warn('AI routes not found:', error.message);
  }

  // Payment routes
  try {
    const paymentRoutes = require('./routes/payment');
    app.use('/api/payment', paymentRoutes);
    logger.info('✅ Payment routes loaded');
  } catch (error) {
    logger.warn('Payment routes not found:', error.message);
  }

  // Algolia routes
  try {
    const algoliaRoutes = require('./routes/algolia');
    app.use('/api/algolia', algoliaRoutes);
    logger.info('✅ Algolia routes loaded');
  } catch (error) {
    logger.warn('Algolia routes not found:', error.message);
  }
}

  // Cosmetic routes
  try {
    const cosmeticRoutes = require('./routes/cosmetic.routes');
    app.use('/api/cosmetic', cosmeticRoutes);
    logger.info('✅ Cosmetic routes loaded');
  } catch (error) {
    logger.warn('Cosmetic routes not found:', error.message);
  }

  // Detergent routes
  try {
    const detergentRoutes = require('./routes/detergent.routes');
    app.use('/api/detergent', detergentRoutes);
    logger.info('✅ Detergent routes loaded');
  } catch (error) {
    logger.warn('Detergent routes not found:', error.message);
  }

  // Analyze routes
  try {
    const analyzeRoutes = require('./routes/analyze.routes');
    app.use('/api/analyze', analyzeRoutes);
    logger.info('✅ Analyze routes loaded');
  } catch (error) {
    logger.warn('Analyze routes not found:', error.message);
  }
}

// ========== ERROR HANDLING ==========

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      '/health',
      '/api/health',
      '/api/test',
      '/api/auth/test',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/profile',
      '/api/auth/logout',
      '/api/auth/me',
      '/api/auth/refresh',
      '/api/dashboard/*',
      '/api/products/*',
      '/api/analysis/*',
      '/api/partner/*',
      '/api/ai/*',
      '/api/payment/*',
      '/api/algolia/*',
      '/api/cosmetic/*',
      '/api/detergent/*',
      '/api/analyze/*'
    ]
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

// ========== DÉMARRAGE SERVEUR ==========

// Démarrage du serveur
async function startServer() {
  try {
    // Connexion MongoDB
    await connectMongoDB();
    
    // Connexion Redis
    await connectRedis();
    
    // Charger les autres routes (après connexion DB)
    setupOtherRoutes();
    
    // Démarrer le serveur
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      logger.info(`🗄️  MongoDB: Connected to Atlas`);
      logger.info(`💾 Redis: ${redisClient?.isReady ? 'Connected' : 'Not configured'}`);
      logger.info(`🔍 Algolia: ${process.env.ALGOLIA_APP_ID ? 'Configured' : 'Not configured'}`);
      logger.info(`💳 LemonSqueezy: ${process.env.LEMONSQUEEZY_STORE_ID ? 'Configured' : 'Not configured'}`);
      logger.info(`🤖 DeepSeek AI: ${process.env.DEEPSEEK_API_KEY ? 'Configured' : 'Not configured'}`);
      logger.info('\n📌 Auth endpoints disponibles:');
      logger.info('  - GET  /api/auth/test');
      logger.info('  - POST /api/auth/register');
      logger.info('  - POST /api/auth/login');
      logger.info('  - GET  /api/auth/profile (protégé)');
      logger.info('  - POST /api/auth/logout (protégé)');
      logger.info('  - GET  /api/auth/me (protégé)');
      logger.info('  - POST /api/auth/refresh');
      logger.info('  - GET  /api/health');
      logger.info('  - GET  /health');
      logger.info('  - GET  /api/test\n');
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ========== GESTION ARRÊT ==========

// Gestion gracieuse de l'arrêt
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

// Démarrage
startServer();

module.exports = app;