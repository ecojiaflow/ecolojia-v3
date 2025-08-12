export interface Product {
  id: string;
  name: string;
  brand: string;
  image?: string;
  category?: string;
  nutriScore?: string;
  ecoScore?: string;
  healthScore?: number;
  labels?: string[];
  isNew?: boolean;
}

export interface SearchFilters {
  categories?: string[];
  nutriScore?: string[];
  labels?: string[];
  priceRange?: [number, number];
}

export interface SearchResult {
  hits: Product[];
  nbHits: number;
  page: number;
  nbPages: number;
  processingTimeMS: number;
}

