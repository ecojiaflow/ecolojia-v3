// PATH: frontend/src/types/api.ts
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
};

export type ProductScore = {
  nutriScore?: string;
  novaGroup?: number;
  ecoScore?: string | number;
  warnings?: string[];
};

export type ProductInfo = {
  id?: string;
  ean?: string;
  barcode?: string;
  name: string;
  brand?: string;
  quantity?: string;
  category?: "food" | "cosmetics" | "detergents" | string;
  imageUrl?: string;
  ingredients?: string[];
  allergens?: string[];
};

export type AnalysisResult = {
  product: ProductInfo;
  score: ProductScore;
  risks?: Array<{ id?: string; level: "low" | "medium" | "high"; title: string; details?: string }>;
  alternatives?: ProductInfo[];
  raw?: Record<string, unknown>;
};

export type OcrResult = {
  ingredients?: string[];
  barcode?: string;
  text?: string;
};
