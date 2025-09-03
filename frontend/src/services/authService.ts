// PATH: frontend/src/services/authService.ts
import axios from "axios";
import { ENV } from "../env";
import { apiClient, setAccessToken, setRefreshToken, setUser, clearAuth } from "./apiClient";

// Types exportés
export interface User {
  id: string;
  email: string;
  profile?: { 
    firstName?: string;
    lastName?: string;
  };
  plan?: "free" | "premium";
  subscription?: {
    tier?: "free" | "premium";
    status?: string;
  };
  quotas?: {
    scansRemaining?: number;
    aiChatsRemaining?: number;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Clés localStorage
const ACCESS_KEY = "ecolojia_token";
const REFRESH_KEY = "ecolojia_refresh";
const USER_KEY = "ecolojia_user";

// Service d'authentification
const authService = {
  async login(payload: LoginPayload): Promise<User> {
    try {
      const { data } = await apiClient.post("/auth/login", payload);
      console.log("🔍 Login response:", data);
      
      // Gestion flexible de la réponse du backend
      let user: User;
      let accessToken: string;
      let refreshToken: string | undefined;
      
      // Si le backend retourne un format avec tokens
      if (data.tokens) {
        accessToken = data.tokens.accessToken;
        refreshToken = data.tokens.refreshToken;
        user = data.user;
      } 
      // Si le backend retourne un format direct
      else if (data.token) {
        accessToken = data.token;
        refreshToken = data.refreshToken;
        user = data.user;
      }
      // Format avec tout au même niveau
      else if (data.accessToken) {
        accessToken = data.accessToken;
        refreshToken = data.refreshToken;
        user = data.user || data;
      }
      else {
        throw new Error("Format de réponse invalide");
      }
      
      // Sauvegarder les tokens et l'utilisateur
      setAccessToken(accessToken);
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
      setUser(user);
      
      // Sauvegarder aussi dans localStorage directement pour compatibilité
      localStorage.setItem(ACCESS_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(REFRESH_KEY, refreshToken);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      console.error("❌ Login error:", error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async register(payload: RegisterPayload): Promise<User> {
    try {
      const { data } = await apiClient.post("/auth/register", payload);
      console.log("🔍 Register response:", data);
      
      // Même logique flexible que login
      let user: User;
      let accessToken: string;
      let refreshToken: string | undefined;
      
      if (data.tokens) {
        accessToken = data.tokens.accessToken;
        refreshToken = data.tokens.refreshToken;
        user = data.user;
      } else if (data.token) {
        accessToken = data.token;
        refreshToken = data.refreshToken;
        user = data.user;
      } else if (data.accessToken) {
        accessToken = data.accessToken;
        refreshToken = data.refreshToken;
        user = data.user || data;
      } else {
        throw new Error("Format de réponse invalide");
      }
      
      // Sauvegarder les tokens et l'utilisateur
      setAccessToken(accessToken);
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
      setUser(user);
      
      // Sauvegarder aussi dans localStorage directement
      localStorage.setItem(ACCESS_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(REFRESH_KEY, refreshToken);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      console.error("❌ Register error:", error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  async me(): Promise<User> {
    try {
      const token = localStorage.getItem(ACCESS_KEY);
      if (!token) {
        throw new Error("Aucun token trouvé");
      }
      
      const { data } = await apiClient.get("/auth/me");
      console.log("🔍 Me response:", data);
      
      // Le backend peut retourner { user: {...} } ou directement l'utilisateur
      const user = data.user || data;
      
      // Mettre à jour l'utilisateur en local
      setUser(user);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      console.error("❌ Me error:", error);
      
      // Si le token est invalide, nettoyer l'auth
      if (error.response?.status === 401) {
        authService.logout();
        throw new Error("Session expirée, veuillez vous reconnecter");
      }
      
      throw error;
    }
  },

  async refresh(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) throw new Error("Aucun refresh token");
      
      const { data } = await apiClient.post("/auth/refresh", { refreshToken });
      
      const newAccessToken = data.accessToken || data.token;
      if (!newAccessToken) {
        throw new Error("Nouveau token non reçu");
      }
      
      setAccessToken(newAccessToken);
      localStorage.setItem(ACCESS_KEY, newAccessToken);
      
      return newAccessToken;
    } catch (error: any) {
      console.error("❌ Refresh error:", error);
      authService.logout();
      throw error;
    }
  },

  logout() {
    // Nettoyer toutes les données d'auth
    clearAuth();
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Optionnel : appeler le backend pour invalider le token
    apiClient.post("/auth/logout").catch(() => {
      // Ignorer les erreurs de logout côté serveur
    });
  },

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },

  getUser(): User | null {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(ACCESS_KEY) && !!localStorage.getItem(USER_KEY);
  },

  isPremium(): boolean {
    const user = authService.getUser();
    return user?.plan === "premium" || 
           user?.subscription?.tier === "premium" ||
           false;
  }
};

export default authService;