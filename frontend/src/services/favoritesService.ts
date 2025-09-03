import { get, post } from "./apiClient";
import type { FavoriteItem, ProductInfo, ScoreBlock } from "../types/api";

const LS_KEY = "ecolojia-favorites";

function loadLocal(): FavoriteItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveLocal(list: FavoriteItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export async function addFavorite(p: ProductInfo, s?: ScoreBlock): Promise<void> {
  const key = p.ean || p.id || `${p.name || "prod"}-${Date.now()}`;
  try {
    await post("/favorites/v2", { key, product: p, score: s });
  } catch {
    try { await post("/favorites", { key, product: p, score: s }); } catch {}
    const current = loadLocal();
    current.unshift({ key, product: p, score: s, savedAt: new Date().toISOString() });
    saveLocal(current);
  }
}

export async function listFavorites(): Promise<FavoriteItem[]> {
  try {
    const res: any = await get("/favorites/v2");
    return res?.items ?? res?.data ?? [];
  } catch {
    try {
      const res: any = await get("/favorites");
      return res?.items ?? res?.data ?? [];
    } catch {
      return loadLocal();
    }
  }
}
