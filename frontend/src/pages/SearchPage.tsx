import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FiltersPanel from "@/components/FiltersPanel";
import { searchAlgolia } from "@/lib/algoliaClient";

type Hit = {
  objectID: string;
  name?: string;
  brand?: string;
  category?: string;
  barcode?: string;
  healthScore?: number;
  imageUrl?: string;
};

function useQueryParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SearchPage() {
  const navigate = useNavigate();
  const qs = useQueryParams();

  const [q, setQ] = useState(qs.get("q") || "");
  const [brands, setBrands] = useState<string[]>(qs.get("brands") ? qs.get("brands")!.split(",").filter(Boolean) : []);
  const [categories, setCategories] = useState<string[]>(qs.get("categories") ? qs.get("categories")!.split(",").filter(Boolean) : []);
  const [hsMin, setHsMin] = useState<number>(qs.get("hsMin") ? Number(qs.get("hsMin")) : 0);
  const [hsMax, setHsMax] = useState<number>(qs.get("hsMax") ? Number(qs.get("hsMax")) : 100);

  const [hits, setHits] = useState<Hit[]>([]);
  const [nbHits, setNbHits] = useState(0);
  const [page, setPage] = useState(0);
  const [nbPages, setNbPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qParam = qs.get("q") || "";
    setQ(qParam);
    setBrands(qs.get("brands") ? qs.get("brands")!.split(",").filter(Boolean) : []);
    setCategories(qs.get("categories") ? qs.get("categories")!.split(",").filter(Boolean) : []);
    setHsMin(qs.get("hsMin") ? Number(qs.get("hsMin")) : 0);
    setHsMax(qs.get("hsMax") ? Number(qs.get("hsMax")) : 100);
    setPage(qs.get("page") ? Number(qs.get("page")) : 0);
  }, [qs]);

  const facetFilters = useMemo(() => {
    const out: (string | string[])[] = [];
    if (brands.length) out.push(brands.map((b) => `brand:${b}`));
    if (categories.length) out.push(categories.map((c) => `category:${c}`));
    return out.length ? out : undefined;
  }, [brands.join(","), categories.join(",")]);

  const numericFilters = useMemo(() => {
    // IMPORTANT: aucun filtre tant que l'utilisateur n'a pas resserré la plage
    if (hsMin <= 0 && hsMax >= 100) return undefined;
    return [`healthScore>=${hsMin}`, `healthScore<=${hsMax}`];
  }, [hsMin, hsMax]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const resp = await searchAlgolia<Hit>({
          query: q || "",
          page,
          hitsPerPage: 20,
          facetFilters,
          numericFilters,
        });
        if (!cancelled) {
          setHits(resp.hits);
          setNbHits(resp.nbHits);
          setNbPages(resp.nbPages);
        }
      } catch (e) {
        console.error("Search error", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [q, page, JSON.stringify(facetFilters), JSON.stringify(numericFilters)]);

  function updateURL(next: { q?: string; page?: number; brands?: string[]; categories?: string[]; hsMin?: number; hsMax?: number }) {
    const params = new URLSearchParams();
    const _q = next.q ?? q;
    if (_q) params.set("q", _q);

    const _brands = next.brands ?? brands;
    const _categories = next.categories ?? categories;
    const _hsMin = Number.isFinite(next.hsMin as number) ? (next.hsMin as number) : hsMin;
    const _hsMax = Number.isFinite(next.hsMax as number) ? (next.hsMax as number) : hsMax;
    const _page = Number.isFinite(next.page as number) ? (next.page as number) : page;

    if (_brands.length) params.set("brands", _brands.join(","));
    if (_categories.length) params.set("categories", _categories.join(","));
    params.set("hsMin", String(_hsMin));
    params.set("hsMax", String(_hsMax));
    if (_page > 0) params.set("page", String(_page));

    navigate({ pathname: "/search", search: `?${params.toString()}` }, { replace: true });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    updateURL({ q, page: 0 });
  }

  return (
    <div className="container mx-auto px-3 py-4">
      <form onSubmit={onSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit…"
            aria-label="Rechercher"
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white">Rechercher</button>
        </div>
        <div className="text-xs text-gray-500 mt-1">Entrée pour relancer — mise à jour auto.</div>
      </form>

      <div className="flex flex-col md:flex-row gap-4">
        <FiltersPanel
          q={q}
          selectedBrands={brands}
          selectedCategories={categories}
          hsMin={hsMin}
          hsMax={hsMax}
          onChange={(next) => {
            setPage(0);
            setBrands(next.brands);
            setCategories(next.categories);
            setHsMin(next.hsMin);
            setHsMax(next.hsMax);
            updateURL({ brands: next.brands, categories: next.categories, hsMin: next.hsMin, hsMax: next.hsMax, page: 0 });
          }}
        />

        <main className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-700">
              {loading ? "Recherche…" : `${nbHits} résultats`}
            </div>
            <div className="text-xs text-gray-500">Page {page + 1} / {Math.max(nbPages, 1)}</div>
          </div>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hits.map((h) => (
              <li key={h.objectID} className="border rounded-xl p-3 bg-white">
                <div className="text-sm text-gray-500 mb-1">{h.brand || "—"} • {h.category || "—"}</div>
                <div className="font-medium">{h.name || h.barcode || "Produit"}</div>
                <div className="text-xs text-gray-500 mt-1">Health: {Number.isFinite(h.healthScore as number) ? h.healthScore : "—"}</div>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 mt-4">
            <button
              disabled={page <= 0}
              onClick={() => { const p = Math.max(0, page - 1); setPage(p); updateURL({ page: p }); }}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              disabled={page >= nbPages - 1}
              onClick={() => { const p = Math.min(nbPages - 1, page + 1); setPage(p); updateURL({ page: p }); }}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
