// backend/src/server.js
// Serveur corrigé avec les bons chemins de routes

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Middleware globaux
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques uploadés
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes de base
app.get('/', (req, res) => {
  res.json({ 
    message: 'ECOLOJIA API V3.0',
    status: 'running',
    timestamp: new Date()
  });
});

// Fonction pour charger les routes en gérant les erreurs
const loadRoute = (name, modulePath, mountPath) => {
  try {
    const route = require(modulePath);
    app.use(mountPath, route);
    console.log(`? Routes ${name} chargées`);
  } catch (error) {
    console.warn(`??  Routes ${name} non trouvées:`, error.message);
  }
};

// Charger toutes les routes disponibles
loadRoute('Auth', './routes/auth', '/api/auth');
loadRoute('Analyse', './routes/analysis.routes', '/api/analysis'); // Correction du nom
loadRoute('Vision', './routes/vision.routes', '/api/vision');
loadRoute('Dashboard', './routes/dashboard', '/api/dashboard');

// Routes Payment avec vérification EmailService
try {
  const paymentRoutes = require('./routes/payment.routes');
  app.use('/api/payment', paymentRoutes);
  console.log('? Routes Payment chargées');
} catch (error) {
  if (error.message.includes('emailService')) {
    console.warn('??  Service Email non configuré (mode simulation)');
    // Créer un mock temporaire
    require.cache[require.resolve('./services/emailService')] = {
      exports: {
        sendEmail: async (options) => {
          console.log('?? Email simulé:', options.subject);
          return { success: true, simulated: true };
        }
      }
    };
    // Réessayer de charger les routes payment
    const paymentRoutes = require('./routes/payment.routes');
    app.use('/api/payment', paymentRoutes);
    console.log('? Routes Payment chargées (mode simulation email)');
  } else {
    console.warn('??  Routes Payment non trouvées:', error.message);
  }
}

loadRoute('GDPR', './routes/gdpr.routes', '/api/gdpr');
loadRoute('AI', './routes/ai.routes', '/api/ai');

// Pour les routes TypeScript, on essaie d'abord .js puis .ts
const loadTSRoute = (name, basePath, mountPath) => {
  try {
    // Essayer d'abord le fichier compilé .js
    const route = require(`${basePath}.js`);
    app.use(mountPath, route);
    console.log(`? Routes ${name} chargées (.js)`);
  } catch (error) {
    try {
      // Si pas de .js, essayer de charger le .ts avec ts-node
      require('ts-node/register');
      const route = require(`${basePath}.ts`);
      app.use(mountPath, route);
      console.log(`? Routes ${name} chargées (.ts)`);
    } catch (tsError) {
      console.warn(`??  Routes ${name} non trouvées:`, error.message);
    }
  }
};

loadTSRoute('User', './routes/user.routes', '/api/users');

// Routes Products (le fichier existe)
loadRoute('Products', './routes/products', '/api/products');
loadRoute('Quota', './routes/quota', '/api/quota');

// Routes additionnelles si elles existent
loadRoute('Algolia', './routes/algolia', '/api/algolia');
loadRoute('Export', './routes/export', '/api/export');
loadRoute('History', './routes/history', '/api/history');
loadRoute('Favorites', './routes/favorites', '/api/favorites');

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Endpoint non trouvé',
    path: req.path,
    method: req.method
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecolojia', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('? MongoDB Atlas connecté');
  console.log(`?? Base de données: ${mongoose.connection.db.databaseName}`);
})
.catch(err => {
  console.error('? Erreur MongoDB:', err.message);
});

// Connexion Redis
const Redis = require('ioredis');
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('connect', () => console.log('? Redis connecté'));
redisClient.on('error', (err) => console.error('? Redis erreur:', err.message));

// Démarrage du serveur
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`
+---------------------------------------------------------------+
¦                   ECOLOJIA Backend V3.0                       ¦
¦---------------------------------------------------------------¦
¦  ?? Serveur:     http://localhost:${PORT}                        ¦
¦  ?? Mode:        ${process.env.NODE_ENV || 'development'}                             ¦
¦  ?? MongoDB:     ${mongoose.connection.readyState === 1 ? 'Connecté ?' : 'Déconnecté ?'}                          ¦
¦  ?? Redis:       ${redisClient.status === 'ready' ? 'Connecté ?' : 'Déconnecté ?'}                        ¦
¦---------------------------------------------------------------¦
¦  ?? Endpoints principaux:                                     ¦
¦  • POST /api/auth/login          - Connexion                 ¦
¦  • POST /api/auth/register       - Inscription               ¦
¦  • POST /api/analysis            - Analyse universelle       ¦
¦  • POST /api/vision/analyze-image - OCR sur image            ¦
¦  • GET  /api/dashboard/stats     - Statistiques              ¦
¦  • POST /api/payment/create-checkout - Paiement              ¦
¦  • GET  /api/gdpr/download-data  - Export RGPD               ¦
¦  • POST /api/ai/chat             - Chat IA                   ¦
+---------------------------------------------------------------+

?? État des services externes:
  ${process.env.MONGODB_URI ? '?' : '?? '} MongoDB: ${process.env.MONGODB_URI ? 'Configuré' : 'Non configuré'}
  ${process.env.REDIS_URL ? '?' : '?'} Redis: ${process.env.REDIS_URL ? 'Configuré' : 'Local'}
  ${process.env.GOOGLE_CLOUD_KEYFILE ? '?' : '?? '} Google Vision: ${process.env.GOOGLE_CLOUD_KEYFILE ? 'Configuré' : 'Non configuré'}
  ${process.env.LEMONSQUEEZY_API_KEY ? '?' : '?? '} LemonSqueezy: ${process.env.LEMONSQUEEZY_API_KEY ? 'Configuré' : 'Non configuré'}
  ${process.env.DEEPSEEK_API_KEY ? '?' : '?? '} DeepSeek AI: ${process.env.DEEPSEEK_API_KEY ? 'Configuré' : 'Non configuré'}
  ${process.env.CLOUDINARY_CLOUD_NAME ? '?' : '?? '} Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configuré' : 'Non configuré'}
  ${process.env.ALGOLIA_APP_ID ? '?' : '?? '} Algolia: ${process.env.ALGOLIA_APP_ID ? 'Configuré' : 'Non configuré'}

?? Serveur ECOLOJIA prêt!
?? Pour tester: POST http://localhost:${PORT}/api/auth/login
   Body: { "email": "test@example.com", "password": "test123" }
  `);
});

// Export pour les tests
module.exports = app;
