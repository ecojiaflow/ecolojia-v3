// PATH: frontend/src/services/analysisService.ts
import api, { ApiResponse } from './apiClient';

export interface ManualAnalysisInput {
  name: string;
  ingredients: string;
  category?: 'food' | 'cosmetic' | 'detergent' | string;
  brand?: string;
  barcode?: string;
  language?: 'fr'|'en';
}

function normalizeApiResponse(res: ApiResponse<any>) {
  if (!res.success) return { success: false, error: (res as any).error || 'ANALYSIS_FAILED' };
  const data = (res.data && (res as any).data?.data) ? (res as any).data.data : (res as any).data;
  return { success: true, data };
}

export async function analyzeManual(input: ManualAnalysisInput): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const category = (input.category || 'food').toLowerCase();

  if (category === 'cosmetic') {
    const res = await api.post('/cosmetics/analyze', {
      name: input.name,
      ingredients: input.ingredients,
      barcode: input.barcode,
      language: input.language || 'fr'
    });
    return normalizeApiResponse(res);
  }

  if (category === 'detergent') {
    const res = await api.post('/detergents/analyze', {
      name: input.name,
      composition: input.ingredients,
      barcode: input.barcode,
      language: input.language || 'fr'
    });
    return normalizeApiResponse(res);
  }

  // Default → legacy unified analysis (food)
  const res: ApiResponse<any> = await api.post('/analysis', {
    mode: 'manual',
    name: input.name,
    ingredients: input.ingredients,
    barcode: input.barcode
  });

  return normalizeApiResponse(res);
}

export async function analyzeByBarcode(barcode: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const res: ApiResponse<any> = await api.post('/analysis', {
    mode: 'barcode',
    barcode,
  });

  return normalizeApiResponse(res);
}

export default { analyzeManual, analyzeByBarcode };
