const API_BASE = (import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "");

export type SearchResult = {
  items: any[];
  source: "algolia" | "local";
};

async function fetchJSON(url: string) {
  const res = await fetch(url, { credentials: "include" as RequestCredentials });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function normalizeItemsFromAlgolia(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload?.hits)) return payload.hits;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  if (Array.isArray(payload?.products)) return payload.products;
  return [];
}

function normalizeItemsFromLocal(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload)) return payload;
  return [];
}

/**
 * Algolia-first → fallback local
 * - Algolia: GET /api/algolia/search?q=
 *   shape possible: { hits: [...] } OU { data: { products: [...] } } OU { products: [...] }
 * - Local:   GET /api/products?query=
 *   shape possible: { products: [...] } OU { items: [...] } OU [ ... ]
 */
export async function searchProducts(query: string): Promise<SearchResult> {
  const q = encodeURIComponent(query.trim());
  if (!q) return { items: [], source: "local" };

  // 1) Tentative Algolia (unifiée)
  try {
    const data = await fetchJSON(`${API_BASE}/api/algolia/search?q=${q}`);
    const items = normalizeItemsFromAlgolia(data);
    if (items.length > 0) return { items, source: "algolia" };
  } catch {
    // ignore -> fallback
  }

  // 2) Fallback local
  try {
    const data = await fetchJSON(`${API_BASE}/api/products?query=${q}`);
    const items = normalizeItemsFromLocal(data);
    return { items, source: "local" };
  } catch {
    return { items: [], source: "local" };
  }
}

// Helpers de normalisation pour l'UI
export function toDisplayProduct(p: any) {
  const name = p?.name ?? p?.product_name ?? "Produit";
  const brand = p?.brand ?? p?.brands ?? "Marque inconnue";
  const code = p?.barcode ?? p?.code ?? p?._id ?? "";
  const category = (p?.category ?? p?.categories_tags?.[0] ?? "").toString().toLowerCase();
  const imageUrl =
    p?.imageUrl ||
    p?.image_front_url ||
    p?.image_small_url ||
    "/placeholder-product.png";

  const score =
    p?.scores?.global ??
    p?.globalScore ??
    p?.healthScore ??
    null;

  return { name, brand, code, category, imageUrl, score, raw: p };
}
