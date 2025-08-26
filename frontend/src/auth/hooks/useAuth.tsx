// PATH: frontend/src/auth/hooks/useAuth.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  createContext,
  useMemo
} from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import type { User } from "../../services/authService";

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
  // Real authentication actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;

  // Demo mode helpers (no-op en prod)
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  simulateScan: (category: string) => void;
  simulateAIQuestion: () => boolean;

  // Misc helpers
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

/*
  ---------------------------------------------------------------------------
  Context setup
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
      setState((s) => ({ ...s, isLoading: true, error: null }));
      const user = await authService.login({ email, password });
      setState((s) => ({
        ...s,
        user,
        isAuthenticated: true,
        isLoading: false,
        isDemoMode: false
      }));
      navigate("/dashboard");
    } catch (err: any) {
      setState((s) => ({ ...s, error: err?.message || "Erreur de connexion", isLoading: false }));
      throw err;
    }
  }, [navigate]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      // Important: on ne passe que ce que l'API attend (évite les erreurs de typage)
      const user = await authService.register({ email: data.email, password: data.password });
      setState((s) => ({
        ...s,
        user,
        isAuthenticated: true,
        isLoading: false,
        isDemoMode: false
      }));
      navigate("/onboarding");
    } catch (err: any) {
      setState((s) => ({ ...s, error: err?.message || "Erreur lors de l'inscription", isLoading: false }));
      throw err;
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      setState((s) => ({ ...s, isLoading: true }));
      authService.logout();
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isDemoMode: false,
        error: null
      });
      navigate("/");
    }
  }, [navigate]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!state.user) return;
    try {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      // TODO (si route dispo): const updated = await api.updateProfile(data);
      setState((s) => ({
        ...s,
        user: { ...(s.user as User), ...data },
        isLoading: false
      }));
    } catch (err: any) {
      setState((s) => ({ ...s, error: err?.message || "Erreur de mise à jour", isLoading: false }));
      throw err;
    }
  }, [state.user]);

  const refreshUser = useCallback(async () => {
    try {
      const user = authService.getUser();
      if (user) {
        setState((s) => ({ ...s, user, isAuthenticated: true }));
      }
    } catch (err) {
      // on logge simplement, pas d'arrêt app
      console.error("Erreur refresh user:", err);
    }
  }, []);

  /* ---------------------------------------------------------------------
     Demo mode actions (no-op en prod — conservés pour compatibilité)
  --------------------------------------------------------------------- */
  const enableDemoMode = useCallback(() => {
    // En production, on NE bascule PAS en demo. On laisse un no-op pour compat.
    setState((s) => ({ ...s, isDemoMode: false }));
    navigate("/dashboard");
  }, [navigate]);

  const disableDemoMode = useCallback(() => {
    // No-op en prod
    setState((s) => ({ ...s, isDemoMode: false }));
    navigate("/");
  }, [navigate]);

  const simulateScan = useCallback((_category: string) => {
    // No-op en prod
    return;
  }, []);

  const simulateAIQuestion = useCallback((): boolean => {
    // No-op en prod
    return false;
  }, []);

  /* ---------------------------------------------------------------------
     Auth check on mount (token based)
  --------------------------------------------------------------------- */
  const checkAuth = useCallback(async () => {
    const token = authService.getAccessToken();
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    try {
      setState((s) => ({ ...s, isLoading: true }));
      await authService.refresh();
      const user = authService.getUser();
      if (user) {
        setState((s) => ({ ...s, user, isAuthenticated: true, isLoading: false }));
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } catch (err) {
      console.error("Token invalide:", err);
      authService.logout();
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

  const clearError = () => setState((s) => ({ ...s, error: null }));

  /* ---------------------------------------------------------------------
     Memoised context value - avoids useless renders
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
  }), [
    state,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    enableDemoMode,
    disableDemoMode,
    simulateScan,
    simulateAIQuestion,
    checkAuth
  ]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

/* -------------------------------------------------------------------------
   Public hooks
---------------------------------------------------------------------------*/
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const Wrapped: React.FC<P> = (props) => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) navigate("/login");
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

export const usePermission = (requiredTier: "free" | "premium" = "free") => {
  const { user } = useAuth();
  const isPremium = user?.subscription?.tier === "premium";
  const hasPermission = requiredTier === "free" || isPremium;
  return { hasPermission, userTier: user?.subscription?.tier || "free", isPremium };
};
