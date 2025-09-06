// ========================================
// FICHIER 1: src/services/authService.ts
// ========================================
// PATH: frontend/src/services/authService.ts

import { ENV } from '../env';
import { clearAuth, getRefreshToken, setAccessToken, setRefreshToken, setUser } from './apiClient';
import { apiClient } from './apiClient';

// Types
export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

export interface User {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName?: string;
  };
  plan?: string;
  subscription?: {
    tier: 'free' | 'premium';
  };
  quotas: {
    scansRemaining: number;
    aiChatsRemaining: number;
  };
}

interface AuthResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user: User;
}

// Mock users database
const mockUsers = new Map<string, { password: string; user: User }>();

// Pre-populate with demo users
mockUsers.set('demo@ecolojia.app', {
  password: 'demo123',
  user: {
    id: '1',
    email: 'demo@ecolojia.app',
    profile: {
      firstName: 'Demo',
      lastName: 'User'
    },
    plan: 'premium',
    subscription: { tier: 'premium' },
    quotas: {
      scansRemaining: 999999,
      aiChatsRemaining: 999999
    }
  }
});

mockUsers.set('test@example.com', {
  password: 'password123',
  user: {
    id: '2',
    email: 'test@example.com',
    profile: {
      firstName: 'Test',
      lastName: 'User'
    },
    plan: 'free',
    subscription: { tier: 'free' },
    quotas: {
      scansRemaining: 30,
      aiChatsRemaining: 5
    }
  }
});

// Generate mock JWT
const generateMockToken = (): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    userId: Date.now(), 
    exp: Date.now() + 24 * 60 * 60 * 1000 
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
};

// Mock auth service
const mockAuthService = {
  async login(credentials: { email: string; password: string }): Promise<User> {
    console.log('🔐 Mock login attempt:', credentials.email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const userEntry = mockUsers.get(credentials.email);
    
    if (!userEntry || userEntry.password !== credentials.password) {
      throw new Error('Email ou mot de passe incorrect');
    }

    const accessToken = generateMockToken();
    const refreshToken = generateMockToken();

    // IMPORTANT: Sauvegarder les tokens ET l'utilisateur
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(userEntry.user);
    
    // AUSSI sauvegarder dans localStorage pour compatibilité
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userEntry.user));

    console.log('✅ Mock login successful, tokens saved');

    return userEntry.user;
  },

  async register(payload: RegisterPayload): Promise<User> {
    console.log('🔐 Mock register attempt:', payload.email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (mockUsers.has(payload.email)) {
      throw new Error('Cet email est déjà utilisé');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email: payload.email,
      profile: {
        firstName: payload.firstName,
        lastName: payload.lastName
      },
      plan: 'free',
      subscription: { tier: 'free' },
      quotas: {
        scansRemaining: 30,
        aiChatsRemaining: 5
      }
    };

    mockUsers.set(payload.email, {
      password: payload.password,
      user: newUser
    });

    const accessToken = generateMockToken();
    const refreshToken = generateMockToken();

    // Sauvegarder tokens et user
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(newUser);
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    return newUser;
  },

  async me(): Promise<User> {
    console.log('🔐 Mock get user profile');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }

    throw new Error('Non authentifié');
  },

  logout(): void {
    console.log('🔐 Mock logout');
    clearAuth();
    // Nettoyer aussi le localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  async refresh(): Promise<AuthResponse> {
    console.log('🔐 Mock refresh token');
    
    const userStr = localStorage.getItem('user');
    if (!userStr) throw new Error('Session expirée');

    const newAccessToken = generateMockToken();
    const newRefreshToken = generateMockToken();
    
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('token', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    return {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      },
      user: JSON.parse(userStr)
    };
  }
};

// Real auth service (pour production)
const realAuthService = {
  async login(credentials: { email: string; password: string }): Promise<User> {
    console.log('🔐 Real login attempt:', credentials.email);
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    setAccessToken(response.data.tokens.accessToken);
    setRefreshToken(response.data.tokens.refreshToken);
    setUser(response.data.user);
    
    return response.data.user;
  },

  async register(payload: RegisterPayload): Promise<User> {
    console.log('🔐 Real register attempt:', payload.email);
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    
    setAccessToken(response.data.tokens.accessToken);
    setRefreshToken(response.data.tokens.refreshToken);
    setUser(response.data.user);
    
    return response.data.user;
  },

  async me(): Promise<User> {
    console.log('🔐 Real get user profile');
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  logout(): void {
    console.log('🔐 Real logout');
    apiClient.post('/auth/logout').catch(console.error);
    clearAuth();
  },

  async refresh(): Promise<AuthResponse> {
    console.log('🔐 Real refresh token');
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    
    setAccessToken(response.data.tokens.accessToken);
    setRefreshToken(response.data.tokens.refreshToken);
    
    return response.data;
  }
};

// Export the appropriate service based on MOCK_MODE
const authService = ENV.MOCK_MODE ? mockAuthService : realAuthService;

export default authService;