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

class PerformanceMonitor {
  private searchMetrics: SearchMetrics[] = [];
  private pageMetrics: PageMetrics[] = [];
  private maxEntries = 100; // Limiter le stockage

  // Enregistrer une recherche
  recordSearch(query: string, resultsCount: number, searchTime: number): void {
    const metric: SearchMetrics = {
      query,
      resultsCount,
      searchTime,
      timestamp: Date.now()
    };

    this.searchMetrics.push(metric);
    
    // Limiter la taille du cache
    if (this.searchMetrics.length > this.maxEntries) {
      this.searchMetrics = this.searchMetrics.slice(-this.maxEntries);
    }

    // Log en développement
    if (import.meta.env.DEV) {
      console.log('📊 Recherche enregistrée:', metric);
    }
  }

  // Enregistrer le chargement d'une page
  recordPageLoad(url: string, loadTime: number): void {
    const metric: PageMetrics = {
      url,
      loadTime,
      timestamp: Date.now()
    };

    this.pageMetrics.push(metric);
    
    // Limiter la taille du cache
    if (this.pageMetrics.length > this.maxEntries) {
      this.pageMetrics = this.pageMetrics.slice(-this.maxEntries);
    }

    // Log en développement
    if (import.meta.env.DEV) {
      console.log('📈 Page chargée:', metric);
    }
  }

  // Obtenir les statistiques de recherche
  getSearchStats(): {
    totalSearches: number;
    averageSearchTime: number;
    averageResultsCount: number;
    recentSearches: SearchMetrics[];
  } {
    if (this.searchMetrics.length === 0) {
      return {
        totalSearches: 0,
        averageSearchTime: 0,
        averageResultsCount: 0,
        recentSearches: []
      };
    }

    const totalSearchTime = this.searchMetrics.reduce((sum, metric) => sum + metric.searchTime, 0);
    const totalResults = this.searchMetrics.reduce((sum, metric) => sum + metric.resultsCount, 0);

    return {
      totalSearches: this.searchMetrics.length,
      averageSearchTime: Math.round(totalSearchTime / this.searchMetrics.length),
      averageResultsCount: Math.round(totalResults / this.searchMetrics.length),
      recentSearches: this.searchMetrics.slice(-10) // 10 dernières recherches
    };
  }

  // Obtenir les statistiques de performance des pages
  getPageStats(): {
    totalPageLoads: number;
    averageLoadTime: number;
    recentPages: PageMetrics[];
  } {
    if (this.pageMetrics.length === 0) {
      return {
        totalPageLoads: 0,
        averageLoadTime: 0,
        recentPages: []
      };
    }

    const totalLoadTime = this.pageMetrics.reduce((sum, metric) => sum + metric.loadTime, 0);

    return {
      totalPageLoads: this.pageMetrics.length,
      averageLoadTime: Math.round(totalLoadTime / this.pageMetrics.length),
      recentPages: this.pageMetrics.slice(-10) // 10 dernières pages
    };
  }

  // Nettoyer les anciennes métriques (plus de 1 heure)
  cleanup(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.searchMetrics = this.searchMetrics.filter(metric => metric.timestamp > oneHourAgo);
    this.pageMetrics = this.pageMetrics.filter(metric => metric.timestamp > oneHourAgo);
  }

  // Exporter les données (pour le debug)
  exportData(): {
    searches: SearchMetrics[];
    pages: PageMetrics[];
    stats: {
      search: ReturnType<typeof this.getSearchStats>;
      page: ReturnType<typeof this.getPageStats>;
    };
  } {
    return {
      searches: this.searchMetrics,
      pages: this.pageMetrics,
      stats: {
        search: this.getSearchStats(),
        page: this.getPageStats()
      }
    };
  }
}

// Instance globale
const performanceMonitor = new PerformanceMonitor();

// Nettoyage automatique toutes les heures
setInterval(() => {
  performanceMonitor.cleanup();
}, 60 * 60 * 1000);

// Hook pour utiliser le monitoring de performance
export const usePerformanceMonitoring = () => {
  const recordSearch = useCallback((query: string, resultsCount: number, searchTime: number) => {
    performanceMonitor.recordSearch(query, resultsCount, searchTime);
  }, []);

  const recordPageLoad = useCallback((url: string, loadTime: number) => {
    performanceMonitor.recordPageLoad(url, loadTime);
  }, []);

  const getSearchStats = useCallback(() => {
    return performanceMonitor.getSearchStats();
  }, []);

  const getPageStats = useCallback(() => {
    return performanceMonitor.getPageStats();
  }, []);

  const exportData = useCallback(() => {
    return performanceMonitor.exportData();
  }, []);

  return {
    recordSearch,
    recordPageLoad,
    getSearchStats,
    getPageStats,
    exportData
  };
};

// Hook pour mesurer automatiquement les performances de page
export const usePagePerformance = (pageName: string) => {
  const { recordPageLoad } = usePerformanceMonitoring();

  useCallback(() => {
    const startTime = performance.now();

    return () => {
      const loadTime = performance.now() - startTime;
      recordPageLoad(pageName, loadTime);
    };
  }, [pageName, recordPageLoad]);
};

export default performanceMonitor;