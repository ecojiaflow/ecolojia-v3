// backend/src/data/categoryDetection.js
// Logique de detection automatique de categorie de produit

class CategoryDetection {
  constructor() {
    this.detectionRules = this.initializeDetectionRules();
  }

  initializeDetectionRules() {
    return {
      cosmetics: {
        weight: 1.0,
        keywords: {
          primary: ['inci', 'aqua', 'parfum', 'creme', 'shampooing', 'gel douche', 'deodorant'],
          secondary: ['sodium lauryl sulfate', 'glycerin', 'paraben', 'silicone', 'huile essentielle']
        },
        ingredients: {
          specific: ['aqua', 'parfum', 'limonene', 'linalool', 'citronellol', 'geraniol'],
          chemical: ['sodium lauryl sulfate', 'sodium laureth sulfate', 'cocamidopropyl betaine']
        },
        packaging: ['tube', 'flacon', 'pot', 'spray', 'pompe'],
        categories: ['beaute', 'hygiene', 'cosmetique', 'soin', 'maquillage'],
        brands: ['loreal', 'nivea', 'garnier', 'dove', 'palmolive'] // marques connues cosmetiques
      },

      detergents: {
        weight: 1.0,
        keywords: {
          primary: ['lessive', 'nettoyant', 'detergent', 'liquide vaisselle', 'lave-linge'],
          secondary: ['tensioactif', 'phosphate', 'enzymes', 'biodegradable', 'anti-calcaire']
        },
        ingredients: {
          specific: ['tensioactifs', 'phosphonates', 'zeolites', 'enzymes', 'agent de blanchiment'],
          chemical: ['sodium carbonate', 'sodium percarbonate', 'sodium citrate']
        },
        usage: ['laver', 'nettoyer', 'degraisser', 'detacher', 'desinfecter', 'recurer'],
        categories: ['entretien', 'menage', 'nettoyage', 'hygiene maison'],
        brands: ['ariel', 'persil', 'skip', 'paic', 'mir'] // marques connues detergents
      },

      food: {
        weight: 0.9, // Legerement moins prioritaire car categorie par defaut
        keywords: {
          primary: ['nutri-score', 'kcal', 'calories', 'proteines', 'glucides', 'lipides'],
          secondary: ['bio', 'sans gluten', 'vegan', 'additif', 'conservateur', 'colorant']
        },
        ingredients: {
          specific: ['eau', 'sucre', 'sel', 'farine', 'huile'],
          additives: ['e100', 'e200', 'e300', 'conservateur', 'colorant', 'edulcorant']
        },
        nutritional: ['calories', 'fibres', 'sodium', 'sucres', 'gras', 'vitamines'],
        categories: ['alimentaire', 'boisson', 'snack', 'petit-dejeuner', 'epicerie'],
        nova_indicators: ['ultra-transforme', 'additifs', 'ingredients industriels']
      }
    };
  }

  // === Dâ€°TECTION PRINCIPALE ===
  async detectCategory(productData) {
    try {
      console.log('Ã°Å¸â€Â Detection categorie pour:', productData?.title || 'Produit sans nom');

      // Calcul des scores pour chaque categorie
      const scores = await this.calculateCategoryScores(productData);
      
      // Tri par score decroissant
      scores.sort((a, b) => b.score - a.score);

      const bestMatch = scores[0];
      const confidence = bestMatch.score;

      // Seuil minimum de confiance
      if (confidence < 0.15) {
        console.log('Ã¢Å¡Â Ã¯Â¸Â Confiance tres faible, fallback vers food');
        return {
          category: 'food',
          confidence: 0.4,
          method: 'fallback_low_confidence',
          alternatives: scores.slice(0, 2)
        };
      }

      console.log(`Ã¢Å“â€¦ Categorie detectee: ${bestMatch.category} (confiance: ${Math.round(confidence * 100)}%)`);

      return {
        category: bestMatch.category,
        confidence: Math.min(confidence, 1.0),
        method: 'ai_detection',
        alternatives: scores.slice(1, 3),
        detection_details: bestMatch.details
      };

    } catch (error) {
      console.error('Erreur detection categorie:', error);
      return {
        category: 'food',
        confidence: 0.3,
        method: 'error_fallback',
        error: error.message
      };
    }
  }

  // === CALCUL SCORES PAR CATâ€°GORIE ===
  async calculateCategoryScores(productData) {
    const scores = [];
    const productText = this.prepareProductText(productData);

    for (const [category, rules] of Object.entries(this.detectionRules)) {
      const score = await this.calculateSingleCategoryScore(productText, productData, rules);
      
      scores.push({
        category,
        score: score.total * rules.weight,
        details: score.breakdown
      });
    }

    return scores;
  }

  // === CALCUL SCORE POUR UNE CATâ€°GORIE ===
  async calculateSingleCategoryScore(productText, productData, rules) {
    const breakdown = {
      keywords_primary: 0,
      keywords_secondary: 0,
      ingredients: 0,
      packaging: 0,
      categories: 0,
      brands: 0,
      special_indicators: 0
    };

    // 1. Score mots-cles primaires (30% du poids)
    if (rules.keywords?.primary) {
      const matches = rules.keywords.primary.filter(kw => 
        productText.includes(kw.toLowerCase())
      );
      breakdown.keywords_primary = (matches.length / rules.keywords.primary.length) * 0.30;
    }

    // 2. Score mots-cles secondaires (20% du poids)
    if (rules.keywords?.secondary) {
      const matches = rules.keywords.secondary.filter(kw => 
        productText.includes(kw.toLowerCase())
      );
      breakdown.keywords_secondary = (matches.length / rules.keywords.secondary.length) * 0.20;
    }

    // 3. Score ingredients specifiques (25% du poids)
    if (rules.ingredients) {
      let ingredientMatches = 0;
      let totalIngredients = 0;

      // Ingredients specifiques
      if (rules.ingredients.specific) {
        totalIngredients += rules.ingredients.specific.length;
        ingredientMatches += rules.ingredients.specific.filter(ing => 
          productText.includes(ing.toLowerCase())
        ).length;
      }

      // Ingredients chimiques/additifs
      if (rules.ingredients.chemical) {
        totalIngredients += rules.ingredients.chemical.length;
        ingredientMatches += rules.ingredients.chemical.filter(ing => 
          productText.includes(ing.toLowerCase())
        ).length;
      }

      // Additifs (pour food)
      if (rules.ingredients.additives) {
        totalIngredients += rules.ingredients.additives.length;
        ingredientMatches += rules.ingredients.additives.filter(ing => 
          productText.includes(ing.toLowerCase())
        ).length;
      }

      if (totalIngredients > 0) {
        breakdown.ingredients = (ingredientMatches / totalIngredients) * 0.25;
      }
    }

    // 4. Score emballage/usage (10% du poids)
    if (rules.packaging) {
      const matches = rules.packaging.filter(pkg => 
        productText.includes(pkg.toLowerCase())
      );
      breakdown.packaging = (matches.length / rules.packaging.length) * 0.10;
    }

    if (rules.usage) {
      const matches = rules.usage.filter(use => 
        productText.includes(use.toLowerCase())
      );
      breakdown.packaging += (matches.length / rules.usage.length) * 0.10;
    }

    // 5. Score categories (10% du poids)
    if (rules.categories) {
      const matches = rules.categories.filter(cat => 
        productText.includes(cat.toLowerCase())
      );
      breakdown.categories = (matches.length / rules.categories.length) * 0.10;
    }

    // 6. Score marques connues (5% du poids)
    if (rules.brands && productData.brand) {
      const brandText = productData.brand.toLowerCase();
      const matches = rules.brands.filter(brand => 
        brandText.includes(brand.toLowerCase())
      );
      breakdown.brands = (matches.length / rules.brands.length) * 0.05;
    }

    // Calcul total
    const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0);

    return {
      total: Math.min(total, 1.0),
      breakdown
    };
  }

  // === PRâ€°PARATION TEXTE PRODUIT ===
  prepareProductText(productData) {
    const textFields = [
      productData.title || '',
      productData.description || '',
      productData.brand || '',
      productData.category || '',
      Array.isArray(productData.ingredients) ? productData.ingredients.join(' ') : '',
      Array.isArray(productData.tags) ? productData.tags.join(' ') : '',
      productData.composition || '',
      productData.usage || ''
    ];

    return textFields.join(' ').toLowerCase();
  }

  // === Dâ€°TECTION SPâ€°CIALISâ€°E PAR TYPE ===
  async detectCosmetics(productData) {
    const text = this.prepareProductText(productData);
    
    // Indicateurs forts cosmetiques
    const strongIndicators = [
      'inci', 'aqua', 'parfum', 'sodium lauryl sulfate',
      'creme', 'shampooing', 'gel douche', 'deodorant'
    ];

    const matches = strongIndicators.filter(indicator => text.includes(indicator));
    
    return {
      isCosmetics: matches.length >= 2,
      confidence: matches.length / strongIndicators.length,
      matched_indicators: matches
    };
  }

  async detectDetergents(productData) {
    const text = this.prepareProductText(productData);
    
    // Indicateurs forts detergents
    const strongIndicators = [
      'lessive', 'nettoyant', 'detergent', 'tensioactif',
      'vaisselle', 'menage', 'enzymes', 'anti-calcaire'
    ];

    const matches = strongIndicators.filter(indicator => text.includes(indicator));
    
    return {
      isDetergents: matches.length >= 2,
      confidence: matches.length / strongIndicators.length,
      matched_indicators: matches
    };
  }

  async detectFood(productData) {
    const text = this.prepareProductText(productData);
    
    // Indicateurs forts alimentaires
    const strongIndicators = [
      'nutri-score', 'kcal', 'calories', 'proteines',
      'glucides', 'additif', 'conservateur', 'bio'
    ];

    const matches = strongIndicators.filter(indicator => text.includes(indicator));
    
    return {
      isFood: matches.length >= 1, // Seuil plus bas car categorie par defaut
      confidence: matches.length / strongIndicators.length,
      matched_indicators: matches
    };
  }

  // === VALIDATION ET OVERRIDE ===
  async validateDetection(category, productData) {
    // Validation croisee pour eviter les erreurs grossieres
    const validations = {
      cosmetics: await this.detectCosmetics(productData),
      detergents: await this.detectDetergents(productData),
      food: await this.detectFood(productData)
    };

    const detectedCategory = validations[category];
    if (!detectedCategory || detectedCategory.confidence < 0.3) {
      console.warn(`Ã¢Å¡Â Ã¯Â¸Â Validation echouee pour ${category}, confidence: ${detectedCategory?.confidence || 0}`);
      return false;
    }

    return true;
  }

  // === Mâ€°THODES UTILITAIRES ===
  getDetectionStats() {
    return {
      available_categories: Object.keys(this.detectionRules),
      total_keywords: Object.values(this.detectionRules).reduce((total, rules) => {
        return total + (rules.keywords?.primary?.length || 0) + (rules.keywords?.secondary?.length || 0);
      }, 0),
      total_brands: Object.values(this.detectionRules).reduce((total, rules) => {
        return total + (rules.brands?.length || 0);
      }, 0)
    };
  }
}

// Export singleton
module.exports = new CategoryDetection();
