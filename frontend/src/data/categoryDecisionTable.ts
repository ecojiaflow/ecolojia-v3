/**
 * ECOLOJIA — Table de Decision par Categorie (Socle V2)
 * 2 niveaux : subcategory -> canonicalCategory -> rulePack
 * Fallback "unknown" = 0 signal
 * @version 2.1.0
 */

export type EcoCategory =
  | "foundation" | "staple" | "protein" | "dairy" | "oils"
  | "pleasure" | "sugary_drink" | "prepared" | "water"
  | "cosmetic_daily" | "cosmetic_occasional" | "cosmetic_hygiene"
  | "cleaning_surface" | "cleaning_laundry" | "cleaning_disinfect" | "cleaning_ambient"
  | "unknown";

export type ProductStatus = "base" | "regular" | "occasional" | "limit" | "unknown";
export type SignalColor = "green" | "yellow" | "orange" | "red";

export interface SignalContext {
  nova: number | null;
  nutriScore: string | null;
  isOrganic: boolean;
  additivesCount: number;
  flags: string[];
  subcategory: string | null;
  categoryType: string | null;
}

export interface ActiveSignal {
  id: string;
  color: SignalColor;
  label: string;
  ficheSlug: string;
}

interface SignalDef {
  id: string;
  color: SignalColor;
  label: string;
  ficheSlug: string;
  condition?: (ctx: SignalContext) => boolean;
}

interface CategoryConfig {
  status: ProductStatus;
  mainIdea: string;
  signals: SignalDef[];
  forbiddenUI: string[];
}

// ═══ NIVEAU 1 — subcategory -> canonicalCategory ═══

const SUBCATEGORY_MAP: Record<string, EcoCategory> = {
  "fruit": "foundation", "vegetable": "foundation", "legume": "foundation",
  "legumes": "foundation", "salad": "foundation", "fresh-fruit": "foundation",
  "fresh-vegetable": "foundation", "dried-fruit": "foundation",
  "canned-vegetable": "foundation", "frozen-vegetable": "foundation",
  "bread": "staple", "pasta": "staple", "rice": "staple", "cereal": "staple",
  "flour": "staple", "potato": "staple", "breakfast": "staple",
  "breakfast-cereal": "staple", "granola": "staple",
  "meat": "protein", "poultry": "protein", "fish": "protein",
  "seafood": "protein", "egg": "protein", "tofu": "protein",
  "deli-meat": "protein", "charcuterie": "protein",
  "milk": "dairy", "yogurt": "dairy", "cheese": "dairy", "cream": "dairy",
  "butter": "dairy", "skyr": "dairy", "fromage-blanc": "dairy",
  "oil": "oils", "olive-oil": "oils", "vegetable-oil": "oils", "margarine": "oils",
  "chocolate-spread": "pleasure", "hazelnut-spread": "pleasure",
  "spread": "pleasure", "nut-butter": "pleasure", "biscuit": "pleasure",
  "cookie": "pleasure", "chips": "pleasure", "candy": "pleasure",
  "ice-cream": "pleasure", "chocolate-bar": "pleasure", "chocolate": "pleasure",
  "snack": "pleasure", "pastry": "pleasure", "cake": "pleasure",
  "confectionery": "pleasure", "dessert": "pleasure",
  "soda": "sugary_drink", "juice": "sugary_drink", "energy-drink": "sugary_drink",
  "sweetened-beverage": "sugary_drink", "flavored-water": "sugary_drink",
  "nectar": "sugary_drink",
  "prepared-meal": "prepared", "frozen-meal": "prepared", "pizza": "prepared",
  "soup": "prepared", "ready-meal": "prepared", "canned-meal": "prepared",
  "sandwich": "prepared",
  "water": "water", "mineral-water": "water", "spring-water": "water",
  "skincare": "cosmetic_daily", "face-cream": "cosmetic_daily",
  "moisturizer": "cosmetic_daily", "deodorant": "cosmetic_daily",
  "sunscreen": "cosmetic_daily", "lip-balm": "cosmetic_daily",
  "bodycare": "cosmetic_occasional", "body-lotion": "cosmetic_occasional",
  "makeup": "cosmetic_occasional", "perfume": "cosmetic_occasional",
  "haircare": "cosmetic_hygiene", "shampoo": "cosmetic_hygiene",
  "conditioner": "cosmetic_hygiene", "shower-gel": "cosmetic_hygiene",
  "soap": "cosmetic_hygiene", "toothpaste": "cosmetic_hygiene",
  "cleaning": "cleaning_surface", "multi-surface": "cleaning_surface",
  "kitchen-cleaner": "cleaning_surface", "bathroom-cleaner": "cleaning_surface",
  "laundry": "cleaning_laundry", "detergent": "cleaning_laundry",
  "fabric-softener": "cleaning_laundry",
  "bleach": "cleaning_disinfect", "disinfectant": "cleaning_disinfect",
  "air-freshener": "cleaning_ambient", "candle": "cleaning_ambient",
  "incense": "cleaning_ambient",
};

// ═══ NIVEAU 2 — canonicalCategory -> rulePack ═══

const isPest = (s: string | null) => s ? ["fruit","fresh-fruit","vegetable","fresh-vegetable","salad"].includes(s) : false;
const isFish = (s: string | null) => s ? ["fish","seafood"].includes(s) : false;

const RULES: Record<EcoCategory, CategoryConfig> = {
  unknown: {
    status: "unknown", mainIdea: "", signals: [], forbiddenUI: [],
  },
  foundation: {
    status: "base", mainIdea: "La base — varie et profite",
    signals: [
      { id: "pesticides", color: "yellow", label: "Residus frequents sur ce type de produit",
        ficheSlug: "pesticides", condition: (ctx) => !ctx.isOrganic && isPest(ctx.subcategory) },
    ],
    forbiddenUI: ["calorie_count", "macro_breakdown"],
  },
  staple: {
    status: "base", mainIdea: "Energie durable — la transformation compte",
    signals: [
      { id: "ut_staple", color: "orange", label: "Ultra-transforme · Prefere versions simples",
        ficheSlug: "ultra-transformation", condition: (ctx) => ctx.nova === 4 },
      { id: "t_staple", color: "yellow", label: "Transforme · Compare les listes d ingredients",
        ficheSlug: "lire-ingredients", condition: (ctx) => ctx.nova === 3 },
    ],
    forbiddenUI: [],
  },
  protein: {
    status: "regular", mainIdea: "Essentiel — varier les sources",
    signals: [
      { id: "metaux", color: "yellow", label: "Poisson · Varier les especes",
        ficheSlug: "poissons-metaux-lourds", condition: (ctx) => isFish(ctx.subcategory) },
      { id: "ut_protein", color: "orange", label: "Ultra-transforme · Prefere brut",
        ficheSlug: "ultra-transformation", condition: (ctx) => ctx.nova === 4 },
    ],
    forbiddenUI: [],
  },
  dairy: {
    status: "regular", mainIdea: "Source pratique — pas indispensable",
    signals: [
      { id: "ut_dairy", color: "orange", label: "Ultra-transforme · Prefere nature",
        ficheSlug: "ultra-transformation", condition: (ctx) => ctx.nova === 4 },
    ],
    forbiddenUI: [],
  },
  oils: {
    status: "regular", mainIdea: "Qualite et variete comptent",
    signals: [
      { id: "varier_huiles", color: "green", label: "Varie les sources de matieres grasses",
        ficheSlug: "huiles-vegetales" },
    ],
    forbiddenUI: [],
  },
  pleasure: {
    status: "occasional", mainIdea: "Plaisir — c est la frequence qui compte",
    signals: [
      { id: "plaisir", color: "orange", label: "Produit plaisir · La frequence est la seule question",
        ficheSlug: "produits-plaisir" },
    ],
    forbiddenUI: ["nutrition_bars", "percent_daily_value", "macro_breakdown", "sugar_grams_detail", "calorie_count"],
  },
  sugary_drink: {
    status: "limit", mainIdea: "Sucres liquides — absorption rapide",
    signals: [
      { id: "boisson", color: "red", label: "Boisson sucree · Limiter la frequence",
        ficheSlug: "sucres-ajoutes" },
    ],
    forbiddenUI: ["nutrition_bars", "calorie_count"],
  },
  prepared: {
    status: "occasional", mainIdea: "Pratique — la transformation est le sujet",
    signals: [
      { id: "ut_prepared", color: "orange", label: "Ultra-transforme · Frequence a surveiller",
        ficheSlug: "ultra-transformation", condition: (ctx) => ctx.nova === 4 },
      { id: "sel_prepared", color: "yellow", label: "Sel cache · Verifie l etiquette",
        ficheSlug: "sel-cache", condition: (ctx) => ctx.flags.includes("sel_eleve") },
    ],
    forbiddenUI: [],
  },
  water: {
    status: "base", mainIdea: "La base — le contenant compte",
    signals: [
      { id: "eau_plastique", color: "yellow", label: "Eau en bouteille · Privilegie verre ou robinet",
        ficheSlug: "plastique" },
    ],
    forbiddenUI: ["mineral_comparison", "brand_recommendation", "calcium_ranking"],
  },
  cosmetic_daily: {
    status: "regular", mainIdea: "Contact cutane repete — la frequence est le sujet",
    signals: [
      { id: "expo_cut", color: "orange", label: "Usage quotidien · L exposition cutanee s accumule",
        ficheSlug: "exposition-cutanee" },
    ],
    forbiddenUI: ["toxicity_label"],
  },
  cosmetic_occasional: {
    status: "occasional", mainIdea: "Usage ponctuel — moindre exposition",
    signals: [
      { id: "compo_occ", color: "yellow", label: "Usage ponctuel · Verifie la composition",
        ficheSlug: "composition-cosmetique",
        condition: (ctx) => ctx.flags.includes("substance_classee") || ctx.flags.includes("substance_surveillee") },
    ],
    forbiddenUI: ["toxicity_label"],
  },
  cosmetic_hygiene: {
    status: "regular", mainIdea: "Rince = bref — non rince = prolonge",
    signals: [
      { id: "rince", color: "yellow", label: "Produit rince · Exposition breve",
        ficheSlug: "rince-vs-non-rince" },
    ],
    forbiddenUI: ["toxicity_label"],
  },
  cleaning_surface: {
    status: "regular", mainIdea: "Inhalation repetee = la vraie exposition",
    signals: [
      { id: "spray", color: "red", label: "Format spray · Inhalation directe",
        ficheSlug: "inhalation-menagers",
        condition: (ctx) => ctx.subcategory === "air-freshener" || ctx.subcategory === "deodorant" },
      { id: "aerer", color: "yellow", label: "Nettoyant · Aerer pendant l usage",
        ficheSlug: "air-interieur",
        condition: (ctx) => ctx.subcategory !== "air-freshener" && ctx.subcategory !== "deodorant" },
    ],
    forbiddenUI: ["toxicity_label"],
  },
  cleaning_laundry: {
    status: "regular", mainIdea: "Contact textile prolonge — bien doser",
    signals: [
      { id: "dosage", color: "yellow", label: "Lessive · Respecter le dosage",
        ficheSlug: "inhalation-menagers" },
    ],
    forbiddenUI: ["toxicity_label"],
  },
  cleaning_disinfect: {
    status: "occasional", mainIdea: "Rarement necessaire — ne JAMAIS melanger",
    signals: [
      { id: "never_mix", color: "red", label: "Desinfectant · Ne JAMAIS melanger avec un autre produit",
        ficheSlug: "quand-desinfecter" },
    ],
    forbiddenUI: ["toxicity_label"],
  },
  cleaning_ambient: {
    status: "limit", mainIdea: "Pollution interieure — aerer vaut mieux",
    signals: [
      { id: "air_int", color: "orange", label: "Air interieur · Aerer plutot que masquer",
        ficheSlug: "air-interieur" },
    ],
    forbiddenUI: ["toxicity_label"],
  },
};

// ═══ API PUBLIQUE ═══

export function resolveCategory(
  subcategory: string | null | undefined,
  categoryType: string | null | undefined
): EcoCategory {
  if (subcategory && SUBCATEGORY_MAP[subcategory]) return SUBCATEGORY_MAP[subcategory];
  if (categoryType === "cosmetic") return "cosmetic_daily";
  if (categoryType === "detergent") return "cleaning_surface";
  if (subcategory) {
    const lower = subcategory.toLowerCase();
    for (const [key, cat] of Object.entries(SUBCATEGORY_MAP)) {
      if (lower.includes(key) || key.includes(lower)) return cat;
    }
  }
  return "unknown";
}

export function resolveImpactSignals(
  subcategory: string | null | undefined,
  categoryType: string | null | undefined,
  context: Omit<SignalContext, "subcategory" | "categoryType">
): {
  category: EcoCategory;
  status: ProductStatus;
  mainIdea: string;
  signals: ActiveSignal[];
  forbiddenUI: string[];
} {
  const category = resolveCategory(subcategory, categoryType);
  const config = RULES[category];
  const ctx: SignalContext = { ...context, subcategory: subcategory ?? null, categoryType: categoryType ?? null };
  const signals = config.signals
    .filter((s) => !s.condition || s.condition(ctx))
    .slice(0, 2)
    .map(({ id, color, label, ficheSlug }) => ({ id, color, label, ficheSlug }));
  return { category, status: config.status, mainIdea: config.mainIdea, signals, forbiddenUI: config.forbiddenUI };
}
