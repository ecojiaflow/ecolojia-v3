/**
 * WhyThisLevel.tsx — Bloc "Pourquoi ce niveau ?" (Mini-Spec V1)
 * 
 * RÈGLE : 3 puces max, pas de paragraphes, format factuel
 * 
 * @version 1.0.0 - Mini-Spec compliant
 */

import React from "react";

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

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
  // Construire la liste des raisons (max 3)
  const reasons: FlagDisplay[] = [];

  // Ajouter les flags
  if (flags && flags.length > 0) {
    flags.forEach(flag => {
      const display = FLAG_DISPLAY[flag];
      if (display && reasons.length < 3) {
        reasons.push(display);
      }
    });
  }

  // Compléter avec NOVA si pas déjà présent et moins de 3 raisons
  if (reasons.length < 3 && nova && !flags?.some(f => f.includes("transforme"))) {
    if (nova === 4) reasons.push({ icon: "🏭", text: "Ultra-transformé (NOVA 4)" });
    else if (nova === 3) reasons.push({ icon: "⚙️", text: "Transformation élevée (NOVA 3)" });
  }

  // Compléter avec Nutri-Score si pas déjà présent et moins de 3 raisons
  if (reasons.length < 3 && nutriScore && !flags?.some(f => f.startsWith("nutriscore"))) {
    const grade = nutriScore.toLowerCase();
    if (grade === "e") reasons.push({ icon: "🔴", text: "Profil nutritionnel défavorable (Nutri-Score E)" });
    else if (grade === "d") reasons.push({ icon: "🟠", text: "Profil nutritionnel à surveiller (Nutri-Score D)" });
  }

  // Si aucune raison, ne pas afficher le bloc
  if (reasons.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5">
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
    </div>
  );
}
