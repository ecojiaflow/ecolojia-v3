// frontend/src/auth/services/authService.ts
import { apiClient } from '../../services/apiClient';
import { LoginRequest, RegisterRequest, User } from '../types/AuthTypes';

interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'ecolojia_token';
  private readonly REFRESH_TOKEN_KEY = 'ecolojia_refresh_token';
  private readonly AUTH_PREFIX = '/api/auth';

  // Connexion
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(`${this.AUTH_PREFIX}/login`, credentials);
      
      if (response.data.success && response.data.token) {
        this.setToken(response.data.token);
        return response.data;
      }
      
      throw new Error(response.data.message || 'Erreur de connexion');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Erreur de connexion. Vérifiez vos identifiants.');
    }
  }

  // Inscription
  async register(userData: RegisterRequest): Promise<void> {
    try {
      const response = await apiClient.post(`${this.AUTH_PREFIX}/register`, userData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de l\'inscription');
      }
      
      // Ne pas connecter automatiquement après inscription
      // L'utilisateur doit vérifier son email d'abord
    } catch (error: any) {
      console.error('❌ Register error:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      if (error.response?.data?.errors) {
        const firstError = error.response.data.errors[0];
        throw new Error(firstError.msg || firstError.message || 'Erreur de validation');
      }
      
      throw new Error('Erreur lors de l\'inscription');
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      // Appel API pour invalider la session côté serveur
      await apiClient.post(`${this.AUTH_PREFIX}/logout`);
    } catch (error) {
      console.warn('⚠️ Logout API error (non-critical):', error);
    } finally {
      // Toujours nettoyer les tokens locaux
      this.clearTokens();
    }
  }

  // Récupérer le profil utilisateur
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<{ success: boolean; user: User }>(`${this.AUTH_PREFIX}/me`);
      
      if (response.data.success && response.data.user) {
        return response.data.user;
      }
      
      throw new Error('Erreur lors de la récupération du profil');
    } catch (error: any) {
      console.error('❌ Get profile error:', error);
      
      if (error.response?.status === 401) {
        this.clearTokens();
        throw new Error('Session expirée');
      }
      
      throw new Error('Erreur lors de la récupération du profil');
    }
  }

  // Renvoyer l'email de vérification
  async resendVerificationEmail(): Promise<void> {
    try {
      const response = await apiClient.post(`${this.AUTH_PREFIX}/resend-verification`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de l\'envoi');
      }
    } catch (error: any) {
      console.error('❌ Resend verification error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email');
    }
  }

  // Vérifier un email avec token
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await apiClient.post(`${this.AUTH_PREFIX}/verify-email`, { token });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur de vérification');
      }
    } catch (error: any) {
      console.error('❌ Verify email error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la vérification');
    }
  }

  // Mot de passe oublié
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await apiClient.post(`${this.AUTH_PREFIX}/forgot-password`, { email });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la demande');
      }
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la demande');
    }
  }

  // Réinitialiser le mot de passe
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const response = await apiClient.post(`${this.AUTH_PREFIX}/reset-password`, {
        token,
        newPassword
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la réinitialisation');
    }
  }

  // Gestion des tokens
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // Vérifier si le token est expiré
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Décoder le JWT pour vérifier l'expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convertir en millisecondes
      
      return Date.now() >= expirationTime;
    } catch (error) {
      console.error('❌ Error checking token expiration:', error);
      return true;
    }
  }

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }
}

// Export singleton
export const authService = new AuthService();