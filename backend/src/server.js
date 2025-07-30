// backend/src/server.js
// FICHIER COMPLET AVEC ROUTES AUTH INTÉGRÉES

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const redis = require('redis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialisation Express
const app = express();
const PORT = process.env.PORT || 5001;

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'ecolojia-secret-key-2024-super-secure';

// Configuration CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger
const logger = {
  info: (...args) => console.log('[INFO]', new Date().toISOString(), ...args),
  error: (...args) => console.error('[ERROR]', new Date().toISOString(), ...args),
  warn: (...args) => console.warn('[WARN]', new Date().toISOString(), ...args)
};

// Variables globales
let redisClient;

// ========== ROUTES AUTH DIRECTES ==========
// GET /api/auth/test
app.get('/api/auth/test', (req, res) => {
  console.log('🧪 Auth test route appelée');
  res.json({
    success: true,
    message: 'Auth routes fonctionnent parfaitement !',
    timestamp: new Date()
  });
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📝 Register appelé:', req.body);
    const { email, password, firstName, lastName } = req.body;

    // Validation basique
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }

    // Vérifier la connexion MongoDB
    if (mongoose.connection.readyState !== 1) {
      // Si MongoDB n'est pas connecté, retourner une réponse de test
      const fakeToken = jwt.sign(
        { email, firstName, lastName },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Mode test - MongoDB non connecté',
        user: { email, firstName, lastName },
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

  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'inscription'
    });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔑 Login appelé:', req.body.email);
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
          { email, tier: 'free' },
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

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion'
    });
  }
});

// GET /api/auth/profile
app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token non fourni'
    });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      user: decoded
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token invalide'
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
      { email: decoded.email, tier: decoded.tier },
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
// ========== FIN ROUTES AUTH DIRECTES ==========

// Routes statiques
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient?.isReady ? 'connected' : 'disconnected';
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      mongodb: mongoStatus,
      redis: redisStatus
    },
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '3.0.0'
  });
});

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

// Fonction pour charger les autres routes
function setupOtherRoutes() {
  // Dashboard routes
  try {
    const dashboardRoutes = require('./routes/dashboard');
    app.use('/api/dashboard', dashboardRoutes);
    logger.info('✅ Dashboard routes loaded');
  } catch (error) {
    logger.warn('Dashboard routes not found:', error.message);
  }

  // Product routes
  try {
    const productRoutes = require('./routes/products');
    app.use('/api/products', productRoutes);
    logger.info('✅ Product routes loaded');
  } catch (error) {
    logger.warn('Product routes not found:', error.message);
  }

  // Analysis routes
  try {
    const analysisRoutes = require('./routes/analysis');
    app.use('/api/analysis', analysisRoutes);
    logger.info('✅ Analysis routes loaded');
  } catch (error) {
    logger.warn('Analysis routes not found:', error.message);
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

  // Analyze routes
  try {
    const analyzeRoutes = require('./routes/analyze.routes');
    app.use('/api/analyze', analyzeRoutes);
    logger.info('✅ Analyze routes loaded');
  } catch (error) {
    logger.warn('Analyze routes not found:', error.message);
  }
}

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      '/health',
      '/api/test',
      '/api/auth/test',
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/profile',
      '/api/auth/refresh',
      '/api/dashboard/*',
      '/api/products/*',
      '/api/analysis/*',
      '/api/partner/*',
      '/api/ai/*',
      '/api/payment/*',
      '/api/algolia/*',
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
      logger.info('  - POST /api/auth/refresh');
      logger.info('  - GET  /health');
      logger.info('  - GET  /api/test\n');
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

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