// PATH: backend/src/controllers/detergentController.ts
import { Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DetergentScorer } = require('../scorers/detergent/detergentScorer');

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

export const analyzeDetergentController = async (req: Request, res: Response) => {
  try {
    const { barcode, name, composition, ingredients, certifications = [] } = req.body || {};
    const list = normalizeIngredients(composition || ingredients);
    if (!list.length) {
      return res.status(400).json({ success: false, error: 'COMPOSITION_OR_INGREDIENTS_REQUIRED' });
    }

    const scorer = new DetergentScorer();
    const raw = await scorer.analyzeDetergent(list, name || 'Produit ménager', certifications);

    const value = Math.round(raw?.score ?? 0);
    const out = {
      id: (global as any).crypto?.randomUUID?.() || String(Date.now()),
      category: 'detergent',
      product: { name: name || 'Produit ménager', barcode: barcode || null },
      score: { value, label: labelFromScore(value) },
      risks: [],
      highlights: Array.isArray(raw?.insights) ? raw.insights.map((i: any) => (i?.title || i?.content || JSON.stringify(i))) : [],
      recommendations: Array.isArray(raw?.alternatives) ? raw.alternatives.map((a: any) => a?.title || a) : [],
      sources: ['REACH', 'ECHA 2024', 'EU Ecolabel'],
      raw
    };

    return res.json({ success: true, data: out });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'DETERGENT_ANALYSIS_FAILED', details: error?.message });
  }
};
