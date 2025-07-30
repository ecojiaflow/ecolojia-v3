// /src/hooks/useProductCache.ts
import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface ProductCache {
  [key: string]: CacheEntry<Product[]>;
}

interface StatsCache {
  data: any;
  timestamp: number;
  expiry: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STATS_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes pour les stats

class CacheManager {
  private productCache: ProductCache = {};
  private statsCache: StatsCache | null = null;
  private listeners: Set<() => void> = new Set();

  // Gestion du cache produits
  setProducts(key: string, products: Product[]): void {
    this.productCache[key] = {
      data: products,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_DURATION
    };
    this.notifyListeners();
  }

  getProducts(key: string): Product[] | null {
    const entry = this.productCache[key];
    if (!entry) return null;

    // Vérifier expiration
    if (Date.now() > entry.expiry) {
      delete this.productCache[key];
      return null;
    }

    return entry.data;
  }

  // Gestion du cache stats
  setStats(stats: any): void {
    this.statsCache = {
      data: stats,
      timestamp: Date.now(),
      expiry: Date.now() + STATS_CACHE_DURATION
    };
    this.notifyListeners();
  }

  getStats(): any | null {
    if (!this.statsCache) return null;

    // Vérifier expiration
    if (Date.now() > this.statsCache.expiry) {
      this.statsCache = null;
      return null;
    }

    return this.statsCache.data;
  }

  // Nettoyage automatique
  cleanup(): void {
    const now = Date.now();
    
    // Nettoyer cache produits
    Object.keys(this.productCache).forEach(key => {
      if (now > this.productCache[key].expiry) {
        delete this.productCache[key];
      }
    });

    // Nettoyer cache stats
    if (this.statsCache && now > this.statsCache.expiry) {
      this.statsCache = null;
    }
  }

  // Gestion des listeners
  addListener(listener: () => void): void {
    this.listeners.add(listener);
  }

  removeListener(listener: () => void): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Invalidation manuelle
  invalidateProducts(key?: string): void {
    if (key) {
      delete this.productCache[key];
    } else {
      this.productCache = {};
    }
    this.notifyListeners();
  }

  invalidateStats(): void {
    this.statsCache = null;
    this.notifyListeners();
  }

  // Statistiques du cache
  getCacheStats(): { 
    productEntries: number; 
    hasStats: boolean; 
    totalSize: number 
  } {
    return {
      productEntries: Object.keys(this.productCache).length,
      hasStats: this.statsCache !== null,
      totalSize: JSON.stringify(this.productCache).length + 
                 (this.statsCache ? JSON.stringify(this.statsCache).length : 0)
    };
  }
}

// Instance globale du cache
const cacheManager = new CacheManager();

// Nettoyage automatique toutes les 10 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 10 * 60 * 1000);

// Hook pour les produits
export const useProductCache = (query: string = '') => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const cacheKey = `products_${query.toLowerCase().trim()}`;

  const fetchProducts = useCallback(async (forceRefresh = false) => {
    // Vérifier le cache d'abord
    if (!forceRefresh) {
      const cachedProducts = cacheManager.getProducts(cacheKey);
      if (cachedProducts) {
        setProducts(cachedProducts);
        setFromCache(true);
        setError(null);
        return cachedProducts;
      }
    }

    setLoading(true);
    setFromCache(false);
    setError(null);

    try {
      // Import dynamique pour éviter les dépendances circulaires
      const { fetchRealProducts } = await import('../api/realApi');
      const fetchedProducts = await fetchRealProducts(query);
      
      // Sauvegarder en cache
      cacheManager.setProducts(cacheKey, fetchedProducts);
      setProducts(fetchedProducts);
      
      return fetchedProducts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(errorMessage);
      console.error('Erreur fetch products:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [query, cacheKey]);

  const refreshProducts = useCallback(() => {
    return fetchProducts(true);
  }, [fetchProducts]);

  const invalidateCache = useCallback(() => {
    cacheManager.invalidateProducts(cacheKey);
  }, [cacheKey]);

  return {
    products,
    loading,
    error,
    fromCache,
    fetchProducts,
    refreshProducts,
    invalidateCache
  };
};

// Hook pour les stats
export const useStatsCache = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const fetchStats = useCallback(async (forceRefresh = false) => {
    // Vérifier le cache d'abord
    if (!forceRefresh) {
      const cachedStats = cacheManager.getStats();
      if (cachedStats) {
        setStats(cachedStats);
        setFromCache(true);
        setError(null);
        return cachedStats;
      }
    }

    setLoading(true);
    setFromCache(false);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/stats`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques');
      }
      
      const fetchedStats = await response.json();
      
      // Sauvegarder en cache
      cacheManager.setStats(fetchedStats);
      setStats(fetchedStats);
      
      return fetchedStats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(errorMessage);
      console.error('Erreur fetch stats:', err);
      
      // Données de démonstration en cas d'erreur
      const demoStats = {
        totalProducts: 59,
        averageScore: 0.68,
        byCategory: {
          alimentaire: 25,
          cosmetique: 15,
          mode: 8,
          maison: 6,
          electronique: 3,
          sport: 2
        },
        topTags: [
          { name: 'bio', count: 32 },
          { name: 'naturel', count: 28 },
          { name: 'vegan', count: 18 },
          { name: 'local', count: 15 },
          { name: 'durable', count: 12 }
        ]
      };
      
      setStats(demoStats);
      return demoStats;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(() => {
    return fetchStats(true);
  }, [fetchStats]);

  const invalidateCache = useCallback(() => {
    cacheManager.invalidateStats();
  }, []);

  return {
    stats,
    loading,
    error,
    fromCache,
    fetchStats,
    refreshStats,
    invalidateCache
  };
};

// Hook pour les statistiques du cache
export const useCacheStats = () => {
  const [cacheStats, setCacheStats] = useState(cacheManager.getCacheStats());

  useEffect(() => {
    const updateStats = () => {
      setCacheStats(cacheManager.getCacheStats());
    };

    cacheManager.addListener(updateStats);
    
    // Mise à jour périodique
    const interval = setInterval(updateStats, 30000); // 30 secondes

    return () => {
      cacheManager.removeListener(updateStats);
      clearInterval(interval);
    };
  }, []);

  return cacheStats;
};

export default cacheManager;