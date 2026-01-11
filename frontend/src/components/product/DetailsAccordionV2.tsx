/**
 * DetailsAccordionV2.tsx — Accordéon Détails (Mini-Spec V1)
 * 
 * RÈGLE : Score + Jauges + Métriques = uniquement ici, fermé par défaut
 * Jamais au-dessus du bloc décision
 * 
 * @version 1.0.0 - Mini-Spec compliant
 */

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

interface NutritionData {
  sugars?: number | null;
  fat?: number | null;
  saturated_fat?: number | null;
  salt?: number | null;
  fiber?: number | null;
  proteins?: number | null;
}

interface DetailsAccordionV2Props {
  score?: number | null;
  healthScore?: number | null;
  environmentScore?: number | null;
  nova?: number | null;
  nutriScore?: string | null;
  nutrition?: NutritionData | null;
}

const NOVA_LABELS: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: "NOVA 1 — Aliments bruts", desc: "Aliments non transformés ou minimalement transformés", color: "bg-emerald-100 text-emerald-700" },
  2: { label: "NOVA 2 — Ingrédients culinaires", desc: "Ingrédients issus d'aliments du groupe 1", color: "bg-lime-100 text-lime-700" },
  3: { label: "NOVA 3 — Aliments transformés", desc: "Aliments fabriqués avec 2-3 ingrédients", color: "bg-amber-100 text-amber-700" },
  4: { label: "NOVA 4 — Ultra-transformés", desc: "Formulations industrielles avec additifs", color: "bg-rose-100 text-rose-700" },
};

interface BarConfig {
  key: keyof NutritionData;
  label: string;
  unit: string;
  max: number;
  thresholds: { low: number; high: number };
  inverse: boolean;
}

const NUTRITION_BARS: BarConfig[] = [
  { key: "sugars", label: "Sucres", unit: "g", max: 50, thresholds: { low: 5, high: 12.5 }, inverse: true },
  { key: "fat", label: "Graisses", unit: "g", max: 40, thresholds: { low: 3, high: 17.5 }, inverse: true },
  { key: "saturated_fat", label: "Saturées", unit: "g", max: 20, thresholds: { low: 1.5, high: 5 }, inverse: true },
  { key: "salt", label: "Sel", unit: "g", max: 6, thresholds: { low: 0.3, high: 1.5 }, inverse: true },
];

function getBarColor(value: number, config: BarConfig): string {
  if (config.inverse) {
    if (value <= config.thresholds.low) return "bg-emerald-500";
    if (value <= config.thresholds.high) return "bg-amber-500";
    return "bg-rose-500";
  } else {
    if (value >= config.thresholds.high) return "bg-emerald-500";
    if (value >= config.thresholds.low) return "bg-amber-500";
    return "bg-rose-500";
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  if (score >= 30) return "text-orange-600";
  return "text-rose-600";
}

export function DetailsAccordionV2({
  score,
  healthScore,
  environmentScore,
  nova,
  nutriScore,
  nutrition,
}: DetailsAccordionV2Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      {/* Header (toujours visible) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-900">
          Voir les détails
        </span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {/* Contenu (accordéon) */}
      {isOpen && (
        <div className="px-5 pb-5 border-t border-slate-100 space-y-5">
          
          {/* Score Global */}
          {score != null && (
            <div className="pt-4">
              <div className="text-xs text-slate-500 mb-2">Score global Ecolojia</div>
              <div className="flex items-center gap-4">
                <div className={cn("text-3xl font-bold", getScoreColor(score))}>
                  {score}/100
                </div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", 
                      score >= 70 ? "bg-emerald-500" : 
                      score >= 50 ? "bg-amber-500" : 
                      score >= 30 ? "bg-orange-500" : "bg-rose-500"
                    )}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
              
              {/* Sous-scores */}
              <div className="mt-3 flex gap-4 text-sm">
                {healthScore != null && (
                  <div>
                    <span className="text-slate-500">Santé:</span>{" "}
                    <span className="font-medium">{healthScore}/100</span>
                  </div>
                )}
                {environmentScore != null && (
                  <div>
                    <span className="text-slate-500">Environnement:</span>{" "}
                    <span className="font-medium">{environmentScore}/100</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NOVA */}
          {nova && NOVA_LABELS[nova] && (
            <div>
              <div className="text-xs text-slate-500 mb-2">Classification NOVA</div>
              <div className={cn("inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium", NOVA_LABELS[nova].color)}>
                {NOVA_LABELS[nova].label}
              </div>
              <p className="mt-1.5 text-xs text-slate-500">{NOVA_LABELS[nova].desc}</p>
            </div>
          )}

          {/* Nutri-Score */}
          {nutriScore && (
            <div>
              <div className="text-xs text-slate-500 mb-2">Nutri-Score</div>
              <div className="flex gap-1">
                {["A", "B", "C", "D", "E"].map((grade) => (
                  <div
                    key={grade}
                    className={cn(
                      "w-8 h-8 rounded flex items-center justify-center text-xs font-bold",
                      nutriScore.toUpperCase() === grade
                        ? grade === "A" ? "bg-emerald-500 text-white" :
                          grade === "B" ? "bg-lime-500 text-white" :
                          grade === "C" ? "bg-yellow-500 text-white" :
                          grade === "D" ? "bg-orange-500 text-white" :
                          "bg-rose-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {grade}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jauges Nutrition */}
          {nutrition && (
            <div>
              <div className="text-xs text-slate-500 mb-3">Nutrition (pour 100g)</div>
              <div className="space-y-2.5">
                {NUTRITION_BARS.map((config) => {
                  const value = nutrition[config.key];
                  if (value == null) return null;
                  
                  const percentage = Math.min((value / config.max) * 100, 100);
                  const barColor = getBarColor(value, config);

                  return (
                    <div key={config.key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">{config.label}</span>
                        <span className="font-medium text-slate-900">{value.toFixed(1)}{config.unit}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", barColor)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sources */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <p>
                Données Open Food Facts enrichies par Ecolojia. 
                Méthodologie basée sur OMS, ANSES, EFSA. 
                Outil éducatif, ne remplace pas un avis médical.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
