// ============================================================================
// ECOLOJIA — EXPLORE SERVICE (Premium)
// VERSION 2.0.0 — 2026-01-03
// Flow guide : Intention -> Contexte -> Regle + Action
//
// UTILISE: Knowledge Base V3.0 (structure par categories)
//
// VERROUILLAGE VISION ECOLOJIA :
// - PAS de chat libre
// - PAS de champ "question"
// - PAS d historique de conversations
// - PAS d extension vers IA conversationnelle
// ============================================================================

const { selectHabitByFlags, getHabitsByCategory } = require('../data/habits.data');
const knowledgeBase = require('../knowledge/rules.v3.json');

// ============================================================================
// INTENTIONS (centrees utilisateur, pas features)
// ============================================================================
const INTENTIONS = {
  frequent_consumption: {
    id: 'frequent_consumption',
    label: 'Je consomme quelque chose trop souvent',
    icon: '🔄',
    defaultFlags: ['ultra_transforme', 'sucre_eleve', 'additifs_multiples'],
    relevantCategories: ['TRANSFORMATION_ALIMENTAIRE', 'RYTHME_ALIMENTAIRE', 'SUCRES']
  },
  reduce_risk: {
    id: 'reduce_risk',
    label: 'Je veux reduire un risque au quotidien',
    icon: '🛡️',
    defaultFlags: ['additifs_multiples', 'graisses_saturees', 'sel_eleve'],
    relevantCategories: ['ADDITIFS', 'GRAISSES', 'SEL', 'PESTICIDES']
  },
  understand_product: {
    id: 'understand_product',
    label: 'Je ne sais pas quoi faire avec ce produit',
    icon: '❓',
    defaultFlags: ['nutriscore_d', 'nutriscore_e', 'transformation_elevee'],
    relevantCategories: ['TRANSFORMATION_ALIMENTAIRE', 'SUCRES', 'GRAISSES']
  },
  improve_gently: {
    id: 'improve_gently',
    label: 'Je veux ameliorer sans tout changer',
    icon: '🌱',
    defaultFlags: ['ultra_transforme', 'sucre_eleve'],
    relevantCategories: ['RYTHME_ALIMENTAIRE', 'TRANSFORMATION_ALIMENTAIRE']
  }
};

// ============================================================================
// FREQUENCES
// ============================================================================
const FREQUENCIES = {
  daily: { id: 'daily', label: 'Tous les jours', riskLevel: 3 },
  several_weekly: { id: 'several_weekly', label: 'Plusieurs fois par semaine', riskLevel: 2 },
  weekly: { id: 'weekly', label: '1 fois par semaine', riskLevel: 1 },
  occasional: { id: 'occasional', label: 'Occasionnellement', riskLevel: 0 }
};

// ============================================================================
// CATEGORIES PRODUIT
// ============================================================================
const PRODUCT_CATEGORIES = {
  food: { 
    id: 'food', 
    label: 'Un aliment', 
    icon: '🍽️',
    knowledgeCategories: ['TRANSFORMATION_ALIMENTAIRE', 'RYTHME_ALIMENTAIRE', 'SUCRES', 'GRAISSES', 'SEL', 'ADDITIFS', 'PESTICIDES', 'CAFE']
  },
  cosmetic: { 
    id: 'cosmetic', 
    label: 'Un cosmetique', 
    icon: '🧴',
    knowledgeCategories: ['COSMETIQUES']
  },
  detergent: { 
    id: 'detergent', 
    label: 'Un produit menager', 
    icon: '🧹',
    knowledgeCategories: ['DETERGENTS']
  }
};

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Explore une situation et retourne regle + action + nuance
 * @param {Object} params - { intention, frequency, category }
 * @returns {Object} - { rule, action, nuance, habit, nextStep }
 */
function exploreSituation({ intention, frequency, category }) {
  // Validation
  if (!intention || !INTENTIONS[intention]) {
    return { error: 'Intention invalide', valid: false };
  }
  if (!frequency || !FREQUENCIES[frequency]) {
    return { error: 'Frequence invalide', valid: false };
  }
  if (!category || !PRODUCT_CATEGORIES[category]) {
    return { error: 'Categorie invalide', valid: false };
  }

  const intentionData = INTENTIONS[intention];
  const frequencyData = FREQUENCIES[frequency];
  const categoryData = PRODUCT_CATEGORIES[category];

  // Determiner les flags simules selon intention + frequence
  const flags = [...intentionData.defaultFlags];

  // Ajouter flag frequence si elevee
  if (frequencyData.riskLevel >= 2) {
    flags.push('high_frequency_use');
  }

  // Calculer niveau selon frequence
  const level = frequencyData.riskLevel >= 2 ? 3 : frequencyData.riskLevel >= 1 ? 2 : 1;

  // Trouver regle pertinente (V3 structure)
  const rule = findBestRuleV3(intentionData, categoryData, frequencyData);

  // Trouver habitude pertinente
  const habit = selectHabitByFlags(flags, category);

  // Determiner action selon intention
  const action = determineAction(intention, frequency, rule);

  // Determiner nuance
  const nuance = determineNuance(intention, frequency, rule);

  // Next step
  const nextStep = {
    type: 'scan',
    label: 'Scanner un produit precis pour aller plus loin'
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
      simple_reflex: rule.action || rule.context?.[getLevelKey(frequencyData.riskLevel)]
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
// HELPERS V3
// ============================================================================

/**
 * Trouve la meilleure regle dans la Knowledge Base V3
 */
function findBestRuleV3(intentionData, categoryData, frequencyData) {
  const categories = knowledgeBase.categories;
  if (!categories) return null;

  // Determiner les categories de knowledge pertinentes
  const relevantKBCategories = intentionData.relevantCategories.filter(
    cat => categoryData.knowledgeCategories.includes(cat)
  );

  // Si aucune categorie pertinente, prendre la premiere de la categorie produit
  const categoriesToSearch = relevantKBCategories.length > 0 
    ? relevantKBCategories 
    : categoryData.knowledgeCategories;

  // Collecter toutes les regles des categories pertinentes
  const allRules = [];
  for (const catKey of categoriesToSearch) {
    const cat = categories[catKey];
    if (cat && cat.rules) {
      allRules.push(...cat.rules.map(r => ({ ...r, categoryKey: catKey })));
    }
  }

  if (allRules.length === 0) return null;

  // Selectionner selon le niveau de risque
  // Pour frequence elevee, prendre des regles plus "fortes"
  if (frequencyData.riskLevel >= 2) {
    // Preferer les regles avec evidence_level "fort"
    const strongRules = allRules.filter(r => r.evidence_level === 'fort');
    if (strongRules.length > 0) {
      return strongRules[Math.floor(Math.random() * strongRules.length)];
    }
  }

  // Sinon prendre une regle aleatoire pertinente
  return allRules[Math.floor(Math.random() * allRules.length)];
}

/**
 * Convertit le riskLevel en cle de contexte
 */
function getLevelKey(riskLevel) {
  if (riskLevel >= 2) return 'red';
  if (riskLevel >= 1) return 'orange';
  return 'green';
}

function determineAction(intention, frequency, rule) {
  // Si la regle a une action, l utiliser
  if (rule?.action) {
    return rule.action;
  }

  // Actions par defaut selon intention + frequence
  const actionMap = {
    frequent_consumption: {
      daily: 'Reduire a 2-3 fois par semaine maximum',
      several_weekly: 'Reduire a 1 fois par semaine',
      weekly: 'Maintenir cette frequence, c\'est raisonnable',
      occasional: 'Aucun changement necessaire'
    },
    reduce_risk: {
      daily: 'Alterner avec des alternatives moins transformees',
      several_weekly: 'Varier les marques et les types de produits',
      weekly: 'Continuer a varier',
      occasional: 'Pas d\'action particuliere necessaire'
    },
    understand_product: {
      daily: 'Scanner le produit pour voir son niveau et ses alternatives',
      several_weekly: 'Scanner le produit pour comprendre sa composition',
      weekly: 'Scanner par curiosite, pas d\'urgence',
      occasional: 'Profiter sans culpabilite'
    },
    improve_gently: {
      daily: 'Choisir 1 seul changement : reduire la portion OU la frequence',
      several_weekly: 'Essayer une alternative 1 fois cette semaine',
      weekly: 'Continuer ainsi, c\'est deja bien',
      occasional: 'Pas de changement necessaire'
    }
  };

  return actionMap[intention]?.[frequency] || 'Scanner un produit pour une recommandation precise';
}

function determineNuance(intention, frequency, rule) {
  // Nuances selon frequence
  if (frequency === 'occasional') {
    return 'Un ecart occasionnel ne pose pas de probleme. C\'est la repetition qui compte.';
  }
  if (frequency === 'weekly') {
    return 'Une fois par semaine est generalement acceptable pour la plupart des produits.';
  }

  // Nuance de la regle si disponible
  if (rule?.nuance) {
    return rule.nuance;
  }

  // Nuance par defaut
  return 'L\'objectif n\'est pas la perfection, mais la progression.';
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  exploreSituation,
  getIntentions: () => Object.values(INTENTIONS),
  getFrequencies: () => Object.values(FREQUENCIES),
  getCategories: () => Object.values(PRODUCT_CATEGORIES),
  // VERROUILLAGE : Aucune fonction de chat/question/historique
};
