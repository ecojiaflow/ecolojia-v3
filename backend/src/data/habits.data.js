// ============================================================================
// ECOLOJIA — BIBLIOTHÈQUE D'HABITUDES FERMÉE
// VERSION 1.0.0 — 2026-01-02
// RÈGLE : L'IA sélectionne, elle ne crée JAMAIS.
// ============================================================================

const HABITS_LIBRARY = [
  {
    id: 'HAB_001',
    title: 'Privilégier les aliments bruts',
    description: 'Les aliments non transformés conservent leurs nutriments.',
    category: 'food',
    triggers: ['ultra_transforme', 'transformation_elevee', 'additifs_multiples']
  },
  {
    id: 'HAB_002',
    title: 'Limiter les produits ultra-transformés',
    description: 'Réserver les produits NOVA 4 aux occasions.',
    category: 'food',
    triggers: ['ultra_transforme', 'nova_4']
  },
  {
    id: 'HAB_003',
    title: 'Surveiller la fréquence plus que l\'interdiction',
    description: 'C\'est la répétition qui compte, pas l\'exception.',
    category: 'food',
    triggers: ['nutriscore_d', 'nutriscore_e', 'sucre_eleve', 'sel_eleve']
  },
  {
    id: 'HAB_004',
    title: 'Préférer les listes d\'ingrédients courtes',
    description: 'Moins d\'ingrédients = souvent moins de transformation.',
    category: 'food',
    triggers: ['additifs_multiples', 'ingredients_nombreux']
  },
  {
    id: 'HAB_005',
    title: 'Associer les sucres à des fibres ou protéines',
    description: 'Ralentit l\'absorption et limite les pics glycémiques.',
    category: 'food',
    triggers: ['sucre_eleve', 'sucres_ajoutes']
  },
  {
    id: 'HAB_006',
    title: 'Réserver les produits plaisir aux occasions',
    description: 'Profiter sans culpabilité, mais pas au quotidien.',
    category: 'food',
    triggers: ['nutriscore_e', 'ultra_transforme']
  },
  {
    id: 'HAB_007',
    title: 'Limiter l\'exposition chimique répétée',
    description: 'Éviter de consommer régulièrement les mêmes additifs.',
    category: 'food',
    triggers: ['additifs_multiples', 'additifs_controverses']
  },
  {
    id: 'HAB_008',
    title: 'Varier les sources de lipides',
    description: 'Alterner huiles végétales, poissons gras et oléagineux.',
    category: 'food',
    triggers: ['graisses_saturees']
  },
  {
    id: 'HAB_009',
    title: 'Vérifier la taille des portions',
    description: 'Les valeurs sont pour 100g, pas pour le paquet entier.',
    category: 'food',
    triggers: ['sucre_eleve', 'sel_eleve']
  },
  {
    id: 'HAB_010',
    title: 'Cuisiner à partir d\'ingrédients de base',
    description: 'Même simple, c\'est souvent mieux que le prêt-à-manger.',
    category: 'food',
    triggers: ['ultra_transforme', 'transformation_elevee']
  }
];

function getHabitById(id) {
  return HABITS_LIBRARY.find(h => h.id === id) || null;
}

function selectHabitByFlags(flags, category = 'food') {
  if (!flags || flags.length === 0) {
    return getHabitById('HAB_003');
  }
  const catHabits = HABITS_LIBRARY.filter(h => h.category === category);
  const scored = catHabits.map(h => ({
    ...h,
    matchCount: h.triggers.filter(t => flags.includes(t)).length
  }));
  scored.sort((a, b) => b.matchCount - a.matchCount);
  return scored[0] || getHabitById('HAB_003');
}

module.exports = { HABITS_LIBRARY, getHabitById, selectHabitByFlags };
