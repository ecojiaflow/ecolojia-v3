const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const recipeAdapter = require('../services/recipeAdapter.service');
const { authenticateUser, requirePremium } = require('../middleware');

/**
 * ROUTES API RECIPES - ECOLOJIA V3.1
 * 
 * Routes pour recettes scientifiques pré-validées :
 * - Lister recettes stock
 * - Recommander selon profil
 * - Détail recette
 */

// ============================================================================
// GET /api/recipes - Lister recettes du stock
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const {
      category,
      dietary,
      minScore = 75,
      limit = 20,
      sort = '-scores.overallScore'
    } = req.query;
    
    console.log('[Recipes] Liste recettes:', { category, dietary, minScore });
    
    // Construire query
    const query = {
      isStock: true,
      isPublic: true,
      'scores.overallScore': { $gte: parseInt(minScore) }
    };
    
    if (category) {
      query.category = category;
    }
    
    if (dietary && dietary !== 'omnivore') {
      query['targetProfiles.dietary'] = dietary;
    }
    
    // Récupérer recettes
    const recipes = await Recipe.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .select('-__v');
    
    console.log(`[Recipes] ✅ ${recipes.length} recettes trouvées`);
    
    res.json({
      success: true,
      count: recipes.length,
      data: recipes
    });
    
  } catch (error) {
    console.error('[Recipes] ❌ Erreur liste:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des recettes'
    });
  }
});

// ============================================================================
// GET /api/recipes/recommend - Recommander recettes selon profil
// ============================================================================
router.get('/recommend', authenticateUser, async (req, res) => {
  try {
    const {
      category,
      targetCalories = 500,
      dietary = 'omnivore',
      allergens = [],
      count = 5
    } = req.query;
    
    console.log('[Recipes] Recommandation:', { category, targetCalories, dietary });
    
    const userProfile = {
      dietary,
      targetCaloriesPerMeal: parseInt(targetCalories),
      allergens: typeof allergens === 'string' ? allergens.split(',') : allergens,
      goals: ['health']
    };
    
    const options = {
      category,
      count: parseInt(count)
    };
    
    const recipes = await recipeAdapter.recommendRecipes(userProfile, options);
    
    console.log(`[Recipes] ✅ ${recipes.length} recettes recommandées`);
    
    res.json({
      success: true,
      count: recipes.length,
      data: recipes
    });
    
  } catch (error) {
    console.error('[Recipes] ❌ Erreur recommandation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recommandation'
    });
  }
});

// ============================================================================
// GET /api/recipes/:id - Détail d'une recette
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[Recipes] Détail recette:', id);
    
    const recipe = await Recipe.findById(id).select('-__v');
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recette non trouvée'
      });
    }
    
    console.log('[Recipes] ✅ Recette trouvée:', recipe.name);
    
    res.json({
      success: true,
      data: recipe
    });
    
  } catch (error) {
    console.error('[Recipes] ❌ Erreur détail:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la recette'
    });
  }
});

// ============================================================================
// POST /api/recipes/generate-meal-plan - Générer plan hebdomadaire (PREMIUM)
// ============================================================================
router.post('/generate-meal-plan', authenticateUser, requirePremium, async (req, res) => {
  try {
    const {
      dietary = 'omnivore',
      targetCaloriesPerDay = 2000,
      allergens = [],
      goals = ['health']
    } = req.body;
    
    console.log('[Recipes] Génération plan hebdo:', { dietary, targetCaloriesPerDay });
    
    const userProfile = {
      dietary,
      targetCaloriesPerDay,
      allergens,
      goals
    };
    
    const mealPlan = await recipeAdapter.generateWeeklyMealPlan(userProfile);
    
    console.log(`[Recipes] ✅ Plan créé: ${mealPlan.length} repas`);
    
    res.json({
      success: true,
      message: 'Plan repas hebdomadaire généré',
      data: {
        totalMeals: mealPlan.length,
        meals: mealPlan
      }
    });
    
  } catch (error) {
    console.error('[Recipes] ❌ Erreur génération plan:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du plan repas'
    });
  }
});

module.exports = router;