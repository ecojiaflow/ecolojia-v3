// /src/utils/performance.ts
import { useCallback } from 'react';

interface SearchMetrics {
  query: string;
  resultsCount: number;
  searchTime: number;
  timestamp: number;
}

interface PageMetrics {
  url: string;
  loadTime: number;
  timestamp: number;
}

interface PerformanceMetrics {
  searches: SearchMetrics[];
  pageLoads: PageMetrics[];
  totalSearches: number;
  averageSearchTime: number;
  lastSearchTime: number;
}

// Cache en mémoire pour les métriques de performance
let performanceCache: PerformanceMetrics = {
  searches: [],
  pageLoads: [],
  totalSearches: 0,
  averageSearchTime: 0,
  lastSearchTime: 0
};

export const usePerformanceMonitoring = () => {
  
  // Enregistrer une recherche
  const recordSearch = useCallback((query: string, resultsCount: number, searchTime: number) => {
    const searchMetric: SearchMetrics = {
      query,
      resultsCount,
      searchTime,
      timestamp: Date.now()
    };
    
    // Ajouter aux métriques
    performanceCache.searches.push(searchMetric);
    performanceCache.totalSearches++;
    performanceCache.lastSearchTime = searchTime;
    
    // Calculer la moyenne (garder seulement les 100 dernières recherches)
    if (performanceCache.searches.length > 100) {
      performanceCache.searches = performanceCache.searches.slice(-100);
    }
    
    const totalTime = performanceCache.searches.reduce((sum, search) => sum + search.searchTime, 0);
    performanceCache.averageSearchTime = totalTime / performanceCache.searches.length;
    
    // Log pour debug (en mode développement seulement)
    if (import.meta.env.DEV) {
      console.log('📊 Performance - Recherche enregistrée:', {
        query,
        resultsCount,
        searchTime: `${searchTime}ms`,
        averageTime: `${performanceCache.averageSearchTime.toFixed(2)}ms`
      });
    }
    
  }, []);
  
  // Enregistrer le chargement d'une page
  const recordPageLoad = useCallback((url: string, loadTime: number) => {
    const pageMetric: PageMetrics = {
      url,
      loadTime,
      timestamp: Date.now()
    };
    
    performanceCache.pageLoads.push(pageMetric);
    
    // Garder seulement les 50 derniers chargements
    if (performanceCache.pageLoads.length > 50) {
      performanceCache.pageLoads = performanceCache.pageLoads.slice(-50);
    }
    
    if (import.meta.env.DEV) {
      console.log('📊 Performance - Page chargée:', {
        url,
        loadTime: `${loadTime}ms`
      });
    }
    
  }, []);
  
  // Mesurer le temps d'exécution d'une fonction
  const measureTime = useCallback(async <T>(
    operation: () => Promise<T> | T,
    operationName: string = 'Operation'
  ): Promise<{ result: T; time: number }> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      if (import.meta.env.DEV) {
        console.log(`⏱️ Performance - ${operationName}:`, `${executionTime.toFixed(2)}ms`);
      }
      
      return { result, time: executionTime };
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      if (import.meta.env.DEV) {
        console.error(`❌ Performance - ${operationName} (erreur):`, `${executionTime.toFixed(2)}ms`, error);
      }
      
      throw error;
    }
  }, []);
  
  // Obtenir les statistiques de performance
  const getPerformanceStats = useCallback((): PerformanceMetrics => {
    return { ...performanceCache };
  }, []);
  
  // Réinitialiser les métriques
  const resetMetrics = useCallback(() => {
    performanceCache = {
      searches: [],
      pageLoads: [],
      totalSearches: 0,
      averageSearchTime: 0,
      lastSearchTime: 0
    };
    
    if (import.meta.env.DEV) {
      console.log('🔄 Performance - Métriques réinitialisées');
    }
  }, []);
  
  // Obtenir les recherches les plus lentes
  const getSlowestSearches = useCallback((count: number = 5): SearchMetrics[] => {
    return [...performanceCache.searches]
      .sort((a, b) => b.searchTime - a.searchTime)
      .slice(0, count);
  }, []);
  
  // Obtenir les recherches récentes
  const getRecentSearches = useCallback((count: number = 10): SearchMetrics[] => {
    return [...performanceCache.searches]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }, []);
  
  return {
    recordSearch,
    recordPageLoad,
    measureTime,
    getPerformanceStats,
    resetMetrics,
    getSlowestSearches,
    getRecentSearches
  };
};

// Export des types pour utilisation externe
export type { SearchMetrics, PageMetrics, PerformanceMetrics };

// Hook pour le monitoring automatique de la navigation
export const usePagePerformanceMonitoring = () => {
  const { recordPageLoad } = usePerformanceMonitoring();
  
  const monitorPageLoad = useCallback(() => {
    // Utiliser l'API Performance pour mesurer le temps de chargement
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        if (loadTime > 0) {
          recordPageLoad(window.location.pathname, loadTime);
        }
      }
    }
  }, [recordPageLoad]);
  
  return { monitorPageLoad };
};