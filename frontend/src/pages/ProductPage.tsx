/**
 * ProductPage.tsx — ECOLOJIA Design PRO 2026
 * 
 * ARCHITECTURE :
 * - Level/Flags = BACKEND ONLY (constitution.healthReflex)
 * - Score = SECONDAIRE
 * - Constitution-First
 * 
 * DESIGN 2026 :
 * - Hero premium avec gradient
 * - Glass effects (backdrop-blur)
 * - Cards soft sans bordures agressives
 * - ProofAccordion avec explications par flag
 * - Sticky bottom bar mobile
 * - Score Ring compact
 * 
 * @version 3.3.0 PRO
 * @date 2026-01-01
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/common/LoadingSpinner";

// ============================================================================
// DESIGN SYSTEM ECOLOJIA 2026
// ============================================================================

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const DS = {
  bg: "bg-[#F3FBF6]",
  surface: "bg-white/80",
  card: "bg-white",
  border: "border-[#E6F2EA]",
  primary: "bg-[#16A34A]",
  primaryHover: "hover:bg-[#0F7A34]",
  primarySoft: "bg-[#E8F7EE]",
  radius: "rounded-[28px]",
  radiusSm: "rounded-2xl",
};

// ============================================================================
// TYPES (Backend-aligned)
// ============================================================================

type Level = 1 | 2 | 3;
type Sublevel = "occasions" | "limit_strongly";

interface HealthReflex {
  level: Level;
  sublevel?: Sublevel | null;
  levelLabel?: string | null;
  flags?: string[] | null;
}

interface ConstitutionCard {
  id?: string;
  title: string;
  icon?: string;
  content: string;
}

interface Habit {
  id?: string;
  title: string;
  description?: string;
}

interface Constitution {
  cards?: ConstitutionCard[];
  habit?: Habit;
  healthReflex?: HealthReflex;
}

interface Scores {
  overallScore?: number;
  healthScore?: number;
  environmentScore?: number;
}

interface FoodData {
  novaGroup?: number;
}

interface Product {
  _id: string;
  name: string;
  brand?: string;
  barcode?: string;
  images?: { front?: string };
  scores?: Scores;
  foodData?: FoodData;
  constitution?: Constitution;
}

// ============================================================================
// API
// ============================================================================

async function getJSON(endpoint: string) {
  const base = import.meta.env.VITE_API_URL || "http://localhost:10000";
  const url = endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;

  const r = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  let data: any = null;
  try {
    data = await r.json();
  } catch {
    data = null;
  }
  return { ok: r.ok, status: r.status, data };
}

// ============================================================================
// COMPONENTS - Design System 2026
// ============================================================================

/**
 * LevelPill - Badge niveau (depuis BACKEND uniquement)
 */
function LevelPill({ 
  level, 
  sublevel, 
  label 
}: { 
  level?: Level | null; 
  sublevel?: Sublevel | null; 
  label?: string | null;
}) {
  const text =
    label ??
    (level === 1
      ? "Acceptable"
      : level === 2
        ? "À limiter au quotidien"
        : sublevel === "limit_strongly"
          ? "À limiter fortement"
          : level === 3
            ? "À réserver aux occasions"
            : "Niveau inconnu");

  const styles =
    level === 1
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
      : level === 2
        ? "bg-amber-50 text-amber-800 ring-amber-200/60"
        : level === 3
          ? "bg-rose-50 text-rose-700 ring-rose-200/60"
          : "bg-slate-50 text-slate-600 ring-slate-200/60";

  const dot =
    level === 1 ? "bg-emerald-500" : 
    level === 2 ? "bg-amber-500" : 
    level === 3 ? "bg-rose-500" : "bg-slate-400";

  return (
    <span className={cn(
      "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1",
      styles
    )}>
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      {text}
    </span>
  );
}

/**
 * ScoreRing - Score compact (secondaire)
 */
function ScoreRing({ score }: { score?: number | null }) {
  const s = score ?? null;
  const color = s === null 
    ? "text-slate-400" 
    : s >= 70 
      ? "text-emerald-600" 
      : s >= 40 
        ? "text-amber-600" 
        : "text-rose-600";

  const ringColor = s === null
    ? "ring-slate-200"
    : s >= 70
      ? "ring-emerald-200"
      : s >= 40
        ? "ring-amber-200"
        : "ring-rose-200";

  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "grid h-14 w-14 place-items-center rounded-2xl bg-white ring-2",
        ringColor
      )}>
        <div className={cn("text-xl font-bold", color)}>{s ?? "—"}</div>
      </div>
      <div>
        <div className="text-xs font-medium text-slate-500">Score global</div>
        <div className="text-[11px] text-slate-400">/100 • secondaire</div>
      </div>
    </div>
  );
}

/**
 * MiniStat - Métrique compacte
 */
function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl bg-white/70 backdrop-blur-sm border px-4 py-3", DS.border)}>
      <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}

/**
 * SoftCard - Carte Constitution (design soft)
 */
function SoftCard({ 
  icon, 
  title, 
  children 
}: { 
  icon?: string; 
  title: string; 
  children: React.ReactNode;
}) {
  return (
    <div className={cn(
      "rounded-3xl bg-white/90 backdrop-blur-sm border p-6",
      DS.border,
      "shadow-[0_1px_3px_rgba(16,24,40,0.04)] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-shadow"
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "grid h-11 w-11 place-items-center rounded-2xl text-xl",
          DS.primarySoft
        )}>
          {icon ?? "📌"}
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="text-[15px] text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
}

/**
 * ProofAccordion - "Pourquoi ce niveau ?" avec explications par flag
 */
function ProofAccordion({ flags }: { flags?: string[] | null }) {
  const [open, setOpen] = useState(false);
  
  if (!flags || flags.length === 0) return null;

  // Mapping flags → titre + explication
  const flagInfo: Record<string, { title: string; hint: string }> = {
    ultra_transforme: { 
      title: "Ultra-transformé", 
      hint: "Transformation industrielle élevée (NOVA 4)" 
    },
    transformation_elevee: { 
      title: "Transformation élevée", 
      hint: "Procédés industriels multiples" 
    },
    sucre_en_premier: { 
      title: "Sucre dominant", 
      hint: "Le sucre apparaît en premier dans la liste d'ingrédients" 
    },
    huile_de_palme: { 
      title: "Huile de palme", 
      hint: "Huile raffinée à profil lipidique discuté" 
    },
    additifs_multiples: { 
      title: "Additifs multiples", 
      hint: "Présence de plusieurs additifs technologiques" 
    },
    sel_eleve: { 
      title: "Teneur en sel élevée", 
      hint: "Contribution au cumul sodique en usage fréquent" 
    },
    graisses_saturees: { 
      title: "Graisses saturées", 
      hint: "Profil lipidique à surveiller en usage régulier" 
    },
  };

  return (
    <div className={cn(
      "rounded-3xl bg-white/90 backdrop-blur-sm border overflow-hidden",
      DS.border
    )}>
      <button 
        onClick={() => setOpen(!open)} 
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
      >
        <div className="text-left">
          <div className="text-sm font-semibold text-slate-900">Pourquoi ce niveau ?</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {flags.length} signal{flags.length > 1 ? 'ux' : ''} factuel{flags.length > 1 ? 's' : ''} détecté{flags.length > 1 ? 's' : ''}
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="px-6 pb-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {flags.slice(0, 8).map((f) => {
              const info = flagInfo[f] || { title: f.replaceAll("_", " "), hint: "Signal factuel" };
              return (
                <div 
                  key={f} 
                  className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4"
                >
                  <div className="text-sm font-semibold text-slate-900">{info.title}</div>
                  <div className="mt-1.5 text-xs text-slate-600 leading-relaxed">{info.hint}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-4 rounded-2xl bg-[#E8F7EE]/50 border border-[#C6F6D5]">
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-[#0F7A34]">Ecolojia qualifie un usage</span> (fréquent, quotidien, occasionnel) — 
              pas le produit lui-même. La fréquence compte plus que l'interdiction.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * HabitBlock - Bloc habitude associée
 */
function HabitBlock({ 
  habit, 
  onList, 
  onFav, 
  isFav 
}: { 
  habit: Habit; 
  onList: () => void; 
  onFav: () => void; 
  isFav: boolean;
}) {
  return (
    <div className={cn(
      "rounded-3xl border p-6",
      "bg-gradient-to-br from-[#E8F7EE] to-[#F0FDF4]",
      "border-[#C6F6D5]"
    )}>
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm text-2xl flex-shrink-0">
          🛡️
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold tracking-wider uppercase text-[#0F7A34]">
            Habitude associée
          </div>
          <div className="mt-1.5 text-base font-semibold text-slate-900 leading-snug">
            {habit.title}
          </div>
          {habit.description && (
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {habit.description}
            </p>
          )}
        </div>
      </div>

      {/* Desktop CTA */}
      <div className="mt-6 hidden lg:flex gap-3">
        <button
          onClick={onList}
          className={cn(
            "flex-1 rounded-2xl py-3.5 text-sm font-semibold text-white shadow-sm transition-all",
            DS.primary,
            DS.primaryHover,
            "hover:shadow-md"
          )}
        >
          🛒 Ajouter à la liste
        </button>
        <button
          onClick={onFav}
          className={cn(
            "flex-1 rounded-2xl py-3.5 text-sm font-semibold border transition-all",
            isFav 
              ? "bg-rose-50 text-rose-700 border-rose-200" 
              : "bg-white text-slate-900 border-[#E6F2EA] hover:bg-slate-50"
          )}
        >
          {isFav ? "❤️ Dans les favoris" : "🤍 Ajouter aux favoris"}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      const res = await getJSON(`/api/products/${id}`);
      if (!alive) return;

      if (!res.ok) {
        setError("Produit introuvable");
        setProduct(null);
      } else {
        const p = res.data?.product || res.data;
        setProduct(p);
      }
      setLoading(false);
    })();

    return () => { alive = false; };
  }, [id]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const onShare = useCallback(async () => {
    if (!product) return;
    if (navigator.share) {
      try {
        await navigator.share({ 
          title: product.name, 
          text: `Découvre ${product.name} sur Ecolojia`, 
          url: window.location.href 
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié");
    }
  }, [product]);

  const onFav = useCallback(() => {
    setIsFav((v) => !v);
    toast.success(!isFav ? "Ajouté aux favoris" : "Retiré des favoris");
  }, [isFav]);

  const onList = useCallback(() => {
    toast.success("Ajouté à la liste de courses");
  }, []);

  // ============================================================================
  // LOADING
  // ============================================================================

  if (loading) {
    return (
      <div className={cn("min-h-screen grid place-items-center", DS.bg)}>
        <div className="text-center">
          <LoadingSpinner size="large" />
          <div className="mt-4 text-sm font-medium text-slate-600">Chargement…</div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR
  // ============================================================================

  if (error || !product) {
    return (
      <div className={cn("min-h-screen grid place-items-center p-4", DS.bg)}>
        <div className={cn("w-full max-w-md rounded-3xl border bg-white p-8 text-center", DS.border)}>
          <div className="text-5xl mb-4">😕</div>
          <div className="text-xl font-semibold text-slate-900">Produit introuvable</div>
          <div className="mt-2 text-sm text-slate-500">{error ?? "Ce produit n'existe pas."}</div>
          <button 
            onClick={() => nav("/search")} 
            className={cn(
              "mt-6 w-full rounded-2xl px-5 py-3.5 text-sm font-semibold text-white",
              DS.primary, 
              DS.primaryHover
            )}
          >
            Rechercher un produit
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // DATA EXTRACTION (Backend only - no UI calculation)
  // ============================================================================

  const { constitution, scores, foodData } = product;

  // ⚠️ CRITIQUE : Niveau depuis BACKEND uniquement
  const healthReflex = constitution?.healthReflex;
  const level = healthReflex?.level ?? null;
  const sublevel = healthReflex?.sublevel ?? null;
  const levelLabel = healthReflex?.levelLabel ?? null;
  const flags = healthReflex?.flags ?? [];

  const cards = constitution?.cards ?? [];
  const habit = constitution?.habit;

  const overall = scores?.overallScore ?? null;
  const health = scores?.healthScore ?? null;
  const env = scores?.environmentScore ?? null;
  const nova = foodData?.novaGroup ?? null;
  const img = product.images?.front;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn("min-h-screen", DS.bg)}>
      
      {/* ================================================================== */}
      {/* TOPBAR GLASS */}
      {/* ================================================================== */}
      <div className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur-xl" style={{ borderColor: "#E6F2EA" }}>
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => nav(-1)} 
              className="p-2 rounded-xl hover:bg-slate-100/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
            <div className="flex items-center gap-2">
              <span className={cn("h-9 w-9 rounded-2xl grid place-items-center text-lg", DS.primarySoft)}>
                🌿
              </span>
              <span className="text-sm font-semibold text-slate-900 hidden sm:block">Ecolojia</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LevelPill level={level} sublevel={sublevel} label={levelLabel} />
            <button 
              onClick={onShare} 
              className="p-2 rounded-xl hover:bg-slate-100/80 transition-colors"
            >
              <Share2 className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* HERO PREMIUM */}
      {/* ================================================================== */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className={cn(
          "rounded-[32px] border p-6 lg:p-8",
          DS.border,
          "bg-gradient-to-br from-white via-white to-slate-50/50",
          "shadow-[0_2px_8px_rgba(16,24,40,0.04)]"
        )}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            
            {/* Product Info */}
            <div className="flex items-start gap-4 lg:gap-5">
              <div className={cn(
                "h-20 w-20 lg:h-24 lg:w-24 rounded-3xl bg-white ring-1 overflow-hidden grid place-items-center flex-shrink-0",
                "ring-[#E6F2EA]"
              )}>
                {img ? (
                  <img src={img} alt={product.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-3xl text-slate-300">📦</span>
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
                  {product.name}
                </h1>
                {product.brand && (
                  <p className="mt-1 text-sm text-slate-500">{product.brand}</p>
                )}
                
                {/* Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <LevelPill level={level} sublevel={sublevel} label={levelLabel} />
                  {nova && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      NOVA {nova}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Score + Stats (Desktop) */}
            <div className="hidden lg:flex items-center gap-6">
              <ScoreRing score={overall} />
              <div className="flex gap-3">
                <MiniStat label="Santé" value={health ?? "—"} />
                <MiniStat label="Env." value={env ?? "—"} />
              </div>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3 lg:hidden">
            <MiniStat label="Score" value={overall ?? "—"} />
            <MiniStat label="Santé" value={health ?? "—"} />
            <MiniStat label="Env." value={env ?? "—"} />
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* CONTENT GRID */}
      {/* ================================================================== */}
      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Constitution Cards */}
          {cards.length > 0 ? (
            cards.map((c, i) => (
              <SoftCard key={c.id ?? i} icon={c.icon} title={c.title}>
                {c.content}
              </SoftCard>
            ))
          ) : (
            <SoftCard icon="⏳" title="Constitution en cours">
              L'analyse détaillée sera disponible prochainement.
            </SoftCard>
          )}

          {/* Proof Accordion */}
          <ProofAccordion flags={flags} />

          {/* Habit Block */}
          {habit && (
            <HabitBlock 
              habit={habit} 
              onList={onList} 
              onFav={onFav} 
              isFav={isFav} 
            />
          )}
        </div>

        {/* Sidebar (Desktop) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-20 space-y-5">
            
            {/* Score Card */}
            <div className={cn("rounded-3xl border bg-white/90 backdrop-blur-sm p-6", DS.border)}>
              <ScoreRing score={overall} />
              
              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniStat label="Santé" value={health ?? "—"} />
                <MiniStat label="Env." value={env ?? "—"} />
              </div>

              <div className="mt-5 pt-5 border-t border-[#E6F2EA]">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Données Open Food Facts + enrichissement Ecolojia. 
                  Outil éducatif — ne remplace pas un avis médical.
                </p>
              </div>
            </div>

            {/* Explorer */}
            <div className={cn("rounded-3xl border bg-white/90 backdrop-blur-sm p-5", DS.border)}>
              <div className="text-sm font-semibold text-slate-900 mb-4">Explorer</div>
              <button
                onClick={() => nav(`/search?similar=${product.barcode ?? ""}`)}
                className={cn(
                  "w-full rounded-2xl border bg-white p-4 text-left hover:bg-slate-50 transition-colors",
                  DS.border
                )}
              >
                <div className="text-sm font-semibold text-slate-900">Voir alternatives</div>
                <div className="text-xs text-slate-500 mt-1">Produits similaires mieux notés</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* STICKY BOTTOM BAR (Mobile) */}
      {/* ================================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-xl border-t border-[#E6F2EA] safe-area-pb">
        <div className="mx-auto max-w-6xl grid grid-cols-2 gap-3">
          <button 
            onClick={onList} 
            className={cn(
              "rounded-2xl py-3.5 text-sm font-semibold text-white shadow-sm",
              DS.primary,
              DS.primaryHover
            )}
          >
            🛒 Liste de courses
          </button>
          <button
            onClick={onFav}
            className={cn(
              "rounded-2xl py-3.5 text-sm font-semibold border",
              isFav 
                ? "bg-rose-50 text-rose-700 border-rose-200" 
                : "bg-white text-slate-900 border-[#E6F2EA]"
            )}
          >
            {isFav ? "❤️ Favori" : "🤍 Favoris"}
          </button>
        </div>
      </div>

      {/* Spacer for sticky bar */}
      <div className="h-24 lg:h-0" />
    </div>
  );
}