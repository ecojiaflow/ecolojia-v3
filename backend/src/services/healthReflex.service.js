// ============================================================================
// ECOLOJIA — SERVICE HEALTH REFLEX V2.0.0
// VERSION 2.0.0 — 2026-01-06
// PRODUCTION READY - Robuste avec fallbacks et logging
// Calcule level + flags + reflexe + habit depuis les donnees produit
// ============================================================================

const { selectHabitByFlags, getHabitWithSources } = require('../data/habits.data');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Seuils nutritionnels (pour 100g)
  thresholds: {
    sugars: { high: 22.5, moderate: 12.5 },
    salt: { high: 1.5, moderate: 0.75 },
    saturatedFat: { high: 5, moderate: 2.5 },
    fiber: { low: 3 }
  },
  // Version du service
  version: '2.0.0'
};

// ============================================================================
// REGLES DE NIVEAU (BIBLE ECOLOJIA)
// ============================================================================
// Niveau 1 (Vert)   : Acceptable
// Niveau 2 (Orange) : A limiter au quotidien
// Niveau 3 (Rouge)  : A reserver aux occasions / A limiter fortement
// ============================================================================

/**
 * Calcule le Health Reflex complet pour un produit
 * @param {Object} product - Produit avec foodData, scores, nutriments
 * @returns {Object} { level, sublevel, levelLabel, flags, content, habit }
 */
function calculateHealthReflex(product) {
  if (!product) {
    console.warn('[HealthReflex V2] Produit null, retour defaut');
    return getDefaultReflex();
  }

  try {
    // Extraire donnees
    const extractedData = extractProductData(product);

    // Detecter flags factuels
    const flags = detectFlags(extractedData);

    // Calculer niveau
    const { level, sublevel } = calculateLevel(flags, extractedData);

    // Generer label et contenu
    const levelLabel = getLevelLabel(level, sublevel);
    const content = getReflexContent(level, sublevel);

    // Selectionner habitude
    const category = product.categoryType || product.category || 'food';
    const habit = selectHabitSafe(flags, category);

    console.log('[HealthReflex V2] Product:', product.name?.substring(0, 30) || 'unknown',
      '| Level:', level,
      '| Flags:', flags.length,
      '| Habit:', habit?.id || 'none');

    return {
      level,
      sublevel,
      levelLabel,
      flags,
      content,
      habit
    };

  } catch (error) {
    console.error('[HealthReflex V2] Erreur calcul:', error.message);
    return getDefaultReflex();
  }
}

// ============================================================================
// EXTRACTION DONNEES PRODUIT
// ============================================================================

function extractProductData(product) {
  const { foodData, scores, nutriments, nutrition } = product || {};
  const breakdown = scores?.breakdown || {};

  // NOVA
  const nova = foodData?.novaGroup
    || breakdown?.nova?.group
    || product?.nova_group
    || null;

  // Nutri-Score
  const nutriScore = (
    foodData?.nutriScore
    || breakdown?.nutriScore?.grade
    || product?.nutriscore_grade
    || ''
  ).toLowerCase();

  // Eco-Score
  const ecoScore = (
    foodData?.ecoScore
    || breakdown?.ecoScore?.grade
    || product?.ecoscore_grade
    || ''
  ).toLowerCase();

  // Additifs
  const additives = foodData?.additives || product?.additives_tags || [];
  const additivesCount = Array.isArray(additives)
    ? additives.length
    : (breakdown?.additives?.count || 0);

  // Nutriments (normaliser differentes sources)
  const nutri = nutriments || nutrition || product?.nutriments || {};
  const sugars = nutri.sugars || nutri.sugars_100g || nutri['sugars_100g'] || 0;
  const salt = nutri.salt || nutri.salt_100g || nutri['salt_100g'] || 0;
  const saturatedFat = nutri.saturated_fat || nutri['saturated-fat_100g'] || nutri.saturated_fat_100g || 0;
  const fiber = nutri.fiber || nutri.fiber_100g || nutri['fiber_100g'] || null;

  // Ingredients
  const ingredientsText = product.ingredients_text || product.ingredientsText || '';
  const ingredientsCount = ingredientsText
    ? ingredientsText.split(/[,;]/).filter(i => i.trim()).length
    : 0;

  return {
    nova,
    nutriScore,
    ecoScore,
    additivesCount,
    sugars,
    salt,
    saturatedFat,
    fiber,
    ingredientsCount
  };
}

// ============================================================================
// DETECTION FLAGS FACTUELS
// ============================================================================

function detectFlags(data) {
  const flags = [];

  // === NOVA ===
  if (data.nova === 4) {
    flags.push('ultra_transforme');
  } else if (data.nova === 3) {
    flags.push('transformation_elevee');
  } else if (data.nova === 2) {
    flags.push('transformation_moderee');
  }

  // === NUTRI-SCORE ===
  if (data.nutriScore === 'e') {
    flags.push('nutriscore_e');
  } else if (data.nutriScore === 'd') {
    flags.push('nutriscore_d');
  }

  // === ADDITIFS ===
  if (data.additivesCount >= 5) {
    flags.push('additifs_multiples');
  } else if (data.additivesCount >= 1) {
    flags.push('additifs_presents');
  }

  // === SUCRES ===
  if (data.sugars > CONFIG.thresholds.sugars.high) {
    flags.push('sucre_eleve');
  } else if (data.sugars > CONFIG.thresholds.sugars.moderate) {
    flags.push('sucre_modere');
  }

  // === SEL ===
  if (data.salt > CONFIG.thresholds.salt.high) {
    flags.push('sel_eleve');
  } else if (data.salt > CONFIG.thresholds.salt.moderate) {
    flags.push('sel_modere');
  }

  // === GRAISSES SATUREES ===
  if (data.saturatedFat > CONFIG.thresholds.saturatedFat.high) {
    flags.push('graisses_saturees');
  }

  // === FIBRES ===
  if (data.fiber !== null && data.fiber < CONFIG.thresholds.fiber.low) {
    flags.push('fibres_faibles');
  }

  // === INGREDIENTS NOMBREUX ===
  if (data.ingredientsCount >= 15) {
    flags.push('ingredients_nombreux');
  }

  return flags;
}

// ============================================================================
// CALCUL NIVEAU (1/2/3)
// ============================================================================

function calculateLevel(flags, data) {
  let level = 1;
  let sublevel = null;

  // Compteurs de severite
  const criticalCount = countCriticalFlags(flags);
  const moderateCount = countModerateFlags(flags);

  // === NIVEAU 3 : Conditions strictes ===
  const isNova4 = data.nova === 4;
  const isNutriE = data.nutriScore === 'e';
  const hasMultipleAdditives = data.additivesCount >= 5;

  // 3B (limite fortement) : Combinaison severe
  if (isNova4 && isNutriE && hasMultipleAdditives) {
    level = 3;
    sublevel = 'limit_strongly';
  }
  // 3A (occasions) : Ultra-transforme + 1 autre signal fort
  else if (isNova4 && (isNutriE || hasMultipleAdditives || criticalCount >= 2)) {
    level = 3;
    sublevel = 'occasions';
  }
  // === NIVEAU 2 : Signaux moderes ===
  else if (
    isNova4 ||
    flags.includes('transformation_elevee') ||
    isNutriE ||
    data.nutriScore === 'd' ||
    data.additivesCount >= 3 ||
    criticalCount >= 1 ||
    moderateCount >= 2
  ) {
    level = 2;
  }
  // === NIVEAU 1 : Par defaut ===

  return { level, sublevel };
}

function countCriticalFlags(flags) {
  const critical = ['ultra_transforme', 'nutriscore_e', 'additifs_multiples', 'sucre_eleve', 'sel_eleve'];
  return flags.filter(f => critical.includes(f)).length;
}

function countModerateFlags(flags) {
  const moderate = ['transformation_elevee', 'nutriscore_d', 'additifs_presents', 'sucre_modere', 'sel_modere', 'graisses_saturees'];
  return flags.filter(f => moderate.includes(f)).length;
}

// ============================================================================
// LABELS ET CONTENUS
// ============================================================================

function getLevelLabel(level, sublevel) {
  const labels = {
    1: 'Acceptable',
    2: 'A limiter au quotidien',
    3: sublevel === 'limit_strongly'
      ? 'A limiter fortement'
      : 'A reserver aux occasions'
  };
  return labels[level] || labels[1];
}

function getReflexContent(level, sublevel) {
  const contents = {
    1: 'Ce type de produit peut s\'integrer dans une alimentation equilibree.',
    2: 'En usage regulier, ce type de produit merite attention.',
    3: sublevel === 'limit_strongly'
      ? 'Ce type de produit est a limiter fortement au quotidien.'
      : 'Ce type de produit est a reserver aux occasions, pas au quotidien.'
  };
  return contents[level] || contents[1];
}

// ============================================================================
// SELECTION HABITUDE (avec fallback)
// ============================================================================

function selectHabitSafe(flags, category) {
  try {
    const habit = selectHabitByFlags(flags, category);

    if (habit) {
      // Essayer d'enrichir avec sources
      const fullHabit = getHabitWithSources(habit.id);
      if (fullHabit?.scientificBasis) {
        return {
          id: habit.id,
          title: habit.title,
          description: habit.description,
          sources: fullHabit.scientificBasis.sources?.slice(0, 2) || []
        };
      }

      return {
        id: habit.id,
        title: habit.title,
        description: habit.description
      };
    }
  } catch (error) {
    console.warn('[HealthReflex V2] Erreur selection habitude:', error.message);
  }

  // Fallback
  return {
    id: 'HAB_DEFAULT',
    title: 'Surveiller la frequence',
    description: 'Un ecart occasionnel ne pose pas de probleme. C\'est la repetition qui compte.'
  };
}

// ============================================================================
// DEFAUT (fallback)
// ============================================================================

function getDefaultReflex() {
  return {
    level: 1,
    sublevel: null,
    levelLabel: 'Acceptable',
    flags: [],
    content: 'Donnees insuffisantes pour une analyse detaillee.',
    habit: {
      id: 'HAB_DEFAULT',
      title: 'Varier son alimentation',
      description: 'La diversite alimentaire est la cle d\'une alimentation equilibree.'
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  calculateHealthReflex,
  detectFlags,
  calculateLevel,
  CONFIG,
  VERSION: CONFIG.version
};
