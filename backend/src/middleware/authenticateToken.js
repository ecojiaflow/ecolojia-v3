// backend/src/middleware/authenticateToken.js
// Middleware d'authentification unifié

const jwt = require('jsonwebtoken');

// Fonction principale d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token d\'authentification requis' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ 
        error: 'Token invalide ou expiré' 
      });
    }

    // Normaliser les données utilisateur
    req.user = {
      id: user.id || user._id || user.userId,
      userId: user.userId || user.id || user._id,
      email: user.email,
      subscription: user.subscription || { tier: 'free' }
    };

    next();
  });
};

// Alias pour compatibilité avec différents noms
const authenticateUser = authenticateToken;

// Middleware de vérification de quota
const checkQuota = (type) => {
  return async (req, res, next) => {
    try {
      // Pour l'instant, on passe toujours (à implémenter selon vos besoins)
      console.log(`Checking quota for ${type} - User: ${req.user?.userId}`);
      next();
    } catch (error) {
      console.error('Quota check error:', error);
      next();
    }
  };
};

// Middleware spécial pour après upload (vision)
const checkQuotaAfterUpload = (type) => {
  return async (req, res, next) => {
    try {
      // Vérifier le quota après l'upload
      const user = req.user;
      
      // Simuler la vérification de quota
      req.quotaInfo = {
        used: 5,
        limit: user.subscription?.tier === 'premium' ? 'unlimited' : 30,
        remaining: user.subscription?.tier === 'premium' ? 'unlimited' : 25
      };
      
      console.log(`Quota check after upload - Type: ${type}, User: ${user.userId}`);
      next();
    } catch (error) {
      console.error('Quota after upload error:', error);
      next();
    }
  };
};

// Export unifié pour tous les middlewares d'auth
module.exports = {
  authenticateToken,
  authenticateUser,
  checkQuota,
  checkQuotaAfterUpload
};
