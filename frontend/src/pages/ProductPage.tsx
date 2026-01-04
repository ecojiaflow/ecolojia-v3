/**
 * ProductPage.tsx — ECOLOJIA Bible UI 2026
 *
 * HIÉRARCHIE (règle 10 secondes) :
 * BLOC A : ReflexHero (Niveau + Réflexe + CTA)
 * BLOC B : Constitution 3 cartes
 * BLOC C : WhyThisLevel (flags) + drawer Méthode
 * BLOC D : Détails repliés (score breakdown)
 *
 * @version 4.0.0 Bible UI
 * @date 2026-01-02
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2, ChevronDown, ChevronUp, Info } from "lucide-react";
import toast from "react-hot-toast";

// Composants Bible UI
import { ReflexHero } from "../components/product/ReflexHero";
import { ProductPageSkeleton } from "../components/product/ProductPageSkeleton";
import { AlternativesPreview } from "../components/product/AlternativesPreview";
import { DetailsAccordion } from "../components/product/DetailsAccordion";
import { MethodDrawer } from "../components/product/MethodDrawer";

// ============================================================================
// UTILS
// ============================================================================

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ============================================================================
// TYPES
// ============================================================================

type Level = 1 | 2 | 3;
type Sublevel = "occasions" | "limit_strongly";

interface HealthReflex {
  level: Level;
  sublevel?: Sublevel | null;
  levelLabel?: string | null;
  flags?: string[] | null;
  content?: string | null;
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

interface RuleHit {
  id: string;
  principle: string;
  mechanism?: string;
  simple_reflex: string;
  context?: string;
  evidence_level?: string;
  nuances?: string;
}

interface Rules {
  reflexHero?: string;
  rulesHits?: RuleHit[];
  actions?: string[];
}

interface Constitution {
  cards?: ConstitutionCard[];
  habit?: Habit;
  healthReflex?: HealthReflex;
  rules?: Rules;
}

interface Scores {
  overallScore?: number;
  healthScore?: number;
  environmentScore?: number;
}

interface FoodData {
  novaGroup?: number;
}

interface Alternative {
  _id: string;
  name: string;
  brand?: string;
  images?: { front?: string };
  scores?: { overallScore?: number };
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
  alternatives?: Alternative[];
}

// ============================================================================
// API
// ============================================================================

async function getJSON(endpoint: string) {
  const base = import.meta.env.VITE_API_URL || "http://localhost:10000";
  const url = endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;
  const r = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
  let data: any = null;
  try { data = await r.json(); } catch { data = null; }
  return { ok: r.ok, status: r.status, data };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LevelPill({ level, sublevel, label, score }: { level?: Level | null; sublevel?: Sublevel | null; label?: string | null; score?: number | null; }) {
  const text = label ?? (level === 1 ? "Acceptable" : level === 2 ? "À limiter au quotidien" : sublevel === "limit_strongly" ? "À limiter fortement" : level === 3 ? "À réserver aux occasions" : "Niveau inconnu");
  const styles = level === 1 ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60" : level === 2 ? "bg-amber-50 text-amber-800 ring-amber-200/60" : level === 3 ? "bg-rose-50 text-rose-700 ring-rose-200/60" : "bg-slate-50 text-slate-600 ring-slate-200/60";
  const dot = level === 1 ? "bg-emerald-500" : level === 2 ? "bg-amber-500" : level === 3 ? "bg-rose-500" : "bg-slate-400";
  return (<span className={cn("inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1", styles)}><span className={cn("h-2 w-2 rounded-full", dot)} />{text}</span>);
}

function SoftCard({ icon, title, children }: { icon?: string; title: string; children: React.ReactNode; }) {
  return (
    <div className="rounded-3xl bg-white/90 backdrop-blur-sm border border-[#E6F2EA] p-6 shadow-[0_1px_3px_rgba(16,24,40,0.04)] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)] transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-11 w-11 place-items-center rounded-2xl text-xl bg-[#E8F7EE]">{icon ?? "📌"}</div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="text-[15px] text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
}

function ProofAccordion({ flags, onMethodClick }: { flags?: string[] | null; onMethodClick: () => void; }) {
  const [open, setOpen] = useState(false);
  if (!flags || flags.length === 0) return null;

  const flagInfo: Record<string, { title: string; hint: string }> = {
    ultra_transforme: { title: "Ultra-transformé", hint: "Transformation industrielle élevée (NOVA 4)" },
    transformation_elevee: { title: "Transformation élevée", hint: "Procédés industriels multiples (NOVA 3)" },
    transformation_moderee: { title: "Transformation modérée", hint: "Procédés industriels modérés (NOVA 2)" },
    nutriscore_e: { title: "Nutri-Score E", hint: "Profil nutritionnel défavorable" },
    nutriscore_d: { title: "Nutri-Score D", hint: "Profil nutritionnel à surveiller" },
    additifs_multiples: { title: "Additifs multiples", hint: "5+ additifs technologiques détectés" },
    additifs_presents: { title: "Additifs présents", hint: "Présence d'additifs technologiques" },
    sucre_eleve: { title: "Sucre élevé", hint: "Teneur en sucres ajoutés significative" },
    sel_eleve: { title: "Sel élevé", hint: "Teneur en sel élevée" },
    graisses_saturees: { title: "Graisses saturées", hint: "Profil lipidique à surveiller" },
  };

  return (
    <div className="rounded-3xl bg-white/90 backdrop-blur-sm border border-[#E6F2EA] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
        <div className="text-left">
          <div className="text-sm font-semibold text-slate-900">Pourquoi ce niveau ?</div>
          <div className="text-xs text-slate-500 mt-0.5">{flags.length} signal{flags.length > 1 ? "ux" : ""} factuel{flags.length > 1 ? "s" : ""}</div>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>
      {open && (
        <div className="px-6 pb-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {flags.slice(0, 8).map((f) => {
              const info = flagInfo[f] || { title: f.replaceAll("_", " "), hint: "Signal factuel" };
              return (<div key={f} className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4"><div className="text-sm font-semibold text-slate-900">{info.title}</div><div className="mt-1.5 text-xs text-slate-600 leading-relaxed">{info.hint}</div></div>);
            })}
          </div>
          <button onClick={onMethodClick} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#16A34A] hover:underline">
            <Info className="h-4 w-4" />Méthode & Sources
          </button>
        </div>
      )}
    </div>
  );
}

function RulesBlock({ rules }: { rules?: Rules }) {
  if (!rules?.rulesHits || rules.rulesHits.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-slate-700 px-1">Règles applicables</div>
      {rules.rulesHits.map((rule, i) => (
        <div key={rule.id} className="rounded-2xl bg-white border border-[#E6F2EA] p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-sm font-bold text-amber-700 flex-shrink-0">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">{rule.principle}</div>
              <div className="mt-1 text-xs text-slate-600 leading-relaxed">{rule.simple_reflex}</div>
              {rule.nuances && <div className="mt-2 text-xs text-slate-400 italic">{rule.nuances}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HabitBlock({ habit }: { habit: Habit; }) {
  return (
    <div className="rounded-3xl border p-6 bg-gradient-to-br from-[#E8F7EE] to-[#F0FDF4] border-[#C6F6D5]">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm text-2xl flex-shrink-0">🛡️</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold tracking-wider uppercase text-[#0F7A34]">Habitude associée</div>
          <div className="mt-1.5 text-base font-semibold text-slate-900 leading-snug">{habit.title}</div>
          {habit.description && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{habit.description}</p>}
        </div>
      </div>
    </div>
  );
}

function ScoreBreakdown({ scores, nova }: { scores?: Scores; nova?: number | null; }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{scores?.overallScore ?? "—"}</div>
          <div className="text-xs text-slate-500 mt-1">Score global</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{scores?.healthScore ?? "—"}</div>
          <div className="text-xs text-slate-500 mt-1">Santé</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{scores?.environmentScore ?? "—"}</div>
          <div className="text-xs text-slate-500 mt-1">Environnement</div>
        </div>
      </div>
      {nova && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50">
          <span className="text-sm font-medium text-slate-700">Classification NOVA</span>
          <span className={cn("px-3 py-1 rounded-full text-sm font-bold", nova === 1 ? "bg-emerald-100 text-emerald-700" : nova === 2 ? "bg-lime-100 text-lime-700" : nova === 3 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700")}>
            NOVA {nova}
          </span>
        </div>
      )}
      <p className="text-xs text-slate-400">Données Open Food Facts + enrichissement Ecolojia. Outil éducatif.</p>
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
  const [methodOpen, setMethodOpen] = useState(false);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);

  // Fetch product
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      const res = await getJSON(`/api/products/${id}`);
      if (!alive) return;
      if (!res.ok) { setError("Produit introuvable"); setProduct(null); }
      else { setProduct(res.data?.product || res.data); }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  // Fetch alternatives (V3.3 - par niveau)
  useEffect(() => {
    if (!product?.barcode) return;
    let alive = true;
    (async () => {
      const res = await getJSON(`/api/products/${product.barcode}/alternatives`);
      if (!alive) return;
      if (res.ok && Array.isArray(res.data)) {
        setAlternatives(res.data);
      }
    })();
    return () => { alive = false; };
  }, [product?.barcode]);

  // Actions
  const onShare = useCallback(async () => {
    if (!product) return;
    if (navigator.share) { try { await navigator.share({ title: product.name, url: window.location.href }); } catch {} }
    else { await navigator.clipboard.writeText(window.location.href); toast.success("Lien copié"); }
  }, [product]);

  const onFav = useCallback(() => { setIsFav(v => !v); toast.success(!isFav ? "Ajouté aux favoris" : "Retiré des favoris"); }, [isFav]);
  const onList = useCallback(() => { toast.success("Ajouté à la liste"); }, []);
  const onAlternatives = useCallback(() => { document.getElementById("alternatives-section")?.scrollIntoView({ behavior: "smooth" }); }, []);
  const onSelectAlt = useCallback((altId: string) => { nav(`/product/${altId}`); }, [nav]);

  // ============================================================================
  // LOADING (Skeleton)
  // ============================================================================
  if (loading) return <ProductPageSkeleton />;

  // ============================================================================
  // ERROR
  // ============================================================================
  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F3FBF6] grid place-items-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#E6F2EA] bg-white p-8 text-center">
          <div className="text-5xl mb-4">😕</div>
          <div className="text-xl font-semibold text-slate-900">Produit introuvable</div>
          <div className="mt-2 text-sm text-slate-500">{error ?? "Ce produit n'existe pas."}</div>
          <button onClick={() => nav("/search")} className="mt-6 w-full rounded-2xl px-5 py-3.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#0F7A34]">Rechercher un produit</button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // DATA (Backend only - no UI calculation)
  // ============================================================================
  const { constitution, scores, foodData } = product;
  const healthReflex = constitution?.healthReflex;
  const level = healthReflex?.level ?? null;
  const sublevel = healthReflex?.sublevel ?? null;
  const levelLabel = healthReflex?.levelLabel ?? null;
  const flags = healthReflex?.flags ?? [];
  const reflexContent = healthReflex?.content ?? null;
  const cards = constitution?.cards ?? [];
  const habit = constitution?.habit;
  const rules = constitution?.rules;
  const nova = foodData?.novaGroup ?? null;
  const img = product.images?.front;
  // alternatives chargées via useEffect séparé (V3.3)

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#F3FBF6]">
      {/* TOPBAR */}
      <div className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur-xl border-[#E6F2EA]">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <button onClick={() => nav(-1)} className="p-2 rounded-xl hover:bg-slate-100/80"><ArrowLeft className="h-5 w-5 text-slate-700" /></button>
          <LevelPill level={level} sublevel={sublevel} label={levelLabel} score={scores?.overallScore} />
          <button onClick={onShare} className="p-2 rounded-xl hover:bg-slate-100/80"><Share2 className="h-5 w-5 text-slate-600" /></button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* PRODUCT HEADER (compact) */}
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-[#E6F2EA]">
          <div className="h-16 w-16 rounded-2xl bg-slate-50 overflow-hidden flex-shrink-0 grid place-items-center">
            {img ? <img src={img} alt={product.name} className="h-full w-full object-contain" /> : <span className="text-2xl text-slate-300">📦</span>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 leading-tight truncate">{product.name}</h1>
            {product.brand && <p className="text-sm text-slate-500 truncate">{product.brand}</p>}
          </div>
        </div>

        {/* BLOC A — REFLEX HERO (10 sec rule) */}
        <ReflexHero
          level={level}
          sublevel={sublevel}
          levelLabel={levelLabel}
          reflexContent={reflexContent} score={scores?.overallScore}
          onAlternatives={onAlternatives}
          onAddToList={onList}
        />

        {/* BLOC B — CONSTITUTION (3 cartes) */}
        {cards.length > 0 ? (
          cards.map((c, i) => <SoftCard key={c.id ?? i} icon={c.icon} title={c.title}>{c.content}</SoftCard>)
        ) : (
          <SoftCard icon="⏳" title="Constitution en cours">L'analyse détaillée sera disponible prochainement.</SoftCard>
        )}

        {/* BLOC C — RULES */}
        <RulesBlock rules={rules} />

        {/* BLOC D — WHY THIS LEVEL (flags + drawer) */}
        <ProofAccordion flags={flags} onMethodClick={() => setMethodOpen(true)} />

        {/* HABIT */}
        {habit && <HabitBlock habit={habit} />}

        {/* ALTERNATIVES PREVIEW */}
        <div id="alternatives-section">
        <AlternativesPreview alternatives={alternatives} onViewAll={onAlternatives} onSelect={onSelectAlt} />
        </div>

        {/* BLOC D — DETAILS (accordéon fermé) */}
        <DetailsAccordion title="Détails & scores" defaultOpen={false}>
          <ScoreBreakdown scores={scores} nova={nova} />
        </DetailsAccordion>
      </div>

      {/* STICKY BOTTOM BAR (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-xl border-t border-[#E6F2EA]">
        <div className="mx-auto max-w-4xl grid grid-cols-2 gap-3">
          <button onClick={onList} className="rounded-2xl py-3.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#0F7A34]">🛒 Liste</button>
          <button onClick={onFav} className={cn("rounded-2xl py-3.5 text-sm font-semibold border", isFav ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-white text-slate-900 border-[#E6F2EA]")}>{isFav ? "❤️ Favori" : "🤍 Favoris"}</button>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-24 lg:h-0" />

      {/* METHOD DRAWER */}
      <MethodDrawer open={methodOpen} onClose={() => setMethodOpen(false)} />
    </div>
  );
}




















