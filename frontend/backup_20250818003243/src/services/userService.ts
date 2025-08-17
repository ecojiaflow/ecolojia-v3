// PATH: frontend/src/services/userService.ts
import { api } from './api';
import { User, AIPreferences } from '../types/user';

export const userService = {
  // Recuperer le profil complet
  async getProfile(): Promise<User> {
    const response = await api.get('/users/v2/me');
    return response.dat?.data;
  },

  // Mettre Æ’Ã‚Â  jour le profil
  async updateProfile(updates: { 
    name?: string; 
    avatar?: string; 
    aiPreferences?: Partial<AIPreferences> 
  }): Promise<User> {
    const response = await api.put('/users/v2/me', updates);
    return response.dat?.data;
  },

  // Supprimer une preference
  async deletePreference(key: string): Promise<void> {
    await api.delete(`/users/v2/me/ai-preferences/${key}`);
  },

  // Verifier les quotas
  async checkQuota(type: 'scans' | 'aiChats' | 'exports'): Promise<boolean> {
    const profile = await this.getProfile();
    const [used, limit] = profile.usage[type].split('/').map(Number);
    return used < limit || profile.plan.code !== 'free';
  }
};

