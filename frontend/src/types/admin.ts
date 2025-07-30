// PATH: frontend/ecolojiaFrontV3/src/types/admin.ts
export interface AdminStats {
  totalProducts: number;
  totalImports: number;
  lastImportDate: string | null;
  successRate: number;
  averageConfidence: number;
  productsByCategory: {
    alimentaire: number;
    cosmetic: number;
    detergent: number;
  };
  recentActivity: {
    date: string;
    action: string;
    count: number;
  }[];
}

export interface RecentProduct {
  id: string;
  title: string;
  slug: string;
  category: string;
  brand?: string;
  eco_score?: number;
  ai_confidence?: number;
  confidence_color?: 'green' | 'orange' | 'red';
  verified_status?: 'verified' | 'pending' | 'rejected';
  created_at: string;
  image_url?: string;
}

export interface ImportLog {
  id: string;
  timestamp: string;
  status: 'success' | 'error' | 'running';
  productsProcessed: number;
  productsSuccess: number;
  productsFailed: number;
  duration?: number;
  errorMessage?: string;
  fileName?: string;
}

export interface ImportProgress {
  isRunning: boolean;
  currentProduct: number;
  totalProducts: number;
  status: string;
  startTime?: string;
  estimatedCompletion?: string;
}

export interface AdminApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
// EOF