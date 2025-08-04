// frontend/src/services/authService.ts
import { apiClient, getErrorMessage, clearRequestQueue } from './apiClient';
import { API_CONFIG } from '../config/api.config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  name?: string;
  acceptTerms?: boolean;
  marketingConsent?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: any;
  token?: string;
  refreshToken?: string;
  accessToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  profile: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  tier: 'free' | 'premium' | 'family';
  emailVerified: boolean;
  quotas: {
    scansRemaining: number;
    aiChatsRemaining: number;
  };
}

class AuthService {
  
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('📝 Tentative d\'inscription:', { email: data.email });
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        name: data.name || `${data.firstName} ${data.lastName}`.trim(),
        acceptTerms: data.acceptTerms || true,
        marketingConsent: data.marketingConsent || false
      });
      
      // Normaliser la réponse
      const responseData = response.data;
      const token = responseData.token || responseData.accessToken;
      const refreshToken = responseData.refreshToken || token;
      
      // Sauvegarder les tokens
      if (token) {
        localStorage.setItem('ecolojia_token', token);
        localStorage.setItem('ecolojia_refresh_token', refreshToken);
      }
      
      console.log('✅ Inscription réussie');
      
      return {
        success: true,
        user: responseData.user,
        token: token,
        refreshToken: refreshToken,
        message: responseData.message || 'Inscription réussie'
      };
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('❌ Erreur inscription:', message);
      throw new Error(message);
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔐 Tentative de connexion:', { email: data.email });
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, {
        email: data.email.toLowerCase().trim(),
        password: data.password
      });
      
      // Normaliser la réponse
      const responseData = response.data;
      const token = responseData.token || responseData.accessToken;
      const refreshToken = responseData.refreshToken || token;
      
      // Sauvegarder les tokens
      if (token) {
        localStorage.setItem('ecolojia_token', token);
        localStorage.setItem('ecolojia_refresh_token', refreshToken);
      }
      
      console.log('✅ Connexion réussie');
      
      return {
        success: true,
        user: responseData.user,
        token: token,
        refreshToken: refreshToken,
        message: responseData.message || 'Connexion réussie'
      };
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('❌ Erreur connexion:', message);
      throw new Error(message);
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 Déconnexion...');
      
      // Essayer d'appeler l'API de déconnexion
      try {
        await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT);
      } catch (error) {
        // Ne pas bloquer la déconnexion si l'API échoue
        console.warn('⚠️ Logout API call failed:', error);
      }
      
      // Toujours nettoyer les données locales
      this.clearTokens();
      clearRequestQueue(); // Nettoyer la queue de requêtes
      
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      // Nettoyer quand même en cas d'erreur
      this.clearTokens();
      clearRequestQueue();
    }
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PROFILE);
      return response.data.user || response.data.data?.user || response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('❌ Erreur récupération profil:', message);
      throw new Error(message);
    }
  }

  /**
   * Alternative pour récupérer le profil (endpoint /me)
   */
  async getMe(): Promise<User> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ME);
      return response.data.data?.user || response.data.user || response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('❌ Erreur récupération profil (me):', message);
      throw new Error(message);
    }
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      console.log('🔄 Rafraîchissement du token...');
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REFRESH, { 
        refreshToken 
      });
      
      // Normaliser la réponse
      const responseData = response.data;
      const newToken = responseData.accessToken || responseData.token;
      const newRefreshToken = responseData.refreshToken || refreshToken;
      
      // Sauvegarder les nouveaux tokens
      if (newToken) {
        localStorage.setItem('ecolojia_token', newToken);
        localStorage.setItem('ecolojia_refresh_token', newRefreshToken);
      }
      
      console.log('✅ Token rafraîchi');
      
      return {
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        message: responseData.message
      };
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('❌ Erreur rafraîchissement token:', message);
      throw new Error(message);
    }
  }

  /**
   * Mettre à jour le profil
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.PROFILE, data);
      return response.data.user || response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('❌ Erreur mise à jour profil:', message);
      throw new Error(message);
    }
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.CHANGE_PASSWORD, {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('❌ Erreur changement mot de passe:', message);
      throw new Error(message);
    }
  }

  /**
   * Demander la réinitialisation du mot de passe
   */
  async requestPasswordReset(email: string): Promise<any> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.FORGOT_PASSWORD, { 
        email: email.toLowerCase().trim() 
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('❌ Erreur demande réinitialisation:', message);
      throw new Error(message);
    }
  }

  /**
   * Réinitialiser le mot de passe avec un token
   */
  async resetPassword(token: string, newPassword: string): Promise<any> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.RESET_PASSWORD, {
        token,
        password: newPassword
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('❌ Erreur réinitialisation mot de passe:', message);
      throw new Error(message);
    }
  }

  /**
   * Vérifier l'email avec un token
   */
  async verifyEmail(token: string): Promise<any> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.VERIFY_EMAIL, { 
        token 
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('❌ Erreur vérification email:', message);
      throw new Error(message);
    }
  }

  // ========== Méthodes utilitaires ==========

  /**
   * Récupérer le token d'accès
   */
  getToken(): string | null {
    return localStorage.getItem('ecolojia_token');
  }

  /**
   * Récupérer le refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('ecolojia_refresh_token');
  }

  /**
   * Nettoyer tous les tokens
   */
  clearTokens(): void {
    localStorage.removeItem('ecolojia_token');
    localStorage.removeItem('ecolojia_refresh_token');
    localStorage.removeItem('ecolojia_user'); // Au cas où
  }

  /**
   * Vérifier si le token est expiré
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Décoder le JWT
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false; // Pas d'expiration
      
      // Vérifier l'expiration (avec 5 minutes de marge)
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const margin = 5 * 60 * 1000; // 5 minutes
      
      return currentTime >= (expirationTime - margin);
    } catch (error) {
      console.error('❌ Erreur décodage token:', error);
      return true;
    }
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  /**
   * Récupérer les infos de l'utilisateur depuis le token
   */
  getUserFromToken(): Partial<User> | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return {
        _id: payload.userId || payload.sub,
        email: payload.email,
        tier: payload.tier || 'free'
      };
    } catch (error) {
      console.error('❌ Erreur décodage token:', error);
      return null;
    }
  }
}

// Créer et exporter une instance unique
export const authService = new AuthService();

// Export par défaut pour compatibilité
export default authService;