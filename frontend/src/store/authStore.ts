// frontend/src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

interface User {
  _id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  tier: 'free' | 'premium' | 'family';
  createdAt: string;
  emailVerified: boolean;
  currentUsage?: {
    scansThisMonth: number;
    aiQuestionsToday: number;
    exportsThisMonth: number;
  };
  quotas?: {
    scansPerMonth: number;
    aiQuestionsPerDay: number;
    exportsPerMonth: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms?: boolean;
  marketingConsent?: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          
          if (response.success && response.user && response.token) {
            // Stocker les tokens
            localStorage.setItem('ecolojia_token', response.token);
            if (response.refreshToken) {
              localStorage.setItem('ecolojia_refresh_token', response.refreshToken);
            }
            
            set({
              user: response.user,
              token: response.token,
              refreshToken: response.refreshToken || null,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            throw new Error(response.message || 'Erreur de connexion');
          }
        } catch (error: any) {
          console.error('Login error:', error);
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Erreur de connexion'
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            name: `${data.firstName} ${data.lastName}`,
            acceptTerms: data.acceptTerms,
            marketingConsent: data.marketingConsent
          });
          
          if (response.success && response.user && response.token) {
            // Stocker les tokens
            localStorage.setItem('ecolojia_token', response.token);
            if (response.refreshToken) {
              localStorage.setItem('ecolojia_refresh_token', response.refreshToken);
            }
            
            set({
              user: response.user,
              token: response.token,
              refreshToken: response.refreshToken || null,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            throw new Error(response.message || 'Erreur lors de l\'inscription');
          }
        } catch (error: any) {
          console.error('Register error:', error);
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Erreur lors de l\'inscription'
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          // Appeler l'API de logout si nécessaire
          await authService.logout();
        } catch (error) {
          console.warn('Logout API error:', error);
        } finally {
          // Nettoyer le state et le localStorage
          localStorage.removeItem('ecolojia_token');
          localStorage.removeItem('ecolojia_refresh_token');
          
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('ecolojia_token');
        
        if (!token) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false
          });
          return;
        }

        set({ isLoading: true });
        
        try {
          // Vérifier si le token est valide en récupérant le profil
          const user = await authService.getProfile();
          
          set({
            user,
            token,
            refreshToken: localStorage.getItem('ecolojia_refresh_token'),
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.error('Auth check error:', error);
          
          // Si le token est invalide ou expiré
          if (error.response?.status === 401) {
            // Essayer de rafraîchir le token
            const refreshToken = localStorage.getItem('ecolojia_refresh_token');
            if (refreshToken) {
              try {
                const response = await authService.refreshToken(refreshToken);
                if (response.success && response.token) {
                  localStorage.setItem('ecolojia_token', response.token);
                  if (response.refreshToken) {
                    localStorage.setItem('ecolojia_refresh_token', response.refreshToken);
                  }
                  
                  // Réessayer de récupérer le profil
                  const user = await authService.getProfile();
                  
                  set({
                    user,
                    token: response.token,
                    refreshToken: response.refreshToken || refreshToken,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                  });
                  return;
                }
              } catch (refreshError) {
                console.error('Token refresh error:', refreshError);
              }
            }
          }
          
          // Si on arrive ici, l'authentification a échoué
          localStorage.removeItem('ecolojia_token');
          localStorage.removeItem('ecolojia_refresh_token');
          
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'ecolojia-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
