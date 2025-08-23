// PATH: frontend/src/services/authService.ts

import { http, post, get } from './api';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  User 
} from '../types/api';
import { notifications } from './notificationService';

// Fonctions utilitaires pour gérer les tokens
function saveTokens(token: string, refreshToken?: string) {
  localStorage.setItem('ecolojia.token', token);
  if (refreshToken) {
    localStorage.setItem('ecolojia.refreshToken', refreshToken);
  }
}

function clearTokens() {
  localStorage.removeItem('ecolojia.token');
  localStorage.removeItem('ecolojia.refreshToken');
  localStorage.removeItem('user');
}

class AuthService {
  private currentUser: User | null = null;

  constructor() {
    // Charger l'utilisateur depuis le localStorage au démarrage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        localStorage.removeItem('user');
      }
    }
  }

  // Connexion
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await post<AuthResponse>('/auth/login', credentials);
      
      // Sauvegarder les tokens
      saveTokens(response.token, response.refreshToken);
      
      // Sauvegarder l'utilisateur
      this.currentUser = response.user;
      localStorage.setItem('user', JSON.stringify(response.user));
      
      notifications.push('success', `Bienvenue ${response.user.profile.firstName} !`);
      
      return response.user;
    } catch (error: any) {
      notifications.push('error', error.message || 'Erreur de connexion');
      throw error;
    }
  }

  // Inscription
  async register(data: RegisterData): Promise<User> {
    try {
      const response = await post<AuthResponse>('/auth/register', data);
      
      // Sauvegarder les tokens
      saveTokens(response.token, response.refreshToken);
      
      // Sauvegarder l'utilisateur
      this.currentUser = response.user;
      localStorage.setItem('user', JSON.stringify(response.user));
      
      notifications.push('success', 'Inscription réussie ! Bienvenue sur ECOLOJIA ??');
      
      return response.user;
    } catch (error: any) {
      notifications.push('error', error.message || 'Erreur lors de l\'inscription');
      throw error;
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      // Appeler l'API pour invalider le token côté serveur (optionnel)
      // await post('/auth/logout', {});
      
      // Nettoyer le stockage local
      clearTokens();
      this.currentUser = null;
      
      notifications.push('info', 'Déconnexion réussie');
      
      // Rediriger vers la page d'accueil
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, on nettoie localement
      clearTokens();
      this.currentUser = null;
    }
  }

  // Récupérer le profil utilisateur
  async getProfile(): Promise<User> {
    try {
      const response = await get<User>('/auth/profile');
      
      // Mettre à jour l'utilisateur en cache
      this.currentUser = response;
      localStorage.setItem('user', JSON.stringify(response));
      
      return response;
    } catch (error: any) {
      notifications.push('error', 'Impossible de récupérer le profil');
      throw error;
    }
  }

  // Mettre à jour le profil
  async updateProfile(updates: Partial<User['profile']>): Promise<User> {
    try {
      const response = await http.patch<User>('/auth/profile', { profile: updates });
      
      // Mettre à jour l'utilisateur en cache
      this.currentUser = response.data;
      localStorage.setItem('user', JSON.stringify(response.data));
      
      notifications.push('success', 'Profil mis à jour');
      
      return response.data;
    } catch (error: any) {
      notifications.push('error', 'Erreur lors de la mise à jour du profil');
      throw error;
    }
  }

  // Mettre à jour les préférences
  async updatePreferences(preferences: Partial<User['preferences']>): Promise<User> {
    try {
      const response = await http.patch<User>('/auth/preferences', { preferences });
      
      // Mettre à jour l'utilisateur en cache
      this.currentUser = response.data;
      localStorage.setItem('user', JSON.stringify(response.data));
      
      notifications.push('success', 'Préférences mises à jour');
      
      return response.data;
    } catch (error: any) {
      notifications.push('error', 'Erreur lors de la mise à jour des préférences');
      throw error;
    }
  }

  // Changer le mot de passe
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      
      notifications.push('success', 'Mot de passe modifié avec succès');
    } catch (error: any) {
      notifications.push('error', error.message || 'Erreur lors du changement de mot de passe');
      throw error;
    }
  }

  // Demander une réinitialisation de mot de passe
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await post('/auth/reset-password', { email });
      
      notifications.push('success', 'Un email de réinitialisation a été envoyé');
    } catch (error: any) {
      notifications.push('error', error.message || 'Erreur lors de la demande de réinitialisation');
      throw error;
    }
  }

  // Réinitialiser le mot de passe avec token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await post('/auth/reset-password/confirm', {
        token,
        newPassword,
      });
      
      notifications.push('success', 'Mot de passe réinitialisé avec succès');
    } catch (error: any) {
      notifications.push('error', error.message || 'Erreur lors de la réinitialisation');
      throw error;
    }
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!this.currentUser && !!localStorage.getItem('ecolojia.token');
  }

  // Vérifier si l'utilisateur est premium
  isPremium(): boolean {
    return this.currentUser?.subscription.tier === 'premium' &&
           this.currentUser?.subscription.status === 'active';
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Obtenir les quotas
  getQuotas() {
    return this.currentUser?.quotas || {
      scansRemaining: 0,
      scansResetDate: '',
      aiChatsRemaining: 0,
      aiChatsResetDate: '',
    };
  }

  // Vérifier les quotas
  canScan(): boolean {
    if (this.isPremium()) return true;
    return (this.currentUser?.quotas.scansRemaining || 0) > 0;
  }

  canChat(): boolean {
    if (this.isPremium()) return true;
    return (this.currentUser?.quotas.aiChatsRemaining || 0) > 0;
  }
}

// Export d'une instance unique
export const authService = new AuthService();

// Export direct de getToken pour compatibilité
export const getToken = (): string | null => {
  return localStorage.getItem('ecolojia.token');
};

// Hook React pour l'authentification
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si on a un token mais pas d'utilisateur
    if (localStorage.getItem('ecolojia.token') && !user) {
      setLoading(true);
      authService.getProfile()
        .then(setUser)
        .catch(() => {
          // Token invalide, nettoyer
          clearTokens();
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const user = await authService.login(credentials);
      setUser(user);
      navigate('/dashboard');
      return user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    try {
      const user = await authService.register(data);
      setUser(user);
      navigate('/onboarding');
      return user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User['profile']>) => {
    const updatedUser = await authService.updateProfile(updates);
    setUser(updatedUser);
    return updatedUser;
  };

  const updatePreferences = async (preferences: Partial<User['preferences']>) => {
    const updatedUser = await authService.updatePreferences(preferences);
    setUser(updatedUser);
    return updatedUser;
  };

  return {
    user,
    loading,
    isAuthenticated: authService.isAuthenticated(),
    isPremium: authService.isPremium(),
    quotas: authService.getQuotas(),
    canScan: authService.canScan(),
    canChat: authService.canChat(),
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
  };
};
