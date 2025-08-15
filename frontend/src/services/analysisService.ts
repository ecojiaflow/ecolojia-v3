// PATH: frontend/src/services/analysisService.ts
import api, { ApiResponse } from './apiClient';

export interface ManualAnalysisInput {
  name: string;
  ingredients: string;
  category?: 'food' | 'cosmetic' | 'detergent' | string;
  brand?: string;
  barcode?: string;
}

export async function analyzeManual(input: ManualAnalysisInput): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const res: ApiResponse<any> = await api.post('/api/analysis', {
    mode: 'manual',
    ...input,
  });

  if (!res.success) return { success: false, error: res.error || 'ANALYSIS_FAILED' };

  // Tolérant: certains backends renvoient {data:{...}} d’autres directement l’objet
  const data = (res.data && res.data.data) ? res.data.data : res.data;
  return { success: true, data };
}

export async function analyzeByBarcode(barcode: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const res: ApiResponse<any> = await api.post('/api/analysis', {
    mode: 'barcode',
    barcode,
  });

  if (!res.success) return { success: false, error: res.error || 'ANALYSIS_FAILED' };

  const data = (res.data && res.data.data) ? res.data.data : res.data;
  return { success: true, data };
}

export default { analyzeManual, analyzeByBarcode };
