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
    console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur API Admin:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class AdminApiService {
  // Dashboard - Statistiques principales
  static async getDashboardStats(): Promise<AdminStats> {
    try {
      const response = await adminApi.get<AdminApiResponse<AdminStats>>('/dashboard');
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erreur lors de la recuperation des statistiques');
      }
      
      return response.data?.data;
    } catch (error) {
      console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur getDashboardStats:', error);
      throw new Error('Impossible de recuperer les statistiques du dashboard');
    }
  }

  // Produits recents
  static async getRecentProducts(limit: number = 10): Promise<RecentProduct[]> {
    try {
      const response = await adminApi.get<AdminApiResponse<RecentProduct[]>>(`/recent-products?limit=${limit}`);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erreur lors de la recuperation des produits');
      }
      
      return response.data?.data;
    } catch (error) {
      console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur getRecentProducts:', error);
      throw new Error('Impossible de recuperer les produits recents');
    }
  }

  // Logs d'import
  static async getImportLogs(): Promise<ImportLog[]> {
    try {
      const response = await adminApi.get<AdminApiResponse<ImportLog[]>>('/import-logs');
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erreur lors de la recuperation des logs');
      }
      
      return response.data?.data;
    } catch (error) {
      console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur getImportLogs:', error);
      throw new Error('Impossible de recuperer les logs d\'import');
    }
  }

  // Declencher nouvel import
  static async triggerImport(maxProducts: number = 50): Promise<{ message: string; importId: string }> {
    try {
      const response = await adminApi.post<AdminApiResponse<{ message: string; importId: string }>>('/trigger-import', {
        maxProducts
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erreur lors du declenchement de l\'import');
      }
      
      return response.data?.data;
    } catch (error) {
      console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur triggerImport:', error);
      throw new Error('Impossible de declencher l\'import');
    }
  }

  // Verifier le statut d'un import en cours
  static async getImportProgress(importId: string): Promise<ImportProgress> {
    try {
      const response = await adminApi.get<AdminApiResponse<ImportProgress>>(`/import-progress/${importId}`);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erreur lors de la recuperation du progres');
      }
      
      return response.data?.data;
    } catch (error) {
      console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur getImportProgress:', error);
      throw new Error('Impossible de recuperer le progres de l\'import');
    }
  }

  // Supprimer un produit
  static async deleteProduct(productId: string): Promise<{ message: string }> {
    try {
      const response = await adminApi.delete<AdminApiResponse<{ message: string }>>(`/product/${productId}`);
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erreur lors de la suppression');
      }
      
      return response.data?.data;
    } catch (error) {
      console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur deleteProduct:', error);
      throw new Error('Impossible de supprimer le produit');
    }
  }

  // Valider un produit
  static async validateProduct(productId: string, status: 'verified' | 'rejected'): Promise<{ message: string }> {
    try {
      const response = await adminApi.patch<AdminApiResponse<{ message: string }>>(`/product/${productId}/validate`, {
        verified_status: status
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erreur lors de la validation');
      }
      
      return response.data?.data;
    } catch (error) {
      console.error('aÆ’Ã¢â‚¬Å¡'šÃ‚ÂÆ’Ã¢â‚¬Â¦aÃ¢'šÂ¬Ã¢'žÂ¢ Erreur validateProduct:', error);
      throw new Error('Impossible de valider le produit');
    }
  }
}

export default AdminApiService;
// EOF




