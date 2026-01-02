/**
 * DESIGN SYSTEM ECOLOJIA 2026
 * Fichier de référence unique pour tout le frontend
 * @version 1.0.0
 */

// ============================================================================
// COULEURS & STYLES
// ============================================================================

export const DS = {
  // Backgrounds
  bg: "bg-[#F3FBF6]",
  bgDark: "bg-[#0A1F12]",
  surface: "bg-white/80 backdrop-blur-sm",
  surfaceSolid: "bg-white",
  card: "bg-white shadow-sm",
  cardHover: "hover:shadow-md transition-shadow",
  
  // Borders
  border: "border-[#E6F2EA]",
  borderDark: "border-[#1A3D24]",
  
  // Primary (Vert Ecolojia)
  primary: "bg-[#16A34A]",
  primaryHover: "hover:bg-[#0F7A34]",
  primarySoft: "bg-[#E8F7EE]",
  primaryText: "text-[#16A34A]",
  
  // Text
  textPrimary: "text-slate-900",
  textSecondary: "text-slate-600",
  textMuted: "text-slate-400",
  
  // Radius
  radius: "rounded-[28px]",
  radiusMd: "rounded-2xl",
  radiusSm: "rounded-xl",
  radiusXs: "rounded-lg",
  
  // Shadows
  shadow: "shadow-sm",
  shadowMd: "shadow-md",
  shadowLg: "shadow-lg",
  
  // Spacing
  containerPadding: "px-4 sm:px-6 lg:px-8",
  sectionGap: "space-y-6",
  cardPadding: "p-5 sm:p-6",
};

// ============================================================================
// LEVEL COLORS (Backend healthReflex)
// ============================================================================

export const LEVEL_STYLES = {
  1: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200/60",
    dot: "bg-emerald-500",
    label: "Acceptable",
  },
  2: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    ring: "ring-amber-200/60",
    dot: "bg-amber-500",
    label: "À limiter au quotidien",
  },
  3: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200/60",
    dot: "bg-rose-500",
    label: "À réserver aux occasions",
  },
};

export const LEVEL_3_SUBLEVELS = {
  occasions: "À réserver aux occasions",
  limit_strongly: "À limiter fortement",
};

// ============================================================================
// SCORE COLORS
// ============================================================================

export const SCORE_STYLES = {
  high: { text: "text-emerald-600", ring: "ring-emerald-200", threshold: 70 },
  medium: { text: "text-amber-600", ring: "ring-amber-200", threshold: 40 },
  low: { text: "text-rose-600", ring: "ring-rose-200", threshold: 0 },
};

export function getScoreStyle(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return { text: "text-slate-400", ring: "ring-slate-200" };
  }
  if (score >= 70) return SCORE_STYLES.high;
  if (score >= 40) return SCORE_STYLES.medium;
  return SCORE_STYLES.low;
}

// ============================================================================
// UTILITY
// ============================================================================

export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
