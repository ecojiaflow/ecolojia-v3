import { get, post } from "./apiClient";
import type { AnalysisResult, ApiResponse } from "../types/api";
import { ENV } from "../env";

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

function fallbackIfDemo(e: unknown): AnalysisResult {
  if (ENV.DEMO_MODE) {
    console.warn("Mode DEMO actif, erreur API:", e);
    return DEMO_SAMPLE;
  }
  throw e instanceof Error ? e : new Error("Analyse indisponible");
}

export async function analyzeByBarcode(barcode: string): Promise<AnalysisResult> {
  try {
    const data = await post<ApiResponse<AnalysisResult>>("/api/analysis", { 
      barcode,
      mode: "barcode" 
    });
    if (data?.success && data.data) return data.data;
    throw new Error(data?.error?.message || "Échec analyse code-barres");
  } catch (e) {
    return fallbackIfDemo(e);
  }
}

export async function analyzeManual(payload: {
  name: string;
  category: string;
  ingredients: string[];
}): Promise<AnalysisResult> {
  try {
    // Format pour l''endpoint unifié /api/analysis
    const requestData = {
      mode: "manual",
      name: payload.name,
      category: payload.category || "food",
      ingredients: Array.isArray(payload.ingredients) 
        ? payload.ingredients.join(", ") 
        : payload.ingredients,
      language: "fr"
    };
    
    console.log("Envoi analyse manuelle:", requestData);
    
    const data = await post<ApiResponse<AnalysisResult>>("/api/analysis", requestData);
    if (data?.success && data.data) return data.data;
    throw new Error(data?.error?.message || "Analyse manuelle indisponible");
  } catch (e) {
    console.error("Erreur analyse manuelle:", e);
    return fallbackIfDemo(e);
  }
}
