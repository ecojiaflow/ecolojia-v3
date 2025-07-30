// PATH: backend/src/services/auth/tokenService.js
// ========================================
// TOKEN SERVICE - VERSION CORRIGÉE
// ========================================
const jwt = require('jsonwebtoken');

class TokenService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'ecolojia-secret-key-2024-super-secure';
    this.REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || this.ACCESS_SECRET + '-refresh';
    this.ACCESS_EXPIRY = '10m';
    this.REFRESH_EXPIRY = '24h';
  }

  /**
   * Génère un token d'accès JWT
   * @param {Object} user - L'utilisateur MongoDB
   * @returns {string} Token JWT
   */
  generateAccessToken(user) {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      tier: user.tier,
      type: 'access'
    };

    return jwt.sign(payload, this.ACCESS_SECRET, {
      expiresIn: this.ACCESS_EXPIRY,
      issuer: 'ecolojia-api',
      audience: 'ecolojia-app'
    });
  }

  /**
   * Génère un refresh token
   * @param {Object} user - L'utilisateur MongoDB
   * @returns {string} Refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      userId: user._id.toString(),
      type: 'refresh',
      tokenId: this.generateTokenId()
    };

    return jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_EXPIRY,
      issuer: 'ecolojia-api'
    });
  }

  /**
   * Sauvegarde le refresh token dans Redis
   * @param {string} userId - ID de l'utilisateur
   * @param {string} token - Refresh token
   */
  async saveRefreshToken(userId, token) {
    if (!this.redis || !this.redis.isReady) {
      console.warn('[TokenService] Redis not available, skipping token save');
      return;
    }

    const key = `refresh_token:${userId}`;
    const ttl = 24 * 60 * 60; // 24 heures en secondes
    
    try {
      await this.redis.setex(key, ttl, token);
      console.log(`[TokenService] Refresh token saved for user ${userId}`);
    } catch (error) {
      console.error('[TokenService] Error saving refresh token:', error);
    }
  }

  /**
   * Vérifie si le refresh token existe dans Redis
   * @param {string} userId - ID de l'utilisateur
   * @param {string} token - Token à vérifier
   * @returns {boolean} Token valide ou non
   */
  async verifyRefreshTokenInDB(userId, token) {
    if (!this.redis || !this.redis.isReady) {
      console.warn('[TokenService] Redis not available, allowing token');
      return true; // En dev, on autorise si pas de Redis
    }

    const key = `refresh_token:${userId}`;
    try {
      const storedToken = await this.redis.get(key);
      return storedToken === token;
    } catch (error) {
      console.error('[TokenService] Error verifying refresh token:', error);
      return false;
    }
  }

  /**
   * Révoque un refresh token
   * @param {string} userId - ID de l'utilisateur
   * @param {string} token - Token à révoquer
   */
  async revokeRefreshToken(userId, token) {
    if (!this.redis || !this.redis.isReady) {
      console.warn('[TokenService] Redis not available, cannot revoke token');
      return;
    }

    const key = `refresh_token:${userId}`;
    try {
      await this.redis.del(key);
      console.log(`[TokenService] Refresh token revoked for user ${userId}`);
    } catch (error) {
      console.error('[TokenService] Error revoking refresh token:', error);
    }
  }

  /**
   * Vérifie et décode un access token
   * @param {string} token - Token à vérifier
   * @returns {Object} Payload décodé
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.ACCESS_SECRET, {
        issuer: 'ecolojia-api',
        audience: 'ecolojia-app'
      });

      return {
        userId: decoded.userId,
        email: decoded.email,
        tier: decoded.tier
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      }
      throw new Error('Invalid access token');
    }
  }

  /**
   * Vérifie et décode un refresh token
   * @param {string} token - Token à vérifier
   * @returns {Object} Payload décodé
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.REFRESH_SECRET, {
        issuer: 'ecolojia-api'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Génère un ID unique pour le token
   * @returns {string} ID unique
   */
  generateTokenId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ⚠️ LIGNE CRUCIALE - EXPORT DE LA CLASSE
module.exports = TokenService;