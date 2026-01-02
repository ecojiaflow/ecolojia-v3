import React from "react";
import { cn, LEVEL_STYLES, LEVEL_3_SUBLEVELS } from "../../lib/designSystem";

interface LevelBadgeProps {
  level?: 1 | 2 | 3 | null;
  sublevel?: "occasions" | "limit_strongly" | null;
  label?: string | null;
  size?: "sm" | "md";
}

/**
 * LevelBadge - Affiche le niveau depuis BACKEND (healthReflex)
 * ⚠️ NE JAMAIS calculer le niveau côté frontend
 */
export function LevelBadge({ level, sublevel, label, size = "md" }: LevelBadgeProps) {
  const lvl = level ?? 1;
  const style = LEVEL_STYLES[lvl as 1 | 2 | 3] || LEVEL_STYLES[1];
  
  const text = label ?? (
    lvl === 3 && sublevel 
      ? LEVEL_3_SUBLEVELS[sublevel] 
      : style.label
  );

  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-1.5 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-medium ring-1",
        style.bg,
        style.text,
        style.ring,
        sizes[size]
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", style.dot)} />
      {text}
    </span>
  );
}
