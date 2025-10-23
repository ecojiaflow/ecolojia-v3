import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import { Request, Response, NextFunction, Express } from 'express';
import compression from 'compression';

/**
 * Configuration CORS selon l'environnement
 */
const getCorsOptions = (): cors.CorsOptions => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  // Liste blanche des origines autorisÃ©es
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.FRONTEND_URL_PROD || 'https://ecolojia.com',
    // Ajouter d'autres domaines si nÃ©cessaire
  ].filter(Boolean);

  return {
    origin: (origin, callback) => {
      // Permettre les requÃªtes sans origine (Postman, apps mobiles)
      if (!origin && isDevelopment) {
        return callback(null, true);
      }

      // VÃ©rifier si l'origine est dans la liste blanche
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Permettre les cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'X-Correlation-ID'
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset'
    ],
    maxAge: 86400, // Cache preflight pendant 24h
    optionsSuccessStatus: 200 // Pour compatibilitÃ© IE11
  };
};

/**
 * Configuration Helmet pour la sÃ©curitÃ© des headers HTTP
 */
const getHelmetOptions = (): Parameters<typeof helmet>[0] => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: [
          "'self'",
          isDevelopment && "'unsafe-inline'",
          'https://js.stripe.com',
          'https://cdn.jsdelivr.net'
        ].filter(Boolean) as string[],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          'https://api.lemonsqueezy.com',
          'https://api.deepseek.com',
          'wss://*.deepseek.com',
          isDevelopment && 'ws://localhost:*'
        ].filter(Boolean) as string[],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: !isDevelopment ? [] : undefined
      }
    },
    
    // Strict Transport Security
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    
    // Autres options de sÃ©curitÃ©
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: false,
    dnsPrefetchControl: { allow: false },
    ieNoOpen: true,
    originAgentCluster: true,
    crossOriginEmbedderPolicy: false, // Pour permettre les images externes
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  };
};

/**
 * Configuration de la compression
 */
const getCompressionOptions = (): compression.CompressionOptions => {
  return {
    level: 6, // Niveau de compression (0-9)
    threshold: 1024, // Ne compresser que les rÃ©ponses > 1KB
    filter: (req, res) => {
      // Ne pas compresser les EventSource/SSE
      if (res.getHeader('Content-Type')?.includes('text/event-stream')) {
        return false;
      }
      // Utiliser la compression par dÃ©faut pour le reste
      return compression.filter(req, res);
    }
  };
};

/**
 * Middleware de sanitization des inputs MongoDB
 */
const getSanitizeOptions = (): Parameters<typeof mongoSanitize>[0] => {
  return {
    replaceWith: '_', // Remplacer $ et . par _
    onSanitize: ({ req, key }) => {
      // Log les tentatives d'injection (en dev seulement)
      if (process.env.NODE_ENV === 'development') {
        console.warn(`âš ï¸ Tentative d'injection MongoDB dÃ©tectÃ©e dans ${key}`);
      }
    }
  };
};

/**
 * Headers de sÃ©curitÃ© supplÃ©mentaires
 */
const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // EmpÃªcher le clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // EmpÃªcher la dÃ©tection du MIME type
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Protection XSS pour les anciens navigateurs
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // EmpÃªcher la mise en cache des donnÃ©es sensibles
  if (req.path.includes('/api/auth') || req.path.includes('/api/payment')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }
  
  // Supprimer les headers qui rÃ©vÃ¨lent des infos serveur
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
};

/**
 * Middleware pour gÃ©rer les erreurs CORS
 */
const corsErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      error: 'CORS_ERROR',
      message: 'Cross-Origin Request Blocked',
      origin: req.get('origin') || 'unknown'
    });
  } else {
    next(err);
  }
};

/**
 * Configuration complÃ¨te de la sÃ©curitÃ© pour l'application
 */
export const setupSecurity = (app: Express): void => {
  // 1. Compression (avant tout pour optimiser)
  app.use(compression(getCompressionOptions()));
  
  // 2. Headers de sÃ©curitÃ© avec Helmet
  app.use(helmet(getHelmetOptions()));
  
  // 3. CORS avec configuration stricte
  app.use(cors(getCorsOptions()));
  
  // 4. Sanitization des inputs MongoDB
  app.use(mongoSanitize(getSanitizeOptions()));
  
  // 5. Headers de sÃ©curitÃ© supplÃ©mentaires
  app.use(additionalSecurityHeaders);
  
  // 6. Gestion des erreurs CORS
  app.use(corsErrorHandler);
  
  // 7. Limite de taille des requÃªtes
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Log de confirmation (dev seulement)
  if (process.env.NODE_ENV === 'development') {
    console.log('âœ… Security middleware configured successfully');
  }
};

/**
 * Fonction utilitaire pour vÃ©rifier la configuration de sÃ©curitÃ©
 */
export const checkSecurityConfig = (): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // VÃ©rifier les variables d'environnement critiques
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    issues.push('JWT_SECRET absent ou trop court (min 32 caractÃ¨res)');
  }
  
  if (!process.env.FRONTEND_URL) {
    issues.push('FRONTEND_URL non dÃ©fini');
  }
  
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.FRONTEND_URL_PROD) {
      issues.push('FRONTEND_URL_PROD requis en production');
    }
    
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
      issues.push('SESSION_SECRET absent ou trop court en production');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};

// Export des configurations pour les tests
export const _testExports = {
  getCorsOptions,
  getHelmetOptions,
  getCompressionOptions
};
