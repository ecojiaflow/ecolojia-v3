// PATH: frontend/ecolojiaFrontV3/src/services/adminApi.ts
import axios from 'axios';
import { AdminStats, RecentProduct, ImportLog, ImportProgress, AdminApiResponse } from '../types/admin';

// Configuration API backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backend-working.onrender.com';

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/api/admin`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Intercepteur pour la gestion des erreurs
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Erreur API Admin:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class AdminApiService {
  // Dashboard - Statistiques principales
  static async getDashboardStats(): Promise<AdminStats> {
    try {
      const response = await adminApi.get<AdminApiResponse<AdminStats>>('/dashboard');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la récupération des statistiques');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getDashboardStats:', error);
      throw new Error('Impossible de récupérer les statistiques du dashboard');
    }
  }

  // Produits récents
  static async getRecentProducts(limit: number = 10): Promise<RecentProduct[]> {
    try {
      const response = await adminApi.get<AdminApiResponse<RecentProduct[]>>(`/recent-products?limit=${limit}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la récupération des produits');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getRecentProducts:', error);
      throw new Error('Impossible de récupérer les produits récents');
    }
  }

  // Logs d'import
  static async getImportLogs(): Promise<ImportLog[]> {
    try {
      const response = await adminApi.get<AdminApiResponse<ImportLog[]>>('/import-logs');
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la récupération des logs');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getImportLogs:', error);
      throw new Error('Impossible de récupérer les logs d\'import');
    }
  }

  // Déclencher nouvel import
  static async triggerImport(maxProducts: number = 50): Promise<{ message: string; importId: string }> {
    try {
      const response = await adminApi.post<AdminApiResponse<{ message: string; importId: string }>>('/trigger-import', {
        maxProducts
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du déclenchement de l\'import');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur triggerImport:', error);
      throw new Error('Impossible de déclencher l\'import');
    }
  }

  // Vérifier le statut d'un import en cours
  static async getImportProgress(importId: string): Promise<ImportProgress> {
    try {
      const response = await adminApi.get<AdminApiResponse<ImportProgress>>(`/import-progress/${importId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la récupération du progrès');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getImportProgress:', error);
      throw new Error('Impossible de récupérer le progrès de l\'import');
    }
  }

  // Supprimer un produit
  static async deleteProduct(productId: string): Promise<{ message: string }> {
    try {
      const response = await adminApi.delete<AdminApiResponse<{ message: string }>>(`/product/${productId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la suppression');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur deleteProduct:', error);
      throw new Error('Impossible de supprimer le produit');
    }
  }

  // Valider un produit
  static async validateProduct(productId: string, status: 'verified' | 'rejected'): Promise<{ message: string }> {
    try {
      const response = await adminApi.patch<AdminApiResponse<{ message: string }>>(`/product/${productId}/validate`, {
        verified_status: status
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la validation');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur validateProduct:', error);
      throw new Error('Impossible de valider le produit');
    }
  }
}

export default AdminApiService;
// EOF