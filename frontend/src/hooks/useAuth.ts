// PATH: frontend/src/hooks/useAuth.ts

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { User, LoginCredentials, RegisterData } from '../types/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Vérifier l'authentification au montage
  useEffect(() => {
    const checkAuth = async () => {
      // Si on a un token mais pas d'utilisateur en mémoire
      if (localStorage.getItem('token') && !user) {
        setLoading(true);
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch (err) {
          // Token invalide, nettoyer
          authService.logout();
        } finally {
          setLoading(false);
        }
      }
    };

    checkAuth();
  }, []);

  // Connexion
  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const loggedInUser = await authService.login(credentials);
      setUser(loggedInUser);
      
      // Redirection selon le statut
      if (loggedInUser.metadata.createdAt === loggedInUser.metadata.updatedAt) {
        // Nouvel utilisateur, aller à l'onboarding
        navigate('/onboarding');
      } else {
        // Utilisateur existant, aller au dashboard
        navigate('/dashboard');
      }
      
      return loggedInUser;
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Inscription
  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newUser = await authService.register(data);
      setUser(newUser);
      
      // Rediriger vers l'onboarding pour les nouveaux utilisateurs
      navigate('/onboarding');
      
      return newUser;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Déconnexion
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      // La redirection est gérée par authService
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour le profil
  const updateProfile = useCallback(async (updates: Partial<User['profile']>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await authService.updateProfile(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour les préférences
  const updatePreferences = useCallback(async (preferences: Partial<User['preferences']>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await authService.updatePreferences(preferences);
      setUser(updatedUser);
      return updatedUser;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Rafraîchir le profil
  const refreshProfile = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    
    setLoading(true);
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      return profile;
    } catch (err) {
      console.error('Erreur lors du rafraîchissement du profil:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helpers
  const isAuthenticated = authService.isAuthenticated();
  const isPremium = authService.isPremium();
  const quotas = user?.quotas || {
    scansRemaining: 30,
    scansResetDate: '',
    aiChatsRemaining: 5,
    aiChatsResetDate: '',
  };
  const canScan = isPremium || quotas.scansRemaining > 0;
  const canChat = isPremium || quotas.aiChatsRemaining > 0;

  return {
    // État
    user,
    loading,
    error,
    
    // Status
    isAuthenticated,
    isPremium,
    
    // Quotas
    quotas,
    canScan,
    canChat,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
    refreshProfile,
    
    // Utils
    clearError: () => setError(null),
  };
};
