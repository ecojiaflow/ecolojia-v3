/**
 * Constitution Templates - Ecolojia V1.0
 * Templates phrases contextuelles pour génération Constitution
 * Respect ton Ecolojia : calme, scientifique, non-alarmiste
 */

module.exports = {
  
  // ========================================
  // 1. WHAT IS IT (Carte 1)
  // ========================================
  
  novaLevels: {
    1: {
      label: 'aliment brut',
      description: 'non transformé ou minimalement transformé'
    },
    2: {
      label: 'aliment peu transformé',
      description: 'avec ajout de sel, sucre ou matière grasse'
    },
    3: {
      label: 'aliment transformé',
      description: 'préparé avec plusieurs ingrédients'
    },
    4: {
      label: 'aliment ultra-transformé',
      description: 'formulé avec de nombreux ingrédients et additifs'
    }
  },
  
  // Templates construction phrase "Ce que c'est vraiment"
  whatIsItTemplates: {
    withBrandAndNova: (name, brand, novaLabel, novaLevel) => 
      `${name} de la marque ${brand} est un ${novaLabel} (NOVA ${novaLevel})`,
    
    withBrandOnly: (name, brand, categoryLabel) => 
      `${name} de la marque ${brand} est un produit ${categoryLabel}`,
    
    withNovaOnly: (name, novaLabel, novaLevel) => 
      `${name} est un ${novaLabel} (NOVA ${novaLevel})`,
    
    basic: (name, categoryLabel) => 
      `${name} est un produit ${categoryLabel}`
  },
  
  // Templates ingrédients principaux
  ingredientsTemplates: {
    threeIngredients: (ingredients) => 
      `, composé principalement de ${ingredients[0]}, ${ingredients[1]} et ${ingredients[2]}`,
    
    twoIngredients: (ingredients) => 
      `, composé principalement de ${ingredients[0]} et ${ingredients[1]}`,
    
    oneIngredient: (ingredients) => 
      `, dont l'ingrédient principal est ${ingredients[0]}`
  },
  
  // ========================================
  // 2. HEALTH REFLEX (Carte 2)
  // ========================================
  
  healthReflexContexts: {
    // Score élevé (75-100)
    excellent: {
      base: 'privilégier ce type de produit dans ton quotidien',
      withAlternative: (category) => 
        `privilégier ce type de ${category} dans ton quotidien`,
      suffix: 'Il s\'inscrit dans une alimentation équilibrée.'
    },
    
    // Score moyen-haut (60-74)
    good: {
      base: 'consommer régulièrement sans excès',
      withModeration: 'intégrer dans une alimentation variée',
      suffix: 'La modération reste de mise.'
    },
    
    // Score moyen (40-59)
    moderate: {
      base: 'consommer occasionnellement',
      withContext: (subcategory) => 
        `réserver ce type de ${subcategory} aux occasions`,
      withAlternative: (alternative) => 
        `limiter la fréquence et privilégier ${alternative}`,
      suffix: 'L\'équilibre passe par la fréquence.'
    },
    
    // Score faible (<40)
    low: {
      base: 'limiter fortement et privilégier des alternatives',
      withAlternative: (alternative) => 
        `réserver aux occasions rares et privilégier ${alternative} au quotidien`,
      withFrequency: 'réserver aux moments de plaisir occasionnels',
      suffix: 'Une consommation fréquente peut contribuer à des déséquilibres.'
    }
  },
  
  // Suggestions alternatives contextuelles
  alternativeSuggestions: {
    food: {
      spreads: 'des pâtes à tartiner moins sucrées ou faites maison',
      snacks: 'des fruits secs, oléagineux ou fruits frais',
      drinks: 'de l\'eau, tisanes ou jus sans sucre ajouté',
      meals: 'des repas faits maison avec ingrédients simples',
      desserts: 'des desserts moins sucrés ou avec sucres naturels'
    },
    cosmetic: {
      generic: 'des cosmétiques avec listes d\'ingrédients plus courtes'
    },
    detergent: {
      generic: 'des produits d\'entretien écologiques ou faits maison'
    }
  },
  
  // ========================================
  // 3. ACTION ITEMS (Carte 3)
  // ========================================
  
  actionLabels: {
    alternatives: {
      withCount: (count, criterium) => 
        `Comparer ${count} alternative${count > 1 ? 's' : ''} moins ${criterium}`,
      
      generic: (count) => 
        `Voir ${count} alternative${count > 1 ? 's' : ''} plus saines`,
      
      noAlternatives: 'Aucune alternative similaire disponible'
    },
    
    recipes: {
      withDuration: (subcategory, duration) => 
        `Faire ta propre ${subcategory} (${duration})`,
      
      generic: (duration) => 
        `Voir une recette de substitution (${duration})`,
      
      simple: 'Voir une recette plus simple'
    },
    
    shoppingList: {
      add: 'Ajouter à ta liste de courses',
      addIngredients: 'Ajouter les ingrédients à ta liste'
    },
    
    favorites: {
      add: 'Ajouter aux favoris',
      remove: 'Retirer des favoris'
    },
    
    learn: {
      habit: 'En savoir plus sur cette habitude',
      product: 'Voir les détails du produit'
    }
  },
  
  // Critères alternatives (pour labels contextuels)
  alternativeCriteria: {
    sugar: 'sucrées',
    fat: 'grasses',
    salt: 'salées',
    additives: 'riches en additifs',
    processing: 'transformées',
    overall: 'saines'
  },
  
  // Durées recettes estimées
  recipeDurations: {
    veryQuick: '5 min',
    quick: '10 min',
    moderate: '15 min',
    medium: '20 min',
    long: '30 min'
  },
  
  // ========================================
  // 4. HELPERS
  // ========================================
  
  // Déterminer contexte santé selon score
  getHealthContext: (score) => {
    if (score >= 75) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'moderate';
    return 'low';
  },
  
  // Déterminer critère principal alternative selon produit
  getMainAlternativeCriterium: (product) => {
    const { scores, nutrition } = product;
    
    // Priorité au problème le plus marqué
    if (nutrition?.sugars > 15) return 'sugar';
    if (scores?.additives < 40) return 'additives';
    if (scores?.processing < 40) return 'processing';
    if (nutrition?.salt > 2) return 'salt';
    if (nutrition?.fat > 20) return 'fat';
    
    return 'overall';
  },
  
  // Déterminer durée recette selon complexité
  getRecipeDuration: (product) => {
    const { scores } = product;
    const novaScore = scores?.processing || 50;
    
    // Plus le produit est transformé, plus la recette alternative peut être rapide
    if (novaScore < 30) return 'veryQuick'; // Ultra-transformé → recette très rapide
    if (novaScore < 50) return 'quick';
    if (novaScore < 70) return 'moderate';
    return 'medium';
  },
  
  // Extraire suggestion alternative selon sous-catégorie
  getAlternativeSuggestion: (product) => {
    const { categoryType, subcategory } = product;
    
    if (categoryType === 'food') {
      const subcat = subcategory?.toLowerCase() || '';
      
      if (subcat.includes('pâte à tartiner') || subcat.includes('confiture')) {
        return module.exports.alternativeSuggestions.food.spreads;
      }
      if (subcat.includes('biscuit') || subcat.includes('gâteau') || subcat.includes('snack')) {
        return module.exports.alternativeSuggestions.food.snacks;
      }
      if (subcat.includes('boisson') || subcat.includes('soda')) {
        return module.exports.alternativeSuggestions.food.drinks;
      }
      if (subcat.includes('plat') || subcat.includes('repas')) {
        return module.exports.alternativeSuggestions.food.meals;
      }
      if (subcat.includes('dessert')) {
        return module.exports.alternativeSuggestions.food.desserts;
      }
      
      return 'des alternatives moins transformées';
    }
    
    if (categoryType === 'cosmetic') {
      return module.exports.alternativeSuggestions.cosmetic.generic;
    }
    
    if (categoryType === 'detergent') {
      return module.exports.alternativeSuggestions.detergent.generic;
    }
    
    return 'des alternatives plus simples';
  },
  
  // Labels catégories
  categoryLabels: {
    food: 'alimentaire',
    cosmetic: 'cosmétique',
    detergent: 'd\'entretien',
    supplement: 'complément alimentaire',
    default: 'de consommation'
  }
};
