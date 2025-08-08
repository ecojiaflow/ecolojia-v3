// PATH: frontend/src/services/authService.ts
// Service d'authentification pour la production

import { apiClient } from './apiClient';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    plan: 'free' | 'premium';
  };
}

class AuthService {
  private tokenKey = 'token';
  private refreshTokenKey = 'refreshToken';
  private userKey = 'user';

  // Connexion
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      
      if (response.token) {
        this.setSession(response);
      }
      
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erreur de connexion');
    }
  }

  // Inscription
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/api/auth/register', data);
      
      if (response.token) {
        this.setSession(response);
      }
      
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Erreur logout:', error);
    } finally {
      this.clearSession();
    }
  }

  // Rafraîchir le token
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return null;

      const response = await apiClient.post('/api/auth/refresh', {
        refreshToken
      });

      if (response.token) {
        localStorage.setItem(this.tokenKey, response.token);
        return response.token;
      }
      
      return null;
    } catch (error) {
      this.clearSession();
      return null;
    }
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Vérifier si le token n'est pas expiré
    try {
      const payload = this.parseJwt(token);
      const expirationTime = payload.exp * 1000;
      return Date.now() < expirationTime;
    } catch {
      return false;
    }
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Obtenir le token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Obtenir le refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Obtenir le plan de l'utilisateur
  getUserPlan(): 'free' | 'premium' {
    const user = this.getCurrentUser();
    return user?.plan || 'free';
  }

  // Méthodes privées
  private setSession(authData: AuthResponse): void {
    localStorage.setItem(this.tokenKey, authData.token);
    
    if (authData.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, authData.refreshToken);
    }
    
    if (authData.user) {
      localStorage.setItem(this.userKey, JSON.stringify(authData.user));
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  private parseJwt(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }
}

export const authService = new AuthService();
export default authService;