/**
 * SERVICE RECETTES MONGODB - ECOLOJIA V3.1
 * Suggestions intelligentes basées sur MongoDB
 */

const Recipe = require('../../models/Recipe');

/**
 * Suggérer recettes depuis MongoDB selon le produit
 * @param {Object} product - Produit scanné
 * @returns {Array} - 3 recettes pertinentes
 */
const suggestFromProduct = async (product) => {
  try {
    const { name, categoryType, ingredients } = product || {};
    
    // ========================================
    // CAS 1 : Produit cosmétique/détergent
    // ========================================
    if (categoryType === 'cosmetic') {
      return [{
        name: 'Routine soin naturelle',
        description: 'Produit cosmétique détecté - Pas de recette alimentaire',
        difficulty: 'easy',
        prepTime: 0,
        servings: 1,
        scores: { overallScore: 0, healthScore: 0, environmentScore: 0 }
      }];
    }
    
    if (categoryType === 'detergent') {
      return [{
        name: 'Conseils d\'usage',
        description: 'Produit détergent détecté - Pas de recette alimentaire',
        difficulty: 'easy',
        prepTime: 0,
        servings: 1,
        scores: { overallScore: 0, healthScore: 0, environmentScore: 0 }
      }];
    }
    
    // ========================================
    // CAS 2 : Produit alimentaire
    // ========================================
    
    // Recherche dans MongoDB
    const searchTerms = [];
    
    // Ajouter le nom du produit
    if (name) {
      searchTerms.push(name.toLowerCase());
    }
    
    // Ajouter les ingrédients si disponibles
    if (ingredients && ingredients.length > 0) {
      ingredients.forEach(ing => {
        if (ing && typeof ing === 'string') {
          searchTerms.push(ing.toLowerCase());
        }
      });
    }
    
    // Recherche MongoDB avec score de pertinence
    const recipes = await Recipe.find({
      $or: [
        // Recherche dans le nom
        { name: { $regex: searchTerms.join('|'), $options: 'i' } },
        // Recherche dans la description
        { description: { $regex: searchTerms.join('|'), $options: 'i' } },
        // Recherche dans les ingrédients
        { 'ingredients.name': { $regex: searchTerms.join('|'), $options: 'i' } }
      ],
      // Filtrer par catégorie alimentaire
      category: { $in: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] }
    })
    .limit(5)
    .sort({ 'scores.overallScore': -1 })
    .lean();
    
    // ========================================
    // CAS 2.1 : Recettes trouvées
    // ========================================
    if (recipes && recipes.length > 0) {
      return recipes.slice(0, 3).map(recipe => ({
        _id: recipe._id,
        name: recipe.name,
        description: recipe.description || 'Recette scientifiquement équilibrée.',
        image: recipe.image,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        scores: {
          overallScore: recipe.scores?.overallScore || 75,
          healthScore: recipe.scores?.healthScore || 75,
          environmentScore: recipe.scores?.environmentScore || 75
        },
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || []
      }));
    }
    
    // ========================================
    // CAS 2.2 : Aucune recette trouvée → Fallback
    // ========================================
    const fallbackRecipes = await Recipe.find({
      category: { $in: ['breakfast', 'lunch', 'dinner', 'snack'] }
    })
    .limit(3)
    .sort({ 'scores.overallScore': -1 })
    .lean();
    
    if (fallbackRecipes && fallbackRecipes.length > 0) {
      return fallbackRecipes.map(recipe => ({
        _id: recipe._id,
        name: recipe.name,
        description: recipe.description || 'Recette équilibrée.',
        image: recipe.image,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        scores: {
          overallScore: recipe.scores?.overallScore || 75,
          healthScore: recipe.scores?.healthScore || 75,
          environmentScore: recipe.scores?.environmentScore || 75
        }
      }));
    }
    
    // ========================================
    // CAS 2.3 : Base vide → Recettes génériques
    // ========================================
    return [
      {
        name: `Salade rapide à base de ${name || 'produit'}`,
        description: 'Un excellent déjeuner à base de flocons d\'avoine, saumon sauvage, brocolis. Recette scientifiquement équilibrée.',
        difficulty: 'easy',
        prepTime: 10,
        servings: 1,
        scores: { overallScore: 75, healthScore: 80, environmentScore: 70 }
      },
      {
        name: `Bowl ${name || 'produit'} & légumineuses`,
        description: 'Un équilibré petit-déjeuner à base de thon, épinards frais, citron. Recette scientifiquement équilibrée.',
        difficulty: 'medium',
        prepTime: 20,
        servings: 1,
        scores: { overallScore: 78, healthScore: 82, environmentScore: 74 }
      }
    ];
    
  } catch (error) {
    console.error('[recipes.service] Erreur:', error);
    
    // Fallback en cas d'erreur
    return [
      {
        name: 'Recette rapide',
        description: 'Recette simple et équilibrée.',
        difficulty: 'easy',
        prepTime: 15,
        servings: 1,
        scores: { overallScore: 75, healthScore: 75, environmentScore: 75 }
      }
    ];
  }
};

module.exports = { suggestFromProduct };