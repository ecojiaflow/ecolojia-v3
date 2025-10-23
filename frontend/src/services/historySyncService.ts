import { get, post } from "./apiClient";
import type { AnalysisResult } from "../types/api";
import { getToken } from "./authService";

export async function pushHistory(item: AnalysisResult): Promise<boolean> {
  try {
    const token = getToken();
    const res = await post("/history/v2", { item }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    return Boolean((res as any)?.success ?? true);
  } catch {
    try {
      const res = await post("/history", { item });
      return Boolean((res as any)?.success ?? true);
    } catch {
      return false;
    }
  }
}

export async function fetchHistory(): Promise<AnalysisResult[]> {
  try {
    const token = getToken();
    const res: any = await get("/history/v2", token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    return res?.items ?? res?.data ?? [];
  } catch {
    try {
      const res: any = await get("/history");
      return res?.items ?? res?.data ?? [];
    } catch {
      return [];
    }
  }
}
