// PATH: backend/src/auth/services/AuthService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Import du modèle MongoDB existant
import User, { IUser } from '../../models/User';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SessionInfo {
  ipAddress: string;
  userAgent: string;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  token?: string;
  message: string;
}

// Interface pour le payload JWT
interface JWTPayload {
  userId: string;
  email: string;
  tier: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'ecolojia-jwt-secret-2024';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * Inscription utilisateur avec validation email
   */
  async register(registerData: RegisterData, sessionInfo: SessionInfo): Promise<AuthResult> {
    try {
      console.log('📝 Tentative inscription:', registerData.email);

      // Vérifier si email existe déjà
      const existingUser = await User.findOne({ email: registerData.email.toLowerCase() });

      if (existingUser) {
        console.log('❌ Email déjà utilisé:', registerData.email);
        return {
          success: false,
          message: 'Un compte existe déjà avec cet email'
        };
      }

      // Hash du mot de passe
      const passwordHash = await bcrypt.hash(registerData.password, 12);

      // Créer utilisateur avec MongoDB
      const user = new User({
        email: registerData.email.toLowerCase(),
        password: passwordHash,
        name: registerData.name,
        tier: 'free',
        isEmailVerified: false,
        
        // Quotas par défaut pour utilisateur gratuit
        quotas: {
          analyses: 30,
          aiQuestions: 0,
          exports: 0,
          apiCalls: 0
        },
        
        // Usage initial
        usage: {
          analyses: 0,
          aiQuestions: 0,
          exports: 0,
          apiCalls: 0,
          lastResetDate: new Date()
        }
      });

      // Générer token de vérification email
      const emailToken = this.generateEmailValidationToken();
      user.emailVerificationToken = emailToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      // Sauvegarder l'utilisateur
      await user.save();

      // Générer token JWT pour session - Utiliser id au lieu de _id
      const userId = user.id || user._id?.toString() || '';
      const token = this.generateJWT(userId, user.email, user.tier);

      console.log('✅ Utilisateur créé avec succès:', user.email);

      // TODO: Envoyer email de vérification
      // await emailService.sendVerificationEmail(user.email, emailToken);

      return {
        success: true,
        user: this.sanitizeUser(user),
        token,
        message: 'Inscription réussie. Vérifiez votre email pour activer votre compte.'
      };

    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      if (error.code === 11000) {
        return {
          success: false,
          message: 'Un compte existe déjà avec cet email'
        };
      }
      
      return {
        success: false,
        message: 'Erreur lors de l\'inscription'
      };
    }
  }

  /**
   * Connexion utilisateur
   */
  async login(loginData: LoginData, sessionInfo: SessionInfo): Promise<AuthResult> {
    try {
      console.log('🔐 Tentative connexion:', loginData.email);

      // Rechercher utilisateur par email
      const user = await User.findOne({ email: loginData.email.toLowerCase() });

      if (!user) {
        console.log('❌ Utilisateur non trouvé:', loginData.email);
        return {
          success: false,
          message: 'Email ou mot de passe incorrect'
        };
      }

      // Vérifier mot de passe
      const passwordMatch = await bcrypt.compare(loginData.password, user.password);
      if (!passwordMatch) {
        console.log('❌ Mot de passe incorrect pour:', loginData.email);
        return {
          success: false,
          message: 'Email ou mot de passe incorrect'
        };
      }

      // Générer token JWT avec le tier de l'utilisateur - Utiliser id au lieu de _id
      const userId = user.id || user._id?.toString() || '';
      const token = this.generateJWT(userId, user.email, user.tier);

      // Mettre à jour dernière connexion
      user.updatedAt = new Date();
      await user.save();

      console.log('✅ Connexion réussie:', user.email);

      return {
        success: true,
        user: this.sanitizeUser(user),
        token,
        message: 'Connexion réussie'
      };

    } catch (error: any) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: 'Erreur lors de la connexion'
      };
    }
  }

  /**
   * Déconnexion utilisateur
   */
  async logout(token: string): Promise<AuthResult> {
    try {
      // Avec JWT, pas besoin de gérer côté serveur
      // Le client supprime simplement le token
      
      console.log('✅ Déconnexion effectuée');
      
      return {
        success: true,
        message: 'Déconnexion réussie'
      };

    } catch (error: any) {
      console.error('❌ Logout error:', error);
      return {
        success: false,
        message: 'Erreur lors de la déconnexion'
      };
    }
  }

  /**
   * Récupérer utilisateur par token JWT
   */
  async getUserFromToken(token: string): Promise<IUser | null> {
    try {
      // Vérifier token JWT
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      
      // Récupérer utilisateur depuis MongoDB
      const user = await User.findById(decoded.userId);

      if (!user) {
        console.log('❌ Utilisateur non trouvé pour ID:', decoded.userId);
        return null;
      }

      return user;

    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        console.log('❌ Token expiré');
      } else if (error.name === 'JsonWebTokenError') {
        console.log('❌ Token invalide');
      } else {
        console.error('❌ Token verification error:', error);
      }
      return null;
    }
  }

  /**
   * Vérifier email avec token
   */
  async verifyEmail(token: string): Promise<AuthResult> {
    try {
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return {
          success: false,
          message: 'Token invalide ou expiré'
        };
      }

      // Marquer comme vérifié
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      console.log('✅ Email vérifié pour:', user.email);

      return {
        success: true,
        message: 'Email vérifié avec succès'
      };

    } catch (error) {
      console.error('❌ Email verification error:', error);
      return {
        success: false,
        message: 'Erreur lors de la vérification'
      };
    }
  }

  /**
   * Réinitialisation mot de passe - Demande
   */
  async requestPasswordReset(email: string): Promise<AuthResult> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Ne pas révéler si l'email existe
        return {
          success: true,
          message: 'Si cet email existe, vous recevrez un lien de réinitialisation'
        };
      }

      // Générer token de reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
      await user.save();

      // TODO: Envoyer email
      // await emailService.sendPasswordResetEmail(user.email, resetToken);

      return {
        success: true,
        message: 'Si cet email existe, vous recevrez un lien de réinitialisation'
      };

    } catch (error) {
      console.error('❌ Password reset request error:', error);
      return {
        success: false,
        message: 'Erreur lors de la demande'
      };
    }
  }

  /**
   * Réinitialisation mot de passe - Confirmation
   */
  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return {
          success: false,
          message: 'Token invalide ou expiré'
        };
      }

      // Hash nouveau mot de passe
      user.password = await bcrypt.hash(newPassword, 12);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      };

    } catch (error) {
      console.error('❌ Password reset error:', error);
      return {
        success: false,
        message: 'Erreur lors de la réinitialisation'
      };
    }
  }

  /**
   * Obtenir le profil utilisateur
   */
  async getProfile(userId: string): Promise<IUser | null> {
    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      console.error('❌ Get profile error:', error);
      return null;
    }
  }

  // === MÉTHODES UTILITAIRES ===

  

  private generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateEmailValidationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private sanitizeUser(user: IUser) {
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.emailVerificationToken;
    delete userObject.resetPasswordToken;
    return userObject;
  }
}

export const authService = new AuthService();



