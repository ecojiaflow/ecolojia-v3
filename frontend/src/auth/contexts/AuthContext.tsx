// PATH: frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, User } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPremium: boolean;
  canScan: boolean;
  canChat: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const auth = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await auth.login(email, password);
      navigate('/dashboard');
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
      throw error;
    }
  };

  const handleRegister = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      await auth.register(userData);
      navigate('/onboarding');
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
      throw error;
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    navigate('/');
  };

  const value: AuthContextType = {
    ...auth,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};