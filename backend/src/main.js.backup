// === ECOLOJIA V3 BACKEND MAIN SERVER ===
// Module M12 - Monitoring & Production Ready

// === MONITORING INITIALIZATION (doit être en premier) ===
const { initSentry, sentryMiddleware, sentryErrorHandler } = require('./monitoring/sentry');
const { initLogging, httpLogger, logInfo, logError } = require('./monitoring/logs');
const { startMetricsCollection, metricsMiddleware } = require('./monitoring/metrics');

// Initialiser le monitoring
const sentryInitialized = initSentry();
initLogging();
startMetricsCollection();

logInfo('ECOLOJIA V3 Backend démarrage', {
  module: 'M12',
  monitoring: {
    sentry: sentryInitialized,
    logging: true,
    metrics: process.env.METRICS_ENABLED === 'true'
  }
});

// === IMPORTS STANDARDS ===
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// === CONFIGURATION SECURITE ===
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// === VARIABLES D'ENVIRONNEMENT ===
const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOW_NO_DB = process.env.ALLOW_NO_DB === 'true';

// === INITIALISATION EXPRESS ===
const app = express();

// === MIDDLEWARE DE SECURITE (avant tout) ===
if (process.env.SECURITY_HEADERS_ENABLED === 'true') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.sentry.io"]
      }
    }
  }));
}

// === RATE LIMITING ===
if (process.env.RATE_LIMIT_ENABLED === 'true') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: 'Trop de requêtes, veuillez réessayer plus tard.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/', limiter);
}

// === MIDDLEWARE SENTRY (si activé) ===
if (sentryInitialized) {
  app.use(sentryMiddleware());
}

// === MIDDLEWARE LOGS HTTP ===
app.use(httpLogger);

// === MIDDLEWARE METRIQUES ===
app.use(metricsMiddleware);

// === MIDDLEWARE PARSING ===
app.use(express.json({ limit: "2mb" }));
app.use(cors({
  origin: (origin, cb) => cb(null, true), // en dev: large
  credentials: true
}));

// === ROUTES PRINCIPALES ===

// Routes de monitoring M12
const monitoringRoutes = require('./monitoring/routes');
app.use('/api/monitoring', monitoringRoutes);

// Routes santé et version
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "ecolojia-backend",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
    module: "M12-Monitoring",
    version: "3.0.0"
  });
});

app.get("/api/version", (_req, res) => {
  let version = "3.0.0";
  try { version = require("../package.json").version; } catch {}
  res.json({ 
    version, 
    commit: process.env.GIT_COMMIT_SHA || null,
    module: "M12-monitoring",
    monitoring: {
      sentry: sentryInitialized,
      metrics: process.env.METRICS_ENABLED === 'true',
      logging: true
    }
  });
});

// === MONTAGE CONDITIONNEL DES ROUTES EXISTANTES ===
function safeMount(base, rel) {
  try {
    const router = require(rel);
    if (router && router.stack) {
      app.use(base, router);
      logInfo(`Route montée: ${base}`, { path: rel });
    } else {
      console.warn(`⚠️  ${rel} ne retourne pas un router Express`);
    }
  } catch (e) {
    console.warn(`• Route optionnelle ignorée: ${rel} (${e.message})`);
  }
}

// Routes existantes
safeMount("/api/analysis", path.join(__dirname, "routes/analysis.routes.js"));
safeMount("/api/vision", path.join(__dirname, "routes/vision.routes.js"));
safeMount("/api/products", path.join(__dirname, "routes/products.js"));
safeMount("/api/algolia", path.join(__dirname, "routes/algolia-unified.js"));
safeMount("/api/auth", path.join(__dirname, "routes/auth.simple.js"));
safeMount("/api/dashboard", path.join(__dirname, "routes/dashboard.js"));

// Fallback algolia si algolia-unified ne fonctionne pas
if (!app._router.stack.find(s => s?.route?.path?.startsWith?.("/api/algolia"))) {
  safeMount("/api/algolia", path.join(__dirname, "routes/algolia.js"));
}

// M7: Vision OCR endpoint (analyze-image)
try {
  app.use('/api/vision', require('./routes/vision.analyze'));
  logInfo('Vision analyze route montée');
} catch(e){ 
  console.warn('⚠️  Vision analyze route load failed:', e.message); 
}

// M7 public OCR mount (no auth, Google or stub)
try {
  app.use("/api/vision-ocr", require("./routes/vision.ocr.public"));
  logInfo("Route vision OCR publique montée");
} catch (e) {
  console.warn("⚠️  Vision OCR public mount failed:", e.message);
}

// Routes M11 Payments (webhook en raw body)
try {
  app.use('/api/webhooks', express.raw({ type: 'application/json' }), require('./payments/routes/webhook.routes'));
  app.use('/api/payments', require('./payments/routes/payments.routes'));
  logInfo('Routes payments M11 montées');
} catch (e) {
  console.warn('⚠️  Payments routes failed:', e.message);
}

// === ERROR HANDLERS ===
// 404 Handler
app.use('*', (req, res) => {
  logInfo('Route non trouvée', { 
    method: req.method, 
    url: req.originalUrl,
    ip: req.ip 
  });
  
  res.status(404).json({
    error: 'Route non trouvée',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Sentry Error Handler (doit être avant le handler général)
if (sentryInitialized) {
  app.use(sentryErrorHandler());
}

// Global Error Handler
app.use((err, req, res, next) => {
  logError('Erreur serveur', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const status = err.status || 500;
  const message = NODE_ENV === 'production' ? 
    'Erreur interne du serveur' : 
    err.message;

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    ...(NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// === FONCTION DE DEMARRAGE ===
async function startServer() {
  try {
    logInfo('Tentative de démarrage du serveur', { port: PORT, env: NODE_ENV });

    // Connexion base de données (avec fallback)
    let dbConnected = false;
    try {
      const mongoose = require('mongoose');
      
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        if (ALLOW_NO_DB) {
          // Tentative rapide mais non bloquante (3s)
          try {
            await mongoose.connect(process.env.MONGO_URI, { 
              autoIndex: true, 
              serverSelectionTimeoutMS: 3000 
            });
            dbConnected = true;
            logInfo('Base de données connectée');
          } catch (_e) {
            logInfo('Mongo non disponible, passage en mode dégradé');
          }
        } else {
          // Mode strict (prod): on exige la DB
          await mongoose.connect(process.env.MONGO_URI, { autoIndex: true });
          dbConnected = true;
          logInfo('Base de données connectée (mode strict)');
        }
      } else {
        dbConnected = true;
        logInfo('Base de données déjà connectée');
      }
    } catch (e) {
      if (!ALLOW_NO_DB) {
        logError('Connexion DB échouée', e);
        process.exit(1);
      } else {
        logInfo('Mongo non disponible, démarrage en mode dégradé');
      }
    }

    // Démarrage serveur
    const server = app.listen(PORT, () => {
      logInfo('Serveur ECOLOJIA V3 démarré avec succès', {
        port: PORT,
        environment: NODE_ENV,
        module: 'M12-monitoring',
        database: dbConnected ? 'connected' : 'disconnected',
        monitoring: {
          sentry: sentryInitialized,
          metrics: process.env.METRICS_ENABLED === 'true',
          security: process.env.SECURITY_HEADERS_ENABLED === 'true',
          rateLimit: process.env.RATE_LIMIT_ENABLED === 'true'
        },
        urls: {
          health: `http://localhost:${PORT}/api/health`,
          monitoring: `http://localhost:${PORT}/api/monitoring/health`,
          metrics: `http://localhost:${PORT}/api/monitoring/metrics`,
          payments: `http://localhost:${PORT}/api/payments`,
          webhooks: `http://localhost:${PORT}/api/webhooks`
        }
      });

      console.log(`
🚀 ========================================
   ECOLOJIA V3 BACKEND - MODULE M12
========================================
🌐 Serveur:     http://localhost:${PORT}
📊 Monitoring:  http://localhost:${PORT}/api/monitoring/health
📈 Métriques:   http://localhost:${PORT}/api/monitoring/metrics
🔍 Santé:       http://localhost:${PORT}/api/health
📝 Version:     http://localhost:${PORT}/api/version
💳 Payments:    http://localhost:${PORT}/api/payments
🔗 Webhooks:    http://localhost:${PORT}/api/webhooks
========================================
🎯 Environnement: ${NODE_ENV}
🗄️  Base données: ${dbConnected ? '✅ Connectée' : '⚠️  Mode dégradé'}
🛡️  Monitoring:   ${sentryInitialized ? '✅ Sentry actif' : '⚠️  Sentry stub'}
📊 Métriques:     ${process.env.METRICS_ENABLED === 'true' ? '✅ Activées' : '⚠️  Désactivées'}
🔒 Sécurité:      ${process.env.SECURITY_HEADERS_ENABLED === 'true' ? '✅ Headers actifs' : '⚠️  Headers basiques'}
⏱️  Rate Limit:   ${process.env.RATE_LIMIT_ENABLED === 'true' ? '✅ Actif' : '⚠️  Désactivé'}
========================================`);
      
      if (ALLOW_NO_DB && !dbConnected) {
        console.warn('⚠️  Running WITHOUT MongoDB (degraded mode)');
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logInfo('Signal SIGTERM reçu, arrêt gracieux...');
      server.close(() => {
        logInfo('Serveur fermé');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logInfo('Signal SIGINT reçu, arrêt gracieux...');
      server.close(() => {
        logInfo('Serveur fermé');
        process.exit(0);
      });
    });

  } catch (error) {
    logError('Erreur fatale au démarrage', error);
    process.exit(1);
  }
}

// === DEMARRAGE ===
startServer().catch(error => {
  console.error('Erreur critique:', error);
  process.exit(1);
});

module.exports = app;