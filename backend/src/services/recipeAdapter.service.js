const Recipe = require('../models/Recipe');
const productCategorizationService = require('./productCategorization.service');

/**
 * RECIPE ADAPTER INTELLIGENT - PRODUCTION
 * IA + MongoDB + Scoring + Cache + Profil utilisateur
 */

class RecipeAdapterService {

  constructor() {
    this.recentlyShown = new Map(); // Éviter doublons
  }
  /**
   * MAPPER CATÉGORIES IA → MONGODB
   * Convertit catégories IA françaises → catégories base anglaises
   */
  mapAICategoriesToDB(aiCategories) {
    const mapping = {
      // Petit-déjeuner
      'petits-déjeuners': 'breakfast',
      'petit-déjeuner': 'breakfast',
      'breakfast': 'breakfast',
      
      // Déjeuner
      'déjeuners': 'lunch',
      'déjeuner': 'lunch',
      'lunch': 'lunch',
      
      // Dîner
      'dîners': 'dinner',
      'dîner': 'dinner',
      'dinner': 'dinner',
      
      // Snacks
      'snacks': 'snack',
      'snack': 'snack',
      'goûters': 'snack',
      'snacks sucrés': 'snack',
      'snacks salés': 'snack',
      
      // Desserts
      'desserts': 'dessert',
      'dessert': 'dessert',
      'desserts au chocolat': 'dessert',
      'desserts fruités': 'dessert',
      'pâtisserie': 'dessert'
    };
    
    const dbCategories = [];
    
    for (const aiCat of aiCategories) {
      const normalized = aiCat.toLowerCase().trim();
      
      // Chercher mapping exact
      if (mapping[normalized]) {
        if (!dbCategories.includes(mapping[normalized])) {
          dbCategories.push(mapping[normalized]);
        }
        continue;
      }
      
      // Chercher mapping partiel (contient)
      for (const [key, value] of Object.entries(mapping)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          if (!dbCategories.includes(value)) {
            dbCategories.push(value);
          }
          break;
        }
      }
    }
    
    console.log('[RecipeAdapter] Mapping catégories:', aiCategories, '→', dbCategories);
    
    return dbCategories;
  }

  /**
   * MÉTHODE PRINCIPALE : Recommander recettes intelligentes
   */
  async recommendRecipesForProduct(product, options = {}) {
    const {
      count = 3,
      userProfile = {},
      excludeIds = []
    } = options;

    const userId = userProfile.userId || 'anonymous';

    console.log('[RecipeAdapter] Recommandation intelligente pour:', product.name);

    // ========================================
    // ÉTAPE 1 : IA analyse produit
    // ========================================
    const categorization = await productCategorizationService.categorizeForRecipes(product);
    
    if (categorization.categories.length === 0) {
      console.log('[RecipeAdapter] Produit non alimentaire');
      return [];
    }

    console.log('[RecipeAdapter] Catégories IA:', categorization.categories);
    console.log('[RecipeAdapter] Ingrédient principal:', categorization.mainIngredient);

        // ========================================
        // ÉTAPE 1.5 : MAPPER CATÉGORIES IA → DB
        // ========================================
        const dbCategories = this.mapAICategoriesToDB(categorization.categories);

    // ========================================
    // ÉTAPE 2 : Construire query MongoDB
    // ========================================
    const query = {
      isStock: true,
      isPublic: true,
      'scores.overallScore': { $gte: 75 }
    };

    // Exclure recettes déjà vues
    const recentIds = this._getRecentlyShown(userId);
    if (recentIds.length > 0 || excludeIds.length > 0) {
      query._id = { $nin: [...recentIds, ...excludeIds] };
    }

        // Filtrer par catégories DB
        if (dbCategories.length > 0) {
          query.category = { $in: dbCategories };
        }

    // Filtrer par ingrédient principal IA
    if (categorization.mainIngredient && categorization.mainIngredient !== 'inconnu') {
      query.$or = [
        { name: { $regex: categorization.mainIngredient, $options: 'i' } },
        { description: { $regex: categorization.mainIngredient, $options: 'i' } },
        { 'ingredients.name': { $regex: categorization.mainIngredient, $options: 'i' } }
      ];
    }

    // Préférences utilisateur
    if (userProfile.dietary && userProfile.dietary !== 'omnivore') {
      query['targetProfiles.dietary'] = userProfile.dietary;
    }

    if (userProfile.allergens && userProfile.allergens.length > 0) {
      query['targetProfiles.allergens'] = { $nin: userProfile.allergens };
    }

    // ========================================
    // ÉTAPE 3 : Recherche MongoDB
    // ========================================
    
    // 🔍 LOG DEBUG : Requête complète
    console.log('[RecipeAdapter] Query MongoDB:', JSON.stringify(query, null, 2));
    
    let recipes = await Recipe.find(query)
      .sort({ 'scores.overallScore': -1 })
      .limit(count * 3)
      .lean();

    console.log(`[RecipeAdapter] ${recipes.length} recettes trouvées dans MongoDB`);

    // ========================================
    // FALLBACK : Si 0 résultats ET filtre ingrédient actif
    // ========================================
    if (recipes.length === 0 && query.$or) {
      console.log('[RecipeAdapter] ⚠️  0 résultats avec filtre ingrédient');
      console.log('[RecipeAdapter] Réessai SANS filtre ingrédient...');
      
      // Supprimer le filtre ingrédient
      const queryWithoutIngredient = { ...query };
      delete queryWithoutIngredient.$or;
      
      recipes = await Recipe.find(queryWithoutIngredient)
        .sort({ 'scores.overallScore': -1 })
        .limit(count * 3)
        .lean();
      
      console.log('[RecipeAdapter] ' + recipes.length + ' recettes trouvées (fallback)');
    }

    // ========================================
    // ÉTAPE 4 : Scoring pertinence
    // ========================================
    if (recipes.length > 0) {
      const scoredRecipes = recipes.map(recipe => ({
        ...recipe,
        relevanceScore: this._calculateIntelligentRelevance(
          recipe,
          categorization,
          userProfile
        )
      }));

      // Trier par pertinence
      scoredRecipes.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return b.scores.overallScore - a.scores.overallScore;
      });

      // Top N
      const topRecipes = scoredRecipes.slice(0, count);

      // Marquer comme vues
      topRecipes.forEach(r => this._markAsShown(userId, r._id));

      console.log('[RecipeAdapter] Top recettes:');
      topRecipes.forEach(r => {
        console.log(`  • ${r.name} (pertinence: ${r.relevanceScore}, santé: ${r.scores.overallScore})`);
      });

      return topRecipes;
    }

    // ========================================
    // ÉTAPE 5 : Fallback si rien trouvé
    // ========================================
    console.log('[RecipeAdapter] Fallback recettes génériques');
    return this._getFallbackRecipes(count, userProfile);
  }

  /**
   * Calculer pertinence intelligente
   */
  _calculateIntelligentRelevance(recipe, categorization, userProfile) {
    let score = 0;

    const recipeName = recipe.name.toLowerCase();
    const recipeDesc = (recipe.description || '').toLowerCase();
    const recipeIngredients = (recipe.ingredients || [])
      .map(i => i.name.toLowerCase())
      .join(' ');

    // 1. Match ingrédient principal IA (poids 5)
    const mainIng = categorization.mainIngredient.toLowerCase();
    if (recipeName.includes(mainIng)) score += 5;
    if (recipeIngredients.includes(mainIng)) score += 3;
    if (recipeDesc.includes(mainIng)) score += 2;

    // 2. Match catégories IA (poids 3)
    categorization.categories.forEach(cat => {
      const catWords = cat.split('-');
      catWords.forEach(word => {
        if (recipeName.includes(word)) score += 3;
        if (recipeDesc.includes(word)) score += 1;
      });
    });

    // 3. Préférences utilisateur calories
    if (userProfile.targetCaloriesPerMeal) {
      const recipeCalories = recipe.nutrition?.perServing?.calories || 500;
      const diff = Math.abs(recipeCalories - userProfile.targetCaloriesPerMeal);
      
      if (diff < 100) score += 2; // Très proche
      else if (diff < 200) score += 1; // Proche
    }

    // 4. Score santé bonus
    if (recipe.scores.overallScore >= 85) score += 2;

    return score;
  }

  /**
   * Gérer recettes récemment affichées (éviter doublons)
   */
  _getRecentlyShown(userId) {
    return this.recentlyShown.get(userId) || [];
  }

  _markAsShown(userId, recipeId) {
    const recent = this.recentlyShown.get(userId) || [];
    recent.push(recipeId);
    
    // Garder max 20 dernières
    if (recent.length > 20) {
      recent.shift();
    }
    
    this.recentlyShown.set(userId, recent);
  }

  /**
   * Fallback recettes génériques
   */
  async _getFallbackRecipes(count, userProfile) {
    const query = {
      isStock: true,
      isPublic: true,
      'scores.overallScore': { $gte: 80 }
    };

    if (userProfile.dietary && userProfile.dietary !== 'omnivore') {
      query['targetProfiles.dietary'] = userProfile.dietary;
    }

    const recipes = await Recipe.find(query)
      .sort({ 'scores.overallScore': -1 })
      .limit(count)
      .lean();

    return recipes;
  }

  /**
   * Méthode legacy (compatibilité)
   */
  async recommendRecipes(userProfile, options = {}) {
    const { category = null, count = 5 } = options;
    
    const query = {
      isStock: true,
      isPublic: true,
      'scores.overallScore': { $gte: 75 }
    };

    if (category) query.category = category;

    const recipes = await Recipe.find(query)
      .sort({ 'scores.overallScore': -1 })
      .limit(count)
      .lean();

    return recipes;
  }
}

module.exports = new RecipeAdapterService();
