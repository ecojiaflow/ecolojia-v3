// ============================================================================
// ECOLOJIA — SERVICE CONSTITUTION
// VERSION 1.0.0 — 2026-01-02
// Génère la Constitution complète (3 cartes + healthReflex + habit)
// ============================================================================

const { calculateHealthReflex } = require('./healthReflex.service');
const { resolveRules } = require('./RuleResolver.service');

// ============================================================================
// GÉNÉRATION DES 3 CARTES
// ============================================================================

function generateCards(product, healthReflex) {
  const { name, brand, foodData, scores } = product || {};
  const nova = foodData?.novaGroup || null;
  const nutriScore = (foodData?.nutriScore || '').toUpperCase();
  const flags = healthReflex?.flags || [];
  
  // CARTE 1 : Ce que c'est vraiment
  const card1 = {
    id: 'card_what',
    icon: '🧠',
    title: 'Ce que c\'est vraiment',
    content: generateWhatContent(product, nova)
  };
  
  // CARTE 2 : Le bon réflexe santé
  const card2 = {
    id: 'card_reflex',
    icon: '🌱',
    title: 'Le bon réflexe santé',
    content: healthReflex?.content || 'Consommer avec modération.'
  };
  
  // CARTE 3 : Actions possibles
  const card3 = {
    id: 'card_actions',
    icon: '🔁',
    title: 'Actions possibles',
    content: generateActionsContent(flags, healthReflex?.level)
  };
  
  return [card1, card2, card3];
}

// ============================================================================
// CONTENU CARTE 1 : CE QUE C'EST VRAIMENT
// ============================================================================

function generateWhatContent(product, nova) {
  const name = product?.name || 'Ce produit';
  const brand = product?.brand ? ` de ${product.brand}` : '';
  
  const novaDescriptions = {
    1: 'un aliment brut ou peu transformé',
    2: 'un ingrédient culinaire transformé',
    3: 'un aliment transformé',
    4: 'un produit ultra-transformé'
  };
  
  const novaDesc = nova ? novaDescriptions[nova] : 'un produit alimentaire';
  
  return `${name}${brand} est ${novaDesc}. Le niveau de transformation influence la qualité nutritionnelle globale.`;
}

// ============================================================================
// CONTENU CARTE 3 : ACTIONS POSSIBLES
// ============================================================================

function generateActionsContent(flags, level) {
  const actions = [];
  
  // Actions selon flags
  if (flags.includes('ultra_transforme') || flags.includes('transformation_elevee')) {
    actions.push('Chercher une alternative moins transformée');
  }
  if (flags.includes('sucre_eleve')) {
    actions.push('Vérifier la portion réelle consommée');
  }
  if (flags.includes('sel_eleve')) {
    actions.push('Rincer si possible ou réduire la quantité');
  }
  if (flags.includes('additifs_multiples')) {
    actions.push('Comparer avec des produits à liste plus courte');
  }
  
  // Actions par défaut selon niveau
  if (actions.length === 0) {
    if (level === 1) {
      actions.push('Intégrer dans une alimentation variée');
    } else if (level === 2) {
      actions.push('Limiter la fréquence de consommation');
      actions.push('Explorer les alternatives disponibles');
    } else {
      actions.push('Réserver aux occasions spéciales');
      actions.push('Découvrir des alternatives plus saines');
    }
  }
  
  // Maximum 3 actions
  return actions.slice(0, 3).map((a, i) => `${i + 1}. ${a}`).join('\n');
}

// ============================================================================
// FONCTION PRINCIPALE : GÉNÉRER CONSTITUTION COMPLÈTE
// ============================================================================

function generateConstitution(product) {
  if (!product) {
    return null;
  }
  
  // 1. Calculer healthReflex (level + flags + habit)
  const healthReflex = calculateHealthReflex(product);
  
  // 2. Générer les 3 cartes
  const cards = generateCards(product, healthReflex);
  
  // 3. Résoudre les règles applicables
  const rulesResult = resolveRules({
    categoryType: product.categoryType || product.category || 'food',
    constitution: { healthReflex }
  });

  // 4. Assembler Constitution complète
  return {
    version: '1.0.0',
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
    }
  };
}

module.exports = { generateConstitution, generateCards };


