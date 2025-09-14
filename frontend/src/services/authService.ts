// PATH: frontend/src/services/authService.ts
import apiClient from './apiClient';

export interface User {
  _id: string;
  id?: string;
  email: string;
  firstName: string;
  lastName?: string;
  profile?: {
    language: string;
    theme: string;
    avatarUrl?: string;
  };
  subscription: {
    tier: 'free' | 'premium';
    status: string;
  };
  quotas: {
    scansRemaining: number;
    aiChatsRemaining: number;
    scansLimit?: number;
    aiChatsLimit?: number;
  };
  plan?: 'free' | 'premium';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName?: string;
}

class AuthService {
  async login(credentials: LoginPayload): Promise<User> {
    console.log('🔐 AuthService: Login attempt...');
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { token, accessToken, refreshToken, user } = response.data;
      
      if (token || accessToken) {
        localStorage.setItem('ecolojia_token', (token || accessToken));
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${(token || accessToken)}`;
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      if (user) {
        user.id = user._id || user.id;
        user.plan = user.subscription?.tier || 'free';
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('ecolojia_user', JSON.stringify(user));
        console.log('✅ Login successful:', user.email);
        setTimeout(() => { window.location.href = '/dashboard'; }, 100);
        return user;
      }
      
      throw new Error('No user data received');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const message = error?.response?.data?.message || 'Login failed';
      throw new Error(message);
    }
  }

  async register(userData: RegisterPayload): Promise<User> {
    console.log('📝 AuthService: Registration...');
    try {
      const response = await apiClient.post('/auth/register', userData);
      const { token, accessToken, refreshToken, user } = response.data;
      
      if (token || accessToken) {
        localStorage.setItem('ecolojia_token', (token || accessToken));
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${(token || accessToken)}`;
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      if (user) {
        user.id = user._id || user.id;
        user.plan = user.subscription?.tier || 'free';
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('ecolojia_user', JSON.stringify(user));
        console.log('✅ Registration successful:', user.email);
        return user;
      }
      
      throw new Error('No user data received');
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      const message = error?.response?.data?.message || 'Registration failed';
      throw new Error(message);
    }
  }

  async me(): Promise<User> {
    console.log('👤 AuthService: Getting profile...');
    try {
      const response = await apiClient.get('/auth/profile');
      const user = response.data?.user || response.data;
      
      if (user) {
        user.id = user._id || user.id;
        user.plan = user.subscription?.tier || 'free';
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('ecolojia_user', JSON.stringify(user));
        return user;
      }
      
      throw new Error('No user data');
    } catch (error) {
      console.error('❌ Get profile error:', error);
      throw error;
    }
  }

  async refresh(): Promise<{ accessToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    
    try {
      const response = await apiClient.post('/auth/refresh', { refreshToken });
      const { accessToken } = response.data;
      
      if (accessToken) {
        localStorage.setItem('ecolojia_token', accessToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        return { accessToken };
      }
      
      throw new Error('No token received');
    } catch (error) {
      console.error('❌ Refresh error:', error);
      this.logout();
      throw error;
    }
  }

  logout(): void {
    console.log('🚪 Logging out...');
    localStorage.removeItem('ecolojia_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
  }

  isAuthenticated(): boolean {
    return !!(localStorage.getItem('ecolojia_token') && localStorage.getItem('user'));
  }

  getCachedUser(): User | null {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        user.id = user._id || user.id;
        user.plan = user.subscription?.tier || 'free';
        return user;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export default new AuthService();


