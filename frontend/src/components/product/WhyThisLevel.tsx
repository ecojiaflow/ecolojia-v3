/**
 * WhyThisLevel.tsx — Bloc "Pourquoi ce niveau ?" (Mini-Spec V1)
 * 
 * RÈGLE : 3 puces max, pas de paragraphes, format factuel
 * NOTE: Pas de wrapper (géré par parent Card)
 * 
 * @version 1.1.0 - Sans wrapper
 */

import React from "react";

interface WhyThisLevelProps {
  flags?: string[] | null;
  nova?: number | null;
  nutriScore?: string | null;
}

interface FlagDisplay {
  icon: string;
  text: string;
}

const FLAG_DISPLAY: Record<string, FlagDisplay> = {
  ultra_transforme: { icon: "🏭", text: "Ultra-transformé (NOVA 4)" },
  transformation_elevee: { icon: "⚙️", text: "Transformation élevée (NOVA 3)" },
  transformation_moderee: { icon: "🔧", text: "Transformation modérée (NOVA 2)" },
  nutriscore_e: { icon: "🔴", text: "Profil nutritionnel défavorable (Nutri-Score E)" },
  nutriscore_d: { icon: "🟠", text: "Profil nutritionnel à surveiller (Nutri-Score D)" },
  additifs_multiples: { icon: "⚗️", text: "Présence de plusieurs additifs (5+)" },
  additifs_presents: { icon: "🧪", text: "Additifs technologiques présents" },
  sucre_eleve: { icon: "🍬", text: "Teneur en sucres élevée" },
  sel_eleve: { icon: "🧂", text: "Teneur en sel élevée" },
  graisses_saturees: { icon: "🧈", text: "Graisses saturées significatives" },
};

export function WhyThisLevel({ flags, nova, nutriScore }: WhyThisLevelProps) {
  const reasons: FlagDisplay[] = [];

  if (flags && flags.length > 0) {
    flags.forEach(flag => {
      const display = FLAG_DISPLAY[flag];
      if (display && reasons.length < 3) {
        reasons.push(display);
      }
    });
  }

  if (reasons.length < 3 && nova && !flags?.some(f => f.includes("transforme"))) {
    if (nova === 4) reasons.push({ icon: "🏭", text: "Ultra-transformé (NOVA 4)" });
    else if (nova === 3) reasons.push({ icon: "⚙️", text: "Transformation élevée (NOVA 3)" });
  }

  if (reasons.length < 3 && nutriScore && !flags?.some(f => f.startsWith("nutriscore"))) {
    const grade = nutriScore.toLowerCase();
    if (grade === "e") reasons.push({ icon: "🔴", text: "Profil nutritionnel défavorable (Nutri-Score E)" });
    else if (grade === "d") reasons.push({ icon: "🟠", text: "Profil nutritionnel à surveiller (Nutri-Score D)" });
  }

  if (reasons.length === 0) {
    return null;
  }

  return (
    <>
      <div className="text-sm font-semibold text-slate-900 mb-3">
        Pourquoi ce niveau ?
      </div>
      <ul className="space-y-2">
        {reasons.slice(0, 3).map((reason, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="flex-shrink-0">{reason.icon}</span>
            <span>{reason.text}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
