/**
 * ProductPage.tsx — ECOLOJIA V2 (Refonte Calm Intelligence)
 *
 * ✅ Zéro score numérique — profil qualitatif uniquement
 * ✅ 3 blocs above-the-fold : Takeaway + Réflexes + Signaux (2 max)
 * ✅ Position semaine visuelle
 * ✅ Accordéon détails (NOVA, ingrédients, nutrition, alternatives)
 * ✅ Phrase signature Ecolojia
 * ✅ Auto-scan conservé
 * ✅ Alternatives conservées
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { ProductPageSkeleton } from "../components/product/ProductPageSkeleton";
import { StickyActionBar } from "../components/product/StickyActionBar";
import { useAuthContext } from "../Contexts/AuthContext";

// ============================================
// ANIMATIONS
// ============================================
const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
};
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

// ============================================
// TYPES
// ============================================
type Level = 1 | 2 | 3;
type WeeklyPlace = "base" | "regular" | "occasional" | "limit" | "context";

interface HealthReflex {
  level: Level;
  levelLabel?: string | null;
  flags?: string[] | null;
  content?: string | null;
}
interface Habit {
  id?: string;
  title: string;
  description?: string;
}
interface Constitution {
  healthReflex?: HealthReflex;
  habit?: Habit;
}
interface Scores {
  overallScore?: number;
  healthScore?: number;
  environmentScore?: number;
}
interface NutritionData {
  sugars?: number;
  fat?: number;
  saturated_fat?: number;
  saturatedFat?: number;
  salt?: number;
  fiber?: number;
  proteins?: number;
}
interface FoodData {
  novaGroup?: number;
  nutriScore?: string;
  nutritionalInfo?: NutritionData;
  additives?: string[];
  labels?: string[];
}
interface Alternative {
  _id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  images?: { front?: string };
  scores?: { overallScore?: number };
}
interface Product {
  _id: string;
  name: string;
  brand?: string;
  barcode?: string;
  imageUrl?: string;
  images?: { front?: string };
  scores?: Scores;
  foodData?: FoodData;
  nutrition?: NutritionData;
  constitution?: Constitution;
  subcategory?: string;
  categoryType?: string;
  tags?: string[];
  labels?: string[];
  additives_tags?: string[];
  additives_extracted?: string[];
  ingredients_text?: string;
  dataQuality?: { additivesSource?: string; additivesCount?: number };
}

interface Signal {
  type: "nutrient" | "exposure";
  label: string;
  level: "positive" | "caution" | "warning";
  detail: string;
}

// ============================================
// PROFILE CONFIG (remplace le score numérique)
// ============================================
const PROFILE_CONFIG: Record<
  WeeklyPlace,
  {
    label: string;
    sublabel: string;
    icon: string;
    desc: string;
    bgClass: string;
    textClass: string;
    accentClass: string;
    borderClass: string;
    lightBgClass: string;
    barColor: string;
    headerGradient: string;
  }
> = {
  base: {
    label: "Base",
    sublabel: "Aliment fondamental",
    icon: "🌿",
    desc: "S'intègre librement dans ton alimentation quotidienne.",
    bgClass: "bg-emerald-50",
    textClass: "text-emerald-800",
    accentClass: "bg-emerald-500",
    borderClass: "border-emerald-200",
    lightBgClass: "bg-emerald-100",
    barColor: "#10b981",
    headerGradient: "from-emerald-50/80 to-stone-50",
  },
  regular: {
    label: "Régulier",
    sublabel: "Place naturelle au quotidien",
    icon: "🔄",
    desc: "Peut revenir régulièrement sans vigilance particulière.",
    bgClass: "bg-sky-50",
    textClass: "text-sky-800",
    accentClass: "bg-sky-500",
    borderClass: "border-sky-200",
    lightBgClass: "bg-sky-100",
    barColor: "#0ea5e9",
    headerGradient: "from-sky-50/80 to-stone-50",
  },
  occasional: {
    label: "Occasionnel",
    sublabel: "Plaisir ponctuel",
    icon: "✨",
    desc: "Garde sa place dans une semaine équilibrée, sans excès.",
    bgClass: "bg-amber-50",
    textClass: "text-amber-800",
    accentClass: "bg-amber-500",
    borderClass: "border-amber-200",
    lightBgClass: "bg-amber-100",
    barColor: "#f59e0b",
    headerGradient: "from-amber-50/80 to-stone-50",
  },
  limit: {
    label: "À limiter",
    sublabel: "Fréquence à surveiller",
    icon: "⏱️",
    desc: "La fréquence est le vrai sujet — pas l'interdiction.",
    bgClass: "bg-red-50",
    textClass: "text-red-800",
    accentClass: "bg-[#f97068]",
    borderClass: "border-red-200",
    lightBgClass: "bg-red-100",
    barColor: "#f97068",
    headerGradient: "from-red-50/80 to-stone-50",
  },
  context: {
    label: "À contextualiser",
    sublabel: "Dépend de ton usage",
    icon: "🔍",
    desc: "Consulte les détails pour mieux comprendre ce produit.",
    bgClass: "bg-slate-50",
    textClass: "text-slate-700",
    accentClass: "bg-slate-500",
    borderClass: "border-slate-200",
    lightBgClass: "bg-slate-100",
    barColor: "#94a3b8",
    headerGradient: "from-slate-50/80 to-stone-50",
  },
};

const ALL_POSITIONS: WeeklyPlace[] = ["base", "regular", "occasional", "limit"];

// ============================================
// HELPERS
// ============================================
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

const getWeeklyPlace = (
  level: number | null,
  nova: number | null
): WeeklyPlace => {
  if (level === 1) return "base";
  if (level === 2) return nova === 4 ? "limit" : "regular";
  if (level === 3) return nova === 4 ? "limit" : "occasional";
  return "context";
};

const getTakeaway = (
  level: number | null,
  nova: number | null,
  productName: string
): string => {
  if (level === 1)
    return "Un aliment de base, à intégrer sans hésiter dans ton quotidien. La qualité des habitudes se construit avec ce type de produit.";
  if (level === 2 && nova === 4)
    return "Un produit ultra-transformé dont la fréquence mérite attention. Pas à bannir, mais à conscientiser dans ta semaine.";
  if (level === 2)
    return "Un produit correct qui trouve sa place dans une alimentation variée. La modération et la variété restent les meilleurs repères.";
  if (level === 3)
    return "Un produit plaisir — et c'est OK. C'est la répétition qui compte, pas un usage ponctuel.";
  return "Consulte les détails pour mieux comprendre ce produit et lui trouver sa juste place.";
};

const getReflexData = (
  subcategory: string | undefined,
  level: number | null,
  nova: number | null
): {
  reflexes: { icon: string; text: string; highlight: boolean }[];
  frequencyLabel: string;
} => {
  if (level === 1) {
    return {
      reflexes: [
        {
          icon: "🥄",
          text: "Portion selon ton appétit — pas de restriction",
          highlight: false,
        },
        {
          icon: "🔁",
          text: "Varie les préparations pour ne pas te lasser",
          highlight: true,
        },
      ],
      frequencyLabel: "Quotidien possible",
    };
  }
  if (level === 2) {
    const isUltra = nova === 4;
    return {
      reflexes: isUltra
        ? [
            {
              icon: "📋",
              text: "Lis les ingrédients — préfère les listes courtes",
              highlight: true,
            },
            {
              icon: "🔄",
              text: "Cherche une version moins transformée",
              highlight: false,
            },
            {
              icon: "📅",
              text: "Pas en quotidien — garde pour 2-3x/semaine max",
              highlight: false,
            },
          ]
        : [
            {
              icon: "🍽️",
              text: "Intègre dans un repas équilibré",
              highlight: false,
            },
            {
              icon: "🔁",
              text: "Alterne avec d'autres produits de la même famille",
              highlight: true,
            },
          ],
      frequencyLabel: isUltra
        ? "À limiter (2-3x/semaine max)"
        : "Régulier avec modération",
    };
  }

  // Level 3 — produits plaisir
  const pleasureMap: Record<
    string,
    {
      reflexes: { icon: string; text: string; highlight: boolean }[];
      frequencyLabel: string;
    }
  > = {
    "chocolate-spread": {
      reflexes: [
        {
          icon: "🥄",
          text: "1 tartine fine (15g) — c'est suffisant pour le plaisir",
          highlight: false,
        },
        {
          icon: "🍌",
          text: "Accompagne d'un fruit pour équilibrer",
          highlight: true,
        },
        {
          icon: "⚠️",
          text: "Évite le cumul sucré (jus + tartine + céréales)",
          highlight: false,
        },
      ],
      frequencyLabel: "Occasionnel (1-2x/semaine)",
    },
    biscuit: {
      reflexes: [
        {
          icon: "🍪",
          text: "2-3 biscuits en fin de repas, pas en grignotage",
          highlight: true,
        },
        {
          icon: "☕",
          text: "Accompagne d'eau ou thé, pas de soda",
          highlight: false,
        },
      ],
      frequencyLabel: "Occasionnel",
    },
    soda: {
      reflexes: [
        {
          icon: "🥂",
          text: "1 verre (200ml) en occasion festive",
          highlight: true,
        },
        {
          icon: "💧",
          text: "L'eau reste la boisson de référence",
          highlight: false,
        },
      ],
      frequencyLabel: "Exceptionnel",
    },
    chips: {
      reflexes: [
        {
          icon: "🤝",
          text: "Une poignée (30g) en partage convivial",
          highlight: true,
        },
        {
          icon: "🥕",
          text: "Accompagne de crudités pour varier",
          highlight: false,
        },
      ],
      frequencyLabel: "Occasionnel",
    },
  };

  const data = pleasureMap[subcategory || ""] || {
    reflexes: [
      {
        icon: "😌",
        text: "Savoure en conscience, dans un moment plaisir",
        highlight: true,
      },
      {
        icon: "📅",
        text: "Pas en quotidien — c'est la fréquence qui compte",
        highlight: false,
      },
    ],
    frequencyLabel: "Occasionnel",
  };
  return data;
};

/**
 * Génère les 2 signaux max à afficher
 */
const buildSignals = (
  flags: string[],
  nova: number | null,
  nutrition: NutritionData | null,
  additives: string[],
  level: number | null
): Signal[] => {
  const signals: Signal[] = [];

  // Positive signals for level 1
  if (level === 1) {
    if (nova === 1) {
      signals.push({
        type: "nutrient",
        label: "Non transformé",
        level: "positive",
        detail: "Aliment brut ou minimalement transformé — NOVA 1",
      });
    }
    if (nutrition?.fiber && nutrition.fiber >= 5) {
      signals.push({
        type: "nutrient",
        label: "Riche en fibres",
        level: "positive",
        detail: `${nutrition.fiber}g de fibres / 100g — favorable au transit et à la satiété`,
      });
    }
    if (nutrition?.proteins && nutrition.proteins >= 15) {
      signals.push({
        type: "nutrient",
        label: "Source de protéines",
        level: "positive",
        detail: `${nutrition.proteins}g / 100g — contribue à l'entretien de la masse musculaire`,
      });
    }
    if (signals.length === 0) {
      signals.push({
        type: "nutrient",
        label: "Profil favorable",
        level: "positive",
        detail: "Aliment de base adapté à une consommation régulière",
      });
    }
  }

  // Warning signals
  const flagLower = flags.map((f) => f.toLowerCase());

  if (
    flagLower.some((f) => f.includes("sugar") || f.includes("sucre")) &&
    signals.length < 2
  ) {
    signals.push({
      type: "exposure",
      label: "Sucres ajoutés",
      level: "warning",
      detail: nutrition?.sugars
        ? `${nutrition.sugars}g / 100g — en cumul quotidien, la fréquence compte`
        : "Teneur élevée en sucres — la fréquence d'exposition est déterminante",
    });
  }

  if (
    flagLower.some((f) => f.includes("salt") || f.includes("sel")) &&
    signals.length < 2
  ) {
    signals.push({
      type: "exposure",
      label: "Sel",
      level: "caution",
      detail: nutrition?.salt
        ? `${nutrition.salt}g / 100g — à considérer dans le cumul journalier`
        : "Teneur notable en sel — surveiller la fréquence",
    });
  }

  if (
    flagLower.some((f) => f.includes("fat") || f.includes("gras")) &&
    signals.length < 2
  ) {
    const satFat = nutrition?.saturatedFat ?? nutrition?.saturated_fat;
    signals.push({
      type: "exposure",
      label: "Graisses saturées",
      level: "caution",
      detail: satFat
        ? `${satFat}g / 100g — varier les sources de lipides est recommandé`
        : "Teneur notable en graisses saturées",
    });
  }

  if (nova === 4 && signals.length < 2) {
    signals.push({
      type: "exposure",
      label: "Ultra-transformation",
      level: "warning",
      detail: `NOVA 4${
        additives.length > 0 ? ` — ${additives.length} additifs détectés` : ""
      }. La fréquence d'exposition est le vrai sujet.`,
    });
  }

  if (additives.length >= 4 && signals.length < 2) {
    signals.push({
      type: "exposure",
      label: "Additifs multiples",
      level: "caution",
      detail: `${additives.length} additifs identifiés — en cas de consommation fréquente, l'exposition se cumule`,
    });
  }

  return signals.slice(0, 2);
};

// ============================================
// NOVA label helper
// ============================================
const novaInfo = (n: number | null) => {
  if (n === 1) return { label: "Non transformé", desc: "Aliment brut ou minimalement transformé", colorClass: "bg-emerald-100 text-emerald-800" };
  if (n === 2) return { label: "Ingrédient culinaire", desc: "Substance extraite d'un aliment du groupe 1", colorClass: "bg-lime-100 text-lime-800" };
  if (n === 3) return { label: "Transformé", desc: "Produit fabriqué avec des méthodes simples", colorClass: "bg-amber-100 text-amber-800" };
  if (n === 4) return { label: "Ultra-transformé", desc: "Produit industriel avec additifs et procédés multiples", colorClass: "bg-red-100 text-red-800" };
  return { label: "Non classé", desc: "Données NOVA non disponibles", colorClass: "bg-slate-100 text-slate-600" };
};

// ============================================
// SIGNAL level config
// ============================================
const SIGNAL_LEVEL: Record<
  string,
  {
    bgClass: string;
    borderColor: string;
    iconBgClass: string;
    iconTextClass: string;
    icon: string;
  }
> = {
  positive: {
    bgClass: "bg-emerald-50",
    borderColor: "border-l-emerald-500",
    iconBgClass: "bg-emerald-100",
    iconTextClass: "text-emerald-700",
    icon: "✓",
  },
  caution: {
    bgClass: "bg-amber-50",
    borderColor: "border-l-amber-500",
    iconBgClass: "bg-amber-100",
    iconTextClass: "text-amber-700",
    icon: "⚡",
  },
  warning: {
    bgClass: "bg-red-50",
    borderColor: "border-l-[#f97068]",
    iconBgClass: "bg-red-100",
    iconTextClass: "text-red-700",
    icon: "↑",
  },
};

// ============================================
// SUB-COMPONENTS (inline — pas de dépendances)
// ============================================

function ProfileBadge({ profile }: { profile: WeeklyPlace }) {
  const cfg = PROFILE_CONFIG[profile];
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl ${cfg.bgClass} border ${cfg.borderClass}`}
    >
      <div
        className={`w-11 h-11 rounded-xl ${cfg.lightBgClass} flex items-center justify-center text-[22px]`}
      >
        {cfg.icon}
      </div>
      <div>
        <div className={`font-bold text-[15px] tracking-tight ${cfg.textClass}`}>
          {cfg.label}
        </div>
        <div className={`text-xs ${cfg.textClass} opacity-70 mt-0.5`}>
          {cfg.sublabel}
        </div>
      </div>
    </div>
  );
}

function TakeawayCardV2({
  text,
  profile,
}: {
  text: string;
  profile: WeeklyPlace;
}) {
  const cfg = PROFILE_CONFIG[profile];
  return (
    <div
      className={`rounded-2xl bg-white border border-slate-200/80 shadow-md overflow-hidden`}
    >
      <div className={`border-l-4 ${cfg.borderClass.replace("border-", "border-l-")} p-5`}
        style={{ borderLeftColor: cfg.barColor }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[13px]`}
            style={{ backgroundColor: cfg.barColor + "18" }}
          >
            💡
          </div>
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: cfg.barColor }}
          >
            À retenir
          </span>
        </div>
        <p className="text-[15.5px] leading-relaxed text-slate-900 font-medium">
          {text}
        </p>
      </div>
    </div>
  );
}

function ReflexCardV2({
  reflexes,
  frequencyLabel,
  profile,
}: {
  reflexes: { icon: string; text: string; highlight: boolean }[];
  frequencyLabel: string;
  profile: WeeklyPlace;
}) {
  const cfg = PROFILE_CONFIG[profile];
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-[13px]">
          ✅
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Réflexes concrets
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {reflexes.map((r, i) => (
          <div
            key={i}
            className={`flex gap-3 items-start px-3.5 py-3 rounded-xl transition-all ${
              r.highlight
                ? `${cfg.bgClass} border ${cfg.borderClass}`
                : "bg-stone-100/80 border border-stone-200/50"
            }`}
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{r.icon}</span>
            <span
              className={`text-[13.5px] leading-snug ${
                r.highlight ? "font-medium text-slate-900" : "text-slate-700"
              }`}
            >
              {r.text}
            </span>
          </div>
        ))}
      </div>

      {/* Frequency pill */}
      <div
        className={`mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ${cfg.bgClass} border ${cfg.borderClass}`}
      >
        <span className="text-xs">📅</span>
        <span className={`text-xs font-semibold ${cfg.textClass}`}>
          {frequencyLabel}
        </span>
      </div>
    </div>
  );
}

function SignalCardV2({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) return null;
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-[13px]">
          📊
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
          Signaux clés
        </span>
        <span className="text-[11px] text-slate-400 ml-auto">
          2 repères max
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {signals.map((s, i) => {
          const lvl = SIGNAL_LEVEL[s.level];
          return (
            <div
              key={i}
              className={`p-3.5 rounded-xl border-l-4 ${lvl.bgClass} ${lvl.borderColor}`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div
                  className={`w-[22px] h-[22px] rounded-md ${lvl.iconBgClass} flex items-center justify-center text-[11px] font-bold ${lvl.iconTextClass}`}
                >
                  {lvl.icon}
                </div>
                <span className="text-[14px] font-semibold text-slate-900">
                  {s.label}
                </span>
                <span
                  className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md ml-auto ${lvl.iconBgClass} ${lvl.iconTextClass} tracking-wide`}
                >
                  {s.type === "nutrient" ? "Nutriment" : "Exposition"}
                </span>
              </div>
              <p className="text-[13px] leading-snug text-slate-600 pl-8">
                {s.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekPositionVisual({ profile }: { profile: WeeklyPlace }) {
  const activeIndex = ALL_POSITIONS.indexOf(profile);
  const cfg = PROFILE_CONFIG[profile];
  const labels = ["Base", "Régulier", "Occasion.", "À limiter"];

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-md p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
        Position dans la semaine
      </div>

      {/* Bar segments */}
      <div className="flex gap-1 mb-2.5">
        {ALL_POSITIONS.map((pos, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          const pcfg = PROFILE_CONFIG[pos];
          return (
            <div
              key={pos}
              className="flex-1 rounded-full transition-all duration-300"
              style={{
                height: isActive ? 10 : 6,
                backgroundColor: isActive
                  ? pcfg.barColor
                  : isPast
                  ? pcfg.barColor + "40"
                  : "#e5e7eb",
                boxShadow: isActive ? `0 2px 8px ${pcfg.barColor}40` : "none",
              }}
            />
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between mb-3">
        {labels.map((label, i) => (
          <span
            key={i}
            className={`text-[10.5px] ${
              i === activeIndex
                ? `font-bold ${PROFILE_CONFIG[ALL_POSITIONS[i]].textClass}`
                : "text-slate-400"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Context sentence */}
      <div className="px-3.5 py-2.5 rounded-xl bg-stone-100/80 text-[12.5px] text-slate-500 leading-snug italic">
        {cfg.desc}
      </div>

      <div className="mt-2.5 text-[11px] text-slate-300 text-center">
        Repère éducatif simplifié — pas une prescription médicale
      </div>
    </div>
  );
}

function DetailsAccordionV2({
  product,
  alternatives,
  onSelectAlternative,
  nova,
  nutrition,
}: {
  product: Product;
  alternatives: Alternative[];
  onSelectAlternative: (id: string) => void;
  nova: number | null;
  nutrition: NutritionData | null;
}) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggle = (s: string) => setOpenSection(openSection === s ? null : s);

  const nInfo = novaInfo(nova);
  const additives =
    product.additives_extracted ||
    product.additives_tags ||
    product.foodData?.additives ||
    [];
  const ingredientsText = product.ingredients_text || "";

  const sections = [
    {
      id: "transform",
      icon: "⚙️",
      title: "Transformation",
      show: nova !== null,
      content: (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-base ${nInfo.colorClass}`}
          >
            {nova}
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-900">
              NOVA {nova} — {nInfo.label}
            </div>
            <div className="text-xs text-slate-500">{nInfo.desc}</div>
          </div>
        </div>
      ),
    },
    {
      id: "ingredients",
      icon: "📋",
      title: "Ingrédients",
      show: ingredientsText.length > 0,
      content: (
        <div className="p-3 rounded-xl bg-stone-50 text-[13.5px] leading-relaxed text-slate-700">
          {ingredientsText || "Données non disponibles."}
        </div>
      ),
    },
    {
      id: "additives",
      icon: "🧪",
      title: `Additifs${additives.length > 0 ? ` (${additives.length})` : ""}`,
      show: additives.length > 0,
      content: (
        <div className="space-y-1.5">
          {additives.slice(0, 6).map((a, i) => (
            <div
              key={i}
              className="px-3 py-2 bg-stone-50 rounded-lg text-sm text-slate-600"
            >
              {a}
            </div>
          ))}
          {additives.length > 6 && (
            <p className="text-xs text-slate-400 mt-1">
              + {additives.length - 6} autres
            </p>
          )}
        </div>
      ),
    },
    {
      id: "nutrition",
      icon: "📊",
      title: "Repères nutritionnels",
      show: !!nutrition,
      content: nutrition ? (
        <div className="space-y-1.5">
          <p className="text-[11px] text-slate-400 mb-1">Pour 100g</p>
          {[
            {
              name: "Sucres",
              val: nutrition.sugars,
              unit: "g",
            },
            {
              name: "Graisses sat.",
              val: nutrition.saturatedFat ?? nutrition.saturated_fat,
              unit: "g",
            },
            { name: "Sel", val: nutrition.salt, unit: "g" },
            { name: "Fibres", val: nutrition.fiber, unit: "g" },
            { name: "Protéines", val: nutrition.proteins, unit: "g" },
            { name: "Mat. grasses", val: nutrition.fat, unit: "g" },
          ]
            .filter((n) => n.val !== undefined && n.val !== null)
            .map((n, i) => (
              <div
                key={i}
                className={`flex justify-between items-center px-3 py-2 rounded-lg ${
                  i % 2 === 0 ? "bg-stone-50" : ""
                }`}
              >
                <span className="text-[13px] text-slate-600">{n.name}</span>
                <span className="text-[13px] font-semibold text-slate-900">
                  {n.val}
                  {n.unit}
                </span>
              </div>
            ))}
        </div>
      ) : null,
    },
    {
      id: "alternatives",
      icon: "🔄",
      title: `Alternatives${
        alternatives.length > 0 ? ` (${alternatives.length})` : ""
      }`,
      show: alternatives.length > 0,
      content: (
        <div className="space-y-2">
          {alternatives.slice(0, 3).map((alt) => (
            <button
              key={alt._id}
              onClick={() => onSelectAlternative(alt._id)}
              className="w-full flex items-center gap-3 p-3 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-white overflow-hidden flex-shrink-0 grid place-items-center border border-slate-200">
                {alt.imageUrl || alt.images?.front ? (
                  <img
                    src={alt.imageUrl || alt.images?.front}
                    alt={alt.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-slate-300">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {alt.name}
                </p>
                {alt.brand && (
                  <p className="text-xs text-slate-500">{alt.brand}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      ),
    },
  ];

  const activeSections = sections.filter((s) => s.show);
  if (activeSections.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-md overflow-hidden">
      <div className="px-5 py-3 bg-stone-100/60 border-b border-slate-200/80">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Voir les détails
        </p>
      </div>
      {activeSections.map((section, index) => (
        <div
          key={section.id}
          className={index > 0 ? "border-t border-slate-100" : ""}
        >
          <button
            onClick={() => toggle(section.id)}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-stone-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{section.icon}</span>
              <span className="text-sm font-medium text-slate-700">
                {section.title}
              </span>
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
                <div className="px-5 pb-4">{section.content}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function SignatureFooterV2() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50/80 border border-emerald-200 shadow-sm p-4 flex gap-3.5 items-start">
      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-base flex-shrink-0 mt-0.5">
        🌱
      </div>
      <div>
        <p className="text-[13.5px] leading-relaxed font-medium text-emerald-800">
          L'ensemble du repas compte plus qu'un aliment isolé.
        </p>
        <p className="text-[13.5px] leading-relaxed font-medium text-emerald-800 mt-1">
          L'ensemble de la semaine compte plus qu'un repas isolé.
        </p>
      </div>
    </div>
  );
}

// ============================================
// PAGE PRINCIPALE
// ============================================
export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const { user } = useAuthContext();

  const base = import.meta.env.VITE_API_URL || "http://localhost:10000";

  // ── Charger le produit ──
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
        const productData = res.data?.product || res.data;
        setProduct(productData);

        // === AUTO-SCAN: enregistrer dans ScanHistory ===
        const token = localStorage.getItem("token");
        if (token && productData?.barcode) {
          fetch(`${base}/api/scans`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ barcode: productData.barcode }),
          }).catch(() => {});
        }
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // ── Charger les alternatives ──
  useEffect(() => {
    if (!product?.barcode) return;
    let alive = true;
    (async () => {
      const res = await getJSON(
        `/api/products/${product.barcode}/alternatives`
      );
      if (!alive) return;
      if (res.ok && Array.isArray(res.data)) setAlternatives(res.data);
    })();
    return () => {
      alive = false;
    };
  }, [product?.barcode]);

  // ── Actions ──
  const onShare = useCallback(async () => {
    if (!product) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url: window.location.href });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié !");
    }
  }, [product]);

  const onAddToList = useCallback(() => {
    toast.success("Ajouté à ma liste ✓");
  }, []);

  const onAlternatives = useCallback(() => {
    document
      .getElementById("details-section")
      ?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const onSelectAlt = useCallback(
    (altId: string) => {
      nav(`/product/${altId}`);
    },
    [nav]
  );

  // ── Loading ──
  if (loading) return <ProductPageSkeleton />;

  // ── Erreur ──
  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] grid place-items-center p-4">
        <motion.div
          {...fadeInUp}
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
        >
          <div className="text-5xl mb-4">{"😕"}</div>
          <div className="text-xl font-semibold text-slate-900">
            Produit introuvable
          </div>
          <div className="mt-2 text-sm text-slate-500">
            {error ?? "Ce produit n'existe pas dans notre base."}
          </div>
          <button
            onClick={() => nav("/search")}
            className="mt-6 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            Rechercher un produit
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Extraire les données ──
  const { constitution, foodData, nutrition } = product;
  const healthReflex = constitution?.healthReflex;
  const level = healthReflex?.level ?? null;
  const flags = healthReflex?.flags ?? [];
  const nova = foodData?.novaGroup ?? null;
  const nutritionData = nutrition || foodData?.nutritionalInfo || null;
  const imageUrl = product.imageUrl || product.images?.front;
  const additives =
    product.additives_extracted ||
    product.additives_tags ||
    product.foodData?.additives ||
    [];

  // ── Données dérivées ──
  const weeklyPlace = getWeeklyPlace(level, nova);
  const profileCfg = PROFILE_CONFIG[weeklyPlace];
  const takeawayText = getTakeaway(level, nova, product.name);
  const reflexData = getReflexData(product.subcategory, level, nova);
  const signals = buildSignals(flags, nova, nutritionData, additives, level);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* ═══ HEADER avec gradient profil ═══ */}
      <div className={`bg-gradient-to-b ${profileCfg.headerGradient}`}>
        {/* Navigation */}
        <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-lg border-b border-slate-200/60">
          <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => nav(-1)}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
            >
              <ArrowLeft className="h-[18px] w-[18px] text-slate-600" />
            </button>
            <span className="text-sm font-medium text-slate-500">
              Fiche produit
            </span>
            <button
              onClick={onShare}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
            >
              <Share2 className="h-[18px] w-[18px] text-slate-500" />
            </button>
          </div>
        </div>

        {/* Product identity */}
        <div className="mx-auto max-w-2xl px-4 pt-6 pb-5">
          <div className="flex gap-4 items-start">
            <div className="w-[72px] h-[72px] rounded-2xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 grid place-items-center shadow-sm">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-3xl text-slate-300">{"📦"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {product.subcategory && (
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                  {product.subcategory.replace(/-/g, " ")}
                </div>
              )}
              <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight line-clamp-2">
                {product.name}
              </h1>
              {product.brand && (
                <p className="text-[13.5px] text-slate-500 mt-1">
                  {product.brand}
                </p>
              )}
            </div>
          </div>

          {/* Profile badge — REMPLACE LE SCORE */}
          <div className="mt-5">
            <ProfileBadge profile={weeklyPlace} />
          </div>
        </div>
      </div>

      {/* ═══ CONTENU PRINCIPAL ═══ */}
      <motion.div
        className="mx-auto max-w-2xl px-4 py-4 space-y-3"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* BLOC 1 : À RETENIR */}
        <motion.div variants={fadeInUp}>
          <TakeawayCardV2 text={takeawayText} profile={weeklyPlace} />
        </motion.div>

        {/* BLOC 2 : RÉFLEXES CONCRETS */}
        <motion.div variants={fadeInUp}>
          <ReflexCardV2
            reflexes={reflexData.reflexes}
            frequencyLabel={reflexData.frequencyLabel}
            profile={weeklyPlace}
          />
        </motion.div>

        {/* BLOC 3 : SIGNAUX CLÉS (2 max) */}
        <motion.div variants={fadeInUp}>
          <SignalCardV2 signals={signals} />
        </motion.div>

        {/* POSITION SEMAINE */}
        <motion.div variants={fadeInUp}>
          <WeekPositionVisual profile={weeklyPlace} />
        </motion.div>

        {/* ACCORDÉON DÉTAILS */}
        <motion.div variants={fadeInUp} id="details-section">
          <DetailsAccordionV2
            product={product}
            alternatives={alternatives}
            onSelectAlternative={onSelectAlt}
            nova={nova}
            nutrition={nutritionData}
          />
        </motion.div>

        {/* SIGNATURE ECOLOJIA */}
        <motion.div variants={fadeInUp}>
          <SignatureFooterV2 />
        </motion.div>

        {/* Espace sticky bar */}
        <div className="h-24 sm:h-6" />
      </motion.div>

      {/* Sticky action bar */}
      <StickyActionBar
        onAlternatives={onAlternatives}
        onAddToList={onAddToList}
      />
    </div>
  );
}