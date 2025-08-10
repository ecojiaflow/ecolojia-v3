// PATH: frontend/src/auth/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../../services/authService';
import demoService from '../../services/demoService';
import ConfigService from '../../services/configService';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  email: string;
  name: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  tier: 'free' | 'premium' | 'family';
  quotas: {
    scansUsed: number;
    scansLimit: number;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  startDemoMode: () => Promise<void>;
  endDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Vérifier si on est en mode démo
      const demoMode = localStorage.getItem('ecolojia_demo_mode') === 'true';
      if (demoMode) {
        setIsDemoMode(true);
        ConfigService.setMode('demo');
        
        // Charger l'utilisateur démo depuis le localStorage
        const demoUser = localStorage.getItem('ecolojia_user');
        if (demoUser) {
          setUser(JSON.parse(demoUser));
        }
      } else {
        // Vérifier l'authentification normale
        const token = authService.getToken();
        if (token) {
          try {
            const userData = await authService.getProfile();
            setUser(userData);
          } catch (error) {
            console.error('Failed to fetch profile:', error);
            authService.logout();
          }
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ 
        email, 
        password,
        rememberMe: true // Par défaut
      });
      setUser(response.user);
      setIsDemoMode(false);
      ConfigService.setMode('production');
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const response = await authService.register(data);
      setUser(response.user);
      setIsDemoMode(false);
      ConfigService.setMode('production');
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsDemoMode(false);
      ConfigService.setMode('demo');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const startDemoMode = async () => {
    try {
      setIsLoading(true);
      
      // Utiliser demoService pour créer une session démo
      const demoSession = await demoService.startDemoSession();
      
      // Sauvegarder les données de démo
      localStorage.setItem('ecolojia_demo_mode', 'true');
      localStorage.setItem('ecolojia_token', demoSession.token);
      localStorage.setItem('ecolojia_refresh_token', demoSession.refreshToken);
      localStorage.setItem('ecolojia_user', JSON.stringify(demoSession.user));
      
      // Mettre à jour l'état
      setUser(demoSession.user);
      setIsDemoMode(true);
      ConfigService.setMode('demo');
      
      // Rediriger vers le dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to start demo mode:', error);
      throw new Error('Impossible de démarrer le mode démo');
    } finally {
      setIsLoading(false);
    }
  };

  const endDemoMode = () => {
    // Nettoyer les données de démo
    localStorage.removeItem('ecolojia_demo_mode');
    localStorage.removeItem('ecolojia_token');
    localStorage.removeItem('ecolojia_refresh_token');
    localStorage.removeItem('ecolojia_user');
    
    // Réinitialiser l'état
    setUser(null);
    setIsDemoMode(false);
    ConfigService.setMode('demo');
    
    // Rediriger vers l'accueil
    navigate('/');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('ecolojia_user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isDemoMode,
    login,
    register,
    logout,
    updateUser,
    startDemoMode,
    endDemoMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
export default AuthContext;