// ============================================================================
// ECOLOJIA — BIBLIOTHÈQUE D'HABITUDES FERMÉE
// VERSION 2.0.0 — 2026-01-03
// RÈGLE : L'IA sélectionne, elle ne crée JAMAIS.
// CATÉGORIES : food, cosmetic, detergent
// ============================================================================

const HABITS_LIBRARY = [
  // =========================================================================
  // FOOD (10 habitudes)
  // =========================================================================
  {
    id: 'HAB_FOOD_001',
    title: 'Privilégier les aliments bruts',
    description: 'Les aliments non transformés conservent leurs nutriments et leur structure.',
    category: 'food',
    triggers: ['ultra_transforme', 'transformation_elevee', 'additifs_multiples']
  },
  {
    id: 'HAB_FOOD_002',
    title: 'Réserver les produits transformés aux occasions',
    description: 'Les produits NOVA 4 ne sont pas interdits, mais à ne pas consommer au quotidien.',
    category: 'food',
    triggers: ['ultra_transforme', 'nova_4']
  },
  {
    id: 'HAB_FOOD_003',
    title: 'Surveiller la fréquence, pas l\'exception',
    description: 'Un écart occasionnel ne pose pas de problème. C\'est la répétition qui compte.',
    category: 'food',
    triggers: ['nutriscore_d', 'nutriscore_e', 'sucre_eleve', 'sel_eleve']
  },
  {
    id: 'HAB_FOOD_004',
    title: 'Préférer les listes d\'ingrédients courtes',
    description: 'Moins d\'ingrédients signifie souvent moins de transformation.',
    category: 'food',
    triggers: ['additifs_multiples', 'ingredients_nombreux']
  },
  {
    id: 'HAB_FOOD_005',
    title: 'Associer les sucres à des fibres',
    description: 'Les fibres ralentissent l\'absorption du sucre et limitent les pics glycémiques.',
    category: 'food',
    triggers: ['sucre_eleve', 'sucres_ajoutes']
  },
  {
    id: 'HAB_FOOD_006',
    title: 'Contrôler les portions réelles',
    description: 'Les valeurs nutritionnelles sont pour 100g, pas pour le paquet entier.',
    category: 'food',
    triggers: ['sucre_eleve', 'sel_eleve', 'graisses_saturees']
  },
  {
    id: 'HAB_FOOD_007',
    title: 'Varier les sources pour limiter l\'accumulation',
    description: 'Alterner les produits et les marques réduit l\'exposition répétée aux mêmes substances.',
    category: 'food',
    triggers: ['additifs_multiples', 'additifs_controverses']
  },
  {
    id: 'HAB_FOOD_008',
    title: 'Équilibrer les types de graisses',
    description: 'Alterner huiles végétales, poissons gras et oléagineux.',
    category: 'food',
    triggers: ['graisses_saturees']
  },
  {
    id: 'HAB_FOOD_009',
    title: 'Comparer avant d\'acheter',
    description: 'Deux produits similaires peuvent avoir des compositions très différentes.',
    category: 'food',
    triggers: ['nutriscore_d', 'nutriscore_e', 'additifs_multiples']
  },
  {
    id: 'HAB_FOOD_010',
    title: 'Cuisiner simplement quand possible',
    description: 'Même une préparation basique est souvent meilleure qu\'un plat industriel.',
    category: 'food',
    triggers: ['ultra_transforme', 'transformation_elevee']
  },

  // =========================================================================
  // COSMETIC (6 habitudes)
  // =========================================================================
  {
    id: 'HAB_COSM_001',
    title: 'Simplifier sa routine quotidienne',
    description: 'Moins de produits signifie moins de risques d\'interactions et d\'irritations.',
    category: 'cosmetic',
    triggers: ['additifs_multiples', 'high_frequency_use', 'ingredients_nombreux']
  },
  {
    id: 'HAB_COSM_002',
    title: 'Adapter la fréquence d\'utilisation',
    description: 'Certains produits n\'ont pas besoin d\'être utilisés tous les jours.',
    category: 'cosmetic',
    triggers: ['high_frequency_use']
  },
  {
    id: 'HAB_COSM_003',
    title: 'Privilégier les formules courtes',
    description: 'Une liste d\'ingrédients courte réduit l\'exposition chimique cumulative.',
    category: 'cosmetic',
    triggers: ['additifs_multiples', 'perturbateurs_endocriniens']
  },
  {
    id: 'HAB_COSM_004',
    title: 'Alterner les produits et les marques',
    description: 'Varier réduit l\'exposition répétée aux mêmes substances.',
    category: 'cosmetic',
    triggers: ['high_frequency_use', 'additifs_multiples']
  },
  {
    id: 'HAB_COSM_005',
    title: 'Distinguer usage quotidien et occasionnel',
    description: 'Réserver les produits complexes aux occasions, garder le simple pour le quotidien.',
    category: 'cosmetic',
    triggers: ['perturbateurs_endocriniens', 'additifs_controverses']
  },
  {
    id: 'HAB_COSM_006',
    title: 'Tester un produit à la fois',
    description: 'Introduire un seul nouveau produit permet d\'identifier les réactions.',
    category: 'cosmetic',
    triggers: ['additifs_multiples']
  },

  // =========================================================================
  // DETERGENT (4 habitudes)
  // =========================================================================
  {
    id: 'HAB_DET_001',
    title: 'Respecter les dosages indiqués',
    description: 'Plus de produit ne signifie pas plus d\'efficacité, mais plus d\'exposition.',
    category: 'detergent',
    triggers: ['high_inhalation_exposure', 'cov_eleves']
  },
  {
    id: 'HAB_DET_002',
    title: 'Aérer pendant et après utilisation',
    description: 'La ventilation réduit l\'exposition aux composés volatils.',
    category: 'detergent',
    triggers: ['high_inhalation_exposure', 'cov_eleves']
  },
  {
    id: 'HAB_DET_003',
    title: 'Préférer les formats non-spray',
    description: 'Les sprays dispersent les particules dans l\'air respirable.',
    category: 'detergent',
    triggers: ['high_inhalation_exposure']
  },
  {
    id: 'HAB_DET_004',
    title: 'Ne pas mélanger les produits',
    description: 'Mélanger des produits ménagers peut créer des réactions chimiques dangereuses.',
    category: 'detergent',
    triggers: ['cov_eleves', 'additifs_multiples']
  }
];

/**
 * Récupère une habitude par ID
 */
function getHabitById(id) {
  return HABITS_LIBRARY.find(h => h.id === id) || null;
}

/**
 * Sélectionne l'habitude la plus pertinente selon les flags et la catégorie
 */
function selectHabitByFlags(flags, category = 'food') {
  // Filtrer par catégorie
  const catHabits = HABITS_LIBRARY.filter(h => h.category === category);
  
  if (!catHabits.length) {
    // Fallback si catégorie inconnue
    return getHabitById('HAB_FOOD_003');
  }

  if (!flags || flags.length === 0) {
    // Retourner habitude par défaut de la catégorie
    return catHabits[0];
  }

  // Scorer chaque habitude selon les flags matchés
  const scored = catHabits.map(h => ({
    ...h,
    matchCount: h.triggers.filter(t => flags.includes(t)).length
  }));

  // Trier par score décroissant
  scored.sort((a, b) => b.matchCount - a.matchCount);

  // Retourner la meilleure ou la première par défaut
  return scored[0].matchCount > 0 ? scored[0] : catHabits[0];
}

/**
 * Liste toutes les habitudes d'une catégorie
 */
function getHabitsByCategory(category) {
  return HABITS_LIBRARY.filter(h => h.category === category);
}

module.exports = { 
  HABITS_LIBRARY, 
  getHabitById, 
  selectHabitByFlags,
  getHabitsByCategory
};
