// backend/src/middleware/validation.js
// Middleware de validation pour sécuriser les entrées

const Joi = require('joi');

// Schémas de validation
const schemas = {
  // Analyse simple
  analysis: Joi.object({
    barcode: Joi.string()
      .pattern(/^[0-9]{8,13}$/)
      .messages({
        'string.pattern.base': 'Code-barres invalide (8-13 chiffres)'
      }),
    name: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .messages({
        'string.min': 'Le nom doit faire au moins 2 caractères',
        'string.max': 'Le nom ne peut pas dépasser 200 caractères'
      }),
    ingredients: Joi.string()
      .max(5000)
      .trim()
      .messages({
        'string.max': 'La liste d\'ingrédients est trop longue (max 5000 caractères)'
      }),
    category: Joi.string()
      .valid('food', 'cosmetic', 'detergent')
      .messages({
        'any.only': 'Catégorie invalide'
      }),
    method: Joi.string()
      .valid('scan', 'search', 'manual', 'voice', 'photo')
      .default('manual')
  }).or('barcode', 'name', 'ingredients'),

  // Analyse batch
  batchAnalysis: Joi.object({
    products: Joi.array()
      .items(
        Joi.object({
          barcode: Joi.string().pattern(/^[0-9]{8,13}$/),
          name: Joi.string().min(2).max(200),
          ingredients: Joi.string().max(5000),
          category: Joi.string().valid('food', 'cosmetic', 'detergent')
        }).or('barcode', 'name')
      )
      .min(1)
      .max(100)
      .required()
      .messages({
        'array.min': 'Au moins un produit requis',
        'array.max': 'Maximum 100 produits par batch'
      })
  }),

  // Feedback
  feedback: Joi.object({
    helpful: Joi.boolean(),
    rating: Joi.number().integer().min(1).max(5),
    comment: Joi.string().max(1000).trim(),
    reportedIssue: Joi.string()
      .valid('wrong_category', 'incorrect_analysis', 'missing_data', 'technical_issue', 'other')
  }).or('helpful', 'rating', 'comment', 'reportedIssue'),

  // Recherche de produits
  productSearch: Joi.object({
    query: Joi.string().min(2).max(100).required(),
    category: Joi.string().valid('all', 'food', 'cosmetic', 'detergent').default('all'),
    limit: Joi.number().integer().min(1).max(50).default(20),
    offset: Joi.number().integer().min(0).default(0),
    sort: Joi.string().valid('relevance', 'popularity', 'health_score', 'name').default('relevance')
  }),

  // Paramètres de pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().pattern(/^-?[a-zA-Z_]+$/).default('-createdAt')
  }),

  // Préférences utilisateur
  userPreferences: Joi.object({
    allergies: Joi.array().items(
      Joi.string().valid(
        'gluten', 'lactose', 'nuts', 'eggs', 'soy', 'fish', 'shellfish',
        'peanuts', 'sesame', 'mustard', 'celery', 'sulphites', 'lupin', 'molluscs'
      )
    ).max(20),
    diets: Joi.array().items(
      Joi.string().valid(
        'vegan', 'vegetarian', 'pescatarian', 'flexitarian',
        'halal', 'kosher', 'gluten_free', 'dairy_free',
        'low_carb', 'keto', 'paleo'
      )
    ).max(10),
    healthConditions: Joi.array().items(
      Joi.string().max(100)
    ).max(10),
    language: Joi.string().valid('fr', 'en', 'es', 'de', 'it'),
    theme: Joi.string().valid('light', 'dark', 'auto'),
    notifications: Joi.object({
      email: Joi.boolean(),
      push: Joi.boolean(),
      sms: Joi.boolean(),
      marketing: Joi.boolean(),
      productAlerts: Joi.boolean(),
      weeklyReport: Joi.boolean()
    })
  })
};

// Middleware de validation générique
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        validation: errors
      });
    }

    // Remplacer req.body par les valeurs validées et nettoyées
    req.body = value;
    next();
  };
};

// Middleware spécifiques
const validateAnalysis = validate(schemas.analysis);
const validateBatchAnalysis = validate(schemas.batchAnalysis);
const validateFeedback = validate(schemas.feedback);
const validateProductSearch = validate(schemas.productSearch);
const validateUserPreferences = validate(schemas.userPreferences);

// Validation des query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Paramètres invalides',
        validation: errors
      });
    }

    req.query = value;
    next();
  };
};

const validatePagination = validateQuery(schemas.pagination);

// Sanitizer pour prévenir les injections
const sanitizeInput = (req, res, next) => {
  // Fonction récursive pour nettoyer les objets
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Supprimer les caractères de contrôle dangereux
      return obj
        .replace(/[\x00-\x1F\x7F]/g, '') // Caractères de contrôle
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Scripts
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Iframes
        .trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj !== null && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Éviter les clés dangereuses
          const safeKey = key.replace(/[\$\.]/g, '');
          sanitized[safeKey] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Nettoyer body, query et params
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// Validation des fichiers uploadés
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB par défaut
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'],
    required = false
  } = options;

  return (req, res, next) => {
    if (!req.file && required) {
      return res.status(400).json({
        success: false,
        error: 'Fichier requis'
      });
    }

    if (!req.file) {
      return next();
    }

    // Vérifier la taille
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `Fichier trop volumineux (max ${maxSize / 1024 / 1024}MB)`
      });
    }

    // Vérifier le type MIME
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Type de fichier non autorisé',
        allowed: allowedMimeTypes
      });
    }

    next();
  };
};

// Validation des permissions
const validatePermission = (requiredTier = 'free') => {
  const tierHierarchy = {
    free: 0,
    premium: 1,
    family: 2,
    enterprise: 3
  };

  return (req, res, next) => {
    const userTier = req.user?.subscription?.tier || 'free';
    
    if (tierHierarchy[userTier] < tierHierarchy[requiredTier]) {
      return res.status(403).json({
        success: false,
        error: 'Abonnement insuffisant',
        requiredTier,
        currentTier: userTier,
        upgradeRequired: true
      });
    }

    next();
  };
};

// Middleware de limitation des requêtes par IP (en plus du rate limiting par user)
const ipRateLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Trop de requêtes depuis cette adresse IP',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

module.exports = {
  // Validateurs principaux
  validateAnalysis,
  validateBatchAnalysis,
  validateFeedback,
  validateProductSearch,
  validateUserPreferences,
  validatePagination,
  
  // Utilitaires
  sanitizeInput,
  validateFileUpload,
  validatePermission,
  ipRateLimiter,
  
  // Export du builder pour validation custom
  validate,
  schemas
};
