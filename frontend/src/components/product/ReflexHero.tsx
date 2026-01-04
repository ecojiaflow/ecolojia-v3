/**
 * ReflexHero.tsx — BLOC A (Bible UI)
 * Niveau + Score Circulaire + Réflexe + CTA
 * @version 4.3.0 - Full Responsive Fix
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
  score?: number | null;
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
    stroke: "#10B981",
  },
  2: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-800",
    label: "À limiter au quotidien",
    stroke: "#F59E0B",
  },
  3: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-500",
    text: "text-rose-800",
    label: "À réserver aux occasions",
    stroke: "#EF4444",
  },
};

function CircularScore({ score, color }: { score: number; color: string }) {
  const size = 42;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-slate-900">{score}</span>
      </div>
    </div>
  );
}

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
  score,
  onAlternatives,
  onAddToList,
}: ReflexHeroProps) {
  const lvl = level ?? 1;
  const config = LEVEL_CONFIG[lvl as 1 | 2 | 3] || LEVEL_CONFIG[1];

  const displayLabel =
    levelLabel ??
    (lvl === 3 && sublevel === "limit_strongly"
      ? "À limiter fortement"
      : config.label);

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
        "rounded-3xl border-2 p-4 sm:p-6 lg:p-8",
        config.bg,
        config.border
      )}
    >
      {/* Header: Niveau + Score Circulaire */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("h-3 w-3 rounded-full flex-shrink-0", config.dot)} />
          <span className={cn("text-xs sm:text-sm font-bold uppercase tracking-wide", config.text)}>
            {displayLabel}
          </span>
        </div>
        {score != null && (
          <CircularScore score={score} color={config.stroke} />
        )}
      </div>

      {/* Réflexe Phrase */}
      <p className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 leading-snug mb-4">
        {headline || fallbackHeadline}
      </p>
      {body && (
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{body}</p>
      )}

      {/* CTA Principal */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={onAlternatives}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3",
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
            "flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3",
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
