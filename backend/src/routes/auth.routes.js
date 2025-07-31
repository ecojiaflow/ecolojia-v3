// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuthService = require('../services/auth/authService');
const TokenService = require('../services/auth/tokenService');
const { auth, authOptional } = require('../middleware/auth');
const { AppError, ValidationError } = require('../utils/errors');

// Initialiser les services
const tokenService = new TokenService(null); // Redis optionnel en dev
const authService = new AuthService(null);

// ═══════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

// ═══════════════════════════════════════════════════════════════════════
// ROUTES PUBLIQUES
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, referralCode } = req.body;

    // Validation
    if (!email || !password || !name) {
      throw new ValidationError('Email, mot de passe et nom requis');
    }

    if (!validateEmail(email)) {
      throw new ValidationError('Email invalide');
    }

    if (!validatePassword(password)) {
      throw new ValidationError('Le mot de passe doit contenir au moins 6 caractères');
    }

    // Utiliser le service d'authentification
    const result = await authService.register({
      email,
      password,
      name,
      referralCode
    });

    // Log pour debug
    console.log(`[Auth] Nouvel utilisateur inscrit: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });

  } catch (error) {
    if (error.message.includes('already registered')) {
      return res.status(409).json({
        success: false,
        error: 'Cet email est déjà utilisé',
        code: 'EMAIL_EXISTS'
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Connexion utilisateur
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new ValidationError('Email et mot de passe requis');
    }

    // Utiliser le service
    const result = await authService.login(email, password);

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });

  } catch (error) {
    if (error.message.includes('Invalid credentials')) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS'
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Rafraîchir le token d'accès
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token requis');
    }

    // Utiliser le service
    const result = await authService.refresh(refreshToken);

    res.json({
      success: true,
      message: 'Token rafraîchi',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });

  } catch (error) {
    if (error.message.includes('Invalid refresh token') || 
        error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token invalide ou expiré',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Déconnexion
 */
router.post('/logout', auth, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user._id.toString();

    if (refreshToken) {
      await authService.logout(userId, refreshToken);
    }

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    // Même si erreur, on considère la déconnexion comme réussie
    console.error('[Auth] Erreur lors du logout:', error);
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// ROUTES PROTÉGÉES
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/auth/me
 * Obtenir le profil de l'utilisateur connecté
 */
router.get('/me', auth, async (req, res, next) => {
  try {
    // L'utilisateur est déjà attaché par le middleware auth
    const user = req.user;

    // Récupérer les infos de quota
    const quotas = user.quotas || {
      scansRemaining: user.tier === 'premium' ? 999999 : 30,
      aiChatsRemaining: user.tier === 'premium' ? 500 : 5
    };

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          displayName: user.displayName,
          tier: user.tier,
          profile: user.profile,
          preferences: user.preferences,
          quotas: quotas,
          isPremium: user.isPremium,
          hasActiveSubscription: user.hasActiveSubscription,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/me
 * Mettre à jour le profil
 */
router.put('/me', auth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    // Champs autorisés à la mise à jour
    const allowedUpdates = [
      'name',
      'profile.firstName',
      'profile.lastName',
      'profile.phone',
      'profile.dateOfBirth',
      'profile.gender',
      'preferences.allergies',
      'preferences.diets',
      'preferences.healthGoals',
      'preferences.notifications'
    ];

    // Filtrer les mises à jour
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/password
 * Changer le mot de passe
 */
router.put('/password', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validation
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Mot de passe actuel et nouveau requis');
    }

    if (!validatePassword(newPassword)) {
      throw new ValidationError('Le nouveau mot de passe doit contenir au moins 6 caractères');
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      throw new ValidationError('Mot de passe actuel incorrect');
    }

    // Hasher et sauvegarder le nouveau mot de passe
    user.password = newPassword; // Le pre-save hook va hasher
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/forgot-password
 * Demander une réinitialisation de mot de passe
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email requis');
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Toujours retourner succès pour éviter l'énumération
    if (!user) {
      return res.json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
      });
    }

    // Générer token de reset
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_SECRET || 'ecolojia-secret-key-2024-super-secure',
      { expiresIn: '1h' }
    );

    // Sauvegarder le token
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 heure
    await user.save();

    // TODO: Envoyer email avec SendGrid
    console.log(`[Auth] Reset token pour ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset-password
 * Réinitialiser le mot de passe
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new ValidationError('Token et nouveau mot de passe requis');
    }

    if (!validatePassword(newPassword)) {
      throw new ValidationError('Le mot de passe doit contenir au moins 6 caractères');
    }

    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'ecolojia-secret-key-2024-super-secure'
      );
    } catch (error) {
      throw new ValidationError('Token invalide ou expiré');
    }

    // Trouver l'utilisateur
    const user = await User.findById(decoded.userId);
    if (!user || user.passwordResetToken !== token) {
      throw new ValidationError('Token invalide');
    }

    // Vérifier expiration
    if (user.passwordResetExpires < new Date()) {
      throw new ValidationError('Token expiré');
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/auth/account
 * Supprimer le compte (RGPD)
 */
router.delete('/account', auth, async (req, res, next) => {
  try {
    const { password, confirmation } = req.body;
    const userId = req.user._id;

    // Validation
    if (!password || confirmation !== 'DELETE') {
      throw new ValidationError('Mot de passe et confirmation requis');
    }

    // Vérifier le mot de passe
    const user = await User.findById(userId);
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new ValidationError('Mot de passe incorrect');
    }

    // Marquer comme supprimé (soft delete pour RGPD)
    user.status = 'deleted';
    user.email = `deleted_${Date.now()}_${user.email}`;
    user.gdpr.deletionDate = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Compte supprimé. Vos données seront effacées sous 30 jours.'
    });

  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// ROUTES DEMO MODE
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/demo
 * Connexion en mode démo
 */
router.post('/demo', async (req, res, next) => {
  try {
    // Créer ou récupérer l'utilisateur démo
    const demoEmail = `demo_${Date.now()}@ecolojia.app`;
    
    const demoUser = new User({
      email: demoEmail,
      password: 'demo123456',
      name: 'Utilisateur Démo',
      tier: 'free',
      isDemo: true,
      quotas: {
        scansRemaining: 10,
        scansResetDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        aiChatsRemaining: 3,
        aiChatsResetDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    await demoUser.save();

    // Générer tokens
    const accessToken = tokenService.generateAccessToken(demoUser);
    const refreshToken = tokenService.generateRefreshToken(demoUser);

    res.json({
      success: true,
      message: 'Mode démo activé',
      data: {
        user: authService.sanitizeUser(demoUser),
        accessToken,
        refreshToken,
        isDemo: true
      }
    });

  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// ROUTES VALIDATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/auth/validate
 * Valider un token
 */
router.get('/validate', authOptional, (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      valid: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        tier: req.user.tier
      }
    });
  } else {
    res.json({
      success: true,
      valid: false
    });
  }
});

/**
 * GET /api/auth/health
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'auth',
    timestamp: new Date(),
    features: [
      'registration',
      'login',
      'refresh_token',
      'password_reset',
      'profile_management',
      'demo_mode',
      'rgpd_compliance'
    ]
  });
});

module.exports = router;