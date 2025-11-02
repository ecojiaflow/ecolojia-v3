const express = require("express");
const router = express.Router();
const { authenticateToken, authenticateUser } = require("../middleware");
const User = require("../models/User");
const { body, validationResult } = require('express-validator');

// Logger
const logger = {
  info: (...args) => console.log('[User Routes]', ...args),
  error: (...args) => console.error('[User Routes ERROR]', ...args)
};

/* ============== ROUTES V1 (existantes) ============== */

// GET /api/users/profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "Utilisateur non trouve" });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("[User] Profile error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/users/profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("[User] Update error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/users
router.delete("/", authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ success: true, message: "Compte supprime" });
  } catch (error) {
    console.error("[User] Delete error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/users/me (compatibilite)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.userId).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============== ROUTES V2 (nouvelles) ============== */

/**
 * GET /api/users/v2/me
 * Recuperer le profil complet avec plan et quotas
 */
router.get('/v2/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouve' 
      });
    }

    // Verifier si les quotas doivent etre reset
    const now = new Date();
    if (user.usage && (!user.usage.currentPeriodEnd || now > user.usage.currentPeriodEnd)) {
      if (user.resetMonthlyUsage) {
        await user.resetMonthlyUsage();
      }
    }

    // Preparer la reponse structuree
    const response = {
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profile: user.profile || {},
        plan: user.plan || { code: 'free', status: 'active' },
        limits: user.limits || {
          scansPerMonth: 30,
          aiChatsPerMonth: 5,
          exportsPerMonth: 1,
          favoritesMax: 20
        },
        usage: user.usage || {
          scansUsed: 0,
          aiChatsUsed: 0,
          exportsUsed: 0
        },
        aiPrefs: user.aiPrefs || {
          tone: 'educational',
          detail: 'balanced',
          language: 'fr',
          focusAreas: [],
          foodRestrictions: [],
          allergies: [],
          autoSuggest: true,
          saveHistory: true
        },
        preferences: user.preferences || {},
        stats: user.stats || {},
        createdAt: user.createdAt
      }
    };

    // Si l'utilisateur a la methode getRemainingQuotas
    if (user.getRemainingQuotas) {
      response.user.usage.remaining = user.getRemainingQuotas();
    }

    logger.info(`Profile v2 fetched for user ${user.email}`);
    res.json(response);

  } catch (error) {
    logger.error('Error fetching profile v2:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la recuperation du profil' 
    });
  }
});

/**
 * PUT /api/users/v2/me
 * Mettre Â  jour le profil et les preferences
 */
router.put('/v2/me', 
  authenticateToken,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('profile.bio').optional().isLength({ max: 500 }),
    body('profile.location.country').optional().isLength({ min: 2, max: 2 }),
    body('aiPrefs.tone').optional().isIn(['casual', 'professional', 'educational', 'fun']),
    body('aiPrefs.detail').optional().isIn(['concise', 'balanced', 'detailed']),
    body('aiPrefs.language').optional().isIn(['fr', 'en', 'es', 'de', 'it']),
    body('preferences.theme').optional().isIn(['light', 'dark', 'auto'])
  ],
  async (req, res) => {
    try {
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const userId = req.user?.id || req.userId;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'Utilisateur non trouve' 
        });
      }

      // Mise Â  jour selective des champs
      const updates = req.body;
      const allowedFields = ['name', 'profile', 'aiPrefs', 'preferences'];

      // Initialiser les objets s'ils n'existent pas
      if (!user.profile) user.profile = {};
      if (!user.aiPrefs) user.aiPrefs = {};
      if (!user.preferences) user.preferences = {};

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          if (typeof updates[field] === 'object' && !Array.isArray(updates[field])) {
            // Merge des objets imbriques
            Object.keys(updates[field]).forEach(subField => {
              if (updates[field][subField] !== undefined) {
                user[field][subField] = updates[field][subField];
              }
            });
          } else {
            user[field] = updates[field];
          }
        }
      });

      await user.save();

      logger.info(`Profile v2 updated for user ${user.email}`);
      res.json({
        success: true,
        message: 'Profil mis Â  jour avec succes',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          profile: user.profile,
          aiPrefs: user.aiPrefs,
          preferences: user.preferences
        }
      });

    } catch (error) {
      logger.error('Error updating profile v2:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la mise Â  jour du profil' 
      });
    }
});

/**
 * PUT /api/users/v2/me/ai-preferences
 * Endpoint dedie pour les preferences IA
 */
router.put('/v2/me/ai-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouve' 
      });
    }

    // Initialiser aiPrefs si n'existe pas
    if (!user.aiPrefs) {
      user.aiPrefs = {
        tone: 'educational',
        detail: 'balanced',
        language: 'fr',
        focusAreas: [],
        foodRestrictions: [],
        allergies: [],
        autoSuggest: true,
        saveHistory: true
      };
    }

    const { tone, detail, language, focusAreas, foodRestrictions, allergies, autoSuggest, saveHistory } = req.body;

    // Mise Â  jour des preferences IA
    if (tone) user.aiPrefs.tone = tone;
    if (detail) user.aiPrefs.detail = detail;
    if (language) user.aiPrefs.language = language;
    if (focusAreas !== undefined) user.aiPrefs.focusAreas = focusAreas;
    if (foodRestrictions !== undefined) user.aiPrefs.foodRestrictions = foodRestrictions;
    if (allergies !== undefined) user.aiPrefs.allergies = allergies;
    if (autoSuggest !== undefined) user.aiPrefs.autoSuggest = autoSuggest;
    if (saveHistory !== undefined) user.aiPrefs.saveHistory = saveHistory;

    await user.save();

    logger.info(`AI preferences updated for user ${user.email}`);
    res.json({
      success: true,
      message: 'Preferences IA mises Â  jour',
      aiPrefs: user.aiPrefs
    });

  } catch (error) {
    logger.error('Error updating AI preferences:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise Â  jour des preferences IA' 
    });
  }
});

/**
 * GET /api/users/v2/me/quotas
 * Endpoint dedie pour recuperer uniquement les quotas
 */
router.get('/v2/me/quotas', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouve' 
      });
    }

    // Verifier si reset necessaire
    const now = new Date();
    if (user.usage && user.resetMonthlyUsage && (!user.usage.currentPeriodEnd || now > user.usage.currentPeriodEnd)) {
      await user.resetMonthlyUsage();
    }

    // Valeurs par defaut si les champs n'existent pas
    const limits = user.limits || {
      scansPerMonth: 30,
      aiChatsPerMonth: 5,
      exportsPerMonth: 1
    };

    const usage = user.usage || {
      scansUsed: 0,
      aiChatsUsed: 0,
      exportsUsed: 0,
      currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };

    const quotas = {
      plan: user.plan?.code || 'free',
      limits: limits,
      usage: {
        scans: {
          used: usage.scansUsed,
          limit: limits.scansPerMonth,
          remaining: limits.scansPerMonth - usage.scansUsed,
          percentage: Math.round((usage.scansUsed / limits.scansPerMonth) * 100)
        },
        aiChats: {
          used: usage.aiChatsUsed,
          limit: limits.aiChatsPerMonth,
          remaining: limits.aiChatsPerMonth - usage.aiChatsUsed,
          percentage: Math.round((usage.aiChatsUsed / limits.aiChatsPerMonth) * 100)
        },
        exports: {
          used: usage.exportsUsed,
          limit: limits.exportsPerMonth,
          remaining: limits.exportsPerMonth - usage.exportsUsed,
          percentage: Math.round((usage.exportsUsed / limits.exportsPerMonth) * 100)
        }
      },
      periodEnd: usage.currentPeriodEnd,
      daysRemaining: Math.ceil((new Date(usage.currentPeriodEnd) - now) / (1000 * 60 * 60 * 24))
    };

    res.json({ success: true, quotas });

  } catch (error) {
    logger.error('Error fetching quotas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la recuperation des quotas' 
    });
  }
});

/**
 * POST /api/users/v2/me/reset-password
 * Changer le mot de passe
 */
router.post('/v2/me/reset-password', 
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit faire au moins 6 caracteres')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id || req.userId;
      const user = await User.findById(userId);

      // Verifier l'ancien mot de passe si la methode existe
      if (user.comparePassword) {
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(401).json({ 
            success: false, 
            error: 'Mot de passe actuel incorrect' 
          });
        }
      }

      // Mettre Â  jour le mot de passe
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user ${user.email}`);
      res.json({
        success: true,
        message: 'Mot de passe modifie avec succes'
      });

    } catch (error) {
      logger.error('Error changing password:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors du changement de mot de passe' 
      });
    }
});


// ═══════════════════════════════════════════════════════════════════
// ⭐ ROUTES PROFIL V3.2 - PERSONNALISATION
// ═══════════════════════════════════════════════════════════════════

/**
 * PUT /api/user/profile
 * Mettre à jour profil personnalisation
 */
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    const { diet, allergens, goal, budget, labels, preferences, excludedIngredients } = req.body;

    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Initialiser profile si inexistant
    if (!user.profile) {
      user.profile = {};
    }

    // Mise à jour profil
    if (diet !== undefined) user.profile.diet = diet;
    if (allergens !== undefined) user.profile.allergens = allergens;
    if (goal !== undefined) user.profile.goal = goal;
    if (budget !== undefined) user.profile.budget = { ...user.profile.budget, ...budget };
    if (labels !== undefined) user.profile.labels = { ...user.profile.labels, ...labels };
    if (preferences !== undefined) user.profile.preferences = { ...user.profile.preferences, ...preferences };
    if (excludedIngredients !== undefined) user.profile.excludedIngredients = excludedIngredients;

    // Recalculer complétude
    user.calculateProfileCompleteness();

    await user.save();

    console.log('[User Profile] Updated for:', user.email);

    res.json({
      success: true,
      message: 'Profil mis à jour',
      profile: user.profile,
      completeness: user.profile.completeness
    });

  } catch (error) {
    console.error('[User Profile] Update failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/user/profile
 * Récupérer profil
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise'
      });
    }

    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Migration auto si nécessaire
    if (!user.profile?.migratedFromAiPreferences && user.aiPreferences) {
      console.log('[User Profile] Auto-migration triggered');
      user.migrateToV32Profile();
      await user.save();
    }

    res.json({
      success: true,
      profile: user.profile || {},
      completeness: user.profile?.completeness || 0,
      dietLabel: user.getDietLabel()
    });

  } catch (error) {
    console.error('[User Profile] Get failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
module.exports = router;