// === ECOLOJIA V3 BACKEND MAIN SERVER ===
// Module M12 - Monitoring & Production Ready
// ================================================================
// 🔧 CHARGEMENT ENVIRONNEMENT (développement + production)

const path = require('path');
const fs = require('fs');

// En développement, charger .env si disponible
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(__dirname, '../.env');
  
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log('📁 [ENV] Fichier .env chargé depuis:', envPath);
  } else {
    console.log('⚠️ [ENV] Fichier .env non trouvé, utilisation des variables système');
  }
} else {
  console.log('🚀 [PROD] Mode production - variables d\'environnement Render');
}

// VÉRIFICATIONS CRITIQUES des variables d'environnement
console.log('🔍 [ENV] Vérification des variables d\'environnement...');
console.log('📊 [ENV] NODE_ENV:', process.env.NODE_ENV || 'development');

const requiredVars = ['MONGODB_URI'];
const missingVars = [];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  } else {
    console.log('✅ [ENV] ' + varName + ': présent');
  }
});

if (missingVars.length > 0) {
  console.error('❌ [FATAL] Variables d\'environnement manquantes:', missingVars);
  if (process.env.NODE_ENV === 'production') {
    console.error('🔧 [PROD] Vérifiez la configuration Render Dashboard');
  } else {
    console.error('🔧 [DEV] Vérifiez votre fichier .env local');
  }
  process.exit(1);
}

// Log de la connexion MongoDB (URI masquée pour sécurité)
const maskedUri = process.env.MONGODB_URI.replace(/:[^:\/]+@/, ':***@');
console.log('🔐 [ENV] MongoDB URI (masquée):', maskedUri);

// ================================================================
// MAINTENANT on peut charger les modules de monitoring (après dotenv)
// ================================================================

let sentryInitialized = false;
let logInfo = console.log;
let logError = console.error;

// Modules de monitoring (avec fallback si non disponibles)
try {
  const { initSentry, sentryMiddleware, sentryErrorHandler } = require('./monitoring/sentry');
  const { initLogging, httpLogger, logInfo: logInfoModule, logError: logErrorModule } = require('./monitoring/logs');
  const { startMetricsCollection, metricsMiddleware } = require('./monitoring/metrics');

  // Initialiser le monitoring
  sentryInitialized = initSentry();
  initLogging();
  startMetricsCollection();
  logInfo = logInfoModule;
  logError = logErrorModule;

  logInfo('ECOLOJIA V3 Backend démarrage', {
    module: 'M12',
    monitoring: {
      sentry: sentryInitialized,
      logging: true,
      metrics: process.env.METRICS_ENABLED === 'true'
    }
  });
} catch (err) {
  console.log('⚠️ [MONITORING] Modules de monitoring non disponibles, utilisation des logs basiques');
}

// ================================================================
// IMPORTS PRINCIPAUX
// ================================================================

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Configuration
const app = express();
const PORT = process.env.PORT || 10000;

// Configuration CORS
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de monitoring (si disponible)
if (sentryInitialized) {
  try {
    const { sentryMiddleware } = require('./monitoring/sentry');
    app.use(sentryMiddleware);
  } catch (err) {
    console.log('⚠️ [SENTRY] Middleware non disponible');
  }
}

// ================================
// CHARGEMENT DES ROUTES
// ================================

// Route de santé (toujours disponible)
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
      monitoring: {
        sentry: sentryInitialized,
        metrics: process.env.METRICS_ENABLED === 'true'
      }
    });
  } catch (error) {
    logError('Health check failed', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    name: 'ECOLOJIA V3 API',
    version: '3.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      '/api/health',
      '/api/analysis',
      '/api/vision',
      '/api/products',
      '/api/search',
      '/api/auth',
      '/api/dashboard',
      '/api/algolia',
      '/api/chat'
    ]
  });
});

// Chargement des routes principales avec gestion d'erreur
const routesToLoad = [
  { path: '/api/analysis', file: './routes/analysis.routes.js', name: 'Analysis' },
  { path: '/api/vision', file: './routes/vision.simple.js', name: 'Vision' },
  { path: '/api/products', file: './routes/products.js', name: 'Products' },
  { path: '/api/search', file: './routes/products-search.js', name: 'Search' },
  { path: '/api/cosmetics', file: './routes/cosmetics.routes.js', name: 'Cosmetics' },
  { path: '/api/detergents', file: './routes/detergents.routes.js', name: 'Detergents' },
  { path: '/api/auth', file: './routes/auth.simple.js', name: 'Auth' },
  { path: '/api/dashboard', file: './routes/dashboard.js', name: 'Dashboard' },
  { path: '/api/algolia', file: './routes/algolia-unified.js', name: 'Algolia Unified' },
  { path: '/api/algolia', file: './routes/algolia.js', name: 'Algolia Legacy' },
  { path: '/api/chat', file: './routes/chat.routes.js', name: 'Chat' }
];

routesToLoad.forEach(route => {
  try {
    const routeModule = require(route.file);
    app.use(route.path, routeModule);
    console.log('✅ [ROUTE] ' + route.name + ' montée sur ' + route.path);
    logInfo('Route montée: ' + route.path, {
      path: path.resolve(__dirname, route.file)
    });
  } catch (err) {
    console.log('⚠️ [ROUTE] ' + route.name + ' non disponible:', err.message);
    logError('Erreur de chargement de route ' + route.path, err);
  }
});

// Middleware d'erreur global
app.use((error, req, res, next) => {
  console.error('❌ [ERROR] Erreur non gérée:', error.message);
  logError('Erreur non gérée', error);
  
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue',
    timestamp: new Date().toISOString()
  });
});

// Sentry error handler (si disponible et doit être en dernier)
if (sentryInitialized) {
  try {
    const { sentryErrorHandler } = require('./monitoring/sentry');
    app.use(sentryErrorHandler);
  } catch (err) {
    console.log('⚠️ [SENTRY] Error handler non disponible');
  }
}

// ================================
// CONNEXION BASE DE DONNÉES
// ================================

async function connectDatabase() {
  try {
    console.log('🔌 [DB] Tentative de connexion MongoDB...');
    console.log('🔐 [DB] URI (masquée):', maskedUri);
    
    // Options de connexion robustes
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4
    };
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('✅ [DB] MongoDB connecté avec succès');
    console.log('📊 [DB] Base de données:', mongoose.connection.name);
    logInfo('MongoDB connecté', {
      database: mongoose.connection.name,
      host: mongoose.connection.host
    });
    
    return true;
  } catch (error) {
    console.error('❌ [DB] Erreur de connexion MongoDB:');
    console.error('    Message:', error.message);
    console.error('    Code:', error.code);
    logError('Erreur MongoDB', error);
    
    // Mode dégradé - continuer sans DB
    console.log('⚠️ [DB] Mode dégradé activé - serveur démarré sans base de données');
    console.log('💡 [DB] Les routes nécessitant la DB utiliseront des mocks');
    console.log('🔧 [DB] Pour réparer la DB : vérifier les identifiants MongoDB Atlas');
    return false;
  }
}

// ================================
// DÉMARRAGE DU SERVEUR
// ================================

async function startServer() {
  try {
    logInfo('Tentative de démarrage du serveur', {
      port: PORT,
      env: process.env.NODE_ENV || 'development'
    });

    // Connexion DB
    const dbConnected = await connectDatabase();
    
    // Démarrage du serveur HTTP
    const server = app.listen(PORT, () => {
      console.log('🚀 [SERVER] ===================================');
      console.log('🚀 [SERVER] ECOLOJIA V3 Backend démarré');
      console.log('🚀 [SERVER] Port: ' + PORT);
      console.log('🚀 [SERVER] Environment: ' + (process.env.NODE_ENV || 'development'));
      console.log('🚀 [SERVER] Base de données: ' + (dbConnected ? 'connectée' : 'non connectée'));
      console.log('🚀 [SERVER] Monitoring: ' + (sentryInitialized ? 'Sentry activé' : 'Sentry désactivé'));
      console.log('🚀 [SERVER] Health check: http://localhost:' + PORT + '/api/health');
      console.log('🚀 [SERVER] API Root: http://localhost:' + PORT + '/');
      console.log('🚀 [SERVER] ===================================');
      
      logInfo('Serveur démarré sur le port ' + PORT, {
        database: dbConnected,
        monitoring: sentryInitialized
      });
    });

    // Gestion gracieuse de l'arrêt
    process.on('SIGINT', async () => {
      console.log('\n⏹️ [SERVER] Arrêt en cours...');
      server.close();
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('🔌 [DB] Connexion MongoDB fermée');
      }
      console.log('✅ [SERVER] Arrêt terminé');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n⏹️ [SERVER] Arrêt demandé...');
      server.close();
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('🔌 [DB] Connexion MongoDB fermée');
      }
      console.log('✅ [SERVER] Arrêt terminé');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ [SERVER] Erreur de démarrage:', error.message);
    logError('Erreur de démarrage serveur', { error });
    process.exit(1);
  }
}

// Lancement de l'application
startServer();