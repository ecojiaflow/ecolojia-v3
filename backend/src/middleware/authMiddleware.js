// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification principal
const authMiddleware = async (req, res, next) => {
  try {
    // Extraire le token du header Authorization EN PREMIER
    const token = req.headers.authorization?.replace('Bearer ', '');

    // === MODE DÉVELOPPEMENT : Accepter les tokens dev ===
    if (process.env.NODE_ENV === 'development' && token && token.startsWith('dev-token-')) {
      console.log('[Auth Dev] ✅ Token dev accepté:', token);
      req.user = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@ecolojia.fr',
        name: 'Test User Premium',
        tier: 'premium',
        status: 'active',
        quotas: {
          scansRemaining: 999999,
          aiChatsRemaining: 999999,
          exportsRemaining: 999999
        }
      };
      req.userId = req.user._id.toString();
      req.token = token;
      return next();
    }

    // Si pas de token du tout
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token non fourni'
      });
    }

    // Vérifier et décoder le token JWT
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'utilisateur est actif
    if (user.status === 'suspended' || user.status === 'deleted') {
      return res.status(403).json({
        success: false,
        message: 'Compte utilisateur inactif'
      });
    }

    // Attacher l'utilisateur à la requête
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

// Middleware optionnel (n'arrête pas si pas de token)
const authOptionalMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        // Vérifier le token
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );

        // Récupérer l'utilisateur
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
    // Continuer même si erreur
    next();
  }
};

// Middleware pour vérifier le tier Premium
const requirePremium = async (req, res, next) => {
  try {
    // S'assurer que l'utilisateur est authentifié d'abord
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Vérifier le tier
    if (req.user.tier !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'Fonctionnalité réservée aux membres Premium',
        requiresUpgrade: true
      });
    }

    next();
  } catch (error) {
    console.error('[Premium Middleware] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de vérification Premium'
    });
  }
};

// Middleware pour vérifier les quotas
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

      // Vérifier si la date de reset est passée
      if (quotas[resetField] && new Date(quotas[resetField]) < new Date()) {
        // Réinitialiser les quotas
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

      // Vérifier le quota restant
      if (!quotas[quotaField] || quotas[quotaField] <= 0) {
        return res.status(429).json({
          success: false,
          message: `Quota ${quotaType} épuisé`,
          quotaType,
          resetDate: quotas[resetField],
          requiresUpgrade: req.user.tier === 'free'
        });
      }

      // Décrémenter le quota
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
        message: 'Erreur de vérification des quotas'
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
  // Alias pour compatibilité
  auth: authMiddleware,
  authOptional: authOptionalMiddleware
};