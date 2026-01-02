// ============================================================================
// ECOLOJIA — RULE RESOLVER SERVICE
// VERSION 1.0.0 — 2026-01-02
// Moteur déterministe : product + flags → reflexHero + rules (max 3)
// ============================================================================

const rules = require('../knowledge/rules.v1.json');

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Résout les règles applicables à un produit
 * @param {Object} product - Produit avec constitution.healthReflex
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

  // ============================================================================
  // 1. FILTRER LES RÈGLES PAR CATÉGORIE
  // ============================================================================
  const categoryRules = rules.rules.filter(r => r.category === category);

  // ============================================================================
  // 2. SCORER CHAQUE RÈGLE SELON LES FLAGS
  // ============================================================================
  const scoredRules = categoryRules.map(rule => {
    const matchCount = rule.triggers.filter(t => flags.includes(t)).length;
    const hasMatch = matchCount > 0 || rule.triggers.length === 0;
    
    return {
      ...rule,
      matchScore: matchCount,
      relevant: hasMatch && matchCount > 0
    };
  });

  // ============================================================================
  // 3. TRIER ET LIMITER À 3 RÈGLES
  // ============================================================================
  const sortedRules = scoredRules
    .filter(r => r.relevant)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  // ============================================================================
  // 4. CONSTRUIRE REFLEX HERO
  // ============================================================================
  let reflexHero = healthReflex.content || null;
  
  // Si pas de contenu, utiliser la première règle
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
    nuances: r.nuances
  }));

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

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  resolveRules,
  getRuleById,
  getRulesByCategory,
  RULES_VERSION: rules.version
};

console.log('[RuleResolver] Service chargé - Version', rules.version, '-', rules.rules.length, 'règles');
