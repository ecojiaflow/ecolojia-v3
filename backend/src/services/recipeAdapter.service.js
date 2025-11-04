const Recipe = require('../models/Recipe');
const Product = require('../models/Product');

/**
 * RECIPE ADAPTER SERVICE - ECOLOJIA V3.1
 * 
 * ✅ APPROCHE SÉCURISÉE :
 * - Stock de recettes scientifiques pré-validées
 * - IA adapte UNIQUEMENT (portions, substitutions)
 * - JAMAIS de génération from scratch
 * 
 * Philosophie Ecolojia :
 * - Recettes éprouvées et testées
 * - Nutrition calculée scientifiquement
 * - Toujours healthy (score >75/100)
 * - Ingrédients naturels et sains
 */

class RecipeAdapterService {
  
  /**
   * Recommander recettes du stock selon profil utilisateur
   */
  async recommendRecipes(userProfile, options = {}) {
    const {
      category = null, // breakfast, lunch, dinner, snack
      count = 5
    } = options;
    
    const {
      dietary = 'omnivore',
      targetCaloriesPerMeal = 500,
      allergens = [],
      goals = ['health']
    } = userProfile;
    
    console.log('[RecipeAdapter] Recommandation:', { dietary, targetCaloriesPerMeal, category });
    
    // Construire query
    const query = {
      isStock: true, // Uniquement recettes stock (pré-validées)
      isPublic: true,
      'scores.overallScore': { $gte: 75 } // Minimum 75/100 (healthy)
    };
    
    if (category) {
      query.category = category;
    }
    
    // Filtrer par régime
    if (dietary !== 'omnivore') {
      query['targetProfiles.dietary'] = dietary;
    }
    
    // Filtrer allergènes
    if (allergens.length > 0) {
      query['targetProfiles.allergens'] = { $nin: allergens };
    }
    
    // Récupérer recettes
    const recipes = await Recipe.find(query)
      .sort({ 'scores.overallScore': -1 }) // Meilleures en premier
      .limit(count);
    
    // Adapter portions selon calories cibles
    const adaptedRecipes = recipes.map(recipe => 
      this._adaptPortions(recipe, targetCaloriesPerMeal)
    );
    
    console.log(`[RecipeAdapter] ✅ ${adaptedRecipes.length} recettes recommandées`);
    
    return adaptedRecipes;
  }
  
  /**
   * Générer plan repas hebdomadaire depuis stock
   */
  async generateWeeklyMealPlan(userProfile) {
    const {
      dietary = 'omnivore',
      targetCaloriesPerDay = 2000,
      allergens = [],
      goals = ['health']
    } = userProfile;
    
    console.log('[RecipeAdapter] Génération plan hebdomadaire depuis STOCK');
    
    const mealPlan = [];
    
    // Répartition calories par repas
    const caloriesBreakfast = Math.round(targetCaloriesPerDay * 0.25); // 25%
    const caloriesLunch = Math.round(targetCaloriesPerDay * 0.40); // 40%
    const caloriesDinner = Math.round(targetCaloriesPerDay * 0.35); // 35%
    
    // Pour chaque jour de la semaine
    for (let day = 0; day < 7; day++) {
      const dayDate = new Date();
      dayDate.setDate(dayDate.getDate() + day);
      
      // Petit-déjeuner
      const breakfasts = await this.recommendRecipes(
        { ...userProfile, targetCaloriesPerMeal: caloriesBreakfast },
        { category: 'breakfast', count: 1 }
      );
      
      if (breakfasts.length > 0) {
        mealPlan.push({
          type: 'recipe',
          recipeId: breakfasts[0]._id,
          recipeName: breakfasts[0].name,
          recipeScore: breakfasts[0].scores.overallScore,
          category: 'breakfast',
          date: dayDate,
          portion: breakfasts[0].adaptedServings || 1,
          nutrition: breakfasts[0].nutrition.perServing
        });
      }
      
      // Déjeuner
      const lunches = await this.recommendRecipes(
        { ...userProfile, targetCaloriesPerMeal: caloriesLunch },
        { category: 'lunch', count: 1 }
      );
      
      if (lunches.length > 0) {
        mealPlan.push({
          type: 'recipe',
          recipeId: lunches[0]._id,
          recipeName: lunches[0].name,
          recipeScore: lunches[0].scores.overallScore,
          category: 'lunch',
          date: dayDate,
          portion: lunches[0].adaptedServings || 1,
          nutrition: lunches[0].nutrition.perServing
        });
      }
      
      // Dîner
      const dinners = await this.recommendRecipes(
        { ...userProfile, targetCaloriesPerMeal: caloriesDinner },
        { category: 'dinner', count: 1 }
      );
      
      if (dinners.length > 0) {
        mealPlan.push({
          type: 'recipe',
          recipeId: dinners[0]._id,
          recipeName: dinners[0].name,
          recipeScore: dinners[0].scores.overallScore,
          category: 'dinner',
          date: dayDate,
          portion: dinners[0].adaptedServings || 1,
          nutrition: dinners[0].nutrition.perServing
        });
      }
    }
    
    console.log(`[RecipeAdapter] ✅ Plan créé: ${mealPlan.length} repas`);
    
    return mealPlan;
  }
  
  /**
   * Adapter portions recette selon calories cibles
   */
  _adaptPortions(recipe, targetCalories) {
    const recipeCalories = recipe.nutrition.perServing.calories;
    
    if (!recipeCalories || recipeCalories === 0) {
      return recipe;
    }
    
    // Calculer ratio portions
    const ratio = targetCalories / recipeCalories;
    
    // Si trop éloigné (>50% différence), garder portion normale
    if (ratio < 0.5 || ratio > 1.5) {
      return recipe;
    }
    
    // Adapter servings
    const adapted = recipe.toObject ? recipe.toObject() : recipe;
    adapted.adaptedServings = ratio;
    
    // Recalculer nutrition
    adapted.nutrition.perServing = {
      calories: Math.round(recipeCalories * ratio),
      protein: Math.round(recipe.nutrition.perServing.protein * ratio),
      carbs: Math.round(recipe.nutrition.perServing.carbs * ratio),
      fat: Math.round(recipe.nutrition.perServing.fat * ratio),
      fiber: Math.round(recipe.nutrition.perServing.fiber * ratio)
    };
    
    return adapted;
  }
  
  /**
   * Substituer ingrédient (ex: vegan, sans gluten)
   */
  async substituteIngredient(recipeId, ingredientName, reason = 'dietary') {
    // TODO: Implémenter substitutions intelligentes
    // Ex: "œuf" → "graines de lin" (vegan)
    // Ex: "farine blé" → "farine amande" (sans gluten)
    
    console.log(`[RecipeAdapter] Substitution: ${ingredientName} (raison: ${reason})`);
    
    // Base de substitutions
    const substitutions = {
      'œuf': { vegan: 'graines de lin moulues (1 càs + 3 càs eau)' },
      'lait': { vegan: 'lait d\'amande', 'lactose-free': 'lait sans lactose' },
      'farine de blé': { 'gluten-free': 'farine d\'amande' },
      'beurre': { vegan: 'huile de coco' }
    };
    
    return substitutions[ingredientName.toLowerCase()]?.[reason] || null;
  }
}

module.exports = new RecipeAdapterService();