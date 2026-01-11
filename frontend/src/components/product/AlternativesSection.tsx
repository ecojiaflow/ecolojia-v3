/**
 * AlternativesSection.tsx — Bloc Alternatives (Mini-Spec V1)
 * 
 * Score discret avec couleur conforme (vert/jaune/orange/rouge)
 * NOTE: Pas de wrapper (géré par parent Card)
 * 
 * @version 1.2.0 - Sans wrapper
 */

import React from "react";
import { ArrowRight } from "lucide-react";

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

interface Alternative {
  _id: string;
  barcode?: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  images?: { front?: string };
  scores?: { overallScore?: number };
  globalScore?: number;
}

interface AlternativesSectionProps {
  alternatives: Alternative[];
  onSelect: (id: string) => void;
}

function getScoreStyle(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  if (score >= 30) return "text-orange-600";
  return "text-rose-600";
}

export function AlternativesSection({
  alternatives,
  onSelect,
}: AlternativesSectionProps) {
  const getImageUrl = (alt: Alternative): string | null => {
    return alt.imageUrl || alt.images?.front || null;
  };

  const getScore = (alt: Alternative): number | null => {
    return alt.globalScore || alt.scores?.overallScore || null;
  };

  if (!alternatives || alternatives.length === 0) {
    return (
      <>
        <div className="text-sm font-semibold text-slate-900 mb-2">
          Alternatives dans la même catégorie
        </div>
        <p className="text-sm text-slate-500">
          Pas assez d'alternatives dans la base pour ce produit.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="text-sm font-semibold text-slate-900 mb-4">
        Alternatives dans la même catégorie
      </div>

      <div className="space-y-2.5">
        {alternatives.slice(0, 3).map((alt) => {
          const imageUrl = getImageUrl(alt);
          const score = getScore(alt);

          return (
            <button
              key={alt._id}
              onClick={() => onSelect(alt._id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] transition-all text-left"
            >
              <div className="h-11 w-11 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={alt.name}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center text-slate-300 text-lg">
                    📦
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 text-sm truncate">
                  {alt.name}
                </div>
                {alt.brand && (
                  <div className="text-xs text-slate-500 truncate">{alt.brand}</div>
                )}
              </div>

              {score != null && (
                <span className={cn(
                  "flex-shrink-0 text-xs font-medium",
                  getScoreStyle(score)
                )}>
                  {score}
                </span>
              )}

              <ArrowRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </>
  );
}
