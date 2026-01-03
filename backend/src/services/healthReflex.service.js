// ============================================================================
// ECOLOJIA — SERVICE HEALTH REFLEX
// VERSION 1.0.1 — 2026-01-03
// Calcule level + flags + réflexe depuis les scores
// CORRECTION: Suppression mentions "santé" - Vision Ecolojia
// ============================================================================

const { selectHabitByFlags } = require('../data/habits.data');

// ============================================================================
// RÈGLES DE NIVEAU (BIBLE ECOLOJIA)
// ============================================================================
// Niveau 1 (Vert)   : Acceptable
// Niveau 2 (Orange) : À limiter au quotidien
// Niveau 3 (Rouge)  : À réserver aux occasions / À limiter fortement
// ============================================================================

function calculateHealthReflex(product) {
  const { foodData, scores } = product || {};
  const breakdown = scores?.breakdown || {};

  // Extraire données clés
  const nova = foodData?.novaGroup || breakdown?.nova?.group || null;
  const nutriScore = (foodData?.nutriScore || breakdown?.nutriScore?.grade || '').toLowerCase();
  const additives = foodData?.additives || [];
  const additivesCount = additives.length || breakdown?.additives?.count || 0;

  // ============================================================================
  // DÉTECTION FLAGS FACTUELS
  // ============================================================================
  const flags = [];

  // NOVA
  if (nova === 4) flags.push('ultra_transforme');
  else if (nova === 3) flags.push('transformation_elevee');
  else if (nova === 2) flags.push('transformation_moderee');

  // Nutri-Score
  if (nutriScore === 'e') flags.push('nutriscore_e');
  else if (nutriScore === 'd') flags.push('nutriscore_d');

  // Additifs
  if (additivesCount >= 5) flags.push('additifs_multiples');
  else if (additivesCount >= 1) flags.push('additifs_presents');

  // Nutriments (si disponibles)
  const nutriments = product?.nutriments || product?.nutrition || {};
  if (nutriments.sugars > 22.5 || nutriments.sugars_100g > 22.5) {
    flags.push('sucre_eleve');
  }
  if (nutriments.salt > 1.5 || nutriments.salt_100g > 1.5) {
    flags.push('sel_eleve');
  }
  if (nutriments.saturated_fat > 5 || nutriments['saturated-fat_100g'] > 5) {
    flags.push('graisses_saturees');
  }

  // ============================================================================
  // CALCUL NIVEAU (1/2/3)
  // ============================================================================
  let level = 1;
  let sublevel = null;

  // Niveau 3 : Conditions strictes (TOUS les critères ou combinaison forte)
  const isNova4 = nova === 4;
  const isNutriE = nutriScore === 'e';
  const hasMultipleAdditives = additivesCount >= 5;
  const hasCriticalFlags = flags.includes('ultra_transforme') &&
    (flags.includes('nutriscore_e') || flags.includes('additifs_multiples'));

  if (hasCriticalFlags || (isNova4 && isNutriE && hasMultipleAdditives)) {
    level = 3;
    sublevel = 'occasions'; // 3A par défaut

    // 3B si vraiment problématique
    if (isNova4 && isNutriE && hasMultipleAdditives && flags.length >= 5) {
      sublevel = 'limit_strongly';
    }
  }
  // Niveau 2 : Au moins 2 signaux modérés
  else if (
    (isNova4 || flags.includes('transformation_elevee')) ||
    (isNutriE || nutriScore === 'd') ||
    additivesCount >= 3 ||
    flags.length >= 2
  ) {
    level = 2;
  }
  // Niveau 1 : Par défaut

  // ============================================================================
  // LABEL NIVEAU
  // ============================================================================
  const levelLabels = {
    1: 'Acceptable',
    2: 'À limiter au quotidien',
    3: sublevel === 'limit_strongly' ? 'À limiter fortement' : 'À réserver aux occasions'
  };

  // ============================================================================
  // CONTENU RÉFLEXE (phrase unique) - SANS MENTION SANTÉ
  // ============================================================================
  const reflexContents = {
    1: 'Ce type de produit peut s\'intégrer dans une alimentation équilibrée.',
    2: 'En usage régulier, ce type de produit mérite attention.',
    3: sublevel === 'limit_strongly'
      ? 'Ce type de produit est à limiter fortement.'
      : 'Ce type de produit est à réserver aux occasions, pas au quotidien.'
  };

  // ============================================================================
  // SÉLECTION HABITUDE
  // ============================================================================
  const habit = selectHabitByFlags(flags, 'food');

  return {
    level,
    sublevel,
    levelLabel: levelLabels[level],
    flags,
    content: reflexContents[level],
    habit: habit ? {
      id: habit.id,
      title: habit.title,
      description: habit.description
    } : null
  };
}

module.exports = { calculateHealthReflex };
