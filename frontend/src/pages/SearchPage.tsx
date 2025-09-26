import React from "react";
import SearchBar from "../components/search/SearchBar";
import FiltersPanel from "../components/search/FiltersPanel";
import { searchProducts, toDisplayProduct, SearchResult } from "../lib/api";
import ScoreChip from "../components/ScoreChip";
import DomainBadges from "../components/DomainBadges";

type DomainKey = "food" | "beauty" | "detergent";
const RESULT_PATH = (import.meta.env.VITE_RESULT_PATH || "/results").replace(/\/+$/,"");

function inferDomains(category: string, name: string, brand: string): DomainKey[] {
  const txt = `${category} ${name} ${brand}`.toLowerCase();
  if (/(cosm|beauty|cr[eè]me|shampoo|lotion|nivea|garnier)/i.test(txt)) return ["beauty"];
  if (/(d[eé]tergent|lessive|ariel|dash|omo|liquide vaisselle|cleaner)/i.test(txt)) return ["detergent"];
  return ["food"];
}

export default function SearchPage() {
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [res, setRes] = React.useState<SearchResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // 1) Hydrate depuis l'URL et lance la recherche automatiquement
  React.useEffect(() => {
    const urlQ = new URLSearchParams(window.location.search).get("q") ?? "";
    setQ(urlQ);
    if (urlQ) doSearch(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Un seul endroit qui lance la recherche + met l'URL à jour
  async function doSearch(query: string) {
    const term = (query || "").trim();
    // garde l'URL en phase
    const url = new URL(window.location.href);
    if (term) url.searchParams.set("q", term); else url.searchParams.delete("q");
    window.history.replaceState(null, "", url.toString());

    if (!term) { setRes({ items: [], source: "local" }); return; }
    setBusy(true); setError(null);
    try {
      const r = await searchProducts(term);
      setRes(r);
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  function resultHref(code: string) {
    return `${RESULT_PATH}/${encodeURIComponent(code)}`;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Recherche</h1>

      {/* La même barre que sur l'accueil, mais ici elle exécute la recherche */}
      <SearchBar
        initialQuery={q} showSuggestions={false}
        onSearch={(term) => { setQ(term); doSearch(term); }}
        className="mb-4"
      />

      {/* (Optionnel) Panneau de filtres si déjà implémenté */}
      <FiltersPanel
        onApply={(f) => {
          // à brancher plus tard avec ton backend facetté
          // pour l'instant on relance juste la même recherche
          doSearch(q);
        }}
      />

      <div className="mt-6">
        {busy && <div className="text-sm text-gray-500">Recherche en cours…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!busy && !error && res && (
          <div className="space-y-3">
            {res.items.length === 0 && <div className="text-sm text-gray-500">Aucun résultat.</div>}
            {res.items.map((p, idx) => {
              const d = toDisplayProduct(p);
              const domains = inferDomains(d.category || "", d.name || "", d.brand || "");
              return (
                <a key={(p as any).objectID || (p as any)._id || d.id || d.barcode || String(idx)} href={resultHref(d.barcode || d.id)} className="block rounded-xl border p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="font-medium">{d.name || "(sans nom)"}</div>
                      <div className="text-xs text-gray-500">
                        {d.brand ? `${d.brand}` : ""} {d.category ? ` · ${d.category}` : ""}
                      </div>
                      <div className="mt-2">
                        <DomainBadges domains={domains as any} />
                      </div>
                    </div>
                    <div className="ml-4">
                      <ScoreChip score={typeof d.healthScore === "number" ? d.healthScore : undefined} />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


