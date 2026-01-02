import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient as api } from "../services/api";

// ============================================================================
// TYPES USER (aligné Backend)
// ============================================================================

export interface UserSubscription {
  tier: "free" | "premium";
  status?: "active" | "canceled" | "past_due";
  currentPeriodEnd?: string;
}

export interface UserPreferences {
  allergies?: string[];
  diets?: string[];
  healthGoals?: string[];
  notifications?: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  language?: "fr" | "en";
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Fallback
  avatar?: string;
  subscription?: UserSubscription;
  preferences?: UserPreferences;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger user depuis localStorage au démarrage
  const refreshUser = async () => {
    try {
      // D'abord vérifier localStorage
      const storedUser = localStorage.getItem("ecolojia_user");
      const storedToken = localStorage.getItem("ecolojia_token");
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        console.log("✅ User loaded from localStorage");
      }
      
      // Puis valider avec le backend (optionnel)
      try {
        const response = await api.get("/auth/profile", {
          withCredentials: true,
        });
        
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem("ecolojia_user", JSON.stringify(response.data.user));
          console.log("✅ User refreshed from API");
        }
      } catch {
        // Token expiré, garder le user local si présent
        console.log("⚠️ Could not refresh from API");
      }
    } catch (error) {
      console.log("👤 No active session");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Charger user au démarrage
  useEffect(() => {
    refreshUser();
  }, []);

  // Login
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password }, {
        withCredentials: true,
      });

      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        
        if (response.data.token) {
          localStorage.setItem("ecolojia_token", response.data.token);
          localStorage.setItem("ecolojia_user", JSON.stringify(userData));
        }
        
        console.log("✅ Login success:", userData.email);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Erreur de connexion");
    }
  };

  // Logout
  const logout = () => {
    document.cookie = "ecolojia_token=; Max-Age=0; path=/";
    document.cookie = "ecolojia_user=; Max-Age=0; path=/";
    localStorage.removeItem("ecolojia_token");
    localStorage.removeItem("ecolojia_refresh");
    localStorage.removeItem("ecolojia_user");
    setUser(null);
    console.log("👋 User logged out");
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
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};
