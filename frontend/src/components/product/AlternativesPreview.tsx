/**
 * AlternativesPreview.tsx — 3 alternatives preview
 * CORRIGÉ: Support format backend (imageUrl au lieu de images.front)
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
  scoreDiff?: number;
}

interface AlternativesPreviewProps {
  alternatives: Alternative[];
  onViewAll: () => void;
  onSelect: (id: string) => void;
}

export function AlternativesPreview({
  alternatives,
  onViewAll,
  onSelect,
}: AlternativesPreviewProps) {
  if (!alternatives || alternatives.length === 0) {
    return (
      <div className="rounded-3xl border border-[#E6F2EA] bg-white/90 p-6">
        <div className="text-sm font-semibold text-slate-900 mb-3">Alternatives</div>
        <p className="text-sm text-slate-500 mb-4">
          Aucune alternative trouvée pour ce produit.
        </p>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#16A34A] hover:underline"
        >
          Explorer d'autres produits
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Helper pour obtenir l'image (supporte les deux formats)
  const getImageUrl = (alt: Alternative): string | null => {
    return alt.imageUrl || alt.images?.front || null;
  };

  // Helper pour obtenir le score
  const getScore = (alt: Alternative): number => {
    return alt.globalScore || alt.scores?.overallScore || 0;
  };

  return (
    <div className="rounded-3xl border border-[#E6F2EA] bg-white/90 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-slate-900">
          Alternatives mieux notées
        </div>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#16A34A] hover:underline"
        >
          Voir tout
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-3">
        {alternatives.slice(0, 3).map((alt) => {
          const imageUrl = getImageUrl(alt);
          const score = getScore(alt);
          
          return (
            <button
              key={alt._id}
              onClick={() => onSelect(alt._id)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[#E6F2EA] hover:bg-slate-50 transition-colors text-left"
            >
              <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={alt.name}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center text-slate-300 text-xl">
                    📦
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate text-sm">
                  {alt.name}
                </div>
                {alt.brand && (
                  <div className="text-xs text-slate-500 truncate">{alt.brand}</div>
                )}
              </div>

              <div className="flex-shrink-0">
                <div
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-bold",
                    score >= 70
                      ? "bg-emerald-100 text-emerald-700"
                      : score >= 50
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {score}/100
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
