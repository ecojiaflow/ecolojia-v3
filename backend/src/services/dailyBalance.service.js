/**
 * dailyBalance.service.js
 * Service Expert - Équilibre Journalier & Hebdomadaire
 * Version: 1.0.0
 * 
 * IMPORTANT: Importe DAILY_REFERENCES et PORTION_REFERENCES depuis nutritionReferences.js
 * pour éviter toute duplication.
 * 
 * CE SERVICE AJOUTE:
 * - WEEKLY_REFERENCES (repères hebdomadaires OMS/ANSES/PNNS)
 * - PORTION_STANDARDS avec maxDaily/maxWeekly
 * - Position assiette PNNS
 * - Calcul équilibre contextuel
 */

// IMPORT des références existantes (pas de duplication)
const { 
  DAILY_REFERENCES, 
  PORTION_REFERENCES, 
  calculateNutritionContext,
  detectSugarType 
} = require('../knowledge/nutritionReferences');

// ═══════════════════════════════════════════════════════════════════
// REPÈRES HEBDOMADAIRES (OMS / ANSES / PNNS / WCRF)
// ═══════════════════════════════════════════════════════════════════

const WEEKLY_REFERENCES = {
  redMeat: {
    maxGrams: 500,
    maxPortions: 3,
    portionSize: 150,
    source: 'OMS/WCRF 2018',
    note: 'Boeuf, porc, agneau, veau - lien cancer colorectal'
  },
  processedMeat: {
    maxGrams: 150,
    maxPortions: 2,
    portionSize: 50,
    source: 'WCRF 2018',
    note: 'Charcuterie - classée cancérogène groupe 1'
  },
  fish: {
    minPortions: 2,
    portionSize: 100,
    source: 'PNNS',
    note: 'Dont 1 poisson gras (oméga-3)'
  },
  legumes: {
    minPortions: 2,
    portionSize: 150,
    source: 'PNNS',
    note: 'Lentilles, pois chiches, haricots'
  },
  sweetProducts: {
    maxOccasions: 5,
    source: 'Expert/PNNS',
    note: 'Biscuits, confiseries, pâtisseries, sodas'
  },
  ultraProcessed: {
    maxPercentCalories: 15,
    source: 'Études NutriNet-Santé',
    note: 'NOVA 4 - corrélation maladies chroniques'
  },
  alcohol: {
    maxUnits: 10,
    source: 'Santé Publique France 2017',
    note: '10 verres max/semaine, pas plus de 2/jour'
  }
};

// ═══════════════════════════════════════════════════════════════════
// FRÉQUENCES PAR CATÉGORIE (étend PORTION_REFERENCES)
// ═══════════════════════════════════════════════════════════════════

const FREQUENCY_LIMITS = {
  'chocolate-spread': { maxDaily: 1, maxWeekly: 4, category: 'pleasure' },
  'chocolate': { maxDaily: 1, maxWeekly: 5, category: 'pleasure' },
  'chocolate-bar': { maxDaily: 1, maxWeekly: 3, category: 'pleasure' },
  'biscuits': { maxDaily: 1, maxWeekly: 5, category: 'pleasure' },
  'breakfast-cereals': { maxDaily: 1, maxWeekly: 7, category: 'starchy' },
  'yogurts': { maxDaily: 2, maxWeekly: 14, category: 'dairy' },
  'cheese': { maxDaily: 1, maxWeekly: 7, category: 'dairy' },
  'bread': { maxDaily: 4, maxWeekly: 28, category: 'starchy' },
  'juices': { maxDaily: 1, maxWeekly: 5, category: 'pleasure' },
  'sodas': { maxDaily: 0, maxWeekly: 2, category: 'pleasure' },
  'chips': { maxDaily: 0, maxWeekly: 2, category: 'pleasure' },
  'snack': { maxDaily: 1, maxWeekly: 4, category: 'pleasure' },
  'ice-cream': { maxDaily: 0, maxWeekly: 3, category: 'pleasure' },
  'pizza': { maxDaily: 0, maxWeekly: 2, category: 'pleasure' },
  'ready-meals': { maxDaily: 0, maxWeekly: 3, category: 'pleasure' },
  'fruits': { maxDaily: 3, maxWeekly: 21, category: 'vegetables' },
  'pasta': { maxDaily: 1, maxWeekly: 5, category: 'starchy' },
  'beverage': { maxDaily: 1, maxWeekly: 5, category: 'pleasure' },
  'meat': { maxDaily: 1, maxWeekly: 4, category: 'proteins' },
  'fish': { maxDaily: 1, maxWeekly: 3, category: 'proteins' },
  'vegetable': { maxDaily: 5, maxWeekly: 35, category: 'vegetables' },
  'legume': { maxDaily: 1, maxWeekly: 4, category: 'proteins' },
  'egg': { maxDaily: 2, maxWeekly: 7, category: 'proteins' },
  'haircare': { maxDaily: 1, maxWeekly: 7, category: 'cosmetic' },
  'skincare': { maxDaily: 2, maxWeekly: 14, category: 'cosmetic' },
  'default': { maxDaily: 1, maxWeekly: 7, category: 'other' }
};

// ═══════════════════════════════════════════════════════════════════
// ASSIETTE ÉQUILIBRÉE PNNS
// ═══════════════════════════════════════════════════════════════════

const PLATE_CATEGORIES = {
  vegetables: {
    label: 'Légumes & Fruits',
    percent: 50,
    color: '#4CAF50',
    emoji: '🥗',
    subcategories: ['vegetable', 'fruit', 'salad', 'legume']
  },
  starchy: {
    label: 'Féculents',
    percent: 25,
    color: '#FF9800',
    emoji: '🍞',
    subcategories: ['pasta', 'rice', 'bread', 'cereal', 'potato', 'breakfast-cereals']
  },
  proteins: {
    label: 'Protéines',
    percent: 25,
    color: '#E91E63',
    emoji: '🥚',
    subcategories: ['meat', 'fish', 'egg', 'tofu', 'legume']
  },
  dairy: {
    label: 'Produits laitiers',
    percent: 0,
    color: '#2196F3',
    emoji: '🥛',
    note: '2-3 portions/jour',
    subcategories: ['yogurt', 'yogurts', 'cheese', 'milk']
  },
  fats: {
    label: 'Matières grasses',
    percent: 0,
    color: '#FFC107',
    emoji: '🧈',
    note: 'Petite quantité, privilégier végétales',
    subcategories: ['oil', 'butter', 'margarine', 'butter-spread']
  },
  pleasure: {
    label: 'Plaisir occasionnel',
    percent: 0,
    color: '#9C27B0',
    emoji: '🍫',
    note: 'Hors assiette équilibrée',
    subcategories: ['chocolate', 'chocolate-spread', 'chocolate-bar', 'biscuit', 'biscuits', 'snack', 'chips', 'soda', 'sodas', 'candy', 'ice-cream', 'beverage']
  }
};

// ═══════════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE : Calculer l'équilibre
// ═══════════════════════════════════════════════════════════════════

function calculateDailyBalance(product) {
  const nutrition = product?.foodData?.nutritionalInfo || product?.nutritionalInfo || {};
  const subcategory = product?.subcategory || 'default';
  const nova = product?.nova_group || product?.foodData?.nova_group || null;
  
  // Récupérer portion depuis PORTION_REFERENCES existant
  const portionRef = PORTION_REFERENCES[subcategory] || PORTION_REFERENCES['default'];
  const freqLimits = FREQUENCY_LIMITS[subcategory] || FREQUENCY_LIMITS['default'];
  const portionGrams = portionRef.value;
  const portionMultiplier = portionGrams / 100;
  
  // Calcul des apports par portion
  const perPortion = {
    energy: Math.round((parseFloat(nutrition.energy_kcal) || 0) * portionMultiplier),
    sugars: Math.round((parseFloat(nutrition.sugars) || 0) * portionMultiplier * 10) / 10,
    saturatedFat: Math.round((parseFloat(nutrition.saturatedFat) || 0) * portionMultiplier * 10) / 10,
    salt: Math.round((parseFloat(nutrition.salt) || 0) * portionMultiplier * 100) / 100,
    fiber: Math.round((parseFloat(nutrition.fiber) || 0) * portionMultiplier * 10) / 10,
    proteins: Math.round((parseFloat(nutrition.proteins) || 0) * portionMultiplier * 10) / 10
  };
  
  // Pourcentages des repères journaliers (utilise DAILY_REFERENCES importé)
  const dailyPercent = {
    energy: {
      value: Math.round((perPortion.energy / DAILY_REFERENCES.energy.value) * 100),
      reference: DAILY_REFERENCES.energy.value,
      unit: 'kcal'
    },
    sugars: {
      euRI: Math.round((perPortion.sugars / DAILY_REFERENCES.sugars.value) * 100),
      omsIdeal: Math.round((perPortion.sugars / (DAILY_REFERENCES.sugars.oms?.ideal || 25)) * 100),
      omsMax: Math.round((perPortion.sugars / (DAILY_REFERENCES.sugars.oms?.max || 50)) * 100),
      referenceEuRI: DAILY_REFERENCES.sugars.value,
      referenceOmsIdeal: DAILY_REFERENCES.sugars.oms?.ideal || 25,
      unit: 'g'
    },
    saturatedFat: {
      value: Math.round((perPortion.saturatedFat / DAILY_REFERENCES.saturatedFat.value) * 100),
      reference: DAILY_REFERENCES.saturatedFat.value,
      unit: 'g'
    },
    salt: {
      euRI: Math.round((perPortion.salt / DAILY_REFERENCES.salt.value) * 100),
      omsMax: Math.round((perPortion.salt / (DAILY_REFERENCES.salt.oms?.max || 5)) * 100),
      referenceEuRI: DAILY_REFERENCES.salt.value,
      referenceOms: DAILY_REFERENCES.salt.oms?.max || 5,
      unit: 'g'
    },
    fiber: {
      value: Math.round((perPortion.fiber / (DAILY_REFERENCES.fiber.ideal || 30)) * 100),
      reference: DAILY_REFERENCES.fiber.ideal || 30,
      unit: 'g',
      isPositive: true
    },
    proteins: {
      value: Math.round((perPortion.proteins / DAILY_REFERENCES.proteins.value) * 100),
      reference: DAILY_REFERENCES.proteins.value,
      unit: 'g',
      isPositive: true
    }
  };
  
  // Position dans l'assiette PNNS
  const platePosition = determinePlatePosition(subcategory);
  
  // Fréquence recommandée
  const frequency = {
    portion: {
      grams: portionGrams,
      context: portionRef.context
    },
    daily: {
      max: freqLimits.maxDaily,
      label: freqLimits.maxDaily === 0 
        ? 'Pas quotidiennement' 
        : freqLimits.maxDaily === 1 
          ? '1 portion max/jour'
          : `${freqLimits.maxDaily} portions max/jour`
    },
    weekly: {
      max: freqLimits.maxWeekly,
      label: `${freqLimits.maxWeekly} fois max/semaine`,
      isOccasional: freqLimits.maxWeekly <= 5
    }
  };
  
  // Insights clés (max 3)
  const keyInsights = generateKeyInsights(perPortion, dailyPercent, nova);
  
  // Message expert
  const expertMessage = generateExpertMessage(perPortion, dailyPercent, frequency, nova);
  
  return {
    version: '1.0.0',
    portion: {
      standard: portionGrams,
      unit: 'g',
      context: portionRef.context,
      nutrition: perPortion
    },
    dailyPercent,
    frequency,
    platePosition,
    keyInsights,
    expertMessage,
    weeklyContext: {
      category: subcategory,
      maxOccasions: freqLimits.maxWeekly,
      isUltraProcessed: nova === 4,
      ultraProcessedLimit: nova === 4 ? WEEKLY_REFERENCES.ultraProcessed : null
    },
    sources: ['EU RI 1169/2011', 'OMS 2015', 'ANSES', 'PNNS'],
    disclaimer: 'Repères indicatifs pour adulte. Ne remplace pas un avis médical.'
  };
}

/**
 * Détermine la position dans l'assiette PNNS
 */
function determinePlatePosition(subcategory) {
  for (const [category, data] of Object.entries(PLATE_CATEGORIES)) {
    if (data.subcategories.some(s => subcategory.includes(s) || subcategory === s)) {
      return {
        category,
        label: data.label,
        percent: data.percent,
        color: data.color,
        emoji: data.emoji,
        note: data.note || null,
        isEssential: data.percent > 0,
        message: data.percent > 0
          ? `Contribue à la part "${data.label}" (${data.percent}%) de l'assiette équilibrée.`
          : `Ce produit est un plaisir occasionnel, pas un aliment du quotidien.`
      };
    }
  }
  
  // Défaut
  return {
    category: 'other',
    label: 'Autre',
    percent: 0,
    color: '#9E9E9E',
    emoji: '📦',
    isEssential: false,
    message: 'Catégorie non définie dans l\'assiette équilibrée.'
  };
}

/**
 * Génère les insights clés (max 3)
 */
function generateKeyInsights(perPortion, dailyPercent, nova) {
  const insights = [];
  
  // Insight sucres (prioritaire si élevé)
  if (perPortion.sugars > 5) {
    const level = dailyPercent.sugars.omsIdeal > 100 ? 'high' : dailyPercent.sugars.omsIdeal > 50 ? 'medium' : 'low';
    insights.push({
      icon: '🍬',
      label: 'Sucres',
      value: `${perPortion.sugars}g`,
      percent: dailyPercent.sugars.omsIdeal,
      reference: 'OMS idéal 25g/jour',
      level
    });
  }
  
  // Insight graisses saturées
  if (perPortion.saturatedFat > 2) {
    const level = dailyPercent.saturatedFat.value > 50 ? 'high' : dailyPercent.saturatedFat.value > 25 ? 'medium' : 'low';
    insights.push({
      icon: '🧈',
      label: 'Graisses sat.',
      value: `${perPortion.saturatedFat}g`,
      percent: dailyPercent.saturatedFat.value,
      reference: 'Max 20g/jour',
      level
    });
  }
  
  // Insight sel
  if (perPortion.salt > 0.3) {
    const level = dailyPercent.salt.omsMax > 30 ? 'high' : dailyPercent.salt.omsMax > 15 ? 'medium' : 'low';
    insights.push({
      icon: '🧂',
      label: 'Sel',
      value: `${perPortion.salt}g`,
      percent: dailyPercent.salt.omsMax,
      reference: 'OMS max 5g/jour',
      level
    });
  }
  
  // Insight fibres (positif)
  if (perPortion.fiber > 2) {
    insights.push({
      icon: '🌾',
      label: 'Fibres',
      value: `${perPortion.fiber}g`,
      percent: dailyPercent.fiber.value,
      reference: 'Objectif 30g/jour',
      level: 'positive'
    });
  }
  
  // Insight énergie
  insights.push({
    icon: '⚡',
    label: 'Énergie',
    value: `${perPortion.energy} kcal`,
    percent: dailyPercent.energy.value,
    reference: 'Base 2000 kcal/jour',
    level: dailyPercent.energy.value > 15 ? 'medium' : 'low'
  });
  
  // Trier par priorité et limiter à 3
  const priority = { high: 0, medium: 1, positive: 2, low: 3 };
  return insights
    .sort((a, b) => priority[a.level] - priority[b.level])
    .slice(0, 3);
}

/**
 * Génère le message expert personnalisé
 */
function generateExpertMessage(perPortion, dailyPercent, frequency, nova) {
  const messages = [];
  
  if (dailyPercent.sugars.omsIdeal > 50) {
    messages.push({
      type: 'sugars',
      severity: dailyPercent.sugars.omsIdeal > 100 ? 'high' : 'medium',
      text: `Une portion apporte ${perPortion.sugars}g de sucres (${dailyPercent.sugars.omsIdeal}% du repère OMS idéal).`
    });
  }
  
  if (dailyPercent.saturatedFat.value > 25) {
    messages.push({
      type: 'fat',
      severity: dailyPercent.saturatedFat.value > 50 ? 'high' : 'medium',
      text: `${perPortion.saturatedFat}g de graisses saturées (${dailyPercent.saturatedFat.value}% du repère).`
    });
  }
  
  if (nova === 4) {
    messages.push({
      type: 'nova',
      severity: 'info',
      text: 'Produit ultra-transformé (NOVA 4) : à limiter à 15% des calories selon les études.'
    });
  }
  
  if (frequency.weekly.isOccasional) {
    messages.push({
      type: 'frequency',
      severity: 'info',
      text: `Fréquence adaptée : ${frequency.weekly.label} dans une alimentation équilibrée.`
    });
  }
  
  return messages;
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  calculateDailyBalance,
  WEEKLY_REFERENCES,
  FREQUENCY_LIMITS,
  PLATE_CATEGORIES
};




