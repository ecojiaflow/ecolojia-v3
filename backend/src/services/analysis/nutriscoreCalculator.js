// backend/src/services/analysis/nutriscoreCalculator.js
// Calculateur Nutri-Score selon l'algorithme officiel Santé Publique France

class NutriScoreCalculator {
  constructor() {
    // Seuils pour les points négatifs (par 100g)
    this.negativeThresholds = {
      energy: [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350], // kJ
      sugars: [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45], // g
      saturatedFat: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // g
      sodium: [90, 180, 270, 360, 450, 540, 630, 720, 810, 900] // mg
    };

    // Seuils pour les points positifs (par 100g)
    this.positiveThresholds = {
      fiber: [0.9, 1.9, 2.8, 3.7, 4.7], // g
      proteins: [1.6, 3.2, 4.8, 6.4, 8.0], // g
      fruitsVegetables: [40, 60, 80, 80, 80] // % (répété pour 3-5 points)
    };

    // Seuils spécifiques pour les boissons
    this.beverageThresholds = {
      energy: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270], // kJ
      sugars: [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12, 13.5], // g
      fruitsVegetables: [40, 40, 60, 60, 80, 80, 80, 80, 80, 80] // %
    };

    // Catégories spéciales
    this.specialCategories = {
      water: ['eaux', 'water', 'eau'],
      cheese: ['fromage', 'cheese'],
      addedFats: ['huile', 'beurre', 'oil', 'butter', 'margarine'],
      beverages: ['boisson', 'beverage', 'drink', 'soda', 'jus', 'juice']
    };
  }

  /**
   * Calcule le Nutri-Score d'un produit
   * @param {Object} product - Produit avec nutriments et catégorie
   * @returns {Object} Résultat détaillé du Nutri-Score
   */
  calculate(product) {
    try {
      // Vérifier si c'est une boisson
      const isBeverage = this.isBeverage(product);
      
      // Vérifier les catégories spéciales
      if (this.isWater(product)) {
        return this.createResult('A', 0, 0, 0, 'Eau - Nutri-Score A automatique');
      }

      // Extraire les nutriments
      const nutrients = this.extractNutrients(product);
      
      if (!this.hasRequiredNutrients(nutrients)) {
        return {
          grade: null,
          score: null,
          details: null,
          error: 'Données nutritionnelles insuffisantes'
        };
      }

      // Calculer les points
      const negativePoints = this.calculateNegativePoints(nutrients, isBeverage);
      const positivePoints = this.calculatePositivePoints(nutrients, isBeverage, product);
      
      // Calculer le score final
      const finalScore = this.calculateFinalScore(
        negativePoints.total,
        positivePoints.total,
        negativePoints.details,
        this.isSpecialCategory(product)
      );

      // Déterminer la lettre
      const grade = this.getGrade(finalScore, isBeverage);

      return this.createResult(
        grade,
        finalScore,
        negativePoints,
        positivePoints,
        isBeverage ? 'Boisson' : 'Aliment solide'
      );

    } catch (error) {
      console.error('Erreur calcul Nutri-Score:', error);
      return {
        grade: null,
        score: null,
        error: error.message
      };
    }
  }

  /**
   * Extrait et normalise les nutriments
   */
  extractNutrients(product) {
    const nutriments = product.nutriments || product.nutritionFacts || {};
    
    return {
      // Énergie en kJ (conversion si en kcal)
      energy: nutriments.energy || 
              nutriments['energy-kj'] || 
              nutriments['energy-kj_100g'] ||
              (nutriments['energy-kcal_100g'] ? nutriments['energy-kcal_100g'] * 4.184 : 0),
      
      // Nutriments en g/100g
      sugars: nutriments.sugars || 
              nutriments.sugars_100g || 
              nutriments['sugars_100g'] || 0,
              
      saturatedFat: nutriments['saturated-fat'] || 
                    nutriments['saturated-fat_100g'] || 
                    nutriments.saturated_fat_100g || 0,
                    
      sodium: nutriments.sodium || 
              nutriments.sodium_100g || 
              nutriments['sodium_100g'] || 
              (nutriments.salt_100g ? nutriments.salt_100g * 400 : 0), // Conversion sel → sodium
              
      fiber: nutriments.fiber || 
             nutriments.fiber_100g || 
             nutriments['fiber_100g'] || 0,
             
      proteins: nutriments.proteins || 
                nutriments.proteins_100g || 
                nutriments['proteins_100g'] || 0,
                
      // Fruits et légumes (en %)
      fruitsVegetables: this.extractFruitsVegetablesPercentage(product)
    };
  }

  /**
   * Calcule les points négatifs (0-40)
   */
  calculateNegativePoints(nutrients, isBeverage) {
    const thresholds = isBeverage ? this.beverageThresholds : this.negativeThresholds;
    
    const details = {
      energy: this.getPoints(nutrients.energy, thresholds.energy || this.negativeThresholds.energy),
      sugars: this.getPoints(nutrients.sugars, thresholds.sugars || this.negativeThresholds.sugars),
      saturatedFat: this.getPoints(nutrients.saturatedFat, this.negativeThresholds.saturatedFat),
      sodium: this.getPoints(nutrients.sodium, this.negativeThresholds.sodium)
    };

    const total = Object.values(details).reduce((sum, points) => sum + points, 0);

    return { total, details };
  }

  /**
   * Calcule les points positifs (0-17)
   */
  calculatePositivePoints(nutrients, isBeverage, product) {
    const details = {
      fiber: isBeverage ? 0 : this.getPoints(nutrients.fiber, this.positiveThresholds.fiber),
      proteins: isBeverage ? 0 : this.getPoints(nutrients.proteins, this.positiveThresholds.proteins),
      fruitsVegetables: this.getPoints(
        nutrients.fruitsVegetables,
        isBeverage ? this.beverageThresholds.fruitsVegetables : this.positiveThresholds.fruitsVegetables
      )
    };

    const total = Object.values(details).reduce((sum, points) => sum + points, 0);

    return { total, details };
  }

  /**
   * Calcule le score final selon les règles du Nutri-Score
   */
  calculateFinalScore(negativeTotal, positiveTotal, negativeDetails, isSpecial) {
    // Règle spéciale : si points négatifs < 11, on soustrait tous les points positifs
    if (negativeTotal < 11) {
      return negativeTotal - positiveTotal;
    }

    // Règle spéciale pour fromages et matières grasses ajoutées
    if (isSpecial) {
      return negativeTotal - positiveTotal;
    }

    // Règle standard : si points négatifs ≥ 11
    // On soustrait uniquement les points fruits/légumes + fibres (pas les protéines)
    const partialPositive = positiveTotal - (negativeDetails.proteins || 0);
    return negativeTotal - partialPositive;
  }

  /**
   * Détermine la lettre du Nutri-Score
   */
  getGrade(score, isBeverage) {
    if (isBeverage) {
      // Seuils spécifiques pour les boissons
      if (score <= 1) return 'B'; // Pas de A pour les boissons (sauf eau)
      if (score <= 5) return 'C';
      if (score <= 9) return 'D';
      return 'E';
    } else {
      // Seuils pour les aliments solides
      if (score <= -1) return 'A';
      if (score <= 2) return 'B';
      if (score <= 10) return 'C';
      if (score <= 18) return 'D';
      return 'E';
    }
  }

  /**
   * Obtient le nombre de points pour une valeur selon les seuils
   */
  getPoints(value, thresholds) {
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i]) {
        return i + 1;
      }
    }
    return 0;
  }

  /**
   * Détermine si le produit est une boisson
   */
  isBeverage(product) {
    const category = (product.category || '').toLowerCase();
    const name = (product.name || '').toLowerCase();
    const categories = product.categories || [];
    
    // Vérifier dans les catégories
    if (categories.some(cat => this.specialCategories.beverages.some(bev => cat.includes(bev)))) {
      return true;
    }
    
    // Vérifier dans le nom
    return this.specialCategories.beverages.some(bev => name.includes(bev));
  }

  /**
   * Détermine si c'est de l'eau
   */
  isWater(product) {
    const name = (product.name || '').toLowerCase();
    const categories = product.categories || [];
    
    return this.specialCategories.water.some(water => 
      name.includes(water) || categories.some(cat => cat.includes(water))
    );
  }

  /**
   * Détermine si c'est une catégorie spéciale (fromage, matière grasse)
   */
  isSpecialCategory(product) {
    const categories = product.categories || [];
    const name = (product.name || '').toLowerCase();
    
    // Vérifier fromages
    if (this.specialCategories.cheese.some(cheese => 
      name.includes(cheese) || categories.some(cat => cat.includes(cheese))
    )) {
      return true;
    }
    
    // Vérifier matières grasses ajoutées
    return this.specialCategories.addedFats.some(fat => 
      name.includes(fat) || categories.some(cat => cat.includes(fat))
    );
  }

  /**
   * Extrait le pourcentage de fruits et légumes
   */
  extractFruitsVegetablesPercentage(product) {
    // Vérifier les champs spécifiques
    if (product.nutriments?.['fruits-vegetables-nuts_100g']) {
      return product.nutriments['fruits-vegetables-nuts_100g'];
    }
    
    // Estimation basée sur les ingrédients
    if (product.ingredients) {
      return this.estimateFruitsVegetablesFromIngredients(product.ingredients);
    }
    
    // Valeur par défaut selon la catégorie
    const categories = product.categories || [];
    if (categories.some(cat => cat.includes('fruit') || cat.includes('vegetable'))) {
      return 50; // Estimation conservative
    }
    
    return 0;
  }

  /**
   * Estime le pourcentage de fruits/légumes depuis les ingrédients
   */
  estimateFruitsVegetablesFromIngredients(ingredients) {
    if (!ingredients || !Array.isArray(ingredients)) return 0;
    
    const fruitVegKeywords = [
      'fruit', 'légume', 'vegetable', 'tomate', 'carotte', 'pomme',
      'orange', 'banane', 'fraise', 'cerise', 'poire', 'raisin'
    ];
    
    let totalPercentage = 0;
    
    ingredients.forEach(ing => {
      const text = (ing.text || ing.name || '').toLowerCase();
      if (fruitVegKeywords.some(keyword => text.includes(keyword))) {
        totalPercentage += ing.percent || 10; // Estimation si pas de pourcentage
      }
    });
    
    return Math.min(totalPercentage, 100);
  }

  /**
   * Vérifie si les nutriments requis sont présents
   */
  hasRequiredNutrients(nutrients) {
    return nutrients.energy !== undefined &&
           nutrients.sugars !== undefined &&
           nutrients.saturatedFat !== undefined &&
           nutrients.sodium !== undefined;
  }

  /**
   * Crée le résultat formaté
   */
  createResult(grade, score, negativePoints, positivePoints, category) {
    return {
      grade,
      score,
      category,
      details: {
        negative: negativePoints,
        positive: positivePoints,
        interpretation: this.getInterpretation(grade)
      },
      confidence: this.calculateConfidence(negativePoints, positivePoints),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fournit une interprétation du score
   */
  getInterpretation(grade) {
    const interpretations = {
      'A': 'Excellente qualité nutritionnelle',
      'B': 'Bonne qualité nutritionnelle',
      'C': 'Qualité nutritionnelle moyenne',
      'D': 'Qualité nutritionnelle faible',
      'E': 'Qualité nutritionnelle très faible'
    };
    
    return interpretations[grade] || 'Score non disponible';
  }

  /**
   * Calcule la confiance du résultat
   */
  calculateConfidence(negativePoints, positivePoints) {
    // Plus on a de données, plus la confiance est élevée
    const dataPoints = Object.values({
      ...negativePoints.details,
      ...positivePoints.details
    }).filter(v => v > 0).length;
    
    return Math.min(0.5 + (dataPoints * 0.1), 1.0);
  }

  /**
   * Méthode pour comparer avec un score Open Food Facts
   */
  compareWithOpenFoodFacts(calculatedGrade, offGrade) {
    if (!offGrade) return null;
    
    const grades = ['A', 'B', 'C', 'D', 'E'];
    const calculated = grades.indexOf(calculatedGrade);
    const off = grades.indexOf(offGrade.toUpperCase());
    
    if (calculated === off) {
      return { match: true, message: 'Score identique à Open Food Facts' };
    } else {
      return {
        match: false,
        message: `Différence détectée: ${calculatedGrade} (calculé) vs ${offGrade.toUpperCase()} (OFF)`,
        difference: Math.abs(calculated - off)
      };
    }
  }
}

module.exports = new NutriScoreCalculator();