// frontend/src/auth/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authService } from '../services/authService';
import { User, AuthContextType, LoginRequest, RegisterRequest } from '../types/AuthTypes';
import { demoService } from '../../services/demoService';

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Interface pour le provider
interface AuthProviderProps {
  children: ReactNode;
}

// ✅ EXPORT PRINCIPAL - AuthProvider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Fonction utilitaire pour nettoyer données démo
  const clearDemoData = useCallback(() => {
    try {
      localStorage.removeItem('ecolojia_demo_mode');
      localStorage.removeItem('ecolojia_demo_user');
      localStorage.removeItem('ecolojia_demo_token');
      localStorage.removeItem('ecolojia_demo_history');
      console.log('🧹 Données démo supprimées');
    } catch (error) {
      console.error('❌ Erreur suppression données démo:', error);
    }
  }, []);

  // Initialisation - vérifier utilisateur déjà connecté OU mode démo
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // ✅ PRIORITÉ 1: Vérifier mode démo d'abord
        if (demoService.isDemoActive()) {
          console.log('🎭 Mode démo détecté');
          const demoSession = demoService.getCurrentSession();
          
          if (demoSession) {
            setUser(demoSession.user);
            setIsAuthenticated(true);
            setIsDemoMode(true);
            console.log('✅ Utilisateur démo initialisé:', demoSession.user.name);
            return; // Sortir, pas besoin de vérifier token réel
          } else {
            console.warn('⚠️ Session démo invalide');
            clearDemoData();
          }
        }
        
        // ✅ PRIORITÉ 2: Authentification réelle si pas en mode démo
        const realToken = authService.getToken();
        
        if (realToken && !authService.isTokenExpired()) {
          console.log('🔐 Token réel détecté - Récupération profil utilisateur');
          try {
            const userData = await authService.getProfile();
            setUser(userData);
            setIsAuthenticated(true);
            setIsDemoMode(false);
            console.log('✅ Utilisateur réel connecté:', userData.name);
          } catch (profileError) {
            console.warn('⚠️ Erreur récupération profil - Token probablement invalide');
            authService.clearTokens();
            setUser(null);
            setIsAuthenticated(false);
            setIsDemoMode(false);
          }
        } else {
          // Token invalide/expiré ou absent
          if (realToken) {
            console.log('🕐 Token expiré - Suppression automatique');
            authService.clearTokens();
          }
          setUser(null);
          setIsAuthenticated(false);
          setIsDemoMode(false);
        }
        
      } catch (err) {
        console.error('❌ Erreur initialisation auth:', err);
        // En cas d'erreur, reset complet
        authService.clearTokens();
        clearDemoData();
        setUser(null);
        setIsAuthenticated(false);
        setIsDemoMode(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [clearDemoData]);

  // Fonction de connexion (authentification réelle uniquement)
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      // Si en mode démo, forcer sortie avant connexion réelle
      if (isDemoMode) {
        console.log('🚪 Sortie mode démo pour connexion réelle');
        demoService.endDemoSession();
        setIsDemoMode(false);
      }

      console.log('🔐 Tentative connexion:', credentials.email);
      const response = await authService.login(credentials);
      
      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        setIsDemoMode(false);
        console.log('✅ Connexion réussie:', response.user.name);
      }
    } catch (err: any) {
      console.error('❌ Erreur connexion:', err);
      setError(err.message || 'Erreur de connexion');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  // Fonction d'inscription (authentification réelle uniquement)
  const register = useCallback(async (userData: RegisterRequest): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);

      // Si en mode démo, forcer sortie avant inscription réelle
      if (isDemoMode) {
        console.log('🚪 Sortie mode démo pour inscription réelle');
        demoService.endDemoSession();
        setIsDemoMode(false);
      }

      console.log('📝 Tentative inscription:', userData.email);
      await authService.register(userData);
      console.log('✅ Inscription réussie pour:', userData.email);
    } catch (err: any) {
      console.error('❌ Erreur inscription:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  // Fonction de déconnexion (mode démo ET réel)
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      if (isDemoMode) {
        console.log('🚪 Déconnexion mode démo');
        demoService.endDemoSession();
      } else {
        console.log('🚪 Déconnexion utilisateur réel');
        try {
          await authService.logout();
        } catch (err) {
          console.warn('⚠️ Erreur logout serveur (non critique):', err);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsDemoMode(false);
      setIsLoading(false);
      setError(null);
      console.log('✅ Déconnexion terminée');
    }
  }, [isDemoMode]);

  // ✅ NOUVELLE MÉTHODE DÉMARER SESSION DÉMO
  const startDemoSession = useCallback(async (tier: 'free' | 'premium' = 'premium'): Promise<void> => {
    try {
      console.log(`🎭 Démarrage session démo ${tier}`);
      
      // Si déjà connecté (réel), déconnecter d'abord
      if (isAuthenticated && !isDemoMode) {
        authService.clearTokens();
      }
      
      // Créer session démo
      const demoSession = demoService.startDemoSession(tier);
      
      // Mettre à jour état
      setUser(demoSession.user);
      setIsAuthenticated(true);
      setIsDemoMode(true);
      setError(null);
      
      console.log('✅ Session démo démarrée:', demoSession.user.name);
    } catch (error) {
      console.error('❌ Erreur démarrage session démo:', error);
      throw new Error('Impossible de démarrer le mode démo');
    }
  }, [isAuthenticated, isDemoMode]);

  // Actualiser les données utilisateur
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      if (isDemoMode) {
        console.log('🎭 Mode démo - Refresh des données démo');
        const demoSession = demoService.getCurrentSession();
        if (demoSession) {
          setUser(demoSession.user);
          console.log('✅ Utilisateur démo rafraîchi');
        }
        return;
      }
      
      if (isAuthenticated && authService.getToken()) {
        console.log('🔄 Refresh données utilisateur réel');
        const userData = await authService.getProfile();
        setUser(userData);
        console.log('✅ Données utilisateur rafraîchies');
      }
    } catch (err) {
      console.error('❌ Erreur refresh user:', err);
      // En cas d'erreur, déconnecter l'utilisateur
      await logout();
    }
  }, [isDemoMode, isAuthenticated, logout]);

  // Effacer l'erreur
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Vérifier les permissions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) {
      console.log('❌ Pas d\'utilisateur pour vérifier permission:', permission);
      return false;
    }
    
    // En mode démo, permissions selon tier
    if (isDemoMode) {
      console.log(`🎭 Mode démo ${user.tier} - Permission ${permission}`);
      switch (permission) {
        case 'unlimited_scans':
        case 'ai_chat':
        case 'export_data':
        case 'advanced_analytics':
        case 'api_access':
          return user.tier === 'premium';
        case 'basic_analysis':
          return true;
        default:
          return false;
      }
    }
    
    // Logique permissions pour utilisateurs réels
    switch (permission) {
      case 'unlimited_scans':
      case 'ai_chat':
      case 'export_data':
      case 'advanced_analytics':
      case 'api_access':
        return user.tier === 'premium';
      case 'basic_analysis':
        return true;
      default:
        console.warn('⚠️ Permission inconnue:', permission);
        return false;
    }
  }, [user, isDemoMode]);

  // Vérifications tier
  const isFreeTier = useCallback((): boolean => {
    if (!user) return true;
    return user.tier === 'free';
  }, [user]);

  const isPremiumTier = useCallback((): boolean => {
    if (!user) return false;
    return user.tier === 'premium';
  }, [user]);

  // Utilitaires quotas
  const getRemainingQuota = useCallback((type: 'scans' | 'aiQuestions' | 'exports' | 'apiCalls'): number => {
    if (!user) return 0;
    
    if (isDemoMode) {
      const demoSession = demoService.getCurrentSession();
      if (demoSession) {
        const quota = demoSession.quotas[type];
        if (quota.limit === -1) return -1; // Illimité
        return Math.max(0, quota.limit - quota.used);
      }
      return 0;
    }
    
    // Logique quotas réels
    const quota = user.quotas[`${type}PerMonth`] || user.quotas[`${type}PerDay`] || 0;
    const used = user.currentUsage[
      type === 'aiQuestions' ? 'aiQuestionsToday' : 
      type === 'scans' ? 'scansThisMonth' :
      type === 'exports' ? 'exportsThisMonth' : 
      'apiCallsThisMonth'
    ] || 0;
    
    if (quota === -1) return -1; // Illimité
    return Math.max(0, quota - used);
  }, [user, isDemoMode]);

  const canPerformAction = useCallback((action: 'scan' | 'aiQuestion' | 'export' | 'apiCall'): boolean => {
    const remaining = getRemainingQuota(
      action === 'scan' ? 'scans' :
      action === 'aiQuestion' ? 'aiQuestions' :
      action === 'export' ? 'exports' : 'apiCalls'
    );
    
    return remaining === -1 || remaining > 0;
  }, [getRemainingQuota]);

  // Méthodes de debugging
  const getAuthState = useCallback(() => ({
    isAuthenticated,
    isDemoMode,
    userTier: user?.tier || 'none',
    userName: user?.name || 'none',
    hasToken: isDemoMode ? 'demo-token' : !!authService.getToken(),
    tokenExpired: isDemoMode ? false : authService.isTokenExpired()
  }), [isAuthenticated, isDemoMode, user]);

  const debugAuth = useCallback((): void => {
    console.log('🔍 État authentification:', getAuthState());
  }, [getAuthState]);

  // Valeur du contexte
  const contextValue: AuthContextType = {
    // État de base
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // État mode démo
    isDemoMode,
    
    // Actions authentification
    login,
    register,
    logout,
    clearError,
    refreshUser,
    
    // Actions mode démo
    startDemoSession,
    
    // Utilitaires permissions
    hasPermission,
    isFreeTier,
    isPremiumTier,
    
    // Utilitaires quotas
    getRemainingQuota,
    canPerformAction,
    
    // Debug
    debugAuth,
    getAuthState
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ EXPORT HOOK personnalisé
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error(
      'useAuth doit être utilisé à l\'intérieur d\'un AuthProvider. ' +
      'Assurez-vous que votre composant est wrappé dans <AuthProvider>.'
    );
  }
  
  return context;
};

// ✅ EXPORT du contexte par défaut
export default AuthContext;