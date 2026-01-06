// ============================================================================
// ECOLOJIA — SERVICE CONSTITUTION V1.1.0
// VERSION 1.1.0 — 2026-01-03
// Génère la Constitution complète (3 cartes + healthReflex + habit)
// CORRECTION V1.1 : Passe subcategory au RuleResolver
// ============================================================================

const { calculateHealthReflex } = require('./healthReflex.service');
const { resolveRules } = require('./RuleResolver.service');

function generateCards(product, healthReflex) {
  const { name, brand, foodData } = product || {};
  const nova = foodData?.novaGroup || null;
  const flags = healthReflex?.flags || [];

  const card1 = {
    id: 'card_what',
    icon: '🧠',
    title: "Ce que c'est vraiment",
    content: generateWhatContent(product, nova)
  };

  const card2 = {
    id: 'card_reflex',
    icon: '🌱',
    title: 'Le bon réflexe',
    content: healthReflex?.content || 'Consommer avec modération.'
  };

  const card3 = {
    id: 'card_actions',
    icon: '🔁',
    title: 'Actions possibles',
    content: generateActionsContent(flags, healthReflex?.level)
  };

  return [card1, card2, card3];
}

function generateWhatContent(product, nova) {
  const name = product?.name || 'Ce produit';
  const brand = product?.brand ? ' de ' + product.brand : '';
  const novaDescriptions = {
    1: 'un aliment brut ou peu transformé',
    2: 'un ingrédient culinaire transformé',
    3: 'un aliment transformé',
    4: 'un produit ultra-transformé'
  };
  const novaDesc = nova ? novaDescriptions[nova] : 'un produit alimentaire';
  return name + brand + ' est ' + novaDesc + '. Le niveau de transformation influence la qualité nutritionnelle globale.';
}

function generateActionsContent(flags, level) {
  const actions = [];
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
  return actions.slice(0, 3).map((a, i) => (i + 1) + '. ' + a).join('\n');
}

function generateConstitution(product) {
  if (!product) return null;
  const healthReflex = calculateHealthReflex(product);
  const cards = generateCards(product, healthReflex);
  const rulesResult = resolveRules({
    name: product.name,
    categoryType: product.categoryType || product.category || 'food',
    subcategory: product.subcategory || null,
    constitution: { healthReflex }
  });
  return {
    version: '1.1.0',
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

function regenerateRulesOnly(product, existingConstitution) {
  if (!product || !existingConstitution) return existingConstitution;
  const rulesResult = resolveRules({
    name: product.name,
    categoryType: product.categoryType || product.category || 'food',
    subcategory: product.subcategory || null,
    constitution: { healthReflex: existingConstitution.healthReflex }
  });
  return {
    ...existingConstitution,
    rules: {
      reflexHero: rulesResult.reflexHero,
      rulesHits: rulesResult.rulesHits,
      actions: rulesResult.actions
    }
  };
}

module.exports = { generateConstitution, generateCards, regenerateRulesOnly };

