// backend/src/routes/auth.js
// FICHIER COMPLET CORRIGÉ

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'ecolojia-secret-key-2024-super-secure';

// Middleware d'authentification simple intégré
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token non fourni'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userTier = decoded.tier;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.name === 'TokenExpiredError' ? 'Token expiré' : 'Token invalide'
    });
  }
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Register endpoint appelé:', req.body);
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Cet email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: `${firstName} ${lastName}`,
      profile: {
        firstName,
        lastName
      },
      tier: 'free',
      status: 'active',
      quotas: {
        scansRemaining: 30,
        scansResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        aiChatsRemaining: 5,
        aiChatsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    await user.save();
    console.log('✅ Utilisateur créé:', user.email);

    // Générer le token
    const token = jwt.sign(
      { userId: user._id, email: user.email, tier: user.tier },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retourner la réponse
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      user: userResponse,
      token,
      accessToken: token,
      refreshToken: token
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'inscription'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('🔑 Login endpoint appelé:', req.body.email);
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe requis'
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le statut
    if (user.status === 'suspended' || user.status === 'deleted') {
      return res.status(403).json({
        success: false,
        error: 'Compte inactif'
      });
    }

    // Mettre à jour la dernière connexion
    user.lastLoginAt = new Date();
    await user.save();

    console.log('✅ Connexion réussie:', user.email);

    // Générer le token
    const token = jwt.sign(
      { userId: user._id, email: user.email, tier: user.tier },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retourner la réponse
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
      token,
      accessToken: token,
      refreshToken: token
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion'
    });
  }
});

// GET /api/auth/profile (protégé)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    console.log('👤 Profile endpoint appelé pour:', req.userId);
    
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 Refresh endpoint appelé');
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Token requis'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Récupérer l'utilisateur
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Générer un nouveau token
    const newToken = jwt.sign(
      { userId: user._id, email: user.email, tier: user.tier },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user,
      accessToken: newToken,
      refreshToken: newToken
    });

  } catch (error) {
    console.error('❌ Refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré'
    });
  }
});

// GET /api/auth/test
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint appelé');
  res.json({
    success: true,
    message: 'Auth routes fonctionnent parfaitement !',
    timestamp: new Date(),
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/profile (protégé)',
      'POST /api/auth/refresh',
      'GET /api/auth/test'
    ]
  });
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  console.log('🚪 Logout endpoint appelé pour:', req.userEmail);
  // Pour un JWT, le logout se fait côté client en supprimant le token
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// Export du router
module.exports = router;