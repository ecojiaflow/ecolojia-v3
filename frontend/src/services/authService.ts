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
      console.log('ðŸ“ Tentative d\'inscription:', { email: data.email });
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        name: data.name || `${data.firstName} ${data.lastName}`.trim(),
        acceptTerms: data.acceptTerms || true,
        marketingConsent: data.marketingConsent || false
      });
      
      // Normaliser la rÃ©ponse
      const responseData = response.data;
      const token = responseData.token || responseData.accessToken;
      const refreshToken = responseData.refreshToken || token;
      
      // Sauvegarder les tokens
      if (token) {
        localStorage.setItem('ecolojia_token', token);
        localStorage.setItem('ecolojia_refresh_token', refreshToken);
      }
      
      console.log('âœ… Inscription rÃ©ussie');
      
      return {
        success: true,
        user: responseData.user,
        token: token,
        refreshToken: refreshToken,
        message: responseData.message || 'Inscription rÃ©ussie'
      };
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('âŒ Erreur inscription:', message);
      throw new Error(message);
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('ðŸ” Tentative de connexion:', { email: data.email });
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, {
        email: data.email.toLowerCase().trim(),
        password: data.password
      });
      
      // Normaliser la rÃ©ponse
      const responseData = response.data;
      const token = responseData.token || responseData.accessToken;
      const refreshToken = responseData.refreshToken || token;
      
      // Sauvegarder les tokens
      if (token) {
        localStorage.setItem('ecolojia_token', token);
        localStorage.setItem('ecolojia_refresh_token', refreshToken);
      }
      
      console.log('âœ… Connexion rÃ©ussie');
      
      return {
        success: true,
        user: responseData.user,
        token: token,
        refreshToken: refreshToken,
        message: responseData.message || 'Connexion rÃ©ussie'
      };
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('âŒ Erreur connexion:', message);
      throw new Error(message);
    }
  }

  /**
   * DÃ©connexion
   */
  async logout(): Promise<void> {
    try {
      console.log('ðŸšª DÃ©connexion...');
      
      // Essayer d'appeler l'API de dÃ©connexion
      try {
        await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT);
      } catch (error) {
        // Ne pas bloquer la dÃ©connexion si l'API Ã©choue
        console.warn('âš ï¸ Logout API call failed:', error);
      }
      
      // Toujours nettoyer les donnÃ©es locales
      this.clearTokens();
      clearRequestQueue(); // Nettoyer la queue de requÃªtes
      
      console.log('âœ… DÃ©connexion rÃ©ussie');
    } catch (error) {
      console.error('âŒ Erreur dÃ©connexion:', error);
      // Nettoyer quand mÃªme en cas d'erreur
      this.clearTokens();
      clearRequestQueue();
    }
  }

  /**
   * RÃ©cupÃ©rer le profil de l'utilisateur connectÃ©
   */
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PROFILE);
      return response.data.user || response.data.data?.user || response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('âŒ Erreur rÃ©cupÃ©ration profil:', message);
      throw new Error(message);
    }
  }

  /**
   * Alternative pour rÃ©cupÃ©rer le profil (endpoint /me)
   */
  async getMe(): Promise<User> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ME);
      return response.data.data?.user || response.data.user || response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('âŒ Erreur rÃ©cupÃ©ration profil (me):', message);
      throw new Error(message);
    }
  }

  /**
   * RafraÃ®chir le token d'accÃ¨s
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      console.log('ðŸ”„ RafraÃ®chissement du token...');
      
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REFRESH, { 
        refreshToken 
      });
      
      // Normaliser la rÃ©ponse
      const responseData = response.data;
      const newToken = responseData.accessToken || responseData.token;
      const newRefreshToken = responseData.refreshToken || refreshToken;
      
      // Sauvegarder les nouveaux tokens
      if (newToken) {
        localStorage.setItem('ecolojia_token', newToken);
        localStorage.setItem('ecolojia_refresh_token', newRefreshToken);
      }
      
      console.log('âœ… Token rafraÃ®chi');
      
      return {
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        message: responseData.message
      };
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('âŒ Erreur rafraÃ®chissement token:', message);
      throw new Error(message);
    }
  }

  /**
   * Mettre Ã  jour le profil
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put(API_CONFIG.ENDPOINTS.PROFILE, data);
      return response.data.user || response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('âŒ Erreur mise Ã  jour profil:', message);
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
      console.error('âŒ Erreur changement mot de passe:', message);
      throw new Error(message);
    }
  }

  /**
   * Demander la rÃ©initialisation du mot de passe
   */
  async requestPasswordReset(email: string): Promise<any> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.FORGOT_PASSWORD, { 
        email: email.toLowerCase().trim() 
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('âŒ Erreur demande rÃ©initialisation:', message);
      throw new Error(message);
    }
  }

  /**
   * RÃ©initialiser le mot de passe avec un token
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
      console.error('âŒ Erreur rÃ©initialisation mot de passe:', message);
      throw new Error(message);
    }
  }

  /**
   * VÃ©rifier l'email avec un token
   */
  async verifyEmail(token: string): Promise<any> {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.VERIFY_EMAIL, { 
        token 
      });
      return response.data;
    } catch (error: any) {
      const message = getErrorMessage(error);
      console.error('âŒ Erreur vÃ©rification email:', message);
      throw new Error(message);
    }
  }

  // ========== MÃ©thodes utilitaires ==========

  /**
   * RÃ©cupÃ©rer le token d'accÃ¨s
   */
  getToken(): string | null {
    return localStorage.getItem('ecolojia_token');
  }

  /**
   * RÃ©cupÃ©rer le refresh token
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
    localStorage.removeItem('ecolojia_user'); // Au cas oÃ¹
  }

  /**
   * VÃ©rifier si le token est expirÃ©
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // DÃ©coder le JWT
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false; // Pas d'expiration
      
      // VÃ©rifier l'expiration (avec 5 minutes de marge)
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const margin = 5 * 60 * 1000; // 5 minutes
      
      return currentTime >= (expirationTime - margin);
    } catch (error) {
      console.error('âŒ Erreur dÃ©codage token:', error);
      return true;
    }
  }

  /**
   * VÃ©rifier si l'utilisateur est connectÃ©
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  /**
   * RÃ©cupÃ©rer les infos de l'utilisateur depuis le token
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
      console.error('âŒ Erreur dÃ©codage token:', error);
      return null;
    }
  }
}

// CrÃ©er et exporter une instance unique
export const authService = new AuthService();

// Export par dÃ©faut pour compatibilitÃ©
export default authService;