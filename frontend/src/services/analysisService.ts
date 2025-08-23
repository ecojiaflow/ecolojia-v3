// PATH: frontend/src/services/analysisService.ts
import { get, post } from "./apiClient";
import type { AnalysisResult, ApiResponse } from "../types/api";
import { adaptResponse } from "./ApiAdapter";

const DEMO_SAMPLE: AnalysisResult = {
  product: {
    name: "Yaourt nature (démo)",
    brand: "ECOLOJIA",
    category: "food",
    ean: "3017620425035",
    ingredients: ["lait", "ferments lactiques", "sucre"],
  },
  score: { 
    nutriScore: "A", 
    novaGroup: 2, 
    ecoScore: "B", 
    warnings: [] as any 
  },
  risks: [],
  alternatives: [],
  raw: { demo: true },
} as any;

function isInDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === '1' || import.meta.env.VITE_DEMO_MODE === 'true';
}

function fallbackIfDemo(e: unknown): AnalysisResult {
  if (isInDemoMode()) {
    console.warn("[DEMO_MODE] API indisponible → renvoi d'un résultat simulé :", e);
    return DEMO_SAMPLE;
  }
  throw e instanceof Error ? e : new Error("Analyse indisponible");
}

export async function analyzeByBarcode(barcode: string): Promise<AnalysisResult> {
  try {
    // Utilise l'endpoint d'analyse auto du backend
    const data = await post<any>("/analyze/auto", { barcode });
    return adaptResponse(data);
  } catch (e) {
    console.error("Erreur analyse barcode:", e);
    return fallbackIfDemo(e);
  }
}

export async function analyzeManual(payload: {
  name: string;
  category: string;
  ingredients: string[];
}): Promise<AnalysisResult> {
  try {
    const data = await post<any>("/analyze/auto", {
      mode: "manual",
      category: payload.category,
      name: payload.name,
      ingredients: payload.ingredients.join(", "),
    });
    return adaptResponse(data);
  } catch (e) {
    console.error("Erreur analyse manuelle:", e);
    return fallbackIfDemo(e);
  }
}

export async function analyzeProduct(productId: string): Promise<AnalysisResult> {
  try {
    const data = await post<any>("/analyze/auto", { productId });
    return adaptResponse(data);
  } catch (e) {
    console.error("Erreur analyse produit:", e);
    return fallbackIfDemo(e);
  }
}

export async function analyzeFood(data: any): Promise<AnalysisResult> {
  try {
    const result = await post<any>("/analyze/food", data);
    return adaptResponse(result);
  } catch (e) {
    console.error("Erreur analyse alimentaire:", e);
    return fallbackIfDemo(e);
  }
}

export async function analyzeCosmetic(data: any): Promise<AnalysisResult> {
  try {
    const result = await post<any>("/cosmetics/analyze", data);
    return adaptResponse(result);
  } catch (e) {
    console.error("Erreur analyse cosmétique:", e);
    return fallbackIfDemo(e);
  }
}

export async function analyzeDetergent(data: any): Promise<AnalysisResult> {
  try {
    const result = await post<any>("/detergents/analyze", data);
    return adaptResponse(result);
  } catch (e) {
    console.error("Erreur analyse détergent:", e);
    return fallbackIfDemo(e);
  }
}

export const analysisService = {
  analyzeByBarcode,
  analyzeManual,
  analyzeProduct,
  analyzeFood,
  analyzeCosmetic,
  analyzeDetergent
};

export default analysisService;