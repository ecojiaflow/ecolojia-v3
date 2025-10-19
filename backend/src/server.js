// PATH: backend/src/server.js
// Serveur ECOLOJIA robuste et prêt pour la production

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const Redis = require('ioredis');

const app = express();

// --------------------------------------------------------------
// Configuration CORS optimisée
// --------------------------------------------------------------
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://frontendvf.netlify.app',
      'https://ecolojia.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      process.env.FRONTEND_BASE_URL,
    ].filter(Boolean);
    
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Signature'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// --------------------------------------------------------------
// Fonction loadRoute DÉFINIE EN PREMIER
// --------------------------------------------------------------
const loadRoute = (name, modulePath, mountPath) => {
  try {
    const route = require(modulePath);
    if (route && (typeof route === 'function' || (route.stack && route.use))) {
      app.use(mountPath, route);
      console.log(`? Routes ${name} chargées sur ${mountPath}`);
    } else {
      console.log(`?? Routes ${name} non valides - type: ${typeof route}`);
    }
  } catch (error) {
    console.log(`?? Routes ${name} non chargées: ${error.message}`);
  }
};

// --------------------------------------------------------------
// Routes webhooks AVANT express.json()
// --------------------------------------------------------------
loadRoute('Webhooks', './payments/routes/webhook.routes', '/api/webhooks');

// --------------------------------------------------------------
// Middleware JSON APRÈS webhooks
// --------------------------------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'ECOLOJIA API V3.0',
    status: 'running',
    timestamp: new Date(),
    endpoints: {
      auth: '/api/auth',
      analysis: '/api/analysis',
      vision: '/api/vision',
      dashboard: '/api/dashboard',
      cosmetics: '/api/cosmetics',
      detergents: '/api/detergents',
      payments: '/api/payments',
      webhooks: '/api/webhooks',
      ai: '/api/ai',
      gdpr: '/api/gdpr'
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
});

// --------------------------------------------------------------
// Toutes les autres routes
// --------------------------------------------------------------
loadRoute('Payments', './payments/routes/payments.routes', '/api/payments');
loadRoute('Auth', './routes/auth', '/api/auth');
loadRoute('Analyse', './routes/analysis.routes', '/api/analysis');
loadRoute('Vision', './routes/vision.ocr.public', '/api/vision');
loadRoute('Dashboard', './routes/dashboard', '/api/dashboard');
loadRoute('Cosmetics', './routes/cosmetics.routes', '/api/cosmetics');
loadRoute('Detergents', './routes/detergents.routes', '/api/detergents');
loadRoute('GDPR', './routes/gdpr.routes', '/api/gdpr');
loadRoute('AI', './routes/ai.routes', '/api/ai');
loadRoute('User', './routes/user.routes', '/api/users');
loadRoute('Users V2', './routes/v2/users', '/api/users/v2');
loadRoute('Products', './routes/products', '/api/products');
loadRoute('Products Search', './routes/products-search', '/api/products');
loadRoute('Quota', './routes/quota', '/api/quota');
loadRoute('Algolia', './routes/algolia-unified', '/api/algolia');
loadRoute('Export', './routes/export', '/api/export');
loadRoute('History', './routes/history', '/api/history');
loadRoute('Favorites', './routes/favorites', '/api/favorites');

loadRoute('OCR Analyze', './routes/ocr-analyze.routes', '/api/ocr-analyze');

// Gestion 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    path: req.path,
    method: req.method
  });
});

// Gestion erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur serveur interne'
  });
});

// MongoDB
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecolojia');
    console.log('? MongoDB connecté');
  } catch (err) {
    console.error('? MongoDB erreur:', err.message);
  }
};

connectMongoDB();

// Redis
let redisClient;
try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  });
  redisClient.on('connect', () => console.log('? Redis connecté'));
  redisClient.on('error', (err) => console.error('?? Redis erreur:', err.message));
} catch (error) {
  console.log('?? Redis non configuré');
}

app.locals.redisClient = redisClient;

// Serveur
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`?? ECOLOJIA Backend V3.0 sur http://localhost:${PORT}`);
  console.log(`?? Payments: http://localhost:${PORT}/api/payments`);
  console.log(`?? Webhooks: http://localhost:${PORT}/api/webhooks/health`);
});

module.exports = app;
