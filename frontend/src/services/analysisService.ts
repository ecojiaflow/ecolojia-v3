// PATH: src/services/analysisService.ts
import api from './apiClient';
import { productService } from './productService';

export type Category = 'food' | 'cosmetic' | 'detergent';

export interface ManualAnalysisInput {
  name: string;
  category: Category;
  ingredients: string;
}

export interface AnalysisResult {
  category: Category;
  nova?: number;
  nutriScore?: 'A'|'B'|'C'|'D'|'E';
  warnings?: string[];
  score?: number;
  details?: any;
}

export async function analyzeManual(input: ManualAnalysisInput): Promise<AnalysisResult> {
  return await api.post<AnalysisResult>('/api/analysis/manual', input);
}

export async function analyzeByBarcode(barcode: string): Promise<AnalysisResult> {
  const p = await productService.getByBarcode(barcode);
  const name =
    p?.name || p?.product_name || p?.generic_name || p?.brands || 'Produit';
  const ingredients =
    p?.ingredients_text || p?.ingredients || p?.composition || '';
  const category: Category =
    (p?.category as Category) ||
    (p?.categories_tags?.[0] as Category) ||
    'food';
  return await analyzeManual({ name, category, ingredients });
}

export const analysisService = { analyzeManual, analyzeByBarcode };
export default analysisService;
