// PATH: frontend/src/services/analysisService.ts
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

const ANALYSIS_PATH =
  // possibilité de surcharger via env si besoin (ex: /api/analysis/v2)
  (import.meta as any)?.env?.VITE_ANALYSIS_PATH || '/api/analysis';

function normalizeCategory(raw: any): Category {
  const s = String(raw || '').toLowerCase();
  if (s.includes('cosm')) return 'cosmetic';
  if (s.includes('deter') || s.includes('clean')) return 'detergent';
  return 'food';
}

/**
 * Analyse manuelle universelle (Render: POST /api/analysis)
 */
export async function analyzeManual(input: ManualAnalysisInput): Promise<AnalysisResult> {
  const payload: ManualAnalysisInput = {
    name: String(input?.name || 'Produit'),
    category: normalizeCategory(input?.category) as Category,
    ingredients: String(input?.ingredients || '').trim(),
  };

  if (!payload.ingredients) {
    // Le backend gère les validations, mais on renvoie une erreur claire côté front.
    throw new Error('Aucun ingrédient fourni pour l’analyse.');
  }

  const res = await api.post<AnalysisResult>(ANALYSIS_PATH, payload);
  // fallback sécurité au cas où l’API ne renverrait pas la catégorie
  if (!res?.category) {
    res.category = payload.category;
  }
  return res;
}

/**
 * Analyse à partir d’un code‑barres :
 * 1) Récupère le produit via /api/products/barcode/:code
 * 2) Construit une analyse manuelle cohérente et appelle /api/analysis
 */
export async function analyzeByBarcode(barcode: string): Promise<AnalysisResult> {
  const code = String(barcode || '').trim();
  if (!code) throw new Error('Code‑barres manquant.');

  const p = await productService.getByBarcode(code);

  // Normalisation tolérante des champs fréquents (Open Food Facts, internes, etc.)
  const name =
    p?.name ||
    p?.product_name ||
    p?.generic_name ||
    p?.brand ||
    p?.brands ||
    p?.label ||
    'Produit';

  const ingredients =
    p?.ingredients_text ||
    p?.ingredients ||
    p?.composition ||
    p?.ingredientsList ||
    '';

  const catRaw =
    p?.category ||
    (Array.isArray(p?.categories_tags) && p.categories_tags[0]) ||
    p?.mainCategory ||
    'food';

  const category = normalizeCategory(catRaw);

  return await analyzeManual({ name, category, ingredients });
}

/**
 * Analyse de texte direct (si tu as juste un bloc d’ingrédients)
 */
export async function analyzeText(ingredients: string, opts?: { name?: string; category?: Category }) {
  return analyzeManual({
    name: String(opts?.name || 'Produit'),
    category: normalizeCategory(opts?.category || 'food'),
    ingredients: String(ingredients || ''),
  });
}

/**
 * Tracking (no‑op si l’endpoint n’existe pas)
 */
export async function track(event: string, data?: any): Promise<void> {
  const payload = { event, data, ts: Date.now() };

  // 1) Endpoint moderne
  try {
    await api.post('/api/analytics/track', payload);
    return;
  } catch (e) {
    const msg = String((e as Error)?.message || '');
    if (!msg.startsWith('HTTP 404')) throw e;
  }

  // 2) Fallback legacy
  try {
    await api.post('/api/track', payload);
  } catch {
    // En dev, on ignore si pas d’endpoint
    if (import.meta.env.DEV) return;
  }
}

export const analysisService = {
  analyzeManual,
  analyzeByBarcode,
  analyzeText,
  track,
};

export default analysisService;
