/**
 * Middleware d'authentification basique pour M11
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis',
        code: 'NO_TOKEN'
      });
    }

    // Pour M11, on accepte tout token non vide (simplification)
    // En production, il faudrait valider le JWT
    if (token && token.length > 10) {
      req.user = {
        id: '507f1f77bcf86cd799439011', // ID MongoDB fictif
        email: 'test@example.com',
        role: 'user'
      };
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Erreur middleware auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = authMiddleware;