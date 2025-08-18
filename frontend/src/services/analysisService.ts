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
    const data = await get<ApiResponse<AnalysisResult>>("/api/analysis/by-barcode", { barcode });
    if (data?.success && data.data) return data.data;
    throw new Error(data?.error?.message || "Échec GET /by-barcode");
  } catch {
    try {
      const data = await post<ApiResponse<AnalysisResult>>("/api/analysis", { barcode });
      if (data?.success && data.data) return data.data;
      throw new Error(data?.error?.message || "Échec POST /analysis");
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
    const data = await post<ApiResponse<AnalysisResult>>("/api/analysis/manual", payload, {
      "Content-Type": "application/json",
    });
    if (data?.success && data.data) return data.data;
    throw new Error(data?.error?.message || "Analyse manuelle indisponible");
  } catch (e) {
    return fallbackIfDemo(e);
  }
}
