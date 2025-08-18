// PATH: frontend/src/services/visionService.ts
import { post } from "./apiClient";
import type { ApiResponse, OcrResult } from "../types/api";

export async function analyzeImage(file: File): Promise<OcrResult> {
  const form = new FormData();
  form.append("image", file);
  const data = await post<ApiResponse<OcrResult>>("/api/vision/analyze-image", form, {
    "Content-Type": "multipart/form-data",
  });
  if (data?.success && data.data) return data.data;
  throw new Error(data?.error?.message || "Échec de l'OCR");
}
