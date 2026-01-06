// ============================================================================
// ECOLOJIA — SERVICE CONSTITUTION V2.0.0
// VERSION 2.0.0 — 2026-01-06
// PRODUCTION READY - Integration Knowledge Base complete
// Genere la Constitution (3 cartes + healthReflex + habit + rules + sources)
// ============================================================================

const { calculateHealthReflex } = require('./healthReflex.service');
const { resolveRules } = require('./RuleResolver.service');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  version: '2.0.0',
  maxCards: 3,
  maxActions: 3
};

// ============================================================================
// GENERATION CONSTITUTION COMPLETE
// ============================================================================

/**
 * Genere la Constitution complete pour un produit
 * @param {Object} product - Produit avec toutes ses donnees
 * @returns {Object} Constitution complete
 */
function generateConstitution(product) {
  if (!product) {
    console.warn('[Constitution V2] Produit null');
    return null;
  }

  try {
    const startTime = Date.now();

    // 1. Calculer Health Reflex (level, flags, habit)
    const healthReflex = calculateHealthReflex(product);

    // 2. Generer les 3 cartes
    const cards = generateCards(product, healthReflex);

    // 3. Resoudre les regles scientifiques
    const rulesResult = resolveRulesSafe(product, healthReflex);

    // 4. Construire Constitution finale
    const constitution = {
      version: CONFIG.version,
      generatedAt: new Date().toISOString(),
      healthReflex: {
        level: healthReflex.level,
        sublevel: healthReflex.sublevel,
        levelLabel: healthReflex.levelLabel,
        flags: healthReflex.flags,
        content: healthReflex.content
      },
      cards,
      habit: healthReflex.habit,
      rules: {
        reflexHero: rulesResult.reflexHero,
        rulesHits: rulesResult.rulesHits,
        actions: rulesResult.actions
      },
      metadata: {
        processingTime: Date.now() - startTime,
        dataQuality: assessDataQuality(product),
        version: CONFIG.version
      }
    };

    console.log('[Constitution V2] Generee pour:', product.name?.substring(0, 30) || 'unknown',
      '| Level:', healthReflex.level,
      '| Cards:', cards.length,
      '| Rules:', rulesResult.rulesHits?.length || 0,
      '| Time:', constitution.metadata.processingTime, 'ms');

    return constitution;

  } catch (error) {
    console.error('[Constitution V2] Erreur generation:', error.message);
    return generateFallbackConstitution(product);
  }
}

// ============================================================================
// GENERATION DES 3 CARTES
// ============================================================================

function generateCards(product, healthReflex) {
  const { name, brand, foodData } = product || {};
  const nova = foodData?.novaGroup || product?.nova_group || null;
  const flags = healthReflex?.flags || [];
  const level = healthReflex?.level || 1;

  const cards = [
    // CARTE 1 : Ce que c'est vraiment
    {
      id: 'card_what',
      icon: '🧠',
      title: "Ce que c'est vraiment",
      content: generateWhatContent(name, brand, nova)
    },
    // CARTE 2 : Le bon reflexe
    {
      id: 'card_reflex',
      icon: '🌱',
      title: 'Le bon reflexe',
      content: healthReflex?.content || getDefaultReflexContent(level)
    },
    // CARTE 3 : Actions possibles
    {
      id: 'card_actions',
      icon: '🔁',
      title: 'Actions possibles',
      content: generateActionsContent(flags, level)
    }
  ];

  return cards;
}

// ============================================================================
// GENERATION CONTENU CARTE 1 (Ce que c'est)
// ============================================================================

function generateWhatContent(name, brand, nova) {
  const productName = name || 'Ce produit';
  const brandSuffix = brand ? ` de ${brand}` : '';

  const novaDescriptions = {
    1: 'un aliment brut ou peu transforme',
    2: 'un ingredient culinaire transforme',
    3: 'un aliment transforme',
    4: 'un produit ultra-transforme'
  };

  const novaDesc = nova ? novaDescriptions[nova] : 'un produit alimentaire';
  const novaContext = nova
    ? ' Le niveau de transformation influence la qualite nutritionnelle globale.'
    : '';

  return `${productName}${brandSuffix} est ${novaDesc}.${novaContext}`;
}

// ============================================================================
// GENERATION CONTENU CARTE 3 (Actions)
// ============================================================================

function generateActionsContent(flags, level) {
  const actions = [];

  // Actions basees sur les flags
  if (flags.includes('ultra_transforme') || flags.includes('transformation_elevee')) {
    actions.push('Chercher une alternative moins transformee');
  }
  if (flags.includes('sucre_eleve')) {
    actions.push('Verifier la portion reelle consommee');
  }
  if (flags.includes('sel_eleve')) {
    actions.push('Rincer si possible ou reduire la quantite');
  }
  if (flags.includes('additifs_multiples')) {
    actions.push('Comparer avec des produits a liste plus courte');
  }
  if (flags.includes('graisses_saturees')) {
    actions.push('Equilibrer avec des sources de graisses insaturees');
  }
  if (flags.includes('fibres_faibles')) {
    actions.push('Accompagner de legumes ou cereales completes');
  }

  // Actions par defaut selon niveau
  if (actions.length === 0) {
    if (level === 1) {
      actions.push('Integrer dans une alimentation variee');
    } else if (level === 2) {
      actions.push('Limiter la frequence de consommation');
      actions.push('Explorer les alternatives disponibles');
    } else {
      actions.push('Reserver aux occasions speciales');
      actions.push('Decouvrir des alternatives plus equilibrees');
    }
  }

  // Limiter a 3 actions et formater
  return actions
    .slice(0, CONFIG.maxActions)
    .map((a, i) => `${i + 1}. ${a}`)
    .join('\n');
}

function getDefaultReflexContent(level) {
  const defaults = {
    1: 'Ce type de produit peut s\'integrer dans une alimentation equilibree.',
    2: 'En usage regulier, ce type de produit merite attention.',
    3: 'Ce type de produit est a reserver aux occasions.'
  };
  return defaults[level] || defaults[1];
}

// ============================================================================
// RESOLUTION REGLES (avec fallback)
// ============================================================================

function resolveRulesSafe(product, healthReflex) {
  try {
    return resolveRules({
      name: product.name,
      categoryType: product.categoryType || product.category || 'food',
      subcategory: product.subcategory || null,
      constitution: { healthReflex }
    });
  } catch (error) {
    console.warn('[Constitution V2] Erreur resolution regles:', error.message);
    return {
      reflexHero: healthReflex?.content || null,
      rulesHits: [],
      actions: []
    };
  }
}

// ============================================================================
// EVALUATION QUALITE DONNEES
// ============================================================================

function assessDataQuality(product) {
  let score = 0;
  const available = [];
  const missing = [];

  // Verifier champs disponibles
  if (product.name) { score += 10; available.push('name'); }
  else { missing.push('name'); }

  if (product.foodData?.novaGroup || product.nova_group) {
    score += 20; available.push('nova');
  } else { missing.push('nova'); }

  if (product.nutriscore_grade || product.foodData?.nutriScore) {
    score += 15; available.push('nutriscore');
  } else { missing.push('nutriscore'); }

  if (product.ingredients_text || product.ingredientsText) {
    score += 15; available.push('ingredients');
  } else { missing.push('ingredients'); }

  if (product.nutriments || product.nutrition) {
    score += 20; available.push('nutriments');
  } else { missing.push('nutriments'); }

  if (product.ecoscore_grade || product.foodData?.ecoScore) {
    score += 10; available.push('ecoscore');
  } else { missing.push('ecoscore'); }

  if (product.subcategory && product.subcategory !== 'other') {
    score += 10; available.push('subcategory');
  } else { missing.push('subcategory'); }

  return {
    score,
    level: score >= 70 ? 'good' : score >= 40 ? 'partial' : 'insufficient',
    available,
    missing
  };
}

// ============================================================================
// CONSTITUTION FALLBACK
// ============================================================================

function generateFallbackConstitution(product) {
  return {
    version: CONFIG.version,
    generatedAt: new Date().toISOString(),
    healthReflex: {
      level: 1,
      sublevel: null,
      levelLabel: 'Non evalue',
      flags: [],
      content: 'Donnees insuffisantes pour une analyse detaillee.'
    },
    cards: [
      {
        id: 'card_what',
        icon: '🧠',
        title: "Ce que c'est vraiment",
        content: `${product?.name || 'Ce produit'} est un produit alimentaire.`
      },
      {
        id: 'card_reflex',
        icon: '🌱',
        title: 'Le bon reflexe',
        content: 'Donnees insuffisantes pour une recommandation precise.'
      },
      {
        id: 'card_actions',
        icon: '🔁',
        title: 'Actions possibles',
        content: '1. Verifier les informations sur l\'emballage'
      }
    ],
    habit: null,
    rules: {
      reflexHero: null,
      rulesHits: [],
      actions: []
    },
    metadata: {
      processingTime: 0,
      dataQuality: { score: 0, level: 'insufficient', available: [], missing: ['all'] },
      version: CONFIG.version,
      fallback: true
    }
  };
}

// ============================================================================
// REGENERATION PARTIELLE (pour mise a jour regles uniquement)
// ============================================================================

function regenerateRulesOnly(product, existingConstitution) {
  if (!product || !existingConstitution) return existingConstitution;

  try {
    const rulesResult = resolveRulesSafe(product, existingConstitution.healthReflex);

    return {
      ...existingConstitution,
      rules: {
        reflexHero: rulesResult.reflexHero,
        rulesHits: rulesResult.rulesHits,
        actions: rulesResult.actions
      },
      metadata: {
        ...existingConstitution.metadata,
        rulesUpdatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[Constitution V2] Erreur regeneration regles:', error.message);
    return existingConstitution;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  generateConstitution,
  generateCards,
  regenerateRulesOnly,
  assessDataQuality,
  CONFIG,
  VERSION: CONFIG.version
};
