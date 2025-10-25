// ========================================
// FICHIER 2: src/Contexts/AuthContext.tsx
// ========================================
// PATH: frontend/src/Contexts/AuthContext.tsx

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import authService, { RegisterPayload, User } from "../services/authService";
import { getAccessToken, getUser, setUser as persistUser } from "../services/apiClient";
import { ENV } from "../env";

// Types
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isPremium: boolean;
  quotas: { scansRemaining: number; aiChatsRemaining: number };
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => getUser<User>());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Refresh user data from API
  const refreshUser = useCallback(async () => {
    try {
      setError(null);
      const me = await authService.me();
      setUserState(me);
      persistUser(me);
    } catch (e: any) {
      console.error("Failed to refresh user:", e);
      setError(e?.message || "Impossible de récupérer le profil");
      throw e;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;
    
    (async () => {
      try {
        setIsLoading(true);
        
        // Check if we have a token first
        const token = getAccessToken() || localStorage.getItem('accessToken');
        
        if (token) {
          console.log("🔄 Token found, restoring session...");
          try {
            const restoredUser = await authService.me();
            if (mounted) {
              setUserState(restoredUser);
              console.log("✅ Session restored");
            }
          } catch (e) {
            console.log("❌ Failed to restore session, clearing auth");
            authService.logout();
            if (mounted) setUserState(null);
          }
        } else {
          console.log("👤 No active session");
          if (mounted) setUserState(null);
        }
      } catch (e) {
        console.error("❌ Auth init failed:", e);
        if (mounted) setUserState(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    
    return () => { 
      mounted = false; 
    };
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const u = await authService.login({ email, password });
      setUserState(u);
      console.log("✅ Login successful in context");
    } catch (e: any) {
      const msg = e?.message || "Échec de connexion";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const u = await authService.register(payload);
      setUserState(u);
      console.log("✅ Registration successful in context");
    } catch (e: any) {
      const msg = e?.message || "Échec d'inscription";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    authService.logout();
    setUserState(null);
    setError(null);
    console.log("✅ Logged out from context");
  }, []);

  // Computed values
  const isPremium = useMemo(() => {
    return user?.plan === "premium" || 
           user?.subscription?.tier === "premium";
  }, [user]);

  const quotas = useMemo(() => {
    return {
      scansRemaining: user?.quotas?.scansRemaining || 0,
      aiChatsRemaining: user?.quotas?.aiChatsRemaining || 0,
    };
  }, [user]);

  // Check authentication status
  const isAuthenticated = useMemo(() => {
    const hasUser = !!user;
    const hasToken = !!(getAccessToken() || localStorage.getItem('accessToken'));
    return hasUser && hasToken;
  }, [user]);

  // Context value
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      register,
      logout,
      refreshUser,
      clearError,
      isPremium,
      quotas,
    }),
    [user, isAuthenticated, isLoading, error, login, register, logout, refreshUser, clearError, isPremium, quotas]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

// Alias for backward compatibility
export const useAuthContext = useAuth;
