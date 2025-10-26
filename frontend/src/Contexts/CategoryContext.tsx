// PATH: frontend/src/Contexts/CategoryContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

/**
 * Types de catégories supportées
 * - food: Produits alimentaires (8 composantes scoring)
 * - cosmetics: Produits cosmétiques (5 composantes scoring)
 * - detergents: Produits détergents (5 composantes scoring)
 */
export type Category = 'food' | 'cosmetics' | 'detergents';

/**
 * Métadonnées par catégorie
 */
export interface CategoryMetadata {
  id: Category;
  label: string;
  icon: string;
  color: string;
  scoringComponents: number;
  description: string;
  apiEndpoint: string;
}

/**
 * Configuration des catégories
 */
export const CATEGORY_CONFIG: Record<Category, CategoryMetadata> = {
  food: {
    id: 'food',
    label: 'Alimentaire',
    icon: 'Apple',
    color: 'green',
    scoringComponents: 8,
    description: 'Produits alimentaires et boissons',
    apiEndpoint: '/api/products'
  },
  cosmetics: {
    id: 'cosmetics',
    label: 'Cosmétiques',
    icon: 'Sparkles',
    color: 'pink',
    scoringComponents: 5,
    description: 'Produits de beauté et cosmétiques',
    apiEndpoint: '/api/cosmetics'
  },
  detergents: {
    id: 'detergents',
    label: 'Détergents',
    icon: 'Droplet',
    color: 'blue',
    scoringComponents: 5,
    description: 'Produits ménagers et détergents',
    apiEndpoint: '/api/detergents'
  }
};

/**
 * Interface du Context
 */
interface CategoryContextType {
  category: Category;
  metadata: CategoryMetadata;
  setCategory: (category: Category) => void;
  isCategory: (cat: Category) => boolean;
  getCategoryColor: (cat?: Category) => string;
}

/**
 * Clés de stockage
 */
const STORAGE_KEY = 'ecolojia:category';
const DEFAULT_CATEGORY: Category = 'food';

/**
 * Context
 */
const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

/**
 * Provider Props
 */
interface CategoryProviderProps {
  children: ReactNode;
  defaultCategory?: Category;
}

/**
 * Provider Component
 * 
 * Gère la catégorie active avec:
 * - Persistence localStorage (priorité 1)
 * - Persistence sessionStorage (priorité 2)
 * - Valeur par défaut (priorité 3)
 */
export const CategoryProvider: React.FC<CategoryProviderProps> = ({ 
  children, 
  defaultCategory = DEFAULT_CATEGORY 
}) => {
  // Initialisation avec persistence
  const [category, setCategoryState] = useState<Category>(() => {
    // 1. Tenter localStorage (persiste entre sessions)
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && Object.keys(CATEGORY_CONFIG).includes(stored)) {
        return stored as Category;
      }
    } catch (error) {
      console.warn('[CategoryContext] localStorage unavailable:', error);
    }

    // 2. Tenter sessionStorage (persiste pendant session)
    try {
      const sessionStored = sessionStorage.getItem(STORAGE_KEY);
      if (sessionStored && Object.keys(CATEGORY_CONFIG).includes(sessionStored)) {
        return sessionStored as Category;
      }
    } catch (error) {
      console.warn('[CategoryContext] sessionStorage unavailable:', error);
    }

    // 3. Utiliser valeur par défaut
    return defaultCategory;
  });

  // Metadata de la catégorie active
  const metadata = CATEGORY_CONFIG[category];

  /**
   * Setter avec persistence et validation
   */
  const setCategory = useCallback((newCategory: Category) => {
    // Validation
    if (!Object.keys(CATEGORY_CONFIG).includes(newCategory)) {
      console.error(`[CategoryContext] Invalid category: ${newCategory}`);
      return;
    }

    // Update state
    setCategoryState(newCategory);

    // Persist
    try {
      localStorage.setItem(STORAGE_KEY, newCategory);
      sessionStorage.setItem(STORAGE_KEY, newCategory);
    } catch (error) {
      console.warn('[CategoryContext] Storage unavailable:', error);
    }

    // Analytics (optionnel - à activer si vous avez Google Analytics)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'category_change', {
        category: newCategory,
        previous_category: category
      });
    }
  }, [category]);

  /**
   * Helper: Vérifier si une catégorie est active
   */
  const isCategory = useCallback((cat: Category): boolean => {
    return category === cat;
  }, [category]);

  /**
   * Helper: Obtenir la couleur d'une catégorie
   */
  const getCategoryColor = useCallback((cat?: Category): string => {
    const targetCat = cat || category;
    return CATEGORY_CONFIG[targetCat]?.color || 'gray';
  }, [category]);

  // Sync entre onglets (optionnel mais pro)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newCat = e.newValue as Category;
        if (Object.keys(CATEGORY_CONFIG).includes(newCat)) {
          setCategoryState(newCat);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: CategoryContextType = {
    category,
    metadata,
    setCategory,
    isCategory,
    getCategoryColor
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

/**
 * Hook personnalisé pour utiliser le context
 * 
 * @throws Error si utilisé hors du Provider
 */
export const useCategory = (): CategoryContextType => {
  const context = useContext(CategoryContext);
  
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  
  return context;
};

/**
 * Export du context pour cas d'usage avancés
 */
export { CategoryContext };