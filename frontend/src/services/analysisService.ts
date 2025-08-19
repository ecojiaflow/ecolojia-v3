import { get, post } from "./apiClient";
import type { AnalysisResult, ApiResponse } from "../types/api";

const DEMO_SAMPLE: AnalysisResult = {
  product: {
    name: "Yaourt nature (démo)",
    brand: "ECOLOJIA",
    category: "food",
    ean: "3017620425035",
    ingredients: ["lait", "ferments lactiques", "sucre"],
  },
  score: { nutriScore: "A", novaGroup: 2, ecoScore: "B", warnings: [] },
  risks: [],
  alternatives: [],
  raw: { demo: true },
};

export async function analyzeByBarcode(barcode: string): Promise<AnalysisResult> {
  // Mode démo forcé temporairement
  console.log("Analyse code-barres (DEMO):", barcode);
  return { ...DEMO_SAMPLE, product: { ...DEMO_SAMPLE.product, ean: barcode } };
}

export async function analyzeManual(payload: {
  name: string;
  category: string;
  ingredients: string[];
}): Promise<AnalysisResult> {
  // Mode démo forcé temporairement
  console.log("Analyse manuelle (DEMO):", payload);
  return {
    ...DEMO_SAMPLE,
    product: {
      ...DEMO_SAMPLE.product,
      name: payload.name,
      category: payload.category,
      ingredients: payload.ingredients
    }
  };
}
