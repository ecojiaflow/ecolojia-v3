const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

// GET /api/auth/google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: process.env.FRONTEND_BASE_URL + '/login?error=google_auth_failed',
  }),
  (req, res) => {
    try {
      console.log('✅ [Google Callback] User authentifié:', req.user._id);

      const userId = req.user._id.toString();
      const email = req.user.email;
      const tier = req.user.tier || 'free';

      // Générer JWT
      const token = jwt.sign(
        { userId, email, tier },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // SOLUTION PRO: Stocker dans cookie httpOnly
      res.cookie('ecolojia_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
        path: '/'
      });

      // User info (non sensible) peut être en cookie accessible
      const userInfo = {
        id: userId,
        email: email,
        name: req.user.name,
        avatar: req.user.avatar,
        plan: req.user.plan?.code || 'free',
        tier: tier
      };

      res.cookie('ecolojia_user', JSON.stringify(userInfo), {
        httpOnly: false, // Accessible par JS
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      console.log('✅ [Google Callback] Tokens stockés en cookies');
      
      // Redirection directe vers home (pas de page callback)
      res.redirect(process.env.FRONTEND_BASE_URL + '/');
    } catch (error) {
      console.error('❌ [Google Callback] Erreur:', error);
      res.redirect(process.env.FRONTEND_BASE_URL + '/login?error=token_generation_failed');
    }
  }
);

module.exports = router;