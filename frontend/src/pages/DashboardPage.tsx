import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthContext } from "../Contexts/AuthContext";

// ============================================================
// TYPES
// ============================================================
interface WeekProduct {
  barcode: string;
  name: string;
  brand: string;
  imageUrl: string;
  subcategory: string;
  status: string;
  level: number;
  nova: number;
  scannedAt: string;
}

interface WeekData {
  period: { from: string; to: string };
  totalScans: number;
  distribution: { base: number; regular: number; occasional: number; limit: number };
  exposures: { sugarFrequency: number; saltFrequency: number; additivesFrequency: number; nova4Frequency: number };
  profile: { level: string; label: string; description: string };
  products: WeekProduct[];
}

// ============================================================
// CONFIG
// ============================================================
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; text: string }> = {
  base:       { label: "Base",        color: "#10b981", bg: "#ecfdf5", text: "#065f46" },
  regular:    { label: "Regulier",    color: "#0ea5e9", bg: "#f0f9ff", text: "#075985" },
  occasional: { label: "Occasionnel", color: "#f59e0b", bg: "#fffbeb", text: "#92400e" },
  limit:      { label: "A limiter",   color: "#f97068", bg: "#fff5f4", text: "#b5403a" },
};

const PROFILE_ICONS: Record<string, string> = {
  excellent: "\uD83C\uDF3F", good: "\u2600\uFE0F", mixed: "\uD83D\uDD04",
  unbalanced: "\u26A1", empty: "\uD83D\uDCF7",
};

const PROFILE_COLORS: Record<string, string> = {
  excellent: "#10b981", good: "#0ea5e9", mixed: "#f59e0b", unbalanced: "#f97316", empty: "#94a3b8",
};

const PROFILE_RING: Record<string, number> = {
  excellent: 0.85, good: 0.65, mixed: 0.4, unbalanced: 0.25, empty: 0,
};

const EXPOSURE_META = [
  { key: "sugarFrequency", label: "Produits sucres", icon: "\uD83C\uDF6C", slug: "sucres-ajoutes" },
  { key: "saltFrequency", label: "Sel eleve", icon: "\uD83E\uDDC2", slug: "sel-cache" },
  { key: "additivesFrequency", label: "Additifs repetes", icon: "\uD83E\uDDEA", slug: "lire-ingredients" },
  { key: "nova4Frequency", label: "Ultra-transformes", icon: "\u2699\uFE0F", slug: "ultra-transformation" },
];

function getFreqLabel(count: number): string {
  if (count === 0) return "absent";
  if (count === 1) return "1 fois";
  if (count <= 3) return count + " fois";
  return "plusieurs fois";
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(from: string, to: string): string {
  const f = new Date(from);
  const t = new Date(to);
  const months = ["jan.", "fev.", "mars", "avr.", "mai", "juin", "juil.", "aout", "sept.", "oct.", "nov.", "dec."];
  return `${f.getDate()} - ${t.getDate()} ${months[t.getMonth()]} ${t.getFullYear()}`;
}

// ============================================================
// COMPOSANTS
// ============================================================

function ProfileRing({ level }: { level: string }) {
  const color = PROFILE_COLORS[level] || "#94a3b8";
  const ring = PROFILE_RING[level] || 0;
  const icon = PROFILE_ICONS[level] || "";
  const c = 2 * Math.PI * 52;
  const offset = c - ring * c;

  return (
    <div style={{ position: "relative", width: 124, height: 124, margin: "0 auto" }}>
      <svg width="124" height="124" viewBox="0 0 124 124">
        <circle cx="62" cy="62" r="52" fill="none" stroke="#f1f5f9" strokeWidth="9" />
        <circle cx="62" cy="62" r="52" fill="none" stroke={color} strokeWidth="9"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          transform="rotate(-90 62 62)" style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${color}12`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function DistTags({ dist }: { dist: WeekData["distribution"] }) {
  const tags: { label: string; color: string }[] = [];
  if (dist.base > 0) tags.push({ label: "Base dominante", color: "#10b981" });
  if (dist.regular > 0) tags.push({ label: `${dist.regular} regulier${dist.regular > 1 ? "s" : ""}`, color: "#0ea5e9" });
  if (dist.occasional > 0) tags.push({ label: `${dist.occasional} plaisir${dist.occasional > 1 ? "s" : ""}`, color: "#f59e0b" });
  if (dist.limit > 0) tags.push({ label: `${dist.limit} a limiter`, color: "#f97068" });

  return (
    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
      {tags.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
          style={{ background: `${t.color}10`, color: t.color }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
          {t.label}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [expanded, setExpanded] = useState(false);

  const isCurrentWeek = getMonday(new Date()).getTime() === weekStart.getTime();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const from = weekStart.toISOString().slice(0, 10);
    const toDate = new Date(weekStart);
    toDate.setDate(toDate.getDate() + 6);
    const to = toDate.toISOString().slice(0, 10);
    const base = import.meta.env.VITE_API_URL || "http://localhost:10000";

    fetch(`${base}/api/dashboard/week?from=${from}&to=${to}`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` },
    })
      .then(r => r.json())
      .then(d => { if (mounted) setData(d); })
      .catch(() => { if (mounted) setData(null); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [weekStart]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const nextWeek = () => {
    if (!isCurrentWeek) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 7);
      setWeekStart(d);
    }
  };

  const card = "bg-white rounded-[18px] border border-slate-200 shadow-[0_2px_12px_rgba(2,6,23,0.04)] p-[18px] mt-3.5";
  const sTitle = "text-[12px] font-semibold text-slate-500 uppercase tracking-wide";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Chargement...</div>
      </div>
    );
  }

  const dist = data?.distribution || { base: 0, regular: 0, occasional: 0, limit: 0 };
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  const profile = data?.profile || { level: "empty", label: "Aucun produit scanne", description: "Scanne tes produits pour voir ton profil semaine." };
  const exposures = data?.exposures || { sugarFrequency: 0, saltFrequency: 0, additivesFrequency: 0, nova4Frequency: 0 };
  const products = data?.products || [];
  const periodLabel = data?.period ? formatWeekLabel(data.period.from, data.period.to) : "";

  const order = ["limit", "occasional", "regular", "base"];
  const sortedProducts = order.flatMap(s => products.filter(p => p.status === s));
  const shownProducts = expanded ? sortedProducts : sortedProducts.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5 text-slate-400" /></button>
          <span className="text-[15px] font-semibold text-slate-800">Ma semaine</span>
          <div className="w-5" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-10 pt-2">

        {/* Bloc 1 — Profil */}
        <div className={`${card} !mt-0 !pt-5 !pb-6`}>
          {/* Week selector */}
          <div className="flex items-center justify-between">
            <button onClick={prevWeek} className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center">
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-800">{periodLabel}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{isCurrentWeek ? "Cette semaine" : "Semaine passee"}</div>
            </div>
            <button onClick={nextWeek} className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center"
              style={{ opacity: isCurrentWeek ? 0.3 : 1, cursor: isCurrentWeek ? "default" : "pointer" }}>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="mt-6">
            <ProfileRing level={profile.level} />
          </div>
          <DistTags dist={dist} />

          <div className="text-center mt-4">
            <div className="text-[17px] font-semibold text-slate-800 leading-snug">{profile.label}</div>
            <div className="text-[13px] text-slate-500 mt-1.5 leading-relaxed max-w-[300px] mx-auto">
              {profile.description}
            </div>
          </div>
          <div className="text-center mt-2 text-[11px] text-slate-400">
            {total} produit{total > 1 ? "s" : ""} scanne{total > 1 ? "s" : ""} cette semaine
          </div>
        </div>

        {/* Bloc 2 — Distribution */}
        {total > 0 && (
          <div className={card}>
            <div className={sTitle}>Equilibre de la semaine</div>
            <div className="flex flex-col gap-2.5 mt-3">
              {(["base", "regular", "occasional", "limit"] as const).map(key => {
                const cfg = STATUS_CONFIG[key];
                const count = dist[key];
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                        <span className="text-[13px] font-medium text-slate-700">{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold" style={{ color: cfg.text }}>{count}</span>
                        <span className="text-[11px] text-slate-400">produit{count > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ background: cfg.color, width: `${pct}%`, minWidth: count > 0 ? 4 : 0 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 py-2.5 px-3 rounded-lg bg-slate-50 text-center text-[12px] text-slate-500 italic">
              La variete compte plus que la perfection.
            </div>
          </div>
        )}

        {/* Bloc 3 — Expositions */}
        {total > 0 && (
          <div className={card}>
            <div className={sTitle}>Expositions repetees</div>
            <div className="flex flex-col gap-0.5 mt-3">
              {EXPOSURE_META.map(exp => {
                const count = (exposures as any)[exp.key] || 0;
                const isHigh = count >= 4;
                const isMed = count >= 2 && count < 4;
                const dot = isHigh ? "#f97068" : isMed ? "#f59e0b" : "#10b981";
                const bg = isHigh ? "#fff5f4" : isMed ? "#fffbeb" : count > 0 ? "#ecfdf5" : "transparent";
                return (
                  <button key={exp.key} onClick={() => navigate(`/learn/fiche/${exp.slug}`)}
                    className="flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
                    style={{ background: bg }}>
                    <span className="text-xl w-8 text-center">{exp.icon}</span>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-slate-800">{exp.label}</div>
                      <div className="text-[12px] text-slate-500 mt-0.5">
                        Present {getFreqLabel(count)} cette semaine
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: dot }} />
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Phrase ADN */}
            <div className="mt-3 py-3 px-3.5 rounded-xl bg-gradient-to-r from-slate-50 to-emerald-50 border border-slate-100 text-center">
              <div className="text-[12px] text-slate-600 leading-relaxed">
                Ce n'est jamais un produit isole qui compte.<br />
                <span className="font-semibold text-emerald-600">C'est la repetition.</span>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 text-center">
              Cliquer sur une exposition pour en savoir plus.
            </div>
          </div>
        )}

        {/* Liste produits */}
        {sortedProducts.length > 0 && (
          <div className={card}>
            <div className="flex justify-between items-center">
              <div className={sTitle}>Produits scannes</div>
              <span className="text-[12px] text-slate-400 font-medium">{products.length} cette sem.</span>
            </div>
            <div className="flex flex-col gap-0.5 mt-3">
              {shownProducts.map((p, i) => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.regular;
                return (
                  <button key={i} onClick={() => navigate(`/product/${p.barcode}`)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl text-left hover:bg-slate-50 transition-colors">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[16px]">📦</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-slate-800 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.brand}</div>
                    </div>
                    <div className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: cfg.bg, color: cfg.text }}>
                      {cfg.label}
                    </div>
                  </button>
                );
              })}
            </div>
            {sortedProducts.length > 6 && (
              <button onClick={() => setExpanded(!expanded)}
                className="w-full py-2.5 mt-2 rounded-lg bg-slate-50 text-slate-500 text-[12px] font-medium">
                {expanded ? "Reduire" : `Voir les ${sortedProducts.length - 6} autres`}
              </button>
            )}
          </div>
        )}

        {/* Signature */}
        <div className="mt-5 py-4 px-5 rounded-[18px] bg-gradient-to-r from-emerald-50 via-sky-50 to-emerald-50 text-center">
          <div className="text-[12px] text-emerald-600 leading-relaxed font-medium">
            L'ensemble du repas compte plus qu'un aliment isole.<br />
            L'ensemble de la semaine compte plus qu'un repas isole.
          </div>
        </div>

        <div className="text-center py-3 text-[10px] text-slate-300">
          Repere educatif simplifie — pas une prescription medicale.
        </div>
      </div>
    </div>
  );
}
