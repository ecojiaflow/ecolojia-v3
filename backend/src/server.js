// PATH: backend/src/server.js
// Serveur ECOLOJIA robuste et prêt pour la production

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const Redis = require('ioredis');

const app = express();

// ────────────────────────────────────────────────
// Configuration CORS optimisée
// ────────────────────────────────────────────────
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
    
    // En développement, accepter toutes les origines
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    // En production, vérifier la liste blanche
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // Cache CORS preflight pendant 24h
};

app.use(cors(corsOptions));

// Headers de sécurité supplémentaires
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// ────────────────────────────────────────────────
// Middleware globaux
// ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Route de test racine avec info CORS
app.get('/', (req, res) => {
  res.json({
    message: 'ECOLOJIA API V3.0',
    status: 'running',
    timestamp: new Date(),
    cors: {
      origin: req.headers.origin || 'No origin header',
      allowed: corsOptions.origin instanceof Function ? 'Dynamic check' : corsOptions.origin
    },
    endpoints: {
      auth: '/api/auth',
      analysis: '/api/analysis',
      vision: '/api/vision',
      dashboard: '/api/dashboard',
      cosmetics: '/api/cosmetics',  // NOUVEAU
      detergents: '/api/detergents', // NOUVEAU
      ai: '/api/ai',
      gdpr: '/api/gdpr'
    }
  });
});

// Route de santé pour monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
});

// ────────────────────────────────────────────────
// Fonction générique pour charger les routes - VERSION CORRIGÉE
// ────────────────────────────────────────────────
const loadRoute = (name, modulePath, mountPath) => {
  try {
    const route = require(modulePath);
    // Vérifier si c'est un Router Express valide
    // Un router Express a des propriétés comme 'stack' et des méthodes comme 'get', 'post', etc.
    if (route && (typeof route === 'function' || (route.stack && route.use))) {
      app.use(mountPath, route);
      console.log(`✅ Routes ${name} chargées sur ${mountPath}`);
    } else {
      console.log(`⚠️ Routes ${name} non valides - type: ${typeof route}`);
    }
  } catch (error) {
    console.log(`⚠️ Routes ${name} non chargées: ${error.message}`);
    // Afficher plus de détails en développement
    if (process.env.NODE_ENV === 'development') {
      console.error(`   Stack trace:`, error.stack);
    }
  }
};

// ────────────────────────────────────────────────
// Chargement des routes
// ────────────────────────────────────────────────
loadRoute('Auth', './routes/auth', '/api/auth');
loadRoute('Analyse', './routes/analysis.routes', '/api/analysis');
loadRoute('Vision', './routes/vision.routes', '/api/vision');
loadRoute('Dashboard', './routes/dashboard', '/api/dashboard');

// Routes cosmétiques et détergents - NOUVEAU
loadRoute('Cosmetics', './routes/cosmetics.routes', '/api/cosmetics');
loadRoute('Detergents', './routes/detergents.routes', '/api/detergents');

// Gestion spéciale pour les routes de paiement
try {
  const paymentRoutes = require('./routes/payment.routes');
  app.use('/api/payment', paymentRoutes);
  console.log('✅ Routes Payment chargées');
} catch (error) {
  console.log('⚠️ Service Email non configuré - Mode simulation activé');
  require.cache[require.resolve('./services/emailService')] = {
    exports: {
      sendEmail: async (options) => {
        console.log('📧 Email simulé:', options.subject);
        return { success: true, simulated: true };
      }
    }
  };
  const paymentRoutes = require('./routes/payment.routes');
  app.use('/api/payment', paymentRoutes);
  console.log('✅ Routes Payment chargées (simulation email)');
}

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

// ────────────────────────────────────────────────
// Gestion des erreurs 404
// ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    path: req.path,
    method: req.method,
    suggestion: 'Vérifiez l\'URL ou consultez GET / pour la liste des endpoints'
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  // Gestion spéciale des erreurs CORS
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS Policy Error',
      message: 'Cette origine n\'est pas autorisée',
      origin: req.headers.origin || 'No origin',
      allowedOrigins: [
        'https://frontendvf.netlify.app',
        'http://localhost:5173',
        'http://localhost:5174'
      ]
    });
  }

  console.error('Erreur serveur:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ────────────────────────────────────────────────
// Connexion MongoDB avec retry
// ────────────────────────────────────────────────
const connectMongoDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecolojia', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ MongoDB Atlas connecté');
      console.log(`📊 Base de données: ${mongoose.connection.db.databaseName}`);
      break;
    } catch (err) {
      retries++;
      console.error(`❌ Tentative ${retries}/${maxRetries} - Erreur MongoDB:`, err.message);
      if (retries < maxRetries) {
        console.log(`⏳ Nouvelle tentative dans 5 secondes...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
};

connectMongoDB();

// ────────────────────────────────────────────────
// Connexion Redis avec fallback
// ────────────────────────────────────────────────
let redisClient;

try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    retryStrategy: (times) => {
      if (times > 3) {
        console.log('⚠️ Redis indisponible, utilisation du cache mémoire');
        return null;
      }
      return Math.min(times * 50, 2000);
    }
  });

  redisClient.on('connect', () => console.log('✅ Redis connecté'));
  redisClient.on('error', (err) => console.error('⚠️ Redis erreur:', err.message));
} catch (error) {
  console.log('⚠️ Redis non configuré, utilisation du cache mémoire');
}

// Export du client Redis pour utilisation dans d'autres modules
app.locals.redisClient = redisClient;

// ────────────────────────────────────────────────
// Graceful shutdown
// ────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('ℹ️ SIGTERM reçu, arrêt gracieux...');
  
  // Fermer les connexions
  if (redisClient) await redisClient.quit();
  await mongoose.connection.close();
  
  process.exit(0);
});

// ────────────────────────────────────────────────
// Lancement du serveur
// ────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   ECOLOJIA Backend V3.0                       ║
╠═══════════════════════════════════════════════════════════════╣
║  🚀 Serveur:     http://localhost:${PORT}                     ║
║  📊 Mode:        ${process.env.NODE_ENV || 'development'}                              ║
║  🔧 MongoDB:     ${mongoose.connection.readyState === 1 ? 'Connecté ✅' : 'En attente ⏳'}              ║
║  💾 Redis:       ${redisClient && redisClient.status === 'ready' ? 'Connecté ✅' : 'Cache mémoire 📝'}            ║
╠═══════════════════════════════════════════════════════════════╣
║  📍 Endpoints principaux:                                     ║
║  • GET  /                          - Info API & endpoints     ║
║  • GET  /health                    - État du serveur          ║
║  • POST /api/auth/login            - Connexion               ║
║  • POST /api/auth/register         - Inscription             ║
║  • POST /api/analysis              - Analyse universelle     ║
║  • POST /api/cosmetics/analyze     - Analyse cosmétique 🆕   ║
║  • POST /api/detergents/analyze    - Analyse détergent 🆕    ║
║  • POST /api/vision/analyze-image  - OCR sur image           ║
║  • GET  /api/dashboard/stats       - Statistiques            ║
║  • POST /api/payment/create-checkout - Paiement              ║
║  • GET  /api/gdpr/download-data    - Export RGPD             ║
║  • POST /api/ai/chat               - Chat IA                 ║
║  • GET  /api/users/v2/me           - Profil & Préférences v2 ║
║  • PUT  /api/users/v2/me           - MAJ Préférences IA      ║
╚═══════════════════════════════════════════════════════════════╝

📋 État des services externes:
  ${process.env.MONGODB_URI ? '✅' : '⚠️'} MongoDB: ${process.env.MONGODB_URI ? 'Configuré' : 'Non configuré'}
  ${process.env.REDIS_URL || process.env.REDIS_HOST ? '✅' : '⚠️'} Redis: ${process.env.REDIS_URL || process.env.REDIS_HOST ? 'Configuré' : 'Local'}
  ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✅' : '⚠️'} Google Vision: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Configuré' : 'Non configuré'}
  ${process.env.LEMONSQUEEZY_API_KEY ? '✅' : '⚠️'} LemonSqueezy: ${process.env.LEMONSQUEEZY_API_KEY ? 'Configuré' : 'Non configuré'}
  ${process.env.DEEPSEEK_API_KEY ? '✅' : '⚠️'} DeepSeek AI: ${process.env.DEEPSEEK_API_KEY ? 'Configuré' : 'Non configuré'}
  ${process.env.CLOUDINARY_CLOUD_NAME ? '✅' : '⚠️'} Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configuré' : 'Non configuré'}
  ${process.env.ALGOLIA_APP_ID ? '✅' : '⚠️'} Algolia: ${process.env.ALGOLIA_APP_ID ? 'Configuré' : 'Non configuré'}

🌐 CORS configuré pour:
  • https://frontendvf.netlify.app (Production)
  • http://localhost:5173 (Dev Vite)
  • http://localhost:5174 (Dev Vite alt)
  • ${process.env.NODE_ENV === 'development' ? 'Toutes origines (mode dev)' : 'Liste blanche uniquement'}

🎉 Serveur ECOLOJIA prêt !
🔍 Pour tester: curl http://localhost:${PORT}/health
  `);
});

// Timeout pour les requêtes longues
server.timeout = 30000; // 30 secondes

module.exports = app;

// Route test pour voir tous les produits
app.get('/api/test-products', async (req, res) => {
  const Product = require('./models/Product');
  const products = await Product.find().limit(100);
  res.json({ count: products.length, products });
});