// PATH: backend/src/routes/v2/users.js
import express from 'express';
import { authOptional } from '../../middleware/auth.js';
import User from '../../models/User.js';
import { validateAIPreferences } from '../../validators/userValidators.js';
import logger from '../../utils/logger.js';

const router = express.Router();

/**
 * GET /api/users/v2/me
 * Recupere le profil complet avec quotas et preferences IA
 */
router.get('/me', authOptional, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        statusCode: 401
      });
    }

    const user = await User.findById(req.user.id).select('-password -__v');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404
      });
    }

    // Reset usage if new month
    user.resetMonthlyUsage();
    await user.save();

    logger.info(`[users] profile fetched | userId: ${user._id}`);

    res.json({
      success: true,
      data: {
        profile: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        plan: user.plan,
        limits: user.limits,
        usage: {
          scans: `${user.usage.scans}/${user.limits.scansPerMonth}`,
          aiChats: `${user.usage.aiChats}/${user.limits.aiChatsPerMonth}`,
          exports: `${user.usage.exports}/${user.limits.exportPerMonth}`,
          favorites: `${user.favorites?.length || 0}/${user.limits.favoritesMax}`,
          lastReset: user.usage.lastReset
        },
        aiPreferences: user.aiPreferences || {}
      }
    });
  } catch (error) {
    logger.error(`[users] profile fetch error | userId: ${req.user?.id} | error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500
    });
  }
});

/**
 * PUT /api/users/v2/me
 * Met   jour le profil et les preferences IA
 */
router.put('/me', authOptional, validateAIPreferences, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        statusCode: 401
      });
    }

    const allowedFields = ['name', 'avatar', 'aiPreferences'];
    const updates = {};
    
    // Filtrer uniquement les champs autorises
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'aiPreferences') {
          // Merge avec les preferences existantes
          updates['aiPreferences'] = {
            ...req.user.aiPreferences,
            ...req.body.aiPreferences
          };
        } else {
          updates[key] = req.body[key];
        }
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -__v');

    logger.info(`[users] profile updated | userId: ${user._id} | fields: ${Object.keys(updates).join(',')}`);

    res.json({
      success: true,
      data: {
        profile: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          emailVerified: user.emailVerified
        },
        aiPreferences: user.aiPreferences
      }
    });
  } catch (error) {
    logger.error(`[users] profile update error | userId: ${req.user?.id} | error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500
    });
  }
});

/**
 * DELETE /api/users/v2/me/ai-preferences/:key
 * Supprime une preference IA specifique
 */
router.delete('/me/ai-preferences/:key', authOptional, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        statusCode: 401
      });
    }

    const { key } = req.params;
    const validKeys = ['foodRestrictions', 'allergens', 'cosmeticPreferences.avoidIngredients'];

    if (!validKeys.includes(key)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid preference key',
        statusCode: 400
      });
    }

    const update = {};
    if (key.includes('.')) {
      // Nested field
      update[`aiPreferences.${key}`] = [];
    } else {
      update[`aiPreferences.${key}`] = [];
    }

    await User.findByIdAndUpdate(req.user.id, { $set: update });

    logger.info(`[users] ai preference cleared | userId: ${req.user.id} | key: ${key}`);

    res.json({
      success: true,
      message: `Preference ${key} cleared successfully`
    });
  } catch (error) {
    logger.error(`[users] preference delete error | userId: ${req.user?.id} | error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500
    });
  }
});

export default router;