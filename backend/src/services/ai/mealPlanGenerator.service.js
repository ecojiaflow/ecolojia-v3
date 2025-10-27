/**
 * MEAL PLAN GENERATOR SERVICE
 * Generation de plans repas hebdomadaires via DeepSeek AI + validation qualite
 * Integration: deepSeekService + mealPlanValidator
 * Version: 1.0.0
 */

const deepSeekService = require('./deepSeekService');
const validator = require('./mealPlanValidator.service');

class MealPlanGenerator {
  constructor() {
    this.maxRetries = 2;
  }

  async generateWeeklyPlan(userPreferences) {
    const {
      budget = 80,
      calories = 2000,
      allergens = [],
      dietType = 'balanced',
      cookingTime = 'medium',
      people = 1
    } = userPreferences;

    let attempt = 0;
    let lastError = null;

    while (attempt < this.maxRetries) {
      try {
        console.log(`[MealPlan] Tentative ${attempt + 1}/${this.maxRetries}`);

        const prompt = this.buildPrompt({
          budget,
          calories,
          allergens,
          dietType,
          cookingTime,
          people
        });

        const response = await deepSeekService.chat(prompt);

        const plan = this.parsePlanFromResponse(response);
        const validationResult = validator.validate(plan, userPreferences);

        if (validationResult.isValid) {
          console.log(`[MealPlan] Plan valide (score: ${validationResult.score}/100)`);
          
          return {
            success: true,
            plan,
            validation: {
              score: validationResult.score,
              warnings: validationResult.warnings
            },
            metadata: {
              generatedAt: new Date(),
              attempt: attempt + 1,
              preferences: userPreferences
            }
          };
        } else {
          lastError = {
            errors: validationResult.errors,
            warnings: validationResult.warnings
          };
          console.warn(`[MealPlan] Validation echouee:`, validationResult.errors);
          attempt++;
        }

      } catch (error) {
        console.error(`[MealPlan] Erreur generation:`, error);
        lastError = error;
        attempt++;
      }
    }

    return {
      success: false,
      error: 'Impossible de generer un plan valide apres plusieurs tentatives',
      details: lastError
    };
  }

  buildPrompt(prefs) {
    const allergensText = prefs.allergens.length > 0 
      ? `ALLERGENES A EVITER ABSOLUMENT: ${prefs.allergens.join(', ')}`
      : 'Aucun allergene specifie';

    const dietConstraints = {
      balanced: 'Regime equilibre avec viandes, poissons, legumes',
      vegetarian: 'Vegetarien (sans viande ni poisson, oeufs et produits laitiers autorises)',
      vegan: 'Vegetalien strict (aucun produit animal)',
      'low-carb': 'Faible en glucides (<100g/jour), riche en proteines et lipides sains'
    };

    const timeConstraints = {
      quick: 'Temps de preparation < 30 minutes',
      medium: 'Temps de preparation 30-60 minutes',
      elaborate: 'Temps de preparation > 60 minutes (recettes elaborees)'
    };

    return `Tu es un nutritionniste expert. Genere un plan repas hebdomadaire (7 jours) personnalise.

CONTRAINTES OBLIGATOIRES:
- Budget total: ${prefs.budget} EUR pour ${prefs.people} personne(s)
- Calories cibles: ${prefs.calories} kcal/jour/personne
- Regime: ${dietConstraints[prefs.dietType]}
- Temps de cuisine: ${timeConstraints[prefs.cookingTime]}
- ${allergensText}

REGLES STRICTES:
1. RESPECTER LE BUDGET (repartition realiste)
2. NE JAMAIS inclure les allergenes listes
3. VARIER les ingredients principaux (max 2x le meme/semaine)
4. Calculer precisement les macros (proteines/glucides/lipides)
5. Liste de courses exhaustive avec quantites

FORMAT DE REPONSE (JSON STRICT):
{
  "weekPlan": {
    "meals": [
      {
        "day": 1,
        "name": "Poulet roti aux legumes",
        "ingredients": ["poulet", "carottes", "courgettes", "huile d'olive"],
        "nutrition": {
          "calories": 650,
          "protein": 45,
          "carbs": 35,
          "fats": 28
        },
        "cookingTime": 45,
        "cost": 8.50
      }
    ],
    "nutrition": {
      "avgPerDay": {
        "calories": 2000,
        "protein": 120,
        "carbs": 200,
        "fats": 70
      }
    },
    "estimatedBudget": 75,
    "shoppingList": [
      {
        "name": "Poulet entier",
        "quantity": 1.5,
        "unit": "kg",
        "category": "Viande",
        "estimatedPrice": 12
      }
    ]
  }
}

GENERE UNIQUEMENT le JSON, sans texte additionnel.`;
  }

  parsePlanFromResponse(response) {
    try {
      let cleaned = response.trim();
      
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
      }

      const parsed = JSON.parse(cleaned);
      return parsed.weekPlan || parsed;
      
    } catch (error) {
      console.error('[MealPlan] Erreur parsing JSON:', error);
      throw new Error('Reponse IA invalide (JSON malformed)');
    }
  }

  async generateShoppingList(planMeals) {
    const grouped = {};
    
    planMeals.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        const category = this.categorizeIngredient(ingredient);
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(ingredient);
      });
    });

    return Object.entries(grouped).map(([category, items]) => ({
      category,
      items: [...new Set(items)]
    }));
  }

  categorizeIngredient(ingredient) {
    const categories = {
      'Fruits & Legumes': ['tomate', 'carotte', 'pomme', 'banane', 'salade', 'courgette'],
      'Viandes & Poissons': ['poulet', 'boeuf', 'porc', 'saumon', 'thon', 'dinde'],
      'Produits laitiers': ['lait', 'yaourt', 'fromage', 'beurre', 'creme'],
      'Feculents': ['pates', 'riz', 'pain', 'pomme de terre', 'quinoa'],
      'Epicerie': ['huile', 'sel', 'poivre', 'farine', 'sucre']
    };

    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => ingredient.toLowerCase().includes(kw))) {
        return cat;
      }
    }
    return 'Autres';
  }
}

module.exports = new MealPlanGenerator();
