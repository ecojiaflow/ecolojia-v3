// PATH: frontend/src/pages/ResultPage.tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import type { AnalysisResult } from "../types/api";
import ScoreDisplay from "../components/analysis/ScoreDisplay";
import RiskCard from "../components/analysis/RiskCard";
import AlternativesList from "../components/analysis/AlternativesList";
import { ecoToTone, novaToTone, nutriToTone } from "../utils/scores";
import { useHistory } from "../hooks/useHistory";

export default function ResultPage() {
  const location = useLocation();
  const { save } = useHistory();

  const result: AnalysisResult | null =
    (location.state as any)?.result ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem("lastAnalysis") || "null");
      } catch {
        return null;
      }
    })();

  useEffect(() => {
    if (result) save(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!result) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-2">Aucun résultat</h1>
        <p>Revenez au scan pour analyser un produit.</p>
      </div>
    );
  }

  const p = result.product;
  const s: any = result.score;
  const isDemo = Boolean((result as any)?.raw?.demo);

  return (
    <div className="mx-auto max-w-3xl p-4">
      {isDemo && (
        <div className="mb-3 p-3 rounded-lg border bg-gray-200 text-sm">
          Mode <strong>démo</strong> — résultat simulé (API indisponible).
        </div>
      )}

      <h1 className="text-2xl font-bold mb-1">{p.name}</h1>
      <p className="text-gray-600 mb-4">
        {p.brand ? `${p.brand} • ` : ""} {p.category || "—"} {p.ean ? `• EAN ${p.ean}` : ""}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <ScoreDisplay label="Nutri-Score" value={s?.nutriScore} tone={nutriToTone(s?.nutriScore)} />
        <ScoreDisplay label="NOVA" value={s?.novaGroup} tone={novaToTone(s?.novaGroup)} />
        <ScoreDisplay label="Eco-Score" value={s?.ecoScore} tone={ecoToTone(s?.ecoScore)} />
      </div>

      {p.ingredients && p.ingredients.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Ingrédients</h2>
          <div className="card text-sm text-gray-800">{p.ingredients.join(", ")}</div>
        </section>
      )}

      {result.risks && result.risks.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Risques potentiels</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.risks.map((r: any, idx: number) => (
              <RiskCard key={r.id || idx} title={r.title} level={r.level} details={r.details} />
            ))}
          </div>
        </section>
      )}

      {result.alternatives && result.alternatives.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Alternatives</h2>
          <AlternativesList items={result.alternatives as any} />
        </section>
      )}
    </div>
  );
}


