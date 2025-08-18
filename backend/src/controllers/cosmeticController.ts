// PATH: backend/src/controllers/cosmeticController.ts
import { Request, Response } from 'express';
// Reuse existing CommonJS scorer
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CosmeticScorer = require('../scorers/cosmetic/cosmeticScorer');

type Severity = 'low' | 'mid' | 'high';

function normalizeIngredients(input?: string | string[]): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(s => String(s).toUpperCase().trim()).filter(Boolean);
  return String(input)
    .replace(/INGRÉDIENTS?|INGREDIENTS?\s*[:;-]?\s*/i, '')
    .replace(/\([^)]*\)/g, '')
    .split(/[,;]\s*|\n+/)
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);
}

function labelFromScore(v: number): 'A'|'B'|'C'|'D'|'E' {
  if (v >= 90) return 'A';
  if (v >= 75) return 'B';
  if (v >= 60) return 'C';
  if (v >= 40) return 'D';
  return 'E';
}

export const analyzeCosmeticController = async (req: Request, res: Response) => {
  try {
    const { barcode, name, ingredients, inciList } = req.body || {};
    const list = normalizeIngredients(ingredients || inciList);
    if (!list.length) {
      return res.status(400).json({ success: false, error: 'INGREDIENTS_REQUIRED' });
    }

    const scorer = new CosmeticScorer();
    const raw = await scorer.analyzeCosmetic({
      name: name || 'Produit',
      ingredients: list.join(', ')
    });

    const value = Math.round(raw?.score ?? 0);
    const out = {
      id: (global as any).crypto?.randomUUID?.() || String(Date.now()),
      category: 'cosmetic',
      product: { name: name || 'Produit', barcode: barcode || null },
      score: { value, label: raw?.grade || labelFromScore(value) },
      risks: [],
      highlights: (raw?.highlights || []).map((h: any) => typeof h === 'string' ? h : (h?.message || h?.title || JSON.stringify(h))),
      recommendations: Array.isArray(raw?.recommendations) ? raw.recommendations : [],
      sources: raw?.meta?.sources || [],
      raw
    };

    return res.json({ success: true, data: out });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'COSMETIC_ANALYSIS_FAILED', details: error?.message });
  }
};
