// ============================================================================
// ECOLOJIA — RULE RESOLVER SERVICE V3.0
// VERSION 3.0.0 — 2026-01-03
// Moteur deterministe : product + flags + subcategory -> reflexHero + rules (max 3)
// ADAPTATION V3 : Structure par categories (Knowledge Base V3.0)
// ============================================================================

const knowledgeBase = require('../knowledge/rules.v3.json');

// ============================================================================
// MAPPING CATEGORIES PRODUIT -> CATEGORIES KNOWLEDGE BASE
// ============================================================================
const CATEGORY_MAPPING = {
  food: [
    'TRANSFORMATION_ALIMENTAIRE',
    'RYTHME_ALIMENTAIRE', 
    'SUCRES',
    'GRAISSES',
    'SEL',
    'ADDITIFS',
    'PESTICIDES',
    'CAFE',
    'EAU',
    'EMBALLAGES'
  ],
  cosmetic: ['COSMETIQUES'],
  detergent: ['DETERGENTS']
};

// ============================================================================
// ALIAS DE SUBCATEGORIES
// Permet de matcher plusieurs variantes vers une regle commune
// ============================================================================
const SUBCATEGORY_ALIASES = {
  // Spreads
  'chocolate-spread': 'spread',
  'hazelnut-spread': 'spread',
  'peanut-butter': 'nut-butter',
  'almond-butter': 'nut-butter',

  // Beverages
  'fruit-juice': 'beverage',
  'soda': 'beverage',
  'energy-drink': 'beverage',

  // Snacks
  'chips': 'snack',
  'biscuit': 'snack',
  'cookie': 'snack',
  'cracker': 'snack',

  // Breakfast
  'cereal': 'breakfast',
  'muesli': 'breakfast',
  'granola': 'breakfast',

  // Chocolate
  'chocolate': 'chocolate-bar',
  'dark-chocolate': 'chocolate-bar',
  'milk-chocolate': 'chocolate-bar',

  // Cosmetics
  'shampoo': 'haircare',
  'conditioner': 'haircare',
  'face-cream': 'skincare',
  'moisturizer': 'skincare',
  'body-lotion': 'bodycare',
  'shower-gel': 'bodycare'
};

/**
 * Normalise une subcategory en utilisant les alias
 */
function normalizeSubcategory(subcategory) {
  if (!subcategory) return null;
  const lower = subcategory.toLowerCase().trim();
  return SUBCATEGORY_ALIASES[lower] || lower;
}

// ============================================================================
// EXTRACTION DES REGLES DE LA V3
// ============================================================================

/**
 * Extrait toutes les regles de la Knowledge Base V3 en format plat
 */
function getAllRulesFlat() {
  const allRules = [];
  const categories = knowledgeBase.categories || {};
  
  for (const [categoryKey, categoryData] of Object.entries(categories)) {
    if (categoryData.rules && Array.isArray(categoryData.rules)) {
      for (const rule of categoryData.rules) {
        allRules.push({
          ...rule,
          kbCategory: categoryKey,
          kbDescription: categoryData.description
        });
      }
    }
  }
  
  return allRules;
}

/**
 * Mappe une categorie Knowledge Base vers une categorie produit
 */
function getProductCategoryFromKB(kbCategory) {
  for (const [productCat, kbCats] of Object.entries(CATEGORY_MAPPING)) {
    if (kbCats.includes(kbCategory)) {
      return productCat;
    }
  }
  return 'food'; // Default
}

// Cache des regles aplaties
let flatRulesCache = null;

function getFlatRules() {
  if (!flatRulesCache) {
    flatRulesCache = getAllRulesFlat();
  }
  return flatRulesCache;
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Resout les regles applicables a un produit
 * @param {Object} product - Produit avec constitution.healthReflex et subcategory
 * @returns {Object} { reflexHero, rulesHits, actions }
 */
function resolveRules(product) {
  if (!product) {
    return {
      reflexHero: null,
      rulesHits: [],
      actions: []
    };
  }

  const healthReflex = product.constitution?.healthReflex || product.healthReflex || {};
  const flags = healthReflex.flags || [];
  const level = healthReflex.level || 1;
  const productCategory = product.categoryType || product.category || 'food';
  const rawSubcategory = product.subcategory || null;
  const subcategory = normalizeSubcategory(rawSubcategory);

  // Obtenir les categories KB pertinentes pour ce type de produit
  const relevantKBCategories = CATEGORY_MAPPING[productCategory] || CATEGORY_MAPPING.food;

  // Obtenir toutes les regles
  const allRules = getFlatRules();

  // Filtrer par categories pertinentes
  const categoryRules = allRules.filter(r => relevantKBCategories.includes(r.kbCategory));

  // ============================================================================
  // SCORER CHAQUE REGLE
  // ============================================================================
  
  const scoredRules = categoryRules.map(rule => {
    let score = 0;
    
    // Score base sur les mots-cles du principe vs flags
    const principleWords = (rule.principle || '').toLowerCase();
    const mechanismWords = (rule.mechanism || '').toLowerCase();
    
    // Matching par flags
    for (const flag of flags) {
      const flagLower = flag.toLowerCase().replace(/_/g, ' ');
      if (principleWords.includes(flagLower) || mechanismWords.includes(flagLower)) {
        score += 5;
      }
    }
    
    // Matching par mots-cles specifiques
    const keywordMatches = {
      'ultra_transforme': ['ultra-transform', 'nova 4', 'transformation'],
      'sucre_eleve': ['sucre', 'glycemi', 'glucose'],
      'sel_eleve': ['sel', 'sodium', 'hypertension'],
      'additifs_multiples': ['additif', 'emulsifi', 'conservat'],
      'graisses_saturees': ['graisse', 'satur', 'lipide', 'cholesterol'],
      'nutriscore_e': ['nutri-score', 'nutritionnel'],
      'nutriscore_d': ['nutri-score', 'nutritionnel'],
      'high_frequency_use': ['frequen', 'quotidien', 'repetee']
    };
    
    for (const flag of flags) {
      const keywords = keywordMatches[flag] || [];
      for (const kw of keywords) {
        if (principleWords.includes(kw) || mechanismWords.includes(kw)) {
          score += 3;
        }
      }
    }
    
    // Bonus pour niveau de preuve fort
    if (rule.evidence_level === 'fort') {
      score += 2;
    }
    
    return {
      ...rule,
      matchScore: score,
      relevant: score > 0
    };
  });

  // ============================================================================
  // TRIER ET LIMITER A 3 REGLES
  // ============================================================================
  
  const sortedRules = scoredRules
    .filter(r => r.relevant)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  // Si aucune regle pertinente, prendre les 2 premieres generiques
  const finalRules = sortedRules.length > 0 
    ? sortedRules 
    : categoryRules.slice(0, 2);

  // ============================================================================
  // CONSTRUIRE REFLEX HERO
  // ============================================================================
  let reflexHero = healthReflex.content || null;

  if (!reflexHero && finalRules.length > 0) {
    reflexHero = finalRules[0].action || finalRules[0].principle;
  }

  // Fallback selon niveau
  if (!reflexHero) {
    const fallbacks = {
      1: "Ce produit peut s'integrer dans une consommation equilibree.",
      2: "A consommer avec moderation au quotidien.",
      3: "A reserver aux occasions plutot qu'au quotidien."
    };
    reflexHero = fallbacks[level] || fallbacks[1];
  }

  // ============================================================================
  // COLLECTER LES ACTIONS (max 3, dedupliquees)
  // ============================================================================
  const allActions = finalRules.map(r => r.action).filter(Boolean);
  const uniqueActions = [...new Set(allActions)].slice(0, 3);

  // ============================================================================
  // FORMATER LES REGLES POUR LE FRONTEND
  // ============================================================================
  const rulesHits = finalRules.map(r => ({
    id: r.id,
    principle: r.principle,
    mechanism: r.mechanism,
    simple_reflex: r.action,
    context: getContextByLevel(r, level),
    evidence_level: r.evidence_level,
    nuances: r.nuance,
    sources: r.sources,
    kbCategory: r.kbCategory
  }));

  console.log('[RuleResolver V3] Product:', product.name || 'unknown', 
    '| Category:', productCategory, 
    '| Flags:', flags.length,
    '| Rules found:', rulesHits.length);

  return {
    reflexHero,
    rulesHits,
    actions: uniqueActions
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retourne le contexte (green/orange/red) selon le niveau
 */
function getContextByLevel(rule, level) {
  if (!rule.context) return null;
  if (level === 1) return rule.context.green;
  if (level === 2) return rule.context.orange;
  return rule.context.red;
}

/**
 * Recupere une regle par ID
 */
function getRuleById(ruleId) {
  return getFlatRules().find(r => r.id === ruleId) || null;
}

/**
 * Liste toutes les regles d une categorie produit
 */
function getRulesByCategory(productCategory) {
  const relevantKBCategories = CATEGORY_MAPPING[productCategory] || CATEGORY_MAPPING.food;
  return getFlatRules().filter(r => relevantKBCategories.includes(r.kbCategory));
}

/**
 * Liste toutes les categories Knowledge Base
 */
function getKBCategories() {
  return Object.keys(knowledgeBase.categories || {});
}

/**
 * Statistiques de la Knowledge Base
 */
function getKBStats() {
  const categories = knowledgeBase.categories || {};
  const stats = {
    version: knowledgeBase.version,
    totalCategories: Object.keys(categories).length,
    totalRules: 0,
    byCategory: {}
  };
  
  for (const [key, cat] of Object.entries(categories)) {
    const count = cat.rules?.length || 0;
    stats.totalRules += count;
    stats.byCategory[key] = count;
  }
  
  return stats;
}

/**
 * Liste tous les alias connus
 */
function getAliases() {
  return { ...SUBCATEGORY_ALIASES };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  resolveRules,
  getRuleById,
  getRulesByCategory,
  getKBCategories,
  getKBStats,
  getAliases,
  normalizeSubcategory,
  RULES_VERSION: knowledgeBase.version
};

// Log au chargement
const stats = getKBStats();
console.log('[RuleResolver V3] Service charge - Version', stats.version);
console.log('[RuleResolver V3] Categories:', stats.totalCategories, '| Regles:', stats.totalRules);
console.log('[RuleResolver V3] Details:', JSON.stringify(stats.byCategory));
