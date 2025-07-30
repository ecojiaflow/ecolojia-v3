

// ========================================
// 3. INTÉGRATION AUTH SERVICE AMÉLIORÉE
// PATH: backend/src/services/auth/authService.js
// ========================================
const User = require('../../models/User');
const TokenService = require('./tokenService');
const bcrypt = require('bcryptjs');

class AuthService {
  constructor(redisClient) {
    this.tokenService = new TokenService(redisClient);
  }

  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} data - Données d'inscription
   * @returns {Object} User + tokens
   */
  async register({ email, password, name, referralCode }) {
    try {
      // Vérifier si l'utilisateur existe
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 12);

      // Créer l'utilisateur
      const user = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        tier: 'free',
        quotas: {
          scansRemaining: 30,
          scansResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          aiChatsRemaining: 5,
          aiChatsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      // Gérer le parrainage
      if (referralCode) {
        const referrer = await User.findOne({ 'metadata.referralCode': referralCode });
        if (referrer) {
          user.metadata.referredBy = referrer._id;
          // TODO: Ajouter bonus de parrainage
        }
      }

      await user.save();

      // Générer les tokens
      const accessToken = this.tokenService.generateAccessToken(user);
      const refreshToken = this.tokenService.generateRefreshToken(user);

      // Sauvegarder le refresh token
      await this.tokenService.saveRefreshToken(user._id.toString(), refreshToken);

      console.log(`[AuthService] New user registered: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken
      };

    } catch (error) {
      console.error('[AuthService] Registration error:', error);
      throw error;
    }
  }

  /**
   * Connexion utilisateur
   * @param {string} email - Email
   * @param {string} password - Mot de passe
   * @returns {Object} User + tokens
   */
  async login(email, password) {
    try {
      // Trouver l'utilisateur
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Mettre à jour dernière connexion
      user.lastLoginAt = new Date();
      await user.save();

      // Générer les tokens
      const accessToken = this.tokenService.generateAccessToken(user);
      const refreshToken = this.tokenService.generateRefreshToken(user);

      // Sauvegarder le refresh token
      await this.tokenService.saveRefreshToken(user._id.toString(), refreshToken);

      console.log(`[AuthService] User logged in: ${user.email}`);

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken
      };

    } catch (error) {
      console.error('[AuthService] Login error:', error);
      throw error;
    }
  }

  /**
   * Rafraîchir les tokens
   * @param {string} refreshToken - Refresh token
   * @returns {Object} Nouveaux tokens
   */
  async refresh(refreshToken) {
    try {
      // Vérifier le refresh token
      const decoded = this.tokenService.verifyRefreshToken(refreshToken);
      
      // Vérifier en base
      const isValid = await this.tokenService.verifyRefreshTokenInDB(decoded.userId, refreshToken);
      if (!isValid) {
        throw new Error('Invalid refresh token');
      }

      // Récupérer l'utilisateur
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Générer nouveaux tokens
      const newAccessToken = this.tokenService.generateAccessToken(user);
      const newRefreshToken = this.tokenService.generateRefreshToken(user);

      // Remplacer le refresh token
      await this.tokenService.revokeRefreshToken(decoded.userId, refreshToken);
      await this.tokenService.saveRefreshToken(user._id.toString(), newRefreshToken);

      return {
        user: this.sanitizeUser(user),
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };

    } catch (error) {
      console.error('[AuthService] Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Déconnexion
   * @param {string} userId - ID utilisateur
   * @param {string} refreshToken - Refresh token à révoquer
   */
  async logout(userId, refreshToken) {
    try {
      await this.tokenService.revokeRefreshToken(userId, refreshToken);
      console.log(`[AuthService] User logged out: ${userId}`);
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
      throw error;
    }
  }

  /**
   * Nettoie les données utilisateur
   * @param {Object} user - Utilisateur MongoDB
   * @returns {Object} Utilisateur sans données sensibles
   */
  sanitizeUser(user) {
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;
    return userObj;
  }
}
module.exports = AuthService;