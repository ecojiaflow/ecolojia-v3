import React from "react";
import { searchProducts, toDisplayProduct, SearchResult } from "../lib/api";
import ScoreChip from "../components/ScoreChip";
import DomainBadges from "../components/DomainBadges";

type DomainKey = "food" | "beauty" | "detergent";

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

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const query = q.trim();
    if (!query) {
      setRes({ items: [], source: "local" });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await searchProducts(query);
      setRes(r);
    } catch (err: any) {
      setError(err?.message ?? "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  function openAnalysis(code: string) {
    if (code) {
      window.location.href = `/result?code=${encodeURIComponent(code)}`;
    }
  }

  const items = (res?.items ?? []).map(toDisplayProduct);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-bold">Recherche</h1>

      <form className="mt-4 flex gap-2" onSubmit={doSearch} role="search" aria-label="Recherche produit">
        <label className="sr-only" htmlFor="q">Rechercher produit</label>
        <input
          id="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ex.: nutella, nivea, ariel…"
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          aria-label="Saisir un nom de produit ou marque"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 font-medium text-emerald-700 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60"
          aria-busy={busy}
        >
          {busy ? "Recherche…" : "Chercher"}
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700" role="alert">
          {error}
        </div>
      )}

      {res && (
        <p className="mt-3 text-sm text-gray-500">
          Source: <strong>{res.source === "algolia" ? "Algolia" : "Base locale"}</strong> — {items.length} résultat(s)
        </p>
      )}

      <section className="mt-4 grid grid-cols-1 gap-3" aria-live="polite">
        {items.map((p, idx) => {
          const domains = inferDomains(p.category, p.name, p.brand);
          return (
            <article
              key={p.code || idx}
              className="group relative grid grid-cols-[96px_1fr] gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-emerald-400"
              tabIndex={0}
              role="article"
              aria-label={`${p.name} — ${p.brand}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openAnalysis(p.code);
                }
              }}
            >
              <img
                src={p.imageUrl}
                alt={p.name}
                className="h-24 w-24 rounded-xl object-cover border border-gray-200"
                loading="lazy"
              />

              <div className="flex flex-col min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold leading-tight truncate" title={p.name}>
                    {p.name}
                  </h3>
                  <ScoreChip score={p.score ?? undefined} ariaLabel="Score global" />
                </div>

                <p className="text-sm text-gray-600 truncate" title={p.brand}>
                  {p.brand}
                </p>

                <DomainBadges active={domains as any} className="mt-1" aria-label="Domaines" />

                <div className="mt-2">
                  <button
                    onClick={() => openAnalysis(p.code)}
                    className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    aria-label="Voir analyse du produit"
                  >
                    Voir analyse
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {!busy && items.length === 0 && q.trim() !== "" && (
        <p className="mt-6 text-gray-600">Aucun résultat. Essayez une autre recherche.</p>
      )}
    </main>
  );
}
