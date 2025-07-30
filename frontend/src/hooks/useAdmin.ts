// PATH: frontend/ecolojiaFrontV3/src/hooks/useAdmin.ts
import { useState, useEffect, useCallback } from 'react';
import AdminApiService from '../services/adminApi';
import { AdminStats, RecentProduct, ImportLog, ImportProgress } from '../types/admin';

export const useAdmin = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Charger toutes les données du dashboard
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [statsData, productsData, logsData] = await Promise.all([
        AdminApiService.getDashboardStats(),
        AdminApiService.getRecentProducts(15),
        AdminApiService.getImportLogs()
      ]);
      
      setStats(statsData);
      setRecentProducts(productsData);
      setImportLogs(logsData);
      setLastUpdate(new Date());
      
      console.log('✅ Dashboard data loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      console.error('❌ Erreur loadDashboardData:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualiser les statistiques uniquement
  const refreshStats = useCallback(async () => {
    try {
      const statsData = await AdminApiService.getDashboardStats();
      setStats(statsData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('❌ Erreur refreshStats:', err);
    }
  }, []);

  // Déclencher un nouvel import
  const triggerImport = useCallback(async (maxProducts: number = 50) => {
    setError(null);
    
    try {
      const result = await AdminApiService.triggerImport(maxProducts);
      
      // Actualiser les données après l'import
      setTimeout(() => {
        loadDashboardData();
      }, 2000);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du déclenchement de l\'import';
      setError(errorMessage);
      throw err;
    }
  }, [loadDashboardData]);

  // Valider un produit
  const validateProduct = useCallback(async (productId: string, status: 'verified' | 'rejected') => {
    try {
      const result = await AdminApiService.validateProduct(productId, status);
      
      // Mettre à jour la liste des produits localement
      setRecentProducts(products => 
        products.map(product => 
          product.id === productId 
            ? { ...product, verified_status: status }
            : product
        )
      );
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la validation';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Supprimer un produit
  const deleteProduct = useCallback(async (productId: string) => {
    try {
      const result = await AdminApiService.deleteProduct(productId);
      
      // Retirer le produit de la liste locale
      setRecentProducts(products => products.filter(product => product.id !== productId));
      
      // Actualiser les stats
      refreshStats();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(errorMessage);
      throw err;
    }
  }, [refreshStats]);

  // Auto-refresh des données toutes les 30 secondes
  useEffect(() => {
    loadDashboardData();
    
    const interval = setInterval(() => {
      refreshStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadDashboardData, refreshStats]);

  return {
    // Données
    stats,
    recentProducts,
    importLogs,
    importProgress,
    
    // États
    loading,
    error,
    lastUpdate,
    
    // Actions
    loadDashboardData,
    refreshStats,
    triggerImport,
    validateProduct,
    deleteProduct,
    
    // Utilitaires
    clearError: () => setError(null)
  };
};

export default useAdmin;
// EOF