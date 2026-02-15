/**
 * ProductPage.tsx — ECOLOJIA v6.1.0
 *
 * Socle V2.1 :
 * - 3 blocs visibles max (Header + TakeawayCard + ReflexCard)
 * - ImpactBalanceCard fusionne = signal + position semaine
 * - Accordeon details en dessous
 * - categoryDecisionTable comme source unique de verite
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Composants Socle V2.1
import { ProductPageSkeleton } from "../components/product/ProductPageSkeleton";
import { StickyActionBar } from "../components/product/StickyActionBar";
import TakeawayCard from "../components/product/TakeawayCard";
import ReflexCard from "../components/product/ReflexCard";
import SignatureFooter from "../components/product/SignatureFooter";
import ImpactBalanceCard from "../components/product/ImpactBalanceCard";
import { useAuthContext } from "../Contexts/AuthContext";

// ============================================
// ANIMATIONS
// ============================================
const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } }
};

// ============================================
// TYPES
// ============================================
type Level = 1 | 2 | 3;
interface HealthReflex { level: Level; levelLabel?: string | null; flags?: string[] | null; content?: string | null; }
interface Habit { id?: string; title: string; description?: string; }
interface Constitution { healthReflex?: HealthReflex; habit?: Habit; }
interface Scores { overallScore?: number; healthScore?: number; environmentScore?: number; }
interface NutritionData { sugars?: number; fat?: number; saturated_fat?: number; saturatedFat?: number; salt?: number; fiber?: number; proteins?: number; }
interface FoodData { novaGroup?: number; nutriScore?: string; nutritionalInfo?: NutritionData; additives?: string[]; labels?: string[]; }
interface Alternative { _id: string; name: string; brand?: string; imageUrl?: string; images?: { front?: string }; scores?: { overallScore?: number }; }
interface ProductContextProfile { processingLevel: string; sugarLevel: string; saltLevel: string; satFatLevel: string; additivesLevel: string; packagingType: string; packagingConfidence: string; isOrganic: boolean; isRawAgricultural: boolean; surfaceConsumed: string | boolean; usageFrequency: string; riskProfiles: string[]; contextConfidence: string; }
interface Product { _id: string; name: string; brand?: string; barcode?: string; imageUrl?: string; images?: { front?: string }; scores?: Scores; foodData?: FoodData; nutrition?: NutritionData; constitution?: Constitution; subcategory?: string; categoryType?: string; tags?: string[]; labels?: string[]; additives_tags?: string[]; additives_extracted?: string[]; ingredients_text?: string; dataQuality?: { additivesSource?: string; additivesCount?: number }; }

// ============================================
// HELPERS
// ============================================
const formatKeyPoint = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;
  const map: Record<string, string> = {
    "ultra_transforme": "Produit ultra-transforme",
    "ultra_processed": "Produit ultra-transforme",
    "transformation_elevee": "Niveau de transformation eleve",
    "high_sugar": "Riche en sucres",
    "sucre_eleve": "Riche en sucres",
    "high_salt": "Riche en sel",
    "sel_eleve": "Riche en sel",
    "high_fat": "Riche en graisses saturees",
    "gras_sature_eleve": "Riche en graisses saturees",
    "many_additives": "Contient plusieurs additifs",
    "additifs_multiples": "Contient plusieurs additifs",
    "low_fiber": "Pauvre en fibres",
    "low_protein": "Pauvre en proteines",
    "nutriscore_a": "Nutri-Score A",
    "nutriscore_b": "Nutri-Score B",
    "nutriscore_c": "Nutri-Score C",
    "nutriscore_d": "Nutri-Score D",
    "nutriscore_e": "Nutri-Score E"
  };
  return map[raw.toLowerCase()] || raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
};

async function getJSON(endpoint: string) {
  const base = import.meta.env.VITE_API_URL || "http://localhost:10000";
  const url = endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;
  const r = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
  let data: any = null;
  try { data = await r.json(); } catch { data = null; }
  return { ok: r.ok, status: r.status, data };
}

const getWeeklyPlace = (level: number | null, nova: number | null): "base" | "regular" | "occasional" | "limit" | "context" => {
  if (level === 1) return "base";
  if (level === 2) return nova === 4 ? "limit" : "regular";
  if (level === 3) return nova === 4 ? "limit" : "occasional";
  return "context";
};

const getOneLiner = (level: number | null, nova: number | null): string => {
  if (level === 1) return "Aliment de base, a integrer sans hesiter.";
  if (level === 2) return nova === 4 ? "Produit ultra-transforme, a limiter en frequence." : "A consommer avec moderation.";
  if (level === 3) return "Produit plaisir : OK ponctuellement, c est la repetition qui compte.";
  return "Consulte les details pour mieux comprendre ce produit.";
};

const getReflexData = (subcategory: string | undefined, level: number | null, nova: number | null) => {
  if (level === 1) {
    return {
      portionLabel: "Selon ton appetit",
      doList: ["Aliment de base a integrer librement", "Varie les preparations"],
      avoidList: [],
      frequencyLabel: "Quotidien possible"
    };
  }
  if (level === 2) {
    const isUltraProcessed = nova === 4;
    return {
      portionLabel: "Portion moderee",
      doList: isUltraProcessed
        ? ["Prefere une version moins transformee", "Lis les ingredients avant d acheter"]
        : ["Consomme dans le cadre d un repas equilibre"],
      avoidList: isUltraProcessed
        ? ["Usage quotidien", "Grandes quantites"]
        : ["Exces reguliers"],
      frequencyLabel: "A limiter (2-3x/semaine max)"
    };
  }
  const pleasureMap: Record<string, { portionLabel: string; doList: string[]; avoidList: string[]; frequencyLabel: string }> = {
    "chocolate-spread": {
      portionLabel: "1 tartine fine (15g)",
      doList: ["Accompagne d un fruit ou yaourt nature", "Reserve aux moments plaisir"],
      avoidList: ["Cumul sucre (jus + tartine)", "Usage quotidien"],
      frequencyLabel: "Occasionnel (1-2x/semaine)"
    },
    "biscuit": {
      portionLabel: "2-3 biscuits",
      doList: ["Prefere en fin de repas", "Accompagne d eau ou the"],
      avoidList: ["Grignotage hors repas", "Paquet entier"],
      frequencyLabel: "Occasionnel"
    },
    "soda": {
      portionLabel: "1 verre (200ml)",
      doList: ["Reserve aux occasions festives"],
      avoidList: ["Consommation quotidienne", "Grandes quantites"],
      frequencyLabel: "Exceptionnel"
    },
    "chips": {
      portionLabel: "Une poignee (30g)",
      doList: ["Partage en convivialite", "Accompagne de crudites"],
      avoidList: ["Paquet seul", "Usage regulier"],
      frequencyLabel: "Occasionnel"
    },
    "candy": {
      portionLabel: "2-3 bonbons",
      doList: ["Savoure lentement", "Reserve aux moments plaisir"],
      avoidList: ["Grignotage repete", "Grandes quantites"],
      frequencyLabel: "Occasionnel"
    },
    "ice-cream": {
      portionLabel: "1 boule (60g)",
      doList: ["Savoure en dessert", "Prefere versions artisanales"],
      avoidList: ["Pot entier", "Usage quotidien"],
      frequencyLabel: "Occasionnel"
    },
    "default": {
      portionLabel: "Portion raisonnable",
      doList: ["Savoure en conscience", "Integre dans un moment plaisir"],
      avoidList: ["Consommation excessive", "Usage quotidien"],
      frequencyLabel: "Occasionnel"
    }
  };
  return pleasureMap[subcategory || "default"] || pleasureMap["default"];
};

// ============================================
// COMPOSANTS INTERNES
// ============================================

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[20px] bg-white border border-slate-200 shadow-[0_10px_30px_rgba(2,6,23,0.06)] ${className}`}>
      {children}
    </div>
  );
}

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return null;
  const getColor = (s: number) => {
    if (s >= 70) return { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" };
    if (s >= 50) return { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" };
    if (s >= 30) return { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-200" };
    return { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200" };
  };
  const colors = getColor(score);
  return (
    <div className={`flex items-center justify-center w-11 h-11 rounded-full ${colors.bg} ${colors.text} ring-2 ${colors.ring} flex-shrink-0`}>
      <span className="text-sm font-bold">{score}</span>
    </div>
  );
}

// ============================================
// ACCORDÉON DÉTAILS
// ============================================
function DetailsAccordion({
  product,
  alternatives,
  onSelectAlternative,
  scores,
  nova,
  nutriScore,
  nutrition
}: {
  product: Product;
  alternatives: Alternative[];
  onSelectAlternative: (id: string) => void;
  scores?: Scores;
  nova: number | null;
  nutriScore: string | null;
  nutrition: NutritionData | null;
}) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggle = (section: string) => setOpenSection(openSection === section ? null : section);

  const additives = product.additives_extracted || product.additives_tags || product.foodData?.additives || [];
  const labels = product.labels || product.foodData?.labels || [];
  const isBio = labels.some(l => l.toLowerCase().includes("bio"));
  const flags = product.constitution?.healthReflex?.flags || [];

  const sections = [
    {
      id: "quick-info",
      title: "Infos rapides",
      icon: "\uD83D\uDCCA",
      hasContent: !!(nova || nutriScore || isBio || flags.length > 0),
      content: (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {nova && (
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                nova === 4 ? "bg-red-100 text-red-700" :
                nova === 3 ? "bg-orange-100 text-orange-700" :
                nova === 2 ? "bg-yellow-100 text-yellow-700" :
                "bg-green-100 text-green-700"
              }`}>
                NOVA {nova} {nova === 4 ? "\u2022 Ultra-transforme" : nova === 1 ? "\u2022 Brut" : ""}
              </span>
            )}
            {nutriScore && (
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase ${
                nutriScore === "a" ? "bg-green-100 text-green-700" :
                nutriScore === "b" ? "bg-lime-100 text-lime-700" :
                nutriScore === "c" ? "bg-yellow-100 text-yellow-700" :
                nutriScore === "d" ? "bg-orange-100 text-orange-700" :
                "bg-red-100 text-red-700"
              }`}>
                Nutri-Score {nutriScore.toUpperCase()}
              </span>
            )}
            {isBio && (
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                \uD83C\uDF31 Bio
              </span>
            )}
          </div>
          {flags.length > 0 && (
            <div className="space-y-1">
              {flags.slice(0, 3).map((flag, i) => (
                <p key={i} className="text-sm text-slate-600">\u2022 {formatKeyPoint(flag)}</p>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: "additives",
      title: `Additifs${additives.length > 0 ? ` (${additives.length})` : ""}`,
      icon: "\uD83E\uDDEA",
      hasContent: additives.length > 0,
      content: (
        <div className="space-y-2">
          {additives.slice(0, 5).map((additive, i) => (
            <div key={i} className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600">
              {additive}
            </div>
          ))}
          {additives.length > 5 && (
            <p className="text-xs text-slate-500 mt-2">
              + {additives.length - 5} autres additifs
            </p>
          )}
        </div>
      )
    },
    {
      id: "alternatives",
      title: `Alternatives${alternatives.length > 0 ? ` (${alternatives.length})` : ""}`,
      icon: "\uD83D\uDD04",
      hasContent: alternatives.length > 0,
      content: (
        <div className="space-y-2">
          {alternatives.slice(0, 3).map((alt) => (
            <button
              key={alt._id}
              onClick={() => onSelectAlternative(alt._id)}
              className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-white overflow-hidden flex-shrink-0 grid place-items-center border border-slate-200">
                {alt.imageUrl || alt.images?.front ? (
                  <img src={alt.imageUrl || alt.images?.front} alt={alt.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-slate-300">\uD83D\uDCE6</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{alt.name}</p>
                {alt.brand && <p className="text-xs text-slate-500">{alt.brand}</p>}
              </div>
              {alt.scores?.overallScore && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  alt.scores.overallScore >= 70 ? "bg-emerald-100 text-emerald-700" :
                  alt.scores.overallScore >= 50 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {alt.scores.overallScore}
                </span>
              )}
            </button>
          ))}
          {alternatives.length === 0 && (
            <p className="text-sm text-slate-500">Aucune alternative trouvee</p>
          )}
        </div>
      )
    },
    {
      id: "nutrition",
      title: "Nutrition complete",
      icon: "\uD83D\uDCCB",
      hasContent: !!nutrition,
      content: nutrition ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 mb-2">Pour 100g</p>
          <div className="grid grid-cols-2 gap-3">
            {nutrition.sugars !== undefined && (
              <div className="px-3 py-2 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Sucres</p>
                <p className="text-sm font-medium text-slate-900">{nutrition.sugars}g</p>
              </div>
            )}
            {(nutrition.saturatedFat ?? nutrition.saturated_fat) !== undefined && (
              <div className="px-3 py-2 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Graisses sat.</p>
                <p className="text-sm font-medium text-slate-900">{nutrition.saturatedFat ?? nutrition.saturated_fat}g</p>
              </div>
            )}
            {nutrition.salt !== undefined && (
              <div className="px-3 py-2 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Sel</p>
                <p className="text-sm font-medium text-slate-900">{nutrition.salt}g</p>
              </div>
            )}
            {nutrition.fiber !== undefined && (
              <div className="px-3 py-2 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Fibres</p>
                <p className="text-sm font-medium text-slate-900">{nutrition.fiber}g</p>
              </div>
            )}
            {nutrition.proteins !== undefined && (
              <div className="px-3 py-2 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Proteines</p>
                <p className="text-sm font-medium text-slate-900">{nutrition.proteins}g</p>
              </div>
            )}
            {nutrition.fat !== undefined && (
              <div className="px-3 py-2 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Matieres grasses</p>
                <p className="text-sm font-medium text-slate-900">{nutrition.fat}g</p>
              </div>
            )}
          </div>
          {scores && (scores.healthScore || scores.environmentScore) && (
            <div className="pt-3 mt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">Scores Ecolojia</p>
              <div className="flex gap-4">
                {scores.healthScore !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">\uD83C\uDFE5</span>
                    <span className="text-sm text-slate-700">Sante: {scores.healthScore}/100</span>
                  </div>
                )}
                {scores.environmentScore !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">\uD83C\uDF0D</span>
                    <span className="text-sm text-slate-700">Environnement: {scores.environmentScore}/100</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Donnees nutritionnelles non disponibles</p>
      )
    }
  ];

  const activeSections = sections.filter(s => s.hasContent);
  if (activeSections.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <p className="text-sm font-medium text-slate-700">Voir les details</p>
      </div>
      {activeSections.map((section, index) => (
        <div key={section.id} className={index > 0 ? "border-t border-slate-100" : ""}>
          <button
            onClick={() => toggle(section.id)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span>{section.icon}</span>
              <span className="text-sm font-medium text-slate-700">{section.title}</span>
            </div>
            {openSection === section.id ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>
          <AnimatePresence>
            {openSection === section.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  {section.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </Card>
  );
}

// ============================================
// PAGE PRINCIPALE — 3 BLOCS + ACCORDÉON
// ============================================
export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [productContext, setProductContext] = useState<ProductContextProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const { user } = useAuthContext();

  // Charger le produit
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
        setProductContext(null);
      } else {
        const productData = res.data?.product || res.data;
        const contextData = res.data?.productContext || null;
        setProduct(productData);
        setProductContext(contextData);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  // Charger les alternatives
  useEffect(() => {
    if (!product?.barcode) return;
    let alive = true;
    (async () => {
      const res = await getJSON(`/api/products/${product.barcode}/alternatives`);
      if (!alive) return;
      if (res.ok && Array.isArray(res.data)) setAlternatives(res.data);
    })();
    return () => { alive = false; };
  }, [product?.barcode]);

  // Actions
  const onShare = useCallback(async () => {
    if (!product) return;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copie !");
    }
  }, [product]);

  const onAddToList = useCallback(() => {
    toast.success("Ajoute a ma liste \u2713");
  }, []);

  const onAlternatives = useCallback(() => {
    document.getElementById("details-section")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const onSelectAlt = useCallback((altId: string) => {
    nav(`/product/${altId}`);
  }, [nav]);

  // Loading
  if (loading) return <ProductPageSkeleton />;

  // Erreur
  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center p-4">
        <motion.div {...fadeInUp} className="w-full max-w-md rounded-[20px] border border-slate-200 bg-white p-8 text-center shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
          <div className="text-5xl mb-4">{"\uD83D\uDE15"}</div>
          <div className="text-xl font-semibold text-slate-900">Produit introuvable</div>
          <div className="mt-2 text-sm text-slate-500">{error ?? "Ce produit n existe pas."}</div>
          <button onClick={() => nav("/search")} className="mt-6 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all">
            Rechercher un produit
          </button>
        </motion.div>
      </div>
    );
  }

  // Extraire les donnees
  const { constitution, scores, foodData, nutrition } = product;
  const healthReflex = constitution?.healthReflex;
  const level = healthReflex?.level ?? null;
  const flags = healthReflex?.flags ?? [];
  const nova = foodData?.novaGroup ?? null;
  const nutriScore = foodData?.nutriScore ?? null;
  const nutritionData = nutrition || foodData?.nutritionalInfo || null;
  const imageUrl = product.imageUrl || product.images?.front;
  const overallScore = scores?.overallScore;

  // Donnees pour les composants
  const weeklyPlace = getWeeklyPlace(level, nova);
  const oneLiner = getOneLiner(level, nova);
  const keyPoint = formatKeyPoint(flags?.[0]) || (nova === 4 ? "Produit ultra-transforme" : undefined);
  const reflexData = getReflexData(product.subcategory, level, nova);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header navigation */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <button onClick={() => nav(-1)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <span className="text-sm font-medium text-slate-600">Fiche produit</span>
          <button onClick={onShare} className="p-2 -mr-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all">
            <Share2 className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* ═══ CONTENU : 3 BLOCS VISIBLES + ACCORDÉON ═══ */}
      <motion.div
        className="mx-auto max-w-2xl px-4 py-5 space-y-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* BLOC 1 : Header produit */}
        <motion.div variants={fadeInUp}>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 grid place-items-center">
                {imageUrl ? (
                  <img src={imageUrl} alt={product.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-2xl text-slate-300">{"\uD83D\uDCE6"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2">{product.name}</h1>
                {product.brand && <p className="text-sm text-slate-500 mt-0.5">{product.brand}</p>}
              </div>
              <ScoreBadge score={overallScore} />
            </div>
          </Card>
        </motion.div>

        {/* BLOC 2 : A RETENIR */}
        <motion.div variants={fadeInUp}>
          <TakeawayCard
            weeklyPlace={weeklyPlace}
            oneLiner={oneLiner}
            keyPoint={keyPoint}
          />
        </motion.div>

        {/* BLOC 3 : REFLEXE CONCRET */}
        <motion.div variants={fadeInUp}>
          <ReflexCard
            portionLabel={reflexData.portionLabel}
            doList={reflexData.doList}
            avoidList={reflexData.avoidList}
            frequencyLabel={reflexData.frequencyLabel}
          />
        </motion.div>

        {/* IMPACT + POSITION SEMAINE (fusionne — Socle V2.1) */}
        <motion.div variants={fadeInUp}>
          <ImpactBalanceCard
            subcategory={product.subcategory}
            categoryType={product.categoryType || "food"}
            nova={nova}
            nutriScore={nutriScore}
            flags={flags}
            additives={product.additives_extracted || product.additives_tags || product.foodData?.additives || []}
            labels={product.labels || product.foodData?.labels || []}
            apiLevel={level}
          />
        </motion.div>

        {/* ACCORDEON DETAILS */}
        <motion.div variants={fadeInUp} id="details-section">
          <DetailsAccordion
            product={product}
            alternatives={alternatives}
            onSelectAlternative={onSelectAlt}
            scores={scores}
            nova={nova}
            nutriScore={nutriScore}
            nutrition={nutritionData}
          />
        </motion.div>

        {/* SIGNATURE ECOLOJIA */}
        <motion.div variants={fadeInUp}>
          <SignatureFooter />
        </motion.div>

        {/* Espace sticky bar */}
        <div className="h-24 sm:h-6" />
      </motion.div>

      {/* Sticky action bar */}
      <StickyActionBar onAlternatives={onAlternatives} onAddToList={onAddToList} />
    </div>
  );
}

