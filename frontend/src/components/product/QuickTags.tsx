/**
 * QuickTags.tsx — Bloc "À retenir" (Mini-Spec V1)
 * 
 * RÈGLE : 4 tags max, regroupés Points d'attention / Points positifs
 * NOTE: Pas de wrapper (géré par parent Card)
 * 
 * @version 1.1.0 - Sans wrapper
 */

import React from "react";

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

interface QuickTagsProps {
  flags?: string[] | null;
  nova?: number | null;
  nutriScore?: string | null;
  isBio?: boolean;
}

interface TagDisplay {
  label: string;
  type: "negative" | "positive";
  color: string;
}

const FLAG_TAGS: Record<string, TagDisplay> = {
  ultra_transforme: { label: "Ultra-transf.", type: "negative", color: "bg-rose-100 text-rose-700 border-rose-200" },
  transformation_elevee: { label: "Très transf.", type: "negative", color: "bg-amber-100 text-amber-700 border-amber-200" },
  nutriscore_e: { label: "Nutri-Score E", type: "negative", color: "bg-rose-100 text-rose-700 border-rose-200" },
  nutriscore_d: { label: "Nutri-Score D", type: "negative", color: "bg-amber-100 text-amber-700 border-amber-200" },
  additifs_multiples: { label: "Additifs 5+", type: "negative", color: "bg-rose-100 text-rose-700 border-rose-200" },
  additifs_presents: { label: "Additifs", type: "negative", color: "bg-amber-100 text-amber-700 border-amber-200" },
  sucre_eleve: { label: "Sucre élevé", type: "negative", color: "bg-rose-100 text-rose-700 border-rose-200" },
  sel_eleve: { label: "Sel élevé", type: "negative", color: "bg-amber-100 text-amber-700 border-amber-200" },
  graisses_saturees: { label: "Gras saturés", type: "negative", color: "bg-amber-100 text-amber-700 border-amber-200" },
  bio: { label: "Bio", type: "positive", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  label_rouge: { label: "Label Rouge", type: "positive", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  aoc: { label: "AOC/AOP", type: "positive", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

export function QuickTags({ flags, nova, nutriScore, isBio }: QuickTagsProps) {
  const tags: TagDisplay[] = [];

  if (flags && flags.length > 0) {
    flags.forEach(flag => {
      const tagDisplay = FLAG_TAGS[flag];
      if (tagDisplay && tags.length < 4) {
        tags.push(tagDisplay);
      }
    });
  }

  if (tags.length < 4 && nova && !flags?.some(f => f.includes("transforme"))) {
    if (nova === 4) tags.push({ label: "NOVA 4", type: "negative", color: "bg-rose-100 text-rose-700 border-rose-200" });
    else if (nova === 3) tags.push({ label: "NOVA 3", type: "negative", color: "bg-amber-100 text-amber-700 border-amber-200" });
    else if (nova === 1) tags.push({ label: "NOVA 1", type: "positive", color: "bg-emerald-100 text-emerald-700 border-emerald-200" });
  }

  if (tags.length < 4 && nutriScore && !flags?.some(f => f.startsWith("nutriscore"))) {
    const grade = nutriScore.toLowerCase();
    if (grade === "a") tags.push({ label: "Nutri-Score A", type: "positive", color: "bg-emerald-100 text-emerald-700 border-emerald-200" });
    else if (grade === "b") tags.push({ label: "Nutri-Score B", type: "positive", color: "bg-lime-100 text-lime-700 border-lime-200" });
  }

  if (tags.length < 4 && isBio && !flags?.includes("bio")) {
    tags.push({ label: "Bio", type: "positive", color: "bg-emerald-100 text-emerald-700 border-emerald-200" });
  }

  if (tags.length === 0) {
    return null;
  }

  const negatives = tags.filter(t => t.type === "negative");
  const positives = tags.filter(t => t.type === "positive");

  return (
    <>
      <div className="text-sm font-semibold text-slate-900 mb-3">
        À retenir
      </div>

      <div className="space-y-3">
        {negatives.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 mb-2">Points d'attention</div>
            <div className="flex flex-wrap gap-2">
              {negatives.map((tag, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                    tag.color
                  )}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {positives.length > 0 && (
          <div>
            <div className="text-xs text-slate-500 mb-2">Points positifs</div>
            <div className="flex flex-wrap gap-2">
              {positives.map((tag, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                    tag.color
                  )}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
