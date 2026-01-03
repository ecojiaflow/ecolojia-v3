// ============================================================================
// ECOLOJIA — RULE RESOLVER SERVICE V2
// VERSION 2.0.0 — 2026-01-03
// Moteur déterministe : product + flags + subcategory → reflexHero + rules (max 3)
// AMÉLIORATION : Priorise les règles spécifiques par subcategory
// ============================================================================

const rules = require('../knowledge/rules.v2.json');

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Résout les règles applicables à un produit
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

  const healthReflex = product.constitution?.healthReflex || {};
  const flags = healthReflex.flags || [];
  const level = healthReflex.level || 1;
  const category = product.categoryType || product.category || 'food';
  const subcategory = product.subcategory || null;

  // ============================================================================
  // 1. FILTRER LES RÈGLES PAR CATÉGORIE ET SUBCATEGORY
  // ============================================================================
  
  // Règles spécifiques à la subcategory
  const subcategoryRules = subcategory 
    ? rules.rules.filter(r => r.category === category && r.subcategory === subcategory)
    : [];
  
  // Règles génériques (sans subcategory)
  const genericRules = rules.rules.filter(r => r.category === category && !r.subcategory);

  // ============================================================================
  // 2. SCORER CHAQUE RÈGLE SELON LES FLAGS
  // ============================================================================
  
  function scoreRules(rulesList, isSpecific = false) {
    return rulesList.map(rule => {
      const matchCount = rule.triggers.filter(t => flags.includes(t)).length;
      const hasMatch = matchCount > 0 || rule.triggers.length === 0;
      
      // Bonus pour les règles spécifiques
      const specificBonus = isSpecific ? 10 : 0;

      return {
        ...rule,
        matchScore: matchCount + specificBonus,
        relevant: hasMatch && matchCount > 0,
        isSpecific
      };
    });
  }

  const scoredSubcategoryRules = scoreRules(subcategoryRules, true);
  const scoredGenericRules = scoreRules(genericRules, false);

  // Combiner toutes les règles scorées
  const allScoredRules = [...scoredSubcategoryRules, ...scoredGenericRules];

  // ============================================================================
  // 3. TRIER ET LIMITER À 3 RÈGLES
  // ============================================================================
  
  // Priorité : règles spécifiques qui matchent > règles génériques qui matchent
  const sortedRules = allScoredRules
    .filter(r => r.relevant)
    .sort((a, b) => {
      // D'abord par spécificité (subcategory)
      if (a.isSpecific !== b.isSpecific) {
        return a.isSpecific ? -1 : 1;
      }
      // Puis par score de match
      return b.matchScore - a.matchScore;
    })
    .slice(0, 3);

  // ============================================================================
  // 4. CONSTRUIRE REFLEX HERO
  // ============================================================================
  let reflexHero = healthReflex.content || null;

  // Si pas de contenu, utiliser la première règle (préférence subcategory)
  if (!reflexHero && sortedRules.length > 0) {
    reflexHero = sortedRules[0].simple_reflex;
  }

  // Fallback selon niveau
  if (!reflexHero) {
    const fallbacks = {
      1: 'Ce produit peut s\'intégrer dans une consommation équilibrée.',
      2: 'À consommer avec modération au quotidien.',
      3: 'À réserver aux occasions plutôt qu\'au quotidien.'
    };
    reflexHero = fallbacks[level] || fallbacks[1];
  }

  // ============================================================================
  // 5. COLLECTER LES ACTIONS (max 3, dédupliquées)
  // ============================================================================
  const allActions = sortedRules.flatMap(r => r.actions || []);
  const uniqueActions = [...new Set(allActions)].slice(0, 3);

  // ============================================================================
  // 6. FORMATER LES RÈGLES POUR LE FRONTEND
  // ============================================================================
  const rulesHits = sortedRules.map(r => ({
    id: r.id,
    principle: r.principle,
    mechanism: r.mechanism,
    simple_reflex: r.simple_reflex,
    context: getContextByLevel(r, level),
    evidence_level: r.evidence_level,
    nuances: r.nuances,
    isSpecific: r.isSpecific || false,
    subcategory: r.subcategory || null
  }));

  // Log pour debug
  if (subcategory) {
    console.log(`[RuleResolver] Product subcategory: ${subcategory}, specific rules found: ${scoredSubcategoryRules.filter(r => r.relevant).length}`);
  }

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
  if (level === 1) return rule.green;
  if (level === 2) return rule.orange;
  return rule.red;
}

/**
 * Récupère une règle par ID
 */
function getRuleById(ruleId) {
  return rules.rules.find(r => r.id === ruleId) || null;
}

/**
 * Liste toutes les règles d'une catégorie
 */
function getRulesByCategory(category) {
  return rules.rules.filter(r => r.category === category);
}

/**
 * Liste toutes les règles d'une subcategory
 */
function getRulesBySubcategory(subcategory) {
  return rules.rules.filter(r => r.subcategory === subcategory);
}

/**
 * Liste toutes les subcategories ayant des règles spécifiques
 */
function getSubcategoriesWithRules() {
  const subcats = rules.rules
    .filter(r => r.subcategory)
    .map(r => r.subcategory);
  return [...new Set(subcats)];
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  resolveRules,
  getRuleById,
  getRulesByCategory,
  getRulesBySubcategory,
  getSubcategoriesWithRules,
  RULES_VERSION: rules.version
};

console.log('[RuleResolver] Service V2 chargé - Version', rules.version, '-', rules.rules.length, 'règles');
console.log('[RuleResolver] Subcategories avec règles:', getSubcategoriesWithRules().join(', '));
