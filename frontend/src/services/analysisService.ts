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
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  warnings?: string[];
  score?: number;
  details?: any;
}

/** Analyse manuelle à partir d'un bloc texte (nom + ingrédients). */
export async function analyzeManual(input: ManualAnalysisInput): Promise<AnalysisResult> {
  return await api.post<AnalysisResult>('/api/analysis/manual', input);
}

/** Analyse à partir d'un code‑barres (récupère d'abord le produit). */
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

/**
 * Tracking tolérant :
 * - essaie /api/analytics/track (backend “propre”)
 * - sinon fallback /api/track
 * En DEV, si les endpoints n'existent pas, on ignore l’erreur pour ne pas casser l’UI.
 */
export async function track(event: string, data?: any): Promise<void> {
  const payload = { event, data, ts: Date.now() };

  // 1) endpoint “officiel”
  try {
    await api.post('/api/analytics/track', payload);
    return;
  } catch (e) {
    // continue vers fallback seulement si 404
    const msg = String((e as Error)?.message || '');
    if (!msg.startsWith('HTTP 404')) throw e;
  }

  // 2) fallback simple
  try {
    await api.post('/api/track', payload);
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[analysisService.track] noop in DEV:', (e as Error)?.message);
    }
  }
}

export const analysisService = { analyzeManual, analyzeByBarcode, track };
export default analysisService;
