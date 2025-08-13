// src/services/authService.ts
import { API_CONFIG, buildApiUrl } from '../config/api.config';

export interface User {
  id: string;
  email: string;
  name: string;
  tier?: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  async getProfile(): Promise<User | null> {
    // Si déjà chargé, retourner le cache
    if (this.user) return this.user;
    
    // Pas de token = pas connecté
    if (!this.token) return null;

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.ME), {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // Token invalide
        this.logout();
        return null;
      }

      if (response.status === 404) {
        // Endpoint n'existe pas - on continue sans auth
        console.warn('Auth endpoint not found, continuing as guest');
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      this.user = data.user || data;
      return this.user;
    } catch (error) {
      console.warn('Auth check failed, continuing as guest:', error);
      return null;
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.token = null;
    this.user = null;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const authService = new AuthService();
export default authService;
