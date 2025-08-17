// src/hooks/index.ts
export * from './useAuth';
export * from './useUniversalSearch';

// Mock de tous les hooks auth possibles
export const useUser = () => ({ user: null, isLoading: false });
export const useProfile = () => ({ profile: null, isLoading: false });
export const useCurrentUser = () => null;
export const useAuthState = () => ({ 
  user: null, 
  isAuthenticated: false,
  getUser: () => null 
});

