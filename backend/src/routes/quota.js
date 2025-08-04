// backend/src/routes/quota.js
// Version autonome sans dépendances externes

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Modèle User
let User;
try {
  User = require('../models/User');
} catch (error) {
  console.warn('User model not found');
}

// Middleware d'authentification local
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ecolojia-secret-key-2024-super-secure');

    req.userId = decoded.userId;
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré'
    });
  }
};

// GET /api/quota/status - Status des quotas utilisateur
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    if (User && mongoose.connection.readyState === 1) {
      const user = await User.findById(req.userId).select('quotas tier subscription');
      
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Calculer les limites selon le tier
      const limits = {
        free: { scans: 30, aiQuestions: 5 },
        premium: { scans: -1, aiQuestions: 500 },
        family: { scans: -1, aiQuestions: 500 }
      };

      const userLimits = limits[user.tier || 'free'];

      res.json({
        quotas: {
          scansUsed: user.quotas?.scansUsed || 0,
          scansLimit: userLimits.scans,
          scansRemaining: userLimits.scans === -1 ? -1 : (userLimits.scans - (user.quotas?.scansUsed || 0)),
          aiQuestionsUsed: user.quotas?.aiChatsUsed || 0,
          aiQuestionsLimit: userLimits.aiQuestions,
          aiQuestionsRemaining: userLimits.aiQuestions - (user.quotas?.aiChatsUsed || 0)
        },
        scan: {
          used: user.quotas?.scansUsed || 0,
          limit: userLimits.scans,
          unlimited: userLimits.scans === -1
        },
        aiQuestion: {
          used: user.quotas?.aiChatsUsed || 0,
          limit: userLimits.aiQuestions,
          unlimited: false
        }
      });
    } else {
      // Mode test sans DB
      res.json({
        quotas: {
          scansUsed: 5,
          scansLimit: 30,
          scansRemaining: 25,
          aiQuestionsUsed: 2,
          aiQuestionsLimit: 5,
          aiQuestionsRemaining: 3
        },
        scan: {
          used: 5,
          limit: 30,
          unlimited: false
        },
        aiQuestion: {
          used: 2,
          limit: 5,
          unlimited: false
        }
      });
    }
  } catch (error) {
    console.error('Error fetching quotas:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des quotas' });
  }
});

// POST /api/quota/increment - Incrémenter l'usage
router.post('/increment', authMiddleware, async (req, res) => {
  try {
    const { type } = req.body; // 'scan' ou 'aiQuestion'
    const mongoose = require('mongoose');
    
    if (!type || !['scan', 'aiQuestion'].includes(type)) {
      return res.status(400).json({ message: 'Type invalide' });
    }
    
    if (User && mongoose.connection.readyState === 1) {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      
      // Initialiser les quotas s'ils n'existent pas
      if (!user.quotas) {
        user.quotas = {
          scansUsed: 0,
          aiChatsUsed: 0,
          scansResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          aiChatsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };
      }
      
      // Incrémenter selon le type
      if (type === 'scan') {
        user.quotas.scansUsed = (user.quotas.scansUsed || 0) + 1;
      } else {
        user.quotas.aiChatsUsed = (user.quotas.aiChatsUsed || 0) + 1;
      }
      
      await user.save();
      
      res.json({
        success: true,
        quotas: {
          scansUsed: user.quotas.scansUsed,
          aiChatsUsed: user.quotas.aiChatsUsed
        }
      });
    } else {
      // Mode test
      res.json({ success: true, message: 'Quota incrémenté (mode test)' });
    }
  } catch (error) {
    console.error('Error incrementing quota:', error);
    res.status(500).json({ message: 'Erreur lors de l\'incrémentation du quota' });
  }
});

// Middleware de vérification des quotas
const checkQuotaMiddleware = (type) => {
  return async (req, res, next) => {
    try {
      const mongoose = require('mongoose');
      
      if (!User || mongoose.connection.readyState !== 1) {
        // Mode test, on laisse passer
        return next();
      }
      
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      
      const limits = {
        free: { scans: 30, aiQuestions: 5 },
        premium: { scans: -1, aiQuestions: 500 },
        family: { scans: -1, aiQuestions: 500 }
      };
      
      const userLimits = limits[user.tier || 'free'];
      
      if (type === 'scan') {
        const used = user.quotas?.scansUsed || 0;
        const limit = userLimits.scans;
        
        if (limit !== -1 && used >= limit) {
          return res.status(429).json({
            success: false,
            message: 'Quota de scans dépassé',
            quotaExceeded: true,
            used,
            limit
          });
        }
      } else if (type === 'aiQuestion') {
        const used = user.quotas?.aiChatsUsed || 0;
        const limit = userLimits.aiQuestions;
        
        if (used >= limit) {
          return res.status(429).json({
            success: false,
            message: 'Quota de questions IA dépassé',
            quotaExceeded: true,
            used,
            limit
          });
        }
      }
      
      next();
    } catch (error) {
      console.error('Error checking quota:', error);
      // En cas d'erreur, on laisse passer pour ne pas bloquer
      next();
    }
  };
};

// Routes protégées par quotas (exemples)
router.post('/scan', authMiddleware, checkQuotaMiddleware('scan'), async (req, res) => {
  res.json({ success: true, data: 'Scan completed' });
});

router.post('/ai-question', authMiddleware, checkQuotaMiddleware('aiQuestion'), async (req, res) => {
  res.json({ success: true, data: 'AI question answered' });
});

// Export du middleware pour usage externe
router.checkQuotaMiddleware = checkQuotaMiddleware;

module.exports = router;