// ============================================================================
// ECOLOJIA — BIBLIOTHEQUE D'HABITUDES UNIFIEE V3.0.0
// VERSION 3.0.0 — 2026-01-06
// PRODUCTION READY - Sources scientifiques integrees
// REGLE : L'IA selectionne, elle ne cree JAMAIS.
// ============================================================================

const fs = require('fs');
const path = require('path');

// ============================================================================
// CHARGEMENT BIBLIOTHEQUE JSON (source unique de verite)
// ============================================================================

let HABITS_LIBRARY_FULL = null;
let HABITS_LIBRARY_SIMPLE = [];

function loadHabitsLibrary() {
  if (HABITS_LIBRARY_FULL) return HABITS_LIBRARY_FULL;

  try {
    const libraryPath = path.join(__dirname, '..', 'knowledge', 'habits', 'library.json');
    const content = fs.readFileSync(libraryPath, 'utf8');
    HABITS_LIBRARY_FULL = JSON.parse(content);

    // Convertir en format simple pour compatibilite
    HABITS_LIBRARY_SIMPLE = HABITS_LIBRARY_FULL.habits.map(h => ({
      id: h.id,
      title: h.name,
      description: h.description,
      category: h.category,
      priority: h.priority,
      triggers: extractTriggersFromHabit(h),
      scientificBasis: h.scientificBasis,
      examples: h.examples,
      impact: h.impact,
      difficulty: h.difficulty
    }));

    console.log('[HabitsLibrary V3] Charge:', HABITS_LIBRARY_SIMPLE.length, 'habitudes');
    return HABITS_LIBRARY_FULL;
  } catch (error) {
    console.error('[HabitsLibrary V3] Erreur chargement:', error.message);
    // Fallback sur habitudes minimales
    return loadFallbackHabits();
  }
}

// ============================================================================
// EXTRACTION TRIGGERS DEPUIS MAPPING RULES
// ============================================================================

function extractTriggersFromHabit(habit) {
  const triggerMap = {
    'privilegier-aliments-bruts': ['nova_1', 'nova_2', 'aliment_brut'],
    'limiter-produits-ultra-transformes': ['ultra_transforme', 'nova_4', 'transformation_elevee'],
    'surveiller-frequence-non-interdiction': ['nutriscore_d', 'nutriscore_e', 'sucre_eleve', 'sel_eleve'],
    'lire-listes-ingredients': ['additifs_multiples', 'ingredients_nombreux'],
    'varier-sources-lipides': ['graisses_saturees'],
    'associer-sucres-fibres-proteines': ['sucre_eleve', 'sucres_ajoutes'],
    'reserver-produits-plaisir-occasions': ['ultra_transforme', 'nutriscore_e'],
    'varier-sources-alimentaires': ['viande_rouge', 'charcuterie'],
    'limiter-exposition-chimique': ['additifs_multiples', 'additifs_controverses', 'perturbateurs_endocriniens'],
    'favoriser-simplicite-preparations': ['ultra_transforme', 'transformation_elevee'],
    'hydrater-eau-priorite': ['boisson_sucree', 'soda'],
    'limiter-sel-ajoute': ['sel_eleve'],
    'limiter-sucres-ajoutes': ['sucre_eleve', 'sucres_ajoutes'],
    'augmenter-fibres-quotidiennes': ['fibres_faibles'],
    'equilibre-global-semaine': ['nutriscore_d', 'nutriscore_e'],
    'cuisiner-maison-regulierement': ['ultra_transforme', 'plat_prepare'],
    'portions-conscientes': ['sucre_eleve', 'sel_eleve', 'graisses_saturees'],
    'limiter-alcool': ['alcool'],
    'manger-en-conscience': [],
    'attention-produits-light': ['edulcorants', 'light'],
    'limiter-viandes-rouges-charcuterie': ['viande_rouge', 'charcuterie'],
    'favoriser-poissons-gras': ['poisson'],
    'fruits-legumes-quotidiens': ['fibres_faibles'],
    'cereales-completes-quotidiennes': ['cereales_raffinees'],
    'limiter-graisses-saturees': ['graisses_saturees']
  };

  return triggerMap[habit.id] || [];
}

// ============================================================================
// FALLBACK HABITUDES (si JSON non disponible)
// ============================================================================

function loadFallbackHabits() {
  console.warn('[HabitsLibrary V3] Utilisation habitudes fallback');

  HABITS_LIBRARY_SIMPLE = [
    {
      id: 'HAB_FOOD_001',
      title: 'Privilegier les aliments bruts',
      description: 'Les aliments non transformes conservent leurs nutriments et leur structure.',
      category: 'food',
      priority: 'high',
      triggers: ['ultra_transforme', 'transformation_elevee', 'additifs_multiples']
    },
    {
      id: 'HAB_FOOD_002',
      title: 'Reserver les produits transformes aux occasions',
      description: 'Les produits NOVA 4 ne sont pas interdits, mais a ne pas consommer au quotidien.',
      category: 'food',
      priority: 'high',
      triggers: ['ultra_transforme', 'nova_4']
    },
    {
      id: 'HAB_FOOD_003',
      title: 'Surveiller la frequence, pas l\'exception',
      description: 'Un ecart occasionnel ne pose pas de probleme. C\'est la repetition qui compte.',
      category: 'food',
      priority: 'high',
      triggers: ['nutriscore_d', 'nutriscore_e', 'sucre_eleve', 'sel_eleve']
    },
    {
      id: 'HAB_COSM_001',
      title: 'Simplifier sa routine quotidienne',
      description: 'Moins de produits signifie moins de risques d\'interactions.',
      category: 'cosmetic',
      priority: 'high',
      triggers: ['additifs_multiples', 'high_frequency_use']
    },
    {
      id: 'HAB_DET_001',
      title: 'Respecter les dosages indiques',
      description: 'Plus de produit ne signifie pas plus d\'efficacite.',
      category: 'detergent',
      priority: 'high',
      triggers: ['high_inhalation_exposure', 'cov_eleves']
    }
  ];

  return { habits: HABITS_LIBRARY_SIMPLE, version: 'fallback' };
}

// ============================================================================
// API PUBLIQUE
// ============================================================================

/**
 * Recupere une habitude par ID
 * @param {string} id - ID de l'habitude
 * @returns {Object|null} Habitude ou null
 */
function getHabitById(id) {
  loadHabitsLibrary();

  // Chercher dans la version simple
  const simple = HABITS_LIBRARY_SIMPLE.find(h => h.id === id);
  if (simple) return simple;

  // Chercher par ID alternatif (format library.json)
  if (HABITS_LIBRARY_FULL?.habits) {
    const full = HABITS_LIBRARY_FULL.habits.find(h => h.id === id);
    if (full) {
      return {
        id: full.id,
        title: full.name,
        description: full.description,
        category: full.category,
        priority: full.priority,
        triggers: extractTriggersFromHabit(full),
        scientificBasis: full.scientificBasis,
        examples: full.examples
      };
    }
  }

  return null;
}

/**
 * Selectionne l'habitude la plus pertinente selon les flags et la categorie
 * @param {string[]} flags - Flags detectes sur le produit
 * @param {string} category - Categorie produit (food/cosmetic/detergent)
 * @returns {Object} Habitude selectionnee
 */
function selectHabitByFlags(flags, category = 'food') {
  loadHabitsLibrary();

  // Normaliser categorie
  const normalizedCategory = normalizeCategory(category);

  // Filtrer par categorie
  const catHabits = HABITS_LIBRARY_SIMPLE.filter(h => h.category === normalizedCategory);

  if (!catHabits.length) {
    console.warn('[HabitsLibrary V3] Aucune habitude pour categorie:', normalizedCategory);
    return getDefaultHabit(normalizedCategory);
  }

  if (!flags || flags.length === 0) {
    return catHabits.find(h => h.priority === 'high') || catHabits[0];
  }

  // Normaliser flags
  const normalizedFlags = flags.map(f => f.toLowerCase().replace(/-/g, '_'));

  // Scorer chaque habitude selon les flags matches
  const scored = catHabits.map(h => {
    const matchCount = h.triggers.filter(t =>
      normalizedFlags.some(f => f.includes(t) || t.includes(f))
    ).length;

    // Bonus pour priorite haute
    const priorityBonus = h.priority === 'high' ? 1 : 0;

    return {
      ...h,
      matchCount,
      totalScore: matchCount * 2 + priorityBonus
    };
  });

  // Trier par score decroissant
  scored.sort((a, b) => b.totalScore - a.totalScore);

  // Retourner la meilleure ou la premiere par defaut
  const best = scored[0];
  if (best.matchCount > 0) {
    console.log('[HabitsLibrary V3] Habitude selectionnee:', best.id, '| Score:', best.totalScore);
    return best;
  }

  return catHabits.find(h => h.priority === 'high') || catHabits[0];
}

/**
 * Liste toutes les habitudes d'une categorie
 * @param {string} category - Categorie
 * @returns {Object[]} Liste des habitudes
 */
function getHabitsByCategory(category) {
  loadHabitsLibrary();
  const normalizedCategory = normalizeCategory(category);
  return HABITS_LIBRARY_SIMPLE.filter(h => h.category === normalizedCategory);
}

/**
 * Recupere l'habitude complete avec sources scientifiques
 * @param {string} id - ID de l'habitude
 * @returns {Object|null} Habitude complete ou null
 */
function getHabitWithSources(id) {
  loadHabitsLibrary();

  if (!HABITS_LIBRARY_FULL?.habits) return null;

  const habit = HABITS_LIBRARY_FULL.habits.find(h => h.id === id);
  if (!habit) return null;

  return {
    id: habit.id,
    title: habit.name,
    description: habit.description,
    category: habit.category,
    priority: habit.priority,
    scientificBasis: habit.scientificBasis,
    examples: habit.examples,
    difficulty: habit.difficulty,
    impact: habit.impact,
    frequencyGoal: habit.frequencyGoal,
    relatedHabits: habit.relatedHabits
  };
}

/**
 * Statistiques de la bibliotheque
 * @returns {Object} Stats
 */
function getHabitsStats() {
  loadHabitsLibrary();

  const stats = {
    total: HABITS_LIBRARY_SIMPLE.length,
    byCategory: {},
    byPriority: {},
    version: HABITS_LIBRARY_FULL?.version || 'unknown'
  };

  HABITS_LIBRARY_SIMPLE.forEach(h => {
    stats.byCategory[h.category] = (stats.byCategory[h.category] || 0) + 1;
    stats.byPriority[h.priority] = (stats.byPriority[h.priority] || 0) + 1;
  });

  return stats;
}

// ============================================================================
// HELPERS
// ============================================================================

function normalizeCategory(category) {
  const mapping = {
    'food': 'food',
    'cosmetic': 'cosmetic',
    'cosmetics': 'cosmetic',
    'detergent': 'detergent',
    'detergents': 'detergent',
    'household': 'detergent'
  };
  return mapping[category?.toLowerCase()] || 'food';
}

function getDefaultHabit(category) {
  const defaults = {
    food: {
      id: 'HAB_FOOD_003',
      title: 'Surveiller la frequence, pas l\'exception',
      description: 'Un ecart occasionnel ne pose pas de probleme.',
      category: 'food',
      priority: 'high',
      triggers: []
    },
    cosmetic: {
      id: 'HAB_COSM_001',
      title: 'Simplifier sa routine quotidienne',
      description: 'Moins de produits signifie moins de risques.',
      category: 'cosmetic',
      priority: 'high',
      triggers: []
    },
    detergent: {
      id: 'HAB_DET_001',
      title: 'Respecter les dosages indiques',
      description: 'Plus de produit ne signifie pas plus d\'efficacite.',
      category: 'detergent',
      priority: 'high',
      triggers: []
    }
  };
  return defaults[category] || defaults.food;
}

// ============================================================================
// INITIALISATION
// ============================================================================

// Charger au demarrage
loadHabitsLibrary();

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // API principale
  getHabitById,
  selectHabitByFlags,
  getHabitsByCategory,
  getHabitWithSources,
  getHabitsStats,

  // Pour compatibilite
  HABITS_LIBRARY: HABITS_LIBRARY_SIMPLE,

  // Version
  HABITS_VERSION: '3.0.0'
};
