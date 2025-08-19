// PATH: frontend/src/services/analysisService.ts
import { get, post } from "./apiClient";
import type { AnalysisResult, ApiResponse } from "../types/api";
import { FLAGS } from "../config/featureFlags";
import { adaptResponse } from "./ApiAdapter";

const DEMO_SAMPLE: AnalysisResult = {
  product: {
    name: "Yaourt nature (démo)",
    brand: "ECOLOJIA",
    category: "food",
    ean: "3017620425035",
    ingredients: ["lait", "ferments lactiques", "sucre"],
  },
  score: { nutriScore: "A", novaGroup: 2, ecoScore: "B", warnings: [] as any },
  risks: [],
  alternatives: [],
  raw: { demo: true },
} as any;

function fallbackIfDemo(e: unknown): AnalysisResult {
  if (FLAGS.DEMO_MODE) {
    console.warn("[DEMO_MODE] API indisponible → renvoi d'un résultat simulé :", e);
    return DEMO_SAMPLE;
  }
  throw e instanceof Error ? e : new Error("Analyse indisponible");
}

export async function analyzeByBarcode(barcode: string): Promise<AnalysisResult> {
  try {
    // 1) Essai par GET si endpoint dispo
    const data = await get<ApiResponse<any> | any>("/api/analysis/by-barcode", { barcode });
    return adaptResponse(data);
  } catch {
    try {
      // 2) Fallback POST unifié
      const data = await post<ApiResponse<any> | any>("/api/analysis", { barcode });
      return adaptResponse(data);
    } catch (e) {
      return fallbackIfDemo(e);
    }
  }
}

export async function analyzeManual(payload: {
  name: string;
  category: string;
  ingredients: string[];
}): Promise<AnalysisResult> {
  try {
    const data = await post<ApiResponse<any> | any>("/api/analysis", {
      mode: "manual",
      category: payload.category,
      name: payload.name,
      ingredients: payload.ingredients.join(", "),
    });
    return adaptResponse(data);
  } catch (e) {
    return fallbackIfDemo(e);
  }
}