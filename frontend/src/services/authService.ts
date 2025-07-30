import { apiClient } from './apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: any;
  session?: {
    token: string;
    refreshToken: string;
    expiresAt: Date;
  };
}

class AuthService {
  
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/register', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/login', data);
      
      if (response.data.success && response.data.session) {
        // Sauvegarder tokens
        localStorage.setItem('ecolojia_token', response.data.session.token);
        localStorage.setItem('ecolojia_refresh_token', response.data.session.refreshToken);
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur de connexion');
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  async getProfile(): Promise<any> {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur récupération profil');
    }
  }

  getToken(): string | null {
    return localStorage.getItem('ecolojia_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('ecolojia_refresh_token');
  }

  clearTokens(): void {
    localStorage.removeItem('ecolojia_token');
    localStorage.removeItem('ecolojia_refresh_token');
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}

export const authService = new AuthService();