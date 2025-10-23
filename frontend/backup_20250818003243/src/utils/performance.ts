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

// Cache en memoire pour les metriques de performance
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
    
    // Ajouter aux metriques
    performanceCache.searches.push(searchMetric);
    performanceCache.totalSearches++;
    performanceCache.lastSearchTime = searchTime;
    
    // Calculer la moyenne (garder seulement les 100 dernieres recherches)
    if (performanceCache.searches.length > 100) {
      performanceCache.searches = performanceCache.searches.slice(-100);
    }
    
    const totalTime = performanceCache.searches.reduce((sum, search) => sum + search.searchTime, 0);
    performanceCache.averageSearchTime = totalTime / performanceCache.searches.length;
    
    // Log pour debug (en mode developpement seulement)
    if (import.met?.env.DEV) {
      console.log('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Performance - Recherche enregistree:', {
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
    
    if (import.met?.env.DEV) {
      console.log('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Performance - Page chargee:', {
        url,
        loadTime: `${loadTime}ms`
      });
    }
    
  }, []);
  
  // Mesurer le temps d'execution d'une fonction
  const measureTime = useCallback(async <T>(
    operation: () => Promise<T> | T,
    operationName: string = 'Operation'
  ): Promise<{ result: T; time: number }> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      if (import.met?.env.DEV) {
        console.log(`aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±Ã†â€™Ãƒâ€šÃ‚Â¯Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Performance - ${operationName}:`, `${executionTime.toFixed(2)}ms`);
      }
      
      return { result, time: executionTime };
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      if (import.met?.env.DEV) {
        console.error(`aÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃ†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦aÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ Performance - ${operationName} (erreur):`, `${executionTime.toFixed(2)}ms`, error);
      }
      
      throw error;
    }
  }, []);
  
  // Obtenir les statistiques de performance
  const getPerformanceStats = useCallback((): PerformanceMetrics => {
    return { ...performanceCache };
  }, []);
  
  // Reinitialiser les metriques
  const resetMetrics = useCallback(() => {
    performanceCache = {
      searches: [],
      pageLoads: [],
      totalSearches: 0,
      averageSearchTime: 0,
      lastSearchTime: 0
    };
    
    if (import.met?.env.DEV) {
      console.log('Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸aaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂaaÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ Performance - Metriques reinitialisees');
    }
  }, []);
  
  // Obtenir les recherches les plus lentes
  const getSlowestSearches = useCallback((count: number = 5): SearchMetrics[] => {
    return [...performanceCache.searches]
      .sort((a, b) => b.searchTime - ?.searchTime)
      .slice(0, count);
  }, []);
  
  // Obtenir les recherches recentes
  const getRecentSearches = useCallback((count: number = 10): SearchMetrics[] => {
    return [...performanceCache.searches]
      .sort((a, b) => b.timestamp - ?.timestamp)
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


