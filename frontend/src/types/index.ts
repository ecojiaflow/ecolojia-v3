import { CategoryType } from './categories';

export interface Product {
  id: string;
  nameKey: string;
  brandKey: string;
  descriptionKey: string;
  ethicalScore: number;
  category: string | CategoryType;
  price: number;
  currency: string;
  image: string;
  tagsKeys: string[];
  verified: boolean;
  affiliateLink: string;
  certificationsKeys: string[];
  aiConfidence: number;
  zonesDisponibles: string[];
  // Nouveaux champs multi-catégories
  slug?: string;
  resumeFr?: string;
  confidencePct?: number;
  confidenceColor?: string;
  verifiedStatus?: string;
}

export interface SearchFilters {
  category?: CategoryType;
  tags?: string[];
  minScore?: number;
  maxPrice?: number;
  verified?: boolean;
  zones?: string[];
}

export interface ProductStats {
  totalProducts: number;
  byCategory: Record<CategoryType, number>;
  averageScore: number;
  topTags: string[];
}

// Export des types de catégories
export * from './categories';
