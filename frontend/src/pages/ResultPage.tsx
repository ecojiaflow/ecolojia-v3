// PATH: frontend/src/pages/ResultPage.tsx
import { useLocation } from "react-router-dom";
import type { AnalysisResult } from "../types/api";
import ScoreDisplay from "../components/analysis/ScoreDisplay";

export default function ResultPage() {
  const location = useLocation();
  const result: AnalysisResult | null =
    (location.state as any)?.result ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem("lastAnalysis") || "null");
      } catch {
        return null;
      }
    })();

  if (!result) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-2">Aucun résultat</h1>
        <p>Revenez au scan pour analyser un produit.</p>
      </div>
    );
  }

  const p = result.product;
  const s = result.score;

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-bold mb-2">{p.name}</h1>
      <p className="text-gray-600 mb-4">
        {p.brand ? `${p.brand} • ` : ""} {p.category || "—"} {p.ean ? `• EAN ${p.ean}` : ""}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <ScoreDisplay label="Nutri-Score" value={s?.nutriScore} />
        <ScoreDisplay label="NOVA" value={s?.novaGroup} />
        <ScoreDisplay label="Eco-Score" value={s?.ecoScore} />
      </div>

      {result.risks && result.risks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Risques potentiels</h2>
          <ul className="list-disc pl-5 space-y-1">
            {result.risks.map((r, idx) => (
              <li key={r.id || idx}>
                <span className="font-medium">{r.title}</span>{" "}
                <span className="text-xs rounded px-2 py-0.5 border ml-2">{r.level}</span>
                {r.details && <div className="text-sm text-gray-600">{r.details}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {p.ingredients && p.ingredients.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Ingrédients</h2>
          <div className="text-sm text-gray-800">{p.ingredients.join(", ")}</div>
        </div>
      )}

      {result.alternatives && result.alternatives.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Alternatives</h2>
          <ul className="list-disc pl-5">
            {result.alternatives.map((a, idx) => (
              <li key={a.id || a.ean || idx}>
                {a.name} {a.brand ? `• ${a.brand}` : ""} {a.category ? `• ${a.category}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
