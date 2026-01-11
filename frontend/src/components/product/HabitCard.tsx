/**
 * HabitCard.tsx — Bloc Habitude Associée (Mini-Spec V1)
 * 
 * RÈGLE : 1 habitude unique, design sobre, ton calme
 * 
 * @version 1.0.0 - Mini-Spec compliant
 */

import React from "react";

interface Habit {
  id?: string;
  title: string;
  description?: string;
}

interface HabitCardProps {
  habit?: Habit | null;
}

export function HabitCard({ habit }: HabitCardProps) {
  if (!habit) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-5">
      <div className="flex items-start gap-4">
        {/* Icône */}
        <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
          <span className="text-xl">🌱</span>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
            Habitude associée
          </div>
          <div className="text-sm font-medium text-slate-900 leading-relaxed">
            {habit.title}
          </div>
          {habit.description && (
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              {habit.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
