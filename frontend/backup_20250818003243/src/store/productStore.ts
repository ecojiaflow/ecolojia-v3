// frontend/src/store/productStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Product {
  _id: string;
  barcode: string;
  name: string;
  brand?: string;
  category: 'food' | 'cosmetic' | 'detergent';
  imageUrl?: string;
  scores?: {
    health?: number;
    environment?: number;
    social?: number;
    nova?: number;
    nutriscore?: string;
    ecoscore?: string;
  };
}

interface Analysis {
  _id: string;
  productId: string;
  productSnapshot: Product;
  results: {
    healthScore: number;
    environmentScore: number;
    socialScore: number;
    recommendations: string[];
  };
  alternatives?: Product[];
  createdAt: string;
}

interface ProductState {
  // ƒÆ’†â€™aaâ€šÂ¬‚Â°tat
  recentScans: Analysis[];
  favorites: string[];
  searchHistory: string[];
  currentAnalysis: Analysis | null;
  isAnalyzing: boolean;
  
  // Actions
  addRecentScan: (analysis: Analysis) => void;
  toggleFavorite: (productId: string) => void;
  addToSearchHistory: (query: string) => void;
  setCurrentAnalysis: (analysis: Analysis | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  clearRecentScans: () => void;
  clearSearchHistory: () => void;
  
  // Getters
  isFavorite: (productId: string) => boolean;
  getRecentScan: (productId: string) => Analysis | undefined;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      // ƒÆ’†â€™aaâ€šÂ¬‚Â°tat initial
      recentScans: [],
      favorites: [],
      searchHistory: [],
      currentAnalysis: null,
      isAnalyzing: false,
      
      // Actions
      addRecentScan: (analysis: Analysis) => {
        set((state) => {
          // ƒÆ’†â€™aaâ€šÂ¬‚Â°viter les doublons
          const filtered = state.recentScans.filter(
            scan => scan.productSnapshot._id !== analysis.productSnapshot._id
          );
          
          // Garder seulement les 50 derniers scans
          const newScans = [analysis, ...filtered].slice(0, 50);
          
          return { recentScans: newScans };
        });
      },
      
      toggleFavorite: (productId: string) => {
        set((state) => {
          const isFavorite = state.favorites.includes(productId);
          const newFavorites = isFavorite
            ? state.favorites.filter(id => id !== productId)
            : [...state.favorites, productId];
          
          return { favorites: newFavorites };
        });
      },
      
      addToSearchHistory: (query: string) => {
        if (!query.trim()) return;
        
        set((state) => {
          // ƒÆ’†â€™aaâ€šÂ¬‚Â°viter les doublons et garder seulement les 20 dernieres recherches
          const filtered = state.searchHistory.filter(q => q !== query);
          const newHistory = [query, ...filtered].slice(0, 20);
          
          return { searchHistory: newHistory };
        });
      },
      
      setCurrentAnalysis: (analysis: Analysis | null) => {
        set({ currentAnalysis: analysis });
      },
      
      setIsAnalyzing: (isAnalyzing: boolean) => {
        set({ isAnalyzing });
      },
      
      clearRecentScans: () => {
        set({ recentScans: [] });
      },
      
      clearSearchHistory: () => {
        set({ searchHistory: [] });
      },
      
      // Getters
      isFavorite: (productId: string) => {
        return get().favorites.includes(productId);
      },
      
      getRecentScan: (productId: string) => {
        return get().recentScans.find(
          scan => scan.productSnapshot._id === productId
        );
      }
    }),
    {
      name: 'ecolojia-products',
      partialize: (state) => ({
        recentScans: state.recentScans.slice(0, 20), // Persister seulement les 20 derniers
        favorites: state.favorites,
        searchHistory: state.searchHistory
      })
    }
  )
);

