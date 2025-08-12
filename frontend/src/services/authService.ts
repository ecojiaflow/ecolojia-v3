// PATH: frontend/src/services/authService.ts
import api from './apiClient';
import { API_CONFIG } from '../config/api.config';
import { ConfigService } from './configService';

// Types cohÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©rents avec le backend
export interface User {
  _id: string;
  email: string;
  name: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    createdAt: string;
  };
  tier: 'free' | 'premium' | 'family';
  emailVerified: boolean;
  quotas: {
    scansUsed: number;
    scansLimit: number;
    aiChatsUsed: number;
    aiChatsLimit: number;
    lastReset: string;
  };
  preferences?: {
    allergies: string[];
    dietaryRestrictions: string[];
    healthGoals: string[];
    notificationsEnabled: boolean;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  name?: string;
  acceptTerms: boolean;
  marketingConsent?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

class AuthService {
  private static instance: AuthService;
  private configService = ConfigService.getInstance();
  private tokenKey = 'ecolojia_token';
  private refreshTokenKey = 'ecolojia_refresh_token';
  private userKey = 'ecolojia_user';
  private refreshTimer: NodeJS.Timeout | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.checkAuthStatus();
  }

  // Connexion
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸"Ã‚ÂÃƒâ€šÃ‚Â Attempting login with:', { email: credentials.email });
      
      // Formater correctement les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©es
      const formattedCredentials = {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
        rememberMe: credentials.rememberMe || false
      };

      const response = await api.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        formattedCredentials
      );

      console.log('âÃƒâ€¦â€Å“"Ã‚Â¦ Login response received:', { 
        success: response.success, 
        hasToken: !!response.token,
        hasUser: !!response.user 
      });

      // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©rifier que nous avons bien reÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§u les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©es nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©cessaires
      if (!response.token || !response.user) {
        throw new Error('RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©ponse du serveur invalide');
      }

      // Sauvegarder les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©es d'authentification
      this.saveAuthData(response);
      this.configService.setMode('production');
      
      // Programmer le refresh du token si expiresIn est fourni
      if (response.expiresIn) {
        this.scheduleTokenRefresh(response.expiresIn);
      }
      
      // ÃƒÆ’Ã†â€™"Ã‚Â°mettre l'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©nement de connexion
      window.dispatchEvent(new CustomEvent('auth:login', { detail: response.user }));

      return response;
    } catch (error: any) {
      console.error('âÃƒâ€šÃ‚ÂÃƒâ€¦â€â„¢ Login error details:', {
        message: error.message,
        statusCode: error.statusCode,
        originalError: error.originalError
      });
      
      // Gestion spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©cifique des erreurs
      if (error.statusCode === 401) {
        throw new Error('Email ou mot de passe incorrect');
      } else if (error.statusCode === 409) {
        throw new Error('Un compte existe dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  avec cet email');
      } else if (error.statusCode === 400) {
        throw new Error('DonnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©es invalides. VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©rifiez vos informations.');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Erreur de connexion. Veuillez rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©essayer.');
      }
    }
  }

  // Inscription
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸"Ãƒâ€šÃ‚Â Attempting registration with:', { email: data.email });
      
      // Formater les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©es pour le backend
      const formattedData = {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        name: data.name || `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        acceptTerms: data.acceptTerms,
        marketingConsent: data.marketingConsent || false
      };

      const response = await api.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        formattedData
      );

      console.log('âÃƒâ€¦â€Å“"Ã‚Â¦ Registration successful:', { 
        success: response.success,
        hasUser: !!response.user 
      });

      // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©rifier la rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©ponse
      if (!response.token || !response.user) {
        throw new Error('RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©ponse du serveur invalide');
      }

      // Sauvegarder les donnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©es
      this.saveAuthData(response);
      this.configService.setMode('production');
      
      if (response.expiresIn) {
        this.scheduleTokenRefresh(response.expiresIn);
      }
      
      window.dispatchEvent(new CustomEvent('auth:register', { detail: response.user }));

      return response;
    } catch (error: any) {
      console.error('âÃƒâ€šÃ‚ÂÃƒâ€¦â€â„¢ Register error:', error);
      
      // Gestion spÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©cifique des erreurs
      if (error.statusCode === 409) {
        throw new Error('Un compte existe dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©jÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  avec cet email');
      } else if (error.statusCode === 400) {
        throw new Error(error.message || 'DonnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©es invalides. VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©rifiez vos informations.');
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Erreur lors de l\'inscription. Veuillez rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©essayer.');
      }
    }
  }

  // DÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©connexion
  async logout(): Promise<void> {
    try {
      await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
      this.configService.setMode('demo');
      
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
      
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  }

  // RafraÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â®chir le token
  async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.REFRESH,
        { refreshToken }
      );

      if (response.token) {
        this.saveAuthData(response);
        if (response.expiresIn) {
          this.scheduleTokenRefresh(response.expiresIn);
        }
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      throw error;
    }
  }

  // RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©cupÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©rer le profil utilisateur
  async getProfile(): Promise<User> {
    try {
      const user = await api.get<User>(API_CONFIG.ENDPOINTS.AUTH.ME);
      this.updateUserData(user);
      return user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Mettre ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â  jour le profil
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const user = await api.put<User>(API_CONFIG.ENDPOINTS.USER.UPDATE, data);
      this.updateUserData(user);
      return user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // RÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©initialiser le mot de passe
  async resetPassword(email: string): Promise<void> {
    await api.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, { 
      email: email.toLowerCase().trim() 
    });
  }

  // Changer le mot de passe
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword
    });
  }

  // VÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©rifier l'email
  async verifyEmail(token: string): Promise<void> {
    await api.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
  }

  // MÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©thodes utilitaires
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getUser(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  getUserTier(): 'free' | 'premium' | 'family' {
    const user = this.getUser();
    return user?.tier || 'free';
  }

  isPremium(): boolean {
    const tier = this.getUserTier();
    return tier === 'premium' || tier === 'family';
  }

  // MÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©thodes privÃƒÆ’Ã†â€™Ãƒâ€šÃ‚©es
  private saveAuthData(data: AuthResponse): void {
    localStorage.setItem(this.tokenKey, data.token);
    localStorage.setItem(this.refreshTokenKey, data.refreshToken);
    localStorage.setItem(this.userKey, JSON.stringify(data.user));
    
    // Configurer le token dans le config service
    this.configService.setAuthToken(data.token);
  }

  private updateUserData(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    
    // Retirer le token du config service
    this.configService.setAuthToken(null);
  }

  private scheduleTokenRefresh(expiresIn: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // RafraÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â®chir 5 minutes avant expiration
    const refreshDelay = Math.max(0, (expiresIn - 300) * 1000);
    
    this.refreshTimer = setTimeout(() => {
      this.refreshToken().catch(console.error);
    }, refreshDelay);
  }

  private async checkAuthStatus(): Promise<void> {
    const token = this.getToken();
    
    if (token) {
      try {
        await this.getProfile();
        this.configService.setMode('production');
        this.configService.setAuthToken(token);
      } catch (error) {
        console.error('Invalid token:', error);
        this.clearAuthData();
      }
    }
  }
}

export default AuthService.getInstance();
//
// === Profil avec fallback robuste ===
export async function getProfileWithFallback(): Promise<any> {
  const candidates = ['/api/users/me', '/users/me', '/users/profile'];
  let lastErr: any = null;

  for (const path of candidates) {
    try {
      const res = await apiClient.get(path);
      if (res?.data) return res.data;
    } catch (err: any) {
      lastErr = err;
      // continue to next candidate
    }
  }
  throw lastErr || new Error('Profil introuvable via tous les endpoints');
}


