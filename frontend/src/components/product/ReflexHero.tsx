/**
 * ReflexHero.tsx — BLOC A (Bible UI)
 * Niveau + Réflexe + CTA — visible en 10 secondes
 */

import React from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type Level = 1 | 2 | 3;
type Sublevel = "occasions" | "limit_strongly";

interface ReflexHeroProps {
  level?: Level | null;
  sublevel?: Sublevel | null;
  levelLabel?: string | null;
  reflexContent?: string | null;
  onAlternatives: () => void;
  onAddToList: () => void;
}

const LEVEL_CONFIG = {
  1: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    text: "text-emerald-800",
    label: "Acceptable",
  },
  2: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-800",
    label: "À limiter au quotidien",
  },
  3: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
    text: "text-rose-800",
    label: "À réserver aux occasions",
  },
};

function getFirstSentence(text: string | null | undefined): { headline: string; body: string } {
  if (!text) return { headline: "", body: "" };
  const match = text.match(/^([^.!?]+[.!?])\s*/);
  if (match) {
    return {
      headline: match[1].trim(),
      body: text.slice(match[0].length).trim(),
    };
  }
  return { headline: text, body: "" };
}

export function ReflexHero({
  level,
  sublevel,
  levelLabel,
  reflexContent,
  onAlternatives,
  onAddToList,
}: ReflexHeroProps) {
  const lvl = level ?? 1;
  const config = LEVEL_CONFIG[lvl as 1 | 2 | 3] || LEVEL_CONFIG[1];

  // Dériver label
  const displayLabel =
    levelLabel ??
    (lvl === 3 && sublevel === "limit_strongly"
      ? "À limiter fortement"
      : config.label);

  // Dériver réflexe phrase
  const { headline, body } = getFirstSentence(reflexContent);
  const fallbackHeadline =
    lvl === 1
      ? "Ce type de produit peut s'intégrer dans une alimentation équilibrée."
      : lvl === 2
        ? "En usage régulier, ce type de produit mérite attention."
        : "Ce type de produit est à réserver aux occasions.";

  return (
    <div
      className={cn(
        "rounded-3xl border-2 p-6 lg:p-8",
        config.bg,
        config.border
      )}
    >
      {/* Niveau Badge Large */}
      <div className="flex items-center gap-3 mb-4">
        <span className={cn("h-4 w-4 rounded-full", config.dot)} />
        <span className={cn("text-lg font-bold uppercase tracking-wide", config.text)}>
          {displayLabel}
        </span>
      </div>

      {/* Réflexe Phrase */}
      <p className="text-xl lg:text-2xl font-semibold text-slate-900 leading-snug mb-2">
        {headline || fallbackHeadline}
      </p>
      {body && (
        <p className="text-base text-slate-600 leading-relaxed mb-6">{body}</p>
      )}

      {/* CTA Principal */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onAlternatives}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5",
            "bg-[#16A34A] text-white font-semibold text-sm",
            "hover:bg-[#0F7A34] transition-colors shadow-sm hover:shadow-md"
          )}
        >
          <ArrowRight className="h-4 w-4" />
          Voir les alternatives
        </button>
        <button
          onClick={onAddToList}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5",
            "bg-white text-slate-900 font-semibold text-sm border border-slate-200",
            "hover:bg-slate-50 transition-colors"
          )}
        >
          <ShoppingCart className="h-4 w-4" />
          Ajouter à la liste
        </button>
      </div>
    </div>
  );
}
