// PATH: frontend\src\auth\context\AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback
} from 'react';
import { authService } from '../../services/authService';
import { demoService } from '../../services/demoService';

// Types simplifiés pour éviter les erreurs d'import
interface User {
  _id: string;
  email: string;
  name: string;
  profile?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  tier: 'free' | 'premium' | 'family';
  emailVerified: boolean;
  quotas?: {
    scansRemaining: number;
    aiChatsRemaining: number;
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  name?: string;
  acceptTerms?: boolean;
  marketingConsent?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  startDemoSession: (tier?: 'free' | 'premium') => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isFreeTier: () => boolean;
  isPremiumTier: () => boolean;
  getRemainingQuota: (type: 'scans' | 'aiQuestions' | 'exports' | 'apiCalls') => number;
  canPerformAction: (action: 'scan' | 'aiQuestion' | 'export' | 'apiCall') => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        if (demoService && demoService.isDemoActive?.()) {
          const demoSession = demoService.getCurrentSession?.();
          if (demoSession) {
            setUser(demoSession.user);
            setIsAuthenticated(true);
            setIsDemoMode(true);
            return;
          }
        }
        const token = localStorage.getItem('ecolojia_token');
        if (token && authService) {
          try {
            const userData = await authService.getProfile();
            setUser(userData);
            setIsAuthenticated(true);
            setIsDemoMode(false);
          } catch (err) {
            localStorage.removeItem('ecolojia_token');
            localStorage.removeItem('ecolojia_refresh_token');
          }
        }
      } catch (err) {
        console.error('Erreur initialisation auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      if (isDemoMode) {
        demoService?.endDemoSession?.();
        setIsDemoMode(false);
      }
      const response = await authService.login(credentials);
      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        setIsDemoMode(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      setError(null);
      setIsLoading(true);

      if (isDemoMode) {
        demoService?.endDemoSession?.();
        setIsDemoMode(false);
      }

      await authService.register(userData);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      if (isDemoMode) {
        demoService?.endDemoSession?.();
      } else {
        try {
          await authService.logout();
        } catch (err) {
          console.warn('Erreur logout serveur:', err);
        }
      }
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsDemoMode(false);
      setIsLoading(false);
      setError(null);
    }
  }, [isDemoMode]);

  const startDemoSession = useCallback(async (tier: 'free' | 'premium' = 'premium') => {
    try {
      if (isAuthenticated && !isDemoMode) {
        localStorage.removeItem('ecolojia_token');
        localStorage.removeItem('ecolojia_refresh_token');
      }
      const demoSession = demoService.startDemoSession(tier);
      setUser(demoSession.user);
      setIsAuthenticated(true);
      setIsDemoMode(true);
      setError(null);
    } catch (error) {
      console.error('Erreur démarrage session démo:', error);
      throw new Error('Impossible de démarrer le mode démo');
    }
  }, [isAuthenticated, isDemoMode]);

  const refreshUser = useCallback(async () => {
    try {
      if (isDemoMode) {
        const demoSession = demoService?.getCurrentSession?.();
        if (demoSession) {
          setUser(demoSession.user);
        }
        return;
      }

      if (isAuthenticated && authService.getToken?.()) {
        const userData = await authService.getProfile();
        setUser(userData);
      }
    } catch (err) {
      console.error('Erreur refresh user:', err);
      await logout();
    }
  }, [isDemoMode, isAuthenticated, logout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    const premiumPermissions = [
      'unlimited_scans',
      'ai_chat',
      'export_data',
      'advanced_analytics',
      'api_access'
    ];
    if (permission === 'basic_analysis') return true;
    return premiumPermissions.includes(permission) && user.tier === 'premium';
  }, [user]);

  const isFreeTier = useCallback(() => !user || user.tier === 'free', [user]);
  const isPremiumTier = useCallback(() => user?.tier === 'premium', [user]);

  const getRemainingQuota = useCallback((type: 'scans' | 'aiQuestions' | 'exports' | 'apiCalls'): number => {
    if (!user) return 0;

    if (isDemoMode) {
      const demoSession = demoService?.getCurrentSession?.();
      if (demoSession?.quotas?.[type]) {
        const quota = demoSession.quotas[type];
        if (quota.limit === -1) return -1;
        return Math.max(0, quota.limit - quota.used);
      }
      return 0;
    }

    if (user.tier === 'premium') return -1;

    const freeQuotas = {
      scans: 30,
      aiQuestions: 5,
      exports: 0,
      apiCalls: 0
    };

    return freeQuotas[type] || 0;
  }, [user, isDemoMode]);

  const canPerformAction = useCallback((action: 'scan' | 'aiQuestion' | 'export' | 'apiCall') => {
    const actionMap = {
      scan: 'scans',
      aiQuestion: 'aiQuestions',
      export: 'exports',
      apiCall: 'apiCalls'
    } as const;

    const remaining = getRemainingQuota(actionMap[action]);
    return remaining === -1 || remaining > 0;
  }, [getRemainingQuota]);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    isDemoMode,
    login,
    register,
    logout,
    clearError,
    refreshUser,
    startDemoSession,
    hasPermission,
    isFreeTier,
    isPremiumTier,
    getRemainingQuota,
    canPerformAction
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
