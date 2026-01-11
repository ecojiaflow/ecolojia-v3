/**
 * DecisionBlock.tsx — Bloc Décision Ecolojia (Mini-Spec V1)
 * 
 * RÈGLE : Niveau → Réflexe → Action (décision-first)
 * Bouton : "Trouver une alternative" (action concrète)
 * 
 * @version 1.1.0 - Wording corrigé
 */

import React from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type Level = 1 | 2 | 3;

interface DecisionBlockProps {
  level?: Level | null;
  levelLabel?: string | null;
  reflex?: string | null;
  onAlternatives: () => void;
  onAddToList: () => void;
}

const LEVEL_CONFIG = {
  1: {
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    dot: "bg-emerald-500",
    text: "text-emerald-800",
    label: "Acceptable",
  },
  2: {
    bg: "bg-amber-50",
    border: "border-amber-300",
    dot: "bg-amber-500",
    text: "text-amber-800",
    label: "À limiter au quotidien",
  },
  3: {
    bg: "bg-rose-50",
    border: "border-rose-300",
    dot: "bg-rose-500",
    text: "text-rose-800",
    label: "À réserver aux occasions",
  },
};

const DEFAULT_REFLEX: Record<Level, string> = {
  1: "Ce produit peut s'intégrer dans une alimentation équilibrée.",
  2: "En consommation régulière, ce produit mérite attention.",
  3: "Ce type de produit se consomme mieux occasionnellement, en petite quantité.",
};

export function DecisionBlock({
  level,
  levelLabel,
  reflex,
  onAlternatives,
  onAddToList,
}: DecisionBlockProps) {
  const lvl = level ?? 2;
  const config = LEVEL_CONFIG[lvl];
  const displayLabel = levelLabel ?? config.label;
  const displayReflex = reflex ?? DEFAULT_REFLEX[lvl];

  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-5",
        config.bg,
        config.border
      )}
    >
      {/* Niveau */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("h-3 w-3 rounded-full flex-shrink-0", config.dot)} />
        <span className={cn("text-sm font-bold uppercase tracking-wide", config.text)}>
          Niveau {lvl} — {displayLabel}
        </span>
      </div>

      {/* Réflexe (1 phrase) */}
      <p className="text-base font-medium text-slate-800 leading-relaxed mb-5">
        💡 {displayReflex}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={onAlternatives}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          Trouver une alternative
        </button>
        <button
          onClick={onAddToList}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-white text-slate-800 font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ShoppingCart className="h-4 w-4" />
          Ajouter à ma liste
        </button>
      </div>
    </div>
  );
}
