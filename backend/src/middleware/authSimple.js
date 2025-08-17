

// ========================================
// FICHIER 2/4: backend/src/middleware/authSimple.js
// Creez ce nouveau fichier
// ========================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ecolojia-secret-key-2024-super-secure';

const authSimple = (req, res, next) => {
  try {
    // Extraire le token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token non fourni'
      });
    }

    const token = authHeader.substring(7);

    // Verifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ajouter les infos   la requete
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userTier = decoded.tier;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expire'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
};

module.exports = authSimple;
