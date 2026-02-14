/**
 * ECOLOJIA Design System — Tokens V1
 * Direction: Nature Premium (calme, chaud, crédible)
 */

export const colors = {
  bgApp: "#F7F8F4",
  surface: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  muted: "#94A3B8",
  
  eco: "#16A34A",
  ecoSoft: "#EAF7EF",
  
  ok: "#16A34A",
  warn: "#F59E0B",
  limit: "#EF4444",
  info: "#6366F1",
  pleasure: "#F97316",
};

export const statusColors = {
  base: { bg: "bg-emerald-50", border: "border-l-emerald-500", text: "text-emerald-700", gradient: "from-emerald-50 to-white" },
  regular: { bg: "bg-sky-50", border: "border-l-sky-500", text: "text-sky-700", gradient: "from-sky-50 to-white" },
  occasional: { bg: "bg-orange-50", border: "border-l-orange-500", text: "text-orange-700", gradient: "from-orange-50 to-white" },
  limit: { bg: "bg-rose-50", border: "border-l-rose-500", text: "text-rose-700", gradient: "from-rose-50 to-white" },
  unknown: { bg: "bg-slate-50", border: "border-l-slate-400", text: "text-slate-600", gradient: "from-slate-50 to-white" },
};

export const ui = {
  card: "rounded-[20px] bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)]",
  cardHover: "transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_14px_40px_rgba(2,6,23,0.10)]",
  pill: "inline-flex items-center gap-1.5 rounded-[14px] px-3 py-1 text-[12px] font-medium",
  sectionTitle: "text-[13px] font-semibold text-slate-800 tracking-tight",
  body: "text-[14px] leading-relaxed text-slate-600",
};

export type ProductStatus = "base" | "regular" | "occasional" | "limit" | "unknown";
