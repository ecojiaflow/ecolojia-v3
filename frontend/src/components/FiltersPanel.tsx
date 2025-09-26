import React, { useEffect, useMemo, useState } from "react";
import { searchAlgolia, FacetMap } from "@/lib/algoliaClient";

type Props = {
  q: string;
  selectedBrands: string[];
  selectedCategories: string[];
  hsMin: number;
  hsMax: number;
  onChange: (next: { brands: string[]; categories: string[]; hsMin: number; hsMax: number }) => void;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function sortFacet(map?: Record<string, number>): Array<[string, number]> {
  if (!map) return [];
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 200);
}

function toggleMulti(
  key: "brands" | "categories",
  value: string,
  ctx: { selectedBrands: string[]; selectedCategories: string[]; hsMin: number; hsMax: number; onChange: Props["onChange"] }
) {
  const { selectedBrands, selectedCategories, hsMin, hsMax, onChange } = ctx;
  const arr = key === "brands" ? [...selectedBrands] : [...selectedCategories];
  const i = arr.indexOf(value);
  if (i >= 0) arr.splice(i, 1); else arr.push(value);
  if (key === "brands") onChange({ brands: arr, categories: selectedCategories, hsMin, hsMax });
  else onChange({ brands: selectedBrands, categories: arr, hsMin, hsMax });
}

function buildFacetFilters(brands: string[], categories: string[]): (string | string[])[] | undefined {
  const out: (string | string[])[] = [];
  if (brands.length) out.push(brands.map((b) => `brand:${b}`));
  if (categories.length) out.push(categories.map((c) => `category:${c}`));
  return out.length ? out : undefined;
}

function buildNumericFilters(min: number, max: number): string[] | undefined {
  // Ne pas filtrer tant que l'utilisateur n'a pas resserré la plage
  if (min <= 0 && max >= 100) return undefined;
  const filters: string[] = [];
  if (Number.isFinite(min)) filters.push(`healthScore>=${min}`);
  if (Number.isFinite(max)) filters.push(`healthScore<=${max}`);
  return filters.length ? filters : undefined;
}

export default function FiltersPanel({ q, selectedBrands, selectedCategories, hsMin, hsMax, onChange }: Props) {
  const [facets, setFacets] = useState<FacetMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const resp = await searchAlgolia({
          query: q || "",
          fetchFacetsOnly: true,
          facetFilters: buildFacetFilters(selectedBrands, selectedCategories),
          numericFilters: buildNumericFilters(hsMin, hsMax),
        });
        if (!cancelled) setFacets(resp.facets || {});
      } catch (e) {
        console.warn("Facets load error", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [q, selectedBrands.join(","), selectedCategories.join(","), hsMin, hsMax]);

  const brands = useMemo(() => sortFacet(facets?.brand), [facets]);
  const categories = useMemo(() => sortFacet(facets?.category), [facets]);

  return (
    <aside className="w-full md:w-64 shrink-0 border border-gray-200 rounded-xl p-3 md:p-4 bg-white">
      <h3 className="text-lg font-semibold mb-2">Filtres</h3>
      <div className="text-xs text-gray-500 mb-3">{loading ? "Chargement des facettes…" : "Facettes à jour"}</div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">Marque</h4>
        <div className="max-h-40 overflow-auto pr-1 space-y-1">
          {brands.map(([value, count]) => {
            const checked = selectedBrands.includes(value);
            return (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMulti("brands", value, { selectedBrands, selectedCategories, hsMin, hsMax, onChange })}
                />
                <span>{value}</span>
                <span className="ml-auto text-xs text-gray-500">{count}</span>
              </label>
            );
          })}
          {brands.length === 0 && <div className="text-sm text-gray-500">Aucune marque disponible</div>}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">Catégorie</h4>
        <div className="max-h-40 overflow-auto pr-1 space-y-1">
          {categories.map(([value, count]) => {
            const checked = selectedCategories.includes(value);
            return (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMulti("categories", value, { selectedBrands, selectedCategories, hsMin, hsMax, onChange })}
                />
                <span>{value}</span>
                <span className="ml-auto text-xs text-gray-500">{count}</span>
              </label>
            );
          })}
          {categories.length === 0 && <div className="text-sm text-gray-500">Aucune catégorie disponible</div>}
        </div>
      </div>

      <div className="mb-2">
        <h4 className="font-medium mb-2">Health score</h4>
        <div className="flex items-center gap-2">
          <input
            type="number" min={0} max={100} value={hsMin}
            onChange={(e) => onChange({ brands: selectedBrands, categories: selectedCategories, hsMin: clamp(+e.target.value || 0, 0, 100), hsMax })}
            className="w-20 border rounded px-2 py-1" aria-label="Score min"
          />
          <span className="text-sm">—</span>
          <input
            type="number" min={0} max={100} value={hsMax}
            onChange={(e) => onChange({ brands: selectedBrands, categories: selectedCategories, hsMin, hsMax: clamp(+e.target.value || 100, 0, 100) })}
            className="w-20 border rounded px-2 py-1" aria-label="Score max"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">0 à 100 (inclus) — par défaut, aucun filtre n’est appliqué.</p>
      </div>
    </aside>
  );
}
