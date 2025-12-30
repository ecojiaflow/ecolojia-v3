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
  // Nouveaux champs multi-categories
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

// Export des types de categories
export * from './categories';
export * from './search';



// Constitution Ecolojia V3.0
export interface ConstitutionCard {
  title: string;
  content: string;
  emoji?: string;
}

export interface Constitution {
  cards: ConstitutionCard[];
  level?: number;
  sublevel?: string;
  habit?: {
    id: string;
    title: string;
    category?: string;
  };
}
