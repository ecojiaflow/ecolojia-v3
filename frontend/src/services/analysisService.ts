// PATH: frontend/src/services/analysisService.ts
import { get, post } from "./apiClient";
import type { AnalysisResult, ApiResponse } from "../types/api";

export async function analyzeByBarcode(barcode: string): Promise<AnalysisResult> {
  try {
    const data = await get<ApiResponse<AnalysisResult>>("/api/analysis/by-barcode", { barcode });
    if (data?.success && data.data) return data.data;
  } catch { /* fallback */ }
  const data = await post<ApiResponse<AnalysisResult>>("/api/analysis", { barcode });
  if (data?.success && data.data) return data.data;
  throw new Error(data?.error?.message || "Échec de l'analyse par code-barres");
}

export async function analyzeManual(payload: {
  name: string;
  category: string;
  ingredients: string[];
}): Promise<AnalysisResult> {
  const data = await post<ApiResponse<AnalysisResult>>("/api/analysis/manual", payload, {
    "Content-Type": "application/json",
  });
  if (data?.success && data.data) return data.data;
  throw new Error(data?.error?.message || "Échec de l'analyse manuelle");
}