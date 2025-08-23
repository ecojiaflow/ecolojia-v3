// PATH: frontend/src/services/ApiAdapter.ts
import type { AnalysisResult, ProductInfo, ScoreBundle } from '../types/api';

const clamp01 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function normalizeProduct(raw: any): ProductInfo {
  return {
    id: raw?.id ?? raw?._id ?? undefined,
    barcode: raw?.barcode ?? raw?.code ?? undefined,
    name: raw?.name ?? raw?.product_name ?? 'Produit',
    brand: raw?.brand ?? raw?.brands ?? undefined,
    imageUrl: raw?.imageUrl ?? raw?.image_front_url ?? raw?.image ?? undefined,
    categories: toCategories(raw?.categories) as ProductInfo['categories'],
    ingredients: Array.isArray(raw?.ingredients) ? raw.ingredients : parseIngredients(raw?.ingredients_text),
    quantity: raw?.quantity ?? undefined,
    origin: raw?.origin ?? raw?.origins ?? undefined
  };
}

function toCategories(x: any): string[]|undefined {
  if (!x) return undefined;
  if (Array.isArray(x)) return x;
  if (typeof x === 'string') return x.split(',').map(s => s.trim());
  return undefined;
}
function parseIngredients(s?: string): string[]|undefined {
  if (!s) return undefined;
  return s.split(/[,;ï¿½\n]/).map(v => v.trim()).filter(Boolean);
}

export function normalizeScores(raw: any): ScoreBundle {
  const healthScore = clamp01(raw?.healthScore ?? raw?.health ?? raw?.score ?? 0);
  const environmentScore = clamp01(raw?.environmentScore ?? raw?.eco ?? 0);
  const global = clamp01(raw?.global ?? Math.round((healthScore + environmentScore) / 2));
  const nova = raw?.nova ?? null;
  const nutriscore = raw?.nutriscore ?? null;
  const ecoscore = raw?.ecoscore ?? null;
  return { healthScore, environmentScore, global, nova, nutriscore, ecoscore };
}

export function computeLabel(s: ScoreBundle): AnalysisResult['label'] {
  const g = s.global ?? Math.round((s.healthScore + s.environmentScore) / 2);
  if (g >= 80) return 'A';
  if (g >= 65) return 'B';
  if (g >= 50) return 'C';
  if (g >= 35) return 'D';
  return 'E';
}

export function normalizeAnalysisResponse(raw: any): AnalysisResult {
  // Format A
  if (raw && raw.success === true && raw.data) {
    const p = normalizeProduct(raw.data.product ?? raw.data);
    const s = normalizeScores(raw.data.score ?? raw.data.scores ?? raw.data);
    const label = computeLabel(s);
    return { product: p, scores: s, label, details: raw.data.details, timestamp: new Date().toISOString() };
  }
  // Format B
  if (raw && (raw.globalScore !== undefined || raw.scores)) {
    const p = normalizeProduct(raw.product ?? raw);
    const s = normalizeScores({ global: raw.globalScore, ...raw.scores });
    const label = computeLabel(s);
    return { product: p, scores: s, label, details: raw.details, timestamp: new Date().toISOString() };
  }
  // Fallback robuste
  const p = normalizeProduct(raw?.product ?? {});
  const s = normalizeScores(raw?.scores ?? {});
  const label = computeLabel(s);
  return { product: p, scores: s, label, details: raw?.details ?? {}, timestamp: new Date().toISOString() };
}

// Alias pour compatibilité
export const adaptResponse = normalizeAnalysisResponse;
