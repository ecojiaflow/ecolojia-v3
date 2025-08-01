import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  createContext,
  useMemo
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, User } from '../services/api';

/*
  ---------------------------------------------------------------------------
  Types
  ---------------------------------------------------------------------------
*/
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  //  ⚡ Real authentication actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;

  //  🎭 Demo‑mode helpers
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  simulateScan: (category: string) => void;
  simulateAIQuestion: () => boolean;

  //  🔎 Misc helpers
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

/*
  ---------------------------------------------------------------------------
  Context set‑up
  ---------------------------------------------------------------------------
*/
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isDemoMode: false,
    error: null
  });

  /* ---------------------------------------------------------------------
     Real authentication actions
  --------------------------------------------------------------------- */
  const login = useCallback(async (email: string, password: string) => {
    try {
      setState(s => ({ ...s, isLoading: true, error: null }));
      const response = await authService.login({ email, password });
      setState(s => ({
        ...s,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isDemoMode: false
      }));
      navigate('/dashboard');
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message ?? 'Erreur de connexion', isLoading: false }));
      throw err;
    }
  }, [navigate]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setState(s => ({ ...s, isLoading: true, error: null }));
      const response = await authService.register(data);
      setState(s => ({
        ...s,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        isDemoMode: false
      }));
      navigate('/onboarding');
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message ?? "Erreur lors de l'inscription", isLoading: false }));
      throw err;
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      setState(s => ({ ...s, isLoading: true }));
      await authService.logout();
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isDemoMode: false,
        error: null
      });
      navigate('/');
    }
  }, [navigate]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!state.user) return;
    try {
      setState(s => ({ ...s, isLoading: true, error: null }));
      // 👉 TODO: Replace with real API call once available
      // const updatedUser = await authService.updateProfile(data);
      setState(s => ({
        ...s,
        user: { ...s.user!, ...data },
        isLoading: false
      }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message ?? 'Erreur de mise à jour', isLoading: false }));
      throw err;
    }
  }, [state.user]);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.getProfile();
      setState(s => ({ ...s, user, isAuthenticated: true }));
    } catch (err) {
      console.error('Erreur refresh user:', err);
    }
  }, []);

  /* ---------------------------------------------------------------------
     Demo‑mode actions (purely client‑side, no API calls!)
  --------------------------------------------------------------------- */
  const enableDemoMode = useCallback(() => {
    const demoUser: User = {
      _id: 'demo-user-001',
      email: 'demo@ecolojia.app',
      name: 'Utilisateur Démo',
      profile: { firstName: 'Demo', lastName: 'User' },
      tier: 'free',
      status: 'active'
    } as User; //  Some optional fields may not exist on real User – that is fine for demo

    setState(s => ({
      ...s,
      user: demoUser,
      isAuthenticated: true,
      isDemoMode: true,
      error: null
    }));
    navigate('/dashboard');
  }, [navigate]);

  const disableDemoMode = useCallback(() => {
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isDemoMode: false,
      error: null
    });
    navigate('/');
  }, [navigate]);

  //  The two helpers below simply mutate local demo‑quotas – ignored for real users
  const simulateScan = useCallback((category: string) => {
    if (!state.isDemoMode || !state.user) return;
    setState(s => ({
      ...s,
      user: {
        ...s.user!,
        // @ts‑ignore – demo only
        usage: {
          totalScans: (s.user!.usage?.totalScans ?? 0) + 1,
          lastScanAt: new Date()
        }
      }
    }));
  }, [state.isDemoMode, state.user]);

  const simulateAIQuestion = useCallback((): boolean => {
    if (!state.isDemoMode || !state.user) return false;
    // @ts‑ignore – demo only
    const remaining = (state.user.quotas?.aiChatsRemaining ?? 0) - 1;
    if (remaining < 0) return false;
    setState(s => ({
      ...s,
      user: {
        ...s.user!,
        // @ts‑ignore – demo only
        quotas: { ...s.user!.quotas, aiChatsRemaining: remaining },
        // @ts‑ignore – demo only
        usage: {
          totalChats: (s.user!.usage?.totalChats ?? 0) + 1,
          lastChatAt: new Date()
        }
      }
    }));
    return true;
  }, [state.isDemoMode, state.user]);

  /* ---------------------------------------------------------------------
     Auth check on mount (token based)
  --------------------------------------------------------------------- */
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }
    try {
      setState(s => ({ ...s, isLoading: true }));
      const user = await authService.getProfile();
      setState(s => ({ ...s, user, isAuthenticated: true, isLoading: false }));
    } catch (err) {
      console.error('Token invalide:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isDemoMode: false,
        error: null
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const clearError = () => setState(s => ({ ...s, error: null }));

  /* ---------------------------------------------------------------------
     Memoised context value – avoids useless renders
  --------------------------------------------------------------------- */
  const contextValue = useMemo<AuthContextType>(() => ({
    ...state,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    enableDemoMode,
    disableDemoMode,
    simulateScan,
    simulateAIQuestion,
    checkAuth,
    clearError
  }), [state, login, register, logout, updateProfile, refreshUser, enableDemoMode, disableDemoMode, simulateScan, simulateAIQuestion, checkAuth]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

/* -------------------------------------------------------------------------
   Public hooks
---------------------------------------------------------------------------*/
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const Wrapped: React.FC<P> = props => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) navigate('/login');
    }, [isAuthenticated, isLoading, navigate]);

    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
        </div>
      );
    }

    if (!isAuthenticated) return null;

    return <Component {...props} />;
  };
  return Wrapped;
};

export const usePermission = (requiredTier: 'free' | 'premium' = 'free') => {
  const { user } = useAuth();
  const isPremium = user?.tier === 'premium';
  const hasPermission = requiredTier === 'free' || isPremium;

  return { hasPermission, userTier: user?.tier ?? 'free', isPremium };
};
