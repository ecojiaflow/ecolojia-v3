// frontend/src/services/authService.ts
import apiClient from './apiClient';
import ConfigService from './configService';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  preferences?: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    interests?: string[];
  };
}

interface User {
  _id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    subscription?: {
      plan: 'free' | 'premium' | 'family';
      status: 'active' | 'inactive' | 'cancelled';
      expiresAt?: string;
    };
  };
  preferences?: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    interests?: string[];
  };
}

interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
  user: User;
}

class AuthService {
  private static instance: AuthService;
  private user: User | null = null;
  private authCheckPromise: Promise<User | null> | null = null;

  private constructor() {
    this.loadUserFromStorage();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private loadUserFromStorage() {
    const userStr = localStorage.getItem('ecolojia_user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.clearAuth();
      }
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // En mode démo, simuler une connexion réussie
      if (ConfigService.isDemo()) {
        const demoUser: User = {
          _id: 'demo-user-123',
          email: credentials.email,
          profile: {
            firstName: 'Utilisateur',
            lastName: 'Démo',
            subscription: {
              plan: 'free',
              status: 'active'
            }
          },
          preferences: {
            dietaryRestrictions: [],
            allergies: [],
            interests: ['santé', 'environnement']
          }
        };

        const demoResponse: AuthResponse = {
          success: true,
          token: 'demo-token-' + Date.now(),
          refreshToken: 'demo-refresh-token-' + Date.now(),
          user: demoUser
        };

        this.setAuth(demoResponse.token, demoResponse.refreshToken || '', demoUser);
        return demoResponse;
      }

      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      if (response.success && response.token) {
        this.setAuth(response.token, response.refreshToken || '', response.user);
      }
      
      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Si le backend n'est pas accessible, passer en mode démo
      if (error.message?.includes('ERR_CONNECTION_REFUSED') || error.message?.includes('Failed to fetch')) {
        ConfigService.setMode('demo');
        return this.login(credentials);
      }
      
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // En mode démo, simuler une inscription réussie
      if (ConfigService.isDemo()) {
        const demoUser: User = {
          _id: 'demo-user-' + Date.now(),
          email: data.email,
          profile: {
            firstName: data.firstName,
            lastName: data.lastName,
            subscription: {
              plan: 'free',
              status: 'active'
            }
          },
          preferences: data.preferences || {
            dietaryRestrictions: [],
            allergies: [],
            interests: []
          }
        };

        const demoResponse: AuthResponse = {
          success: true,
          token: 'demo-token-' + Date.now(),
          refreshToken: 'demo-refresh-token-' + Date.now(),
          user: demoUser
        };

        this.setAuth(demoResponse.token, demoResponse.refreshToken || '', demoUser);
        return demoResponse;
      }

      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      
      if (response.success && response.token) {
        this.setAuth(response.token, response.refreshToken || '', response.user);
      }
      
      return response;
    } catch (error: any) {
      console.error('Register error:', error);
      
      // Si le backend n'est pas accessible, passer en mode démo
      if (error.message?.includes('ERR_CONNECTION_REFUSED') || error.message?.includes('Failed to fetch')) {
        ConfigService.setMode('demo');
        return this.register(data);
      }
      
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token && !ConfigService.isDemo()) {
        await apiClient.post('/auth/logout', {});
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('ecolojia_refresh_token');
      if (!refreshToken || ConfigService.isDemo()) {
        return null;
      }

      const response = await apiClient.post<{ token: string; refreshToken: string }>('/auth/refresh', {
        refreshToken
      });

      if (response.token) {
        localStorage.setItem('ecolojia_token', response.token);
        if (response.refreshToken) {
          localStorage.setItem('ecolojia_refresh_token', response.refreshToken);
        }
        return response.token;
      }
      
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      return null;
    }
  }

  async getProfile(): Promise<User | null> {
    try {
      if (ConfigService.isDemo()) {
        return this.user;
      }

      const token = this.getToken();
      if (!token) {
        return null;
      }

      // Utiliser /auth/profile au lieu de /auth/me si c'est l'endpoint correct
      const response = await apiClient.get<User>('/auth/profile');
      
      if (response) {
        this.user = response;
        localStorage.setItem('ecolojia_user', JSON.stringify(response));
        return response;
      }
      
      return null;
    } catch (error: any) {
      console.error('Get profile error:', error);
      
      // Si c'est une erreur 404, essayer un autre endpoint ou utiliser les données en cache
      if (error.statusCode === 404 || error.message?.includes('404')) {
        console.log('Profile endpoint not found, using cached user data');
        return this.user;
      }
      
      // Si c'est une erreur 401, le token est invalide
      if (error.statusCode === 401) {
        this.clearAuth();
      }
      
      throw error;
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      if (ConfigService.isDemo()) {
        if (this.user) {
          this.user = { ...this.user, ...data };
          localStorage.setItem('ecolojia_user', JSON.stringify(this.user));
        }
        return this.user!;
      }

      const response = await apiClient.put<User>('/auth/profile', data);
      
      if (response) {
        this.user = response;
        localStorage.setItem('ecolojia_user', JSON.stringify(response));
      }
      
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async checkAuthStatus(): Promise<User | null> {
    // Éviter les appels multiples simultanés
    if (this.authCheckPromise) {
      return this.authCheckPromise;
    }

    this.authCheckPromise = this._checkAuthStatus();
    
    try {
      const result = await this.authCheckPromise;
      return result;
    } finally {
      this.authCheckPromise = null;
    }
  }

  private async _checkAuthStatus(): Promise<User | null> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return null;
      }

      if (ConfigService.isDemo()) {
        return this.user;
      }

      // Essayer de récupérer le profil
      try {
        const user = await this.getProfile();
        return user;
      } catch (profileError: any) {
        console.log('Profile fetch failed:', profileError.message);
        
        // Si le profil échoue mais qu'on a un utilisateur en cache, l'utiliser
        if (this.user) {
          console.log('Using cached user data');
          return this.user;
        }
        
        // Si c'est une erreur 401, nettoyer l'auth
        if (profileError.statusCode === 401) {
          this.clearAuth();
          return null;
        }
        
        // Pour toute autre erreur, garder l'utilisateur en cache s'il existe
        return this.user;
      }
    } catch (error) {
      console.error('Check auth status error:', error);
      return this.user; // Retourner l'utilisateur en cache s'il existe
    }
  }

  private setAuth(token: string, refreshToken: string, user: User) {
    localStorage.setItem('ecolojia_token', token);
    if (refreshToken) {
      localStorage.setItem('ecolojia_refresh_token', refreshToken);
    }
    localStorage.setItem('ecolojia_user', JSON.stringify(user));
    this.user = user;
  }

  private clearAuth() {
    localStorage.removeItem('ecolojia_token');
    localStorage.removeItem('ecolojia_refresh_token');
    localStorage.removeItem('ecolojia_user');
    this.user = null;
  }

  getToken(): string | null {
    return localStorage.getItem('ecolojia_token');
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.user;
  }

  isPremium(): boolean {
    return this.user?.profile?.subscription?.plan === 'premium' || 
           this.user?.profile?.subscription?.plan === 'family';
  }

  hasActiveSubscription(): boolean {
    return this.user?.profile?.subscription?.status === 'active';
  }
}

export default AuthService.getInstance();