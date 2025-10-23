// frontend/src/utils/buildAlgoliaFilters.ts
export interface FilterState {
  brands?: string[];
  categories?: string[];
  productType?: 'food' | 'cosmetics' | 'detergent';
  minScore?: number;
  maxScore?: number;
}

export const buildAlgoliaFilters = (filters: FilterState) => {
  const facetFilters: string[][] = [];
  const numericFilters: string[] = [];
  
  // Filtres par marques
  if (filters.brands && filters.brands.length > 0) {
    filters.brands.forEach(brand => {
      facetFilters.push([`brands:${brand}`]);
    });
  }
  
  // Filtres par catégories
  if (filters.categories && filters.categories.length > 0) {
    filters.categories.forEach(category => {
      facetFilters.push([`categories.lvl0:${category}`]);
    });
  }
  
  // Filtre par type de produit
  if (filters.productType) {
    facetFilters.push([`productType:${filters.productType}`]);
  }
  
  // Filtres numériques pour le score
  if (typeof filters.minScore === 'number') {
    numericFilters.push(`score>=${filters.minScore}`);
  }
  if (typeof filters.maxScore === 'number') {
    numericFilters.push(`score<=${filters.maxScore}`);
  }
  
  return { 
    facetFilters: facetFilters.length > 0 ? facetFilters : undefined,
    numericFilters: numericFilters.length > 0 ? numericFilters : undefined
  };
};

// Helper pour extraire les filtres depuis l'URL
export const parseFiltersFromURL = (searchParams: URLSearchParams): FilterState => {
  return {
    brands: searchParams.getAll('brands'),
    categories: searchParams.getAll('categories'),
    productType: searchParams.get('productType') as any,
    minScore: searchParams.get('minScore') ? Number(searchParams.get('minScore')) : undefined,
    maxScore: searchParams.get('maxScore') ? Number(searchParams.get('maxScore')) : undefined
  };
};
