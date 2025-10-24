// backend/src/middleware/validation.js
// Middlewares de validation pour ECOLOJIA
// Remplace le fichier vide actuel (291 bytes)

/**
 * Valide les données pour une analyse de produit
 */
const validateAnalysis = (req, res, next) => {
  const { barcode, name, ingredients, category } = req.body;
  
  // Au moins un champ requis
  if (!barcode && !name && !ingredients) {
    return res.status(400).json({
      success: false,
      error: 'Au moins un champ requis: barcode, name ou ingredients',
      code: 'MISSING_FIELDS'
    });
  }

  // Validation du barcode si présent
  if (barcode) {
    const barcodeStr = String(barcode);
    if (!/^\d{8,13}$/.test(barcodeStr)) {
      return res.status(400).json({
        success: false,
        error: 'Code-barres invalide (8-13 chiffres requis)',
        code: 'INVALID_BARCODE'
      });
    }
  }

  // Validation du nom si présent
  if (name && typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Le nom doit être une chaîne de caractères',
      code: 'INVALID_NAME'
    });
  }

  // Validation des ingrédients si présents
  if (ingredients && typeof ingredients !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Les ingrédients doivent être une chaîne de caractères',
      code: 'INVALID_INGREDIENTS'
    });
  }

  // Validation de la catégorie si présente
  if (category) {
    const validCategories = ['food', 'cosmetic', 'detergent', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Catégorie invalide. Valeurs acceptées: ${validCategories.join(', ')}`,
        code: 'INVALID_CATEGORY'
      });
    }
  }

  next();
};

/**
 * Valide les données pour un produit
 */
const validateProduct = (req, res, next) => {
  const { name, brand, category } = req.body;

  // Nom requis
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Le nom du produit est requis',
      code: 'MISSING_PRODUCT_NAME'
    });
  }

  // Marque optionnelle mais doit être string si présente
  if (brand && typeof brand !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'La marque doit être une chaîne de caractères',
      code: 'INVALID_BRAND'
    });
  }

  // Catégorie requise
  if (!category) {
    return res.status(400).json({
      success: false,
      error: 'La catégorie est requise',
      code: 'MISSING_CATEGORY'
    });
  }

  const validCategories = ['food', 'cosmetic', 'detergent', 'other'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      error: `Catégorie invalide. Valeurs acceptées: ${validCategories.join(', ')}`,
      code: 'INVALID_CATEGORY'
    });
  }

  next();
};

/**
 * Valide les données utilisateur (inscription/mise Ã  jour)
 */
const validateUser = (req, res, next) => {
  const { email, password, name } = req.body;
  const isUpdate = req.method === 'PUT' || req.method === 'PATCH';

  // Email validation
  if (!isUpdate || email) {
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis',
        code: 'MISSING_EMAIL'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Format email invalide',
        code: 'INVALID_EMAIL'
      });
    }
  }

  // Password validation (seulement pour création ou si fourni en update)
  if (!isUpdate || password) {
    if (!isUpdate && !password) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe requis',
        code: 'MISSING_PASSWORD'
      });
    }

    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères',
        code: 'WEAK_PASSWORD'
      });
    }
  }

  // Name validation
  if (!isUpdate || name) {
    if (!isUpdate && !name) {
      return res.status(400).json({
        success: false,
        error: 'Nom requis',
        code: 'MISSING_NAME'
      });
    }

    if (name && (typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Le nom doit être une chaîne de caractères non vide',
        code: 'INVALID_NAME'
      });
    }
  }

  next();
};

/**
 * Valide les paramètres de pagination
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Le numéro de page doit être un entier positif',
        code: 'INVALID_PAGE'
      });
    }
    req.query.page = pageNum;
  }

  if (limit) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'La limite doit être un entier entre 1 et 100',
        code: 'INVALID_LIMIT'
      });
    }
    req.query.limit = limitNum;
  }

  next();
};

/**
 * Valide les données pour le chat IA
 */
const validateChat = (req, res, next) => {
  const { message, productId } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Message requis',
      code: 'MISSING_MESSAGE'
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      error: 'Le message ne doit pas dépasser 1000 caractères',
      code: 'MESSAGE_TOO_LONG'
    });
  }

  if (productId && typeof productId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'L\'ID du produit doit être une chaîne de caractères',
      code: 'INVALID_PRODUCT_ID'
    });
  }

  next();
};

/**
 * Valide les données pour l'export GDPR
 */
const validateExport = (req, res, next) => {
  const { format } = req.query;
  const validFormats = ['json', 'csv', 'pdf'];

  if (format && !validFormats.includes(format)) {
    return res.status(400).json({
      success: false,
      error: `Format invalide. Valeurs acceptées: ${validFormats.join(', ')}`,
      code: 'INVALID_FORMAT'
    });
  }

  next();
};

// Export de tous les validateurs
module.exports = {
  validateAnalysis,
  validateProduct,
  validateUser,
  validatePagination,
  validateChat,
  validateExport
};
