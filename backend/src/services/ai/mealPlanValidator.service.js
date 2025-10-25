/**
 * MEAL PLAN VALIDATOR SERVICE
 * Validation qualite des plans repas generes par IA
 * Criteres: Budget, Allergenes, Macros, Variete, Quantites
 * Version: 1.0.0
 */

class MealPlanValidator {
  constructor() {
    this.rules = {
      budgetMax: 150,
      budgetMin: 20,
      caloriesMax: 3500,
      caloriesMin: 1200,
      proteinMaxRatio: 0.35,
      carbsMinRatio: 0.40,
      fatsMaxRatio: 0.40,
      maxRepeatIngredient: 2
    };
  }

  validate(plan, userPreferences = {}) {
    const errors = [];
    const warnings = [];

    const budgetCheck = this.validateBudget(plan.estimatedBudget);
    if (!budgetCheck.isValid) errors.push(...budgetCheck.errors);
    warnings.push(...budgetCheck.warnings);

    const allergenCheck = this.validateAllergens(plan.meals, userPreferences.allergens || []);
    if (!allergenCheck.isValid) errors.push(...allergenCheck.errors);

    const macrosCheck = this.validateMacros(plan.nutrition);
    if (!macrosCheck.isValid) errors.push(...macrosCheck.errors);
    warnings.push(...macrosCheck.warnings);

    const varietyCheck = this.validateVariety(plan.meals);
    if (!varietyCheck.isValid) errors.push(...varietyCheck.errors);
    warnings.push(...varietyCheck.warnings);

    const quantityCheck = this.validateQuantities(plan.shoppingList);
    warnings.push(...quantityCheck.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateQualityScore(errors, warnings)
    };
  }

  validateBudget(budget) {
    const errors = [];
    const warnings = [];

    if (!budget || typeof budget !== 'number') {
      errors.push('Budget manquant ou invalide');
      return { isValid: false, errors, warnings };
    }

    if (budget > this.rules.budgetMax) {
      errors.push(`Budget irrealiste: ${budget} EUR (max ${this.rules.budgetMax} EUR/semaine)`);
    }

    if (budget < this.rules.budgetMin) {
      warnings.push(`Budget tres bas: ${budget} EUR - Verifier faisabilite`);
    }

    if (budget > 100) {
      warnings.push(`Budget eleve: ${budget} EUR - Optimisation possible`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  validateAllergens(meals, userAllergens) {
    const errors = [];

    if (!userAllergens || userAllergens.length === 0) {
      return { isValid: true, errors };
    }

    const normalizedUserAllergens = userAllergens.map(a => a.toLowerCase().trim());

    meals.forEach((meal, index) => {
      const mealIngredients = (meal.ingredients || []).map(i => i.toLowerCase());
      const detected = normalizedUserAllergens.filter(allergen => 
        mealIngredients.some(ingredient => ingredient.includes(allergen))
      );

      if (detected.length > 0) {
        errors.push(
          `Jour ${index + 1} (${meal.name}): Allergene detecte - ${detected.join(', ')}`
        );
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  validateMacros(nutrition) {
    const errors = [];
    const warnings = [];

    if (!nutrition || !nutrition.avgPerDay) {
      errors.push('Donnees nutritionnelles manquantes');
      return { isValid: false, errors, warnings };
    }

    const { calories, protein, carbs, fats } = nutrition.avgPerDay;

    if (calories > this.rules.caloriesMax) {
      errors.push(`Calories trop elevees: ${calories}kcal/jour (max ${this.rules.caloriesMax})`);
    }
    if (calories < this.rules.caloriesMin) {
      errors.push(`Calories trop basses: ${calories}kcal/jour (min ${this.rules.caloriesMin})`);
    }

    const proteinCal = protein * 4;
    const carbsCal = carbs * 4;
    const fatsCal = fats * 9;
    const totalCal = proteinCal + carbsCal + fatsCal;

    const proteinRatio = proteinCal / totalCal;
    const carbsRatio = carbsCal / totalCal;
    const fatsRatio = fatsCal / totalCal;

    if (proteinRatio > this.rules.proteinMaxRatio) {
      warnings.push(
        `Proteines elevees: ${(proteinRatio * 100).toFixed(0)}% (recommande <35%)`
      );
    }

    if (carbsRatio < this.rules.carbsMinRatio) {
      warnings.push(
        `Glucides faibles: ${(carbsRatio * 100).toFixed(0)}% (recommande >40%)`
      );
    }

    if (fatsRatio > this.rules.fatsMaxRatio) {
      warnings.push(
        `Lipides eleves: ${(fatsRatio * 100).toFixed(0)}% (recommande <40%)`
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  validateVariety(meals) {
    const errors = [];
    const warnings = [];

    if (!meals || meals.length < 7) {
      errors.push('Plan incomplet: moins de 7 jours');
      return { isValid: false, errors, warnings };
    }

    const mainIngredients = {};
    meals.forEach(meal => {
      if (meal.ingredients && meal.ingredients.length > 0) {
        const main = meal.ingredients[0].toLowerCase().trim();
        mainIngredients[main] = (mainIngredients[main] || 0) + 1;
      }
    });

    Object.entries(mainIngredients).forEach(([ingredient, count]) => {
      if (count > this.rules.maxRepeatIngredient) {
        warnings.push(
          `Ingredient repete: "${ingredient}" apparait ${count}x (max ${this.rules.maxRepeatIngredient}x recommande)`
        );
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  validateQuantities(shoppingList) {
    const warnings = [];

    if (!shoppingList || shoppingList.length === 0) {
      warnings.push('Liste de courses vide');
      return { warnings };
    }

    const absurdThresholds = {
      'kg': 10,
      'l': 5,
      'unite': 50
    };

    shoppingList.forEach(item => {
      const quantity = parseFloat(item.quantity);
      const unit = item.unit?.toLowerCase();

      if (unit === 'kg' && quantity > absurdThresholds.kg) {
        warnings.push(`Quantite suspecte: ${item.name} - ${quantity}kg`);
      }
      if (unit === 'l' && quantity > absurdThresholds.l) {
        warnings.push(`Quantite suspecte: ${item.name} - ${quantity}L`);
      }
      if (unit === 'unite' && quantity > absurdThresholds.unite) {
        warnings.push(`Quantite suspecte: ${item.name} - ${quantity} unites`);
      }
    });

    return { warnings };
  }

  calculateQualityScore(errors, warnings) {
    let score = 100;
    score -= errors.length * 20;
    score -= warnings.length * 5;
    return Math.max(0, score);
  }
}

module.exports = new MealPlanValidator();