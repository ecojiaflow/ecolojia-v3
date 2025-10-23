// server-postgres-fixed.js - Serveur avec PostgreSQL amÃ©liorÃ© et sÃ©curisÃ©
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration PostgreSQL avec parsing de l'URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://ecolojia_db_user:Mj2kdVH9LJKTQLvLQ2HIrdJjsqThJmBI@dpg-d11f1849c44c73f9jmf0-a.frankfurt-postgres.render.com:5432/ecolojia_db';

// Configuration du pool PostgreSQL
const poolConfig = {
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
};

const pool = new Pool(poolConfig);

// Variable pour stocker l'Ã©tat de la connexion
let dbConnected = false;

// ========== CONFIGURATION SÃƒâ€°CURITÃƒâ€° ==========

// 1. Compression
app.use(compression());

// 2. Helmet pour les headers de sÃ©curitÃ©
app.use(helmet({
  contentSecurityPolicy: false, // DÃ©sactivÃ© pour les APIs
  crossOriginEmbedderPolicy: false
}));

// 3. Configuration CORS stricte
const corsOptions = {
  origin: function (origin, callback) {
    // Liste des origines autorisÃ©es
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://ecolojia-v3.netlify.app',
      'https://main--ecolojia-v3.netlify.app',
      'https://frontendv3.netlify.app',
      'https://ecolojiafrontv3.netlify.app'
    ];
    
    // Ajouter les origines depuis l'environnement
    if (process.env.CORS_ORIGIN) {
      const envOrigins = process.env.CORS_ORIGIN.split(',').map(o => o.trim());
      allowedOrigins.push(...envOrigins);
    }
    
    // Permettre les requÃªtes sans origine (Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // Cache preflight 24h
};

app.use(cors(corsOptions));

// 4. Sanitization des inputs
app.use(mongoSanitize());

// 5. Headers de sÃ©curitÃ© supplÃ©mentaires
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.removeHeader('X-Powered-By');
  next();
});

// 6. Body parsers avec limite
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== GESTION D'ERREURS ==========

// Classe d'erreur personnalisÃ©e
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Wrapper pour les routes async
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ========== FONCTIONS DB ==========

// Test connexion DB avec retry
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Ã¢Å“â€¦ PostgreSQL connectÃ©:', result.rows[0].now);
    dbConnected = true;
    return true;
  } catch (err) {
    console.error('Ã¢ÂÅ’ Erreur connexion PostgreSQL:', err.message);
    dbConnected = false;
    return false;
  }
}

// CrÃ©er les tables si elles n'existent pas
async function createTables() {
  if (!dbConnected) {
    console.log('Ã¢Å¡Â Ã¯Â¸Â Base de donnÃ©es non connectÃ©e, tables non crÃ©Ã©es');
    return;
  }
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        tier VARCHAR(50) DEFAULT 'free',
        is_email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        barcode VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id),
        score INTEGER,
        analysis_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
    `);
    console.log('Ã¢Å“â€¦ Tables crÃ©Ã©es/vÃ©rifiÃ©es');
  } catch (error) {
    console.error('Ã¢ÂÅ’ Erreur crÃ©ation tables:', error.message);
  }
}

// Stockage en mÃ©moire pour le mode sans DB
const memoryUsers = [];

// ========== VALIDATION ==========

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

// ========== ROUTES ==========

// Route principale
app.get('/', (req, res) => {
  res.json({
    name: 'ECOLOJIA API',
    version: '2.0.0',
    status: 'running',
    database: dbConnected ? 'PostgreSQL connectÃ©' : 'Mode sans base de donnÃ©es',
    security: 'enabled',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route santÃ©
app.get('/health', asyncHandler(async (req, res) => {
  const dbStatus = await testConnection();
  res.json({ 
    status: 'healthy',
    database: dbStatus ? 'connected' : 'disconnected',
    type: 'PostgreSQL',
    mode: dbStatus ? 'full' : 'limited',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
}));

// Route inscription
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  
  // Validation
  if (!email || !password || !name) {
    throw new AppError('Tous les champs sont requis', 400);
  }

  if (!validateEmail(email)) {
    throw new AppError('Format email invalide', 400);
  }

  if (!validatePassword(password)) {
    throw new AppError('Le mot de passe doit contenir au moins 6 caractÃ¨res', 400);
  }

  if (name.trim().length < 2 || name.trim().length > 100) {
    throw new AppError('Le nom doit contenir entre 2 et 100 caractÃ¨res', 400);
  }

  // Normalisation
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedName = name.trim();

  // Si DB connectÃ©e, utiliser PostgreSQL
  if (dbConnected) {
    try {
      // VÃ©rifier si utilisateur existe
      const userCheck = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [normalizedEmail]
      );

      if (userCheck.rows.length > 0) {
        throw new AppError('Email dÃ©jÃƒÂ  utilisÃ©', 409);
      }

      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // CrÃ©er utilisateur
      const result = await pool.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, tier, created_at',
        [normalizedEmail, hashedPassword, normalizedName]
      );

      res.status(201).json({
        success: true,
        message: 'Inscription rÃ©ussie',
        user: result.rows[0]
      });
    } catch (dbError) {
      if (dbError instanceof AppError) throw dbError;
      console.error('Erreur DB, bascule sur mÃ©moire:', dbError.message);
      dbConnected = false;
    }
  }
  
  // Si DB non connectÃ©e, utiliser le stockage mÃ©moire
  if (!dbConnected) {
    // VÃ©rifier si email existe
    if (memoryUsers.find(u => u.email === normalizedEmail)) {
      throw new AppError('Email dÃ©jÃƒÂ  utilisÃ©', 409);
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // CrÃ©er utilisateur en mÃ©moire
    const user = {
      id: memoryUsers.length + 1,
      email: normalizedEmail,
      password: hashedPassword,
      name: normalizedName,
      tier: 'free',
      created_at: new Date()
    };

    memoryUsers.push(user);

    res.status(201).json({
      success: true,
      message: 'Inscription rÃ©ussie (stockage temporaire)',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        created_at: user.created_at
      }
    });
  }
}));

// Route connexion
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Validation
  if (!email || !password) {
    throw new AppError('Email et mot de passe requis', 400);
  }

  if (!validateEmail(email)) {
    throw new AppError('Format email invalide', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  let user = null;

  // Si DB connectÃ©e, chercher dans PostgreSQL
  if (dbConnected) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [normalizedEmail]
      );
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } catch (dbError) {
      console.error('Erreur DB:', dbError.message);
      dbConnected = false;
    }
  }

  // Si DB non connectÃ©e, chercher en mÃ©moire
  if (!dbConnected) {
    user = memoryUsers.find(u => u.email === normalizedEmail);
  }

  if (!user) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  // VÃ©rifier mot de passe
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  res.json({
    success: true,
    message: 'Connexion rÃ©ussie',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier || 'free'
    },
    token: 'fake-jwt-token' // TODO: ImplÃ©menter JWT
  });
}));

// Route pour lister les utilisateurs (test)
app.get('/api/users', asyncHandler(async (req, res) => {
  let users = [];

  if (dbConnected) {
    try {
      const result = await pool.query('SELECT id, email, name, tier, created_at FROM users ORDER BY created_at DESC');
      users = result.rows;
    } catch (dbError) {
      console.error('Erreur DB:', dbError.message);
      dbConnected = false;
    }
  }

  if (!dbConnected) {
    users = memoryUsers.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      tier: u.tier,
      created_at: u.created_at
    }));
  }

  res.json({
    success: true,
    count: users.length,
    users,
    storage: dbConnected ? 'PostgreSQL' : 'Memory'
  });
}));

// ========== GESTION ERREURS 404 ==========
app.use((req, res, next) => {
  const error = new AppError(`Route non trouvÃ©e: ${req.method} ${req.originalUrl}`, 404);
  next(error);
});

// ========== MIDDLEWARE ERREUR GLOBAL ==========
app.use((err, req, res, next) => {
  // Log l'erreur
  console.error('Erreur:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Erreur CORS spÃ©cifique
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS_ERROR',
      message: 'Origine non autorisÃ©e'
    });
  }

  // Status par dÃ©faut
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur serveur interne';

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ========== DÃƒâ€°MARRAGE ==========
async function start() {
  // Tenter la connexion DB
  console.log('Ã°Å¸â€â€ž Tentative de connexion ÃƒÂ  PostgreSQL...');
  const connected = await testConnection();
  
  if (connected) {
    await createTables();
  } else {
    console.log('Ã¢Å¡Â Ã¯Â¸Â DÃ©marrage en mode sans base de donnÃ©es (stockage mÃ©moire)');
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\nÃ°Å¸Å’Â± ECOLOJIA API v2.0 - Serveur dÃ©marrÃ©');
    console.log('================================================');
    console.log(`Ã°Å¸â€œÂ¡ URL: http://localhost:${PORT}`);
    console.log(`Ã°Å¸â€â€™ Mode: ${dbConnected ? 'PostgreSQL' : 'Stockage mÃ©moire'}`);
    console.log(`Ã°Å¸Å’Â Environnement: ${process.env.NODE_ENV || 'development'}`);
    console.log('\nÃ°Å¸â€œÂ Endpoints disponibles:');
    console.log(`   - GET  http://localhost:${PORT}/`);
    console.log(`   - GET  http://localhost:${PORT}/health`);
    console.log(`   - POST http://localhost:${PORT}/api/auth/register`);
    console.log(`   - POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   - GET  http://localhost:${PORT}/api/users`);
    console.log('\nÃ°Å¸â€Â SÃ©curitÃ© activÃ©e:');
    console.log('   Ã¢Å“â€¦ Helmet (headers sÃ©curisÃ©s)');
    console.log('   Ã¢Å“â€¦ CORS (origines contrÃ´lÃ©es)');
    console.log('   Ã¢Å“â€¦ Sanitization des entrÃ©es');
    console.log('   Ã¢Å“â€¦ Validation complÃ¨te');
    console.log('   Ã¢Å“â€¦ Gestion d\'erreurs centralisÃ©e');
    console.log('================================================\n');
  });
}

// ========== GESTION ARRÃƒÅ T PROPRE ==========
process.on('SIGTERM', () => {
  console.log('SIGTERM reÃ§u, fermeture gracieuse...');
  pool.end().then(() => {
    console.log('Pool PostgreSQL fermÃ©');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT reÃ§u, fermeture...');
  pool.end().then(() => {
    console.log('Pool PostgreSQL fermÃ©');
    process.exit(0);
  });
});

// Gestion des erreurs non capturÃ©es
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// DÃ©marrer le serveur
start();