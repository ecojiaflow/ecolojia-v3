import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient as api } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: string;
  tier: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer le profil depuis cookie (via API)
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/profile', {
        withCredentials: true // IMPORTANT: envoyer cookies
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        console.log('✅ User loaded from cookie:', response.data.user.email);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log('👤 No active session');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Charger user au démarrage
  useEffect(() => {
    refreshUser();
  }, []);

  // Login classique
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password }, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        // Stocker token
        if (response.data.token) {
          localStorage.setItem('ecolojia_token', response.data.token);
          localStorage.setItem('ecolojia_user', JSON.stringify(response.data.user));
        }
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur de connexion');
    }
  };

  // Logout
  const logout = () => {
    // Supprimer cookies côté client
    document.cookie = 'ecolojia_token=; Max-Age=0; path=/';
    document.cookie = 'ecolojia_user=; Max-Age=0; path=/';
    
    // Supprimer localStorage (compatibilité)
    localStorage.removeItem('ecolojia_token');
    localStorage.removeItem('ecolojia_refresh');
    localStorage.removeItem('ecolojia_user');
    
    setUser(null);
    console.log('👋 User logged out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

