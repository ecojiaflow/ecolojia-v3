// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification principal
const authMiddleware = async (req, res, next) => {
  try {
    // Extraire le token du header Authorization
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token non fourni'
      });
    }

    // VÃ©rifier et dÃ©coder le token
    let decoded;
    try {
      decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'ecolojia-secret-key-2024-super-secure'
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expirÃ©'
      });
    }

    // RÃ©cupÃ©rer l'utilisateur depuis la base de donnÃ©es
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvÃ©'
      });
    }

    // VÃ©rifier si l'utilisateur est actif
    if (user.status === 'suspended' || user.status === 'deleted') {
      return res.status(403).json({
        success: false,
        message: 'Compte utilisateur inactif'
      });
    }

    // Attacher l'utilisateur Ã  la requÃªte
    req.user = user;
    req.userId = user._id.toString();
    req.token = token;

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    res.status(401).json({
      success: false,
      message: 'Erreur d\'authentification'
    });
  }
};

// Middleware optionnel (n'arrÃªte pas si pas de token)
const authOptionalMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        // VÃ©rifier le token
        const decoded = jwt.verify(
          token, 
          process.env.JWT_SECRET || 'ecolojia-secret-key-2024-super-secure'
        );

        // RÃ©cupÃ©rer l'utilisateur
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.status !== 'suspended' && user.status !== 'deleted') {
          req.user = user;
          req.userId = user._id.toString();
          req.token = token;
        }
      } catch (error) {
        // Ignorer les erreurs de token en mode optionnel
        console.log('[Auth Optional] Token invalid, continuing without auth');
      }
    }

    next();
  } catch (error) {
    // Continuer mÃªme si erreur
    next();
  }
};

// Middleware pour vÃ©rifier le tier Premium
const requirePremium = async (req, res, next) => {
  try {
    // S'assurer que l'utilisateur est authentifiÃ© d'abord
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // VÃ©rifier le tier
    if (req.user.tier !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'FonctionnalitÃ© rÃ©servÃ©e aux membres Premium',
        requiresUpgrade: true
      });
    }

    next();
  } catch (error) {
    console.error('[Premium Middleware] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de vÃ©rification Premium'
    });
  }
};

// Middleware pour vÃ©rifier les quotas
const checkQuota = (quotaType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      const quotas = req.user.quotas || {};
      let quotaField, resetField;

      switch (quotaType) {
        case 'scan':
          quotaField = 'scansRemaining';
          resetField = 'scansResetDate';
          break;
        case 'chat':
          quotaField = 'aiChatsRemaining';
          resetField = 'aiChatsResetDate';
          break;
        default:
          return next();
      }

      // VÃ©rifier si la date de reset est passÃ©e
      if (quotas[resetField] && new Date(quotas[resetField]) < new Date()) {
        // RÃ©initialiser les quotas
        const User = require('../models/User');
        const defaultQuotas = {
          scansRemaining: req.user.tier === 'premium' ? 999999 : 30,
          aiChatsRemaining: req.user.tier === 'premium' ? 500 : 5
        };

        await User.findByIdAndUpdate(req.user._id, {
          [`quotas.${quotaField}`]: defaultQuotas[quotaField],
          [`quotas.${resetField}`]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        req.user.quotas[quotaField] = defaultQuotas[quotaField];
      }

      // VÃ©rifier le quota restant
      if (!quotas[quotaField] || quotas[quotaField] <= 0) {
        return res.status(429).json({
          success: false,
          message: `Quota ${quotaType} Ã©puisÃ©`,
          quotaType,
          resetDate: quotas[resetField],
          requiresUpgrade: req.user.tier === 'free'
        });
      }

      // DÃ©crÃ©menter le quota
      req.decrementQuota = async () => {
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { [`quotas.${quotaField}`]: -1 }
        });
      };

      next();
    } catch (error) {
      console.error('[Quota Middleware] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur de vÃ©rification des quotas'
      });
    }
  };
};

// Export des middlewares
module.exports = {
  authMiddleware,
  authOptionalMiddleware,
  requirePremium,
  checkQuota,
  // Alias pour compatibilitÃ©
  auth: authMiddleware,
  authOptional: authOptionalMiddleware
};
