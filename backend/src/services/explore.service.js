// ============================================================================
// ECOLOJIA — EXPLORE SERVICE (Premium)
// VERSION 1.0.0 — 2026-01-03
// Flow guidé : Intention → Contexte → Règle + Action
// 
// ⛔ VERROUILLAGE VISION ECOLOJIA :
// - PAS de chat libre
// - PAS de champ "question"
// - PAS d'historique de conversations
// - PAS d'extension vers IA conversationnelle
// ============================================================================

const { selectHabitByFlags, getHabitsByCategory } = require('../data/habits.data');
const rules = require('../knowledge/rules.v2.json');

// ============================================================================
// INTENTIONS (centrées utilisateur, pas features)
// ============================================================================
const INTENTIONS = {
  frequent_consumption: {
    id: 'frequent_consumption',
    label: 'Je consomme quelque chose trop souvent',
    icon: '🔄',
    defaultFlags: ['ultra_transforme', 'sucre_eleve', 'additifs_multiples']
  },
  reduce_risk: {
    id: 'reduce_risk',
    label: 'Je veux réduire un risque au quotidien',
    icon: '🛡️',
    defaultFlags: ['additifs_multiples', 'graisses_saturees', 'sel_eleve']
  },
  understand_product: {
    id: 'understand_product',
    label: 'Je ne sais pas quoi faire avec ce produit',
    icon: '❓',
    defaultFlags: ['nutriscore_d', 'nutriscore_e', 'transformation_elevee']
  },
  improve_gently: {
    id: 'improve_gently',
    label: 'Je veux améliorer sans tout changer',
    icon: '🌱',
    defaultFlags: ['ultra_transforme', 'sucre_eleve']
  }
};

// ============================================================================
// FRÉQUENCES
// ============================================================================
const FREQUENCIES = {
  daily: { id: 'daily', label: 'Tous les jours', riskLevel: 3 },
  several_weekly: { id: 'several_weekly', label: 'Plusieurs fois par semaine', riskLevel: 2 },
  weekly: { id: 'weekly', label: '1 fois par semaine', riskLevel: 1 },
  occasional: { id: 'occasional', label: 'Occasionnellement', riskLevel: 0 }
};

// ============================================================================
// CATÉGORIES
// ============================================================================
const CATEGORIES = {
  food: { id: 'food', label: 'Un aliment', icon: '🍽️' },
  cosmetic: { id: 'cosmetic', label: 'Un cosmétique', icon: '🧴' },
  detergent: { id: 'detergent', label: 'Un produit ménager', icon: '🧹' }
};

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Explore une situation et retourne règle + action + nuance
 * @param {Object} params - { intention, frequency, category }
 * @returns {Object} - { rule, action, nuance, habit, nextStep }
 */
function exploreSituation({ intention, frequency, category }) {
  // Validation
  if (!intention || !INTENTIONS[intention]) {
    return { error: 'Intention invalide', valid: false };
  }
  if (!frequency || !FREQUENCIES[frequency]) {
    return { error: 'Fréquence invalide', valid: false };
  }
  if (!category || !CATEGORIES[category]) {
    return { error: 'Catégorie invalide', valid: false };
  }

  const intentionData = INTENTIONS[intention];
  const frequencyData = FREQUENCIES[frequency];
  const categoryData = CATEGORIES[category];

  // Déterminer les flags simulés selon intention + fréquence
  const flags = [...intentionData.defaultFlags];
  
  // Ajouter flag fréquence si élevée
  if (frequencyData.riskLevel >= 2) {
    flags.push('high_frequency_use');
  }

  // Calculer niveau selon fréquence
  const level = frequencyData.riskLevel >= 2 ? 3 : frequencyData.riskLevel >= 1 ? 2 : 1;

  // Trouver règle pertinente
  const rule = findBestRule(flags, category, level);

  // Trouver habitude pertinente
  const habit = selectHabitByFlags(flags, category);

  // Déterminer action selon intention
  const action = determineAction(intention, frequency, rule);

  // Déterminer nuance
  const nuance = determineNuance(intention, frequency, rule);

  // Next step
  const nextStep = {
    type: 'scan',
    label: 'Scanner un produit précis pour aller plus loin'
  };

  return {
    valid: true,
    intention: {
      id: intentionData.id,
      label: intentionData.label
    },
    frequency: {
      id: frequencyData.id,
      label: frequencyData.label
    },
    category: {
      id: categoryData.id,
      label: categoryData.label
    },
    level,
    rule: rule ? {
      id: rule.id,
      principle: rule.principle,
      simple_reflex: rule.simple_reflex
    } : null,
    action,
    nuance,
    habit: habit ? {
      id: habit.id,
      title: habit.title,
      description: habit.description
    } : null,
    nextStep
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function findBestRule(flags, category, level) {
  // Filtrer règles par catégorie
  const categoryRules = rules.rules.filter(r => r.category === category);
  
  // Scorer selon flags
  const scored = categoryRules.map(r => ({
    ...r,
    score: r.triggers.filter(t => flags.includes(t)).length
  }));

  // Trier par score
  scored.sort((a, b) => b.score - a.score);

  // Retourner la meilleure ou la première générique
  return scored[0] || categoryRules[0] || null;
}

function determineAction(intention, frequency, rule) {
  // Actions par défaut selon intention + fréquence
  const actionMap = {
    frequent_consumption: {
      daily: 'Réduire à 2-3 fois par semaine maximum',
      several_weekly: 'Réduire à 1 fois par semaine',
      weekly: 'Maintenir cette fréquence, c\'est raisonnable',
      occasional: 'Aucun changement nécessaire'
    },
    reduce_risk: {
      daily: 'Alterner avec des alternatives moins transformées',
      several_weekly: 'Varier les marques et les types de produits',
      weekly: 'Continuer à varier',
      occasional: 'Pas d\'action particulière nécessaire'
    },
    understand_product: {
      daily: 'Scanner le produit pour voir son niveau et ses alternatives',
      several_weekly: 'Scanner le produit pour comprendre sa composition',
      weekly: 'Scanner par curiosité, pas d\'urgence',
      occasional: 'Profiter sans culpabilité'
    },
    improve_gently: {
      daily: 'Choisir 1 seul changement : réduire la portion OU la fréquence',
      several_weekly: 'Essayer une alternative 1 fois cette semaine',
      weekly: 'Continuer ainsi, c\'est déjà bien',
      occasional: 'Pas de changement nécessaire'
    }
  };

  return actionMap[intention]?.[frequency] || rule?.actions?.[0] || 'Scanner un produit pour une recommandation précise';
}

function determineNuance(intention, frequency, rule) {
  // Nuances selon fréquence
  if (frequency === 'occasional') {
    return 'Un écart occasionnel ne pose pas de problème. C\'est la répétition qui compte.';
  }
  if (frequency === 'weekly') {
    return 'Une fois par semaine est généralement acceptable pour la plupart des produits.';
  }
  
  // Nuance de la règle si disponible
  if (rule?.nuances) {
    return rule.nuances;
  }

  // Nuance par défaut
  return 'L\'objectif n\'est pas la perfection, mais la progression.';
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  exploreSituation,
  getIntentions: () => Object.values(INTENTIONS),
  getFrequencies: () => Object.values(FREQUENCIES),
  getCategories: () => Object.values(CATEGORIES),
  // ⛔ VERROUILLAGE : Aucune fonction de chat/question/historique
};
