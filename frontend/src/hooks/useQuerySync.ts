import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export type SearchState = { q: string; brand?: string[]; category?: string[]; scoreMin?: number; scoreMax?: number; };

export function useQuerySync(state: SearchState, onHydrate: (s: SearchState)=>void) {
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const q = params.get("q") || "";
    const brand = params.getAll("brand");
    const category = params.getAll("category");
    const scoreMin = params.get("scoreMin") ? Number(params.get("scoreMin")) : undefined;
    const scoreMax = params.get("scoreMax") ? Number(params.get("scoreMax")) : undefined;
    onHydrate({ q, brand: brand.length?brand:undefined, category: category.length?category:undefined, scoreMin, scoreMax });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (state.q) next.set("q", state.q);
    state.brand?.forEach(b => next.append("brand", b));
    state.category?.forEach(c => next.append("category", c));
    if (typeof state.scoreMin === "number") next.set("scoreMin", String(state.scoreMin));
    if (typeof state.scoreMax === "number") next.set("scoreMax", String(state.scoreMax));
    setParams(next, { replace: false });
  }, [state.q, state.brand, state.category, state.scoreMin, state.scoreMax, setParams]);
}
