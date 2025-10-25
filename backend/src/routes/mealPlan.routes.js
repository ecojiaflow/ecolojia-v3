/**
 * MEAL PLAN ROUTES
 * Endpoints pour generation plans repas hebdomadaires (Premium)
 * Version: 1.0.0
 */

const express = require('express');
const router = express.Router();
const mealPlanGenerator = require('../services/ai/mealPlanGenerator.service');
const { authenticateToken, requirePremium } = require('../middleware');

router.post('/generate', authenticateToken, requirePremium, async (req, res) => {
  try {
    const {
      budget = 80,
      calories = 2000,
      allergens = [],
      dietType = 'balanced',
      cookingTime = 'medium',
      people = 1
    } = req.body;

    if (budget < 20 || budget > 500) {
      return res.status(400).json({
        success: false,
        error: 'Budget invalide (entre 20 EUR et 500 EUR)'
      });
    }

    if (calories < 1200 || calories > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Calories invalides (entre 1200 et 4000 kcal)'
      });
    }

    const validDietTypes = ['balanced', 'vegetarian', 'vegan', 'low-carb'];
    if (!validDietTypes.includes(dietType)) {
      return res.status(400).json({
        success: false,
        error: `Type de regime invalide. Valeurs acceptees: ${validDietTypes.join(', ')}`
      });
    }

    console.log(`[MealPlan] Generation demandee par user ${req.user.id}`);
    console.log(`   Budget: ${budget} EUR | Calories: ${calories} | Regime: ${dietType}`);

    const result = await mealPlanGenerator.generateWeeklyPlan({
      budget,
      calories,
      allergens,
      dietType,
      cookingTime,
      people
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }

    console.log(`[MealPlan] Plan genere avec succes (score: ${result.validation.score}/100)`);

    const disclaimers = {
      health: "INFORMATION IMPORTANTE : ECOLOJIA n'est pas un dispositif medical. Les plans repas sont informatifs, bases sur des recommandations nutritionnelles generales (OMS, ANSES). Ils ne remplacent pas l'avis d'un professionnel de sante. Consultez un medecin ou nutritionniste diplome avant tout changement alimentaire majeur, surtout en cas de pathologie.",
      ai: "RAPPEL : Ce plan est genere par une intelligence artificielle. Bien que valide selon des criteres nutritionnels, il peut contenir des erreurs. Verifiez toujours la coherence des recettes et adaptez selon vos besoins. En cas de doute, consultez un professionnel.",
      allergens: "ALLERGENES : Meme si vos allergenes ont ete exclus automatiquement, verifiez TOUJOURS les etiquettes des produits achetes. Les contaminations croisees existent. En cas d'allergie severe, cette fonction ne remplace pas votre vigilance."
    };

    res.json({
      success: true,
      data: result.plan,
      disclaimers,
      validation: result.validation,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('[MealPlan] Erreur route:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la generation du plan repas',
      message: error.message
    });
  }
});

router.get('/preferences', authenticateToken, requirePremium, (req, res) => {
  res.json({
    success: true,
    data: {
      dietTypes: [
        { value: 'balanced', label: 'Equilibre', description: 'Viandes, poissons, legumes' },
        { value: 'vegetarian', label: 'Vegetarien', description: 'Sans viande ni poisson' },
        { value: 'vegan', label: 'Vegetalien', description: 'Aucun produit animal' },
        { value: 'low-carb', label: 'Low-Carb', description: 'Faible en glucides (<100g/jour)' }
      ],
      cookingTimes: [
        { value: 'quick', label: 'Rapide', description: '< 30 minutes' },
        { value: 'medium', label: 'Modere', description: '30-60 minutes' },
        { value: 'elaborate', label: 'Elabore', description: '> 60 minutes' }
      ],
      budgetRange: { min: 20, max: 500, default: 80 },
      caloriesRange: { min: 1200, max: 4000, default: 2000 },
      peopleRange: { min: 1, max: 8, default: 1 }
    }
  });
});

router.post('/validate', authenticateToken, requirePremium, async (req, res) => {
  try {
    const { plan, userPreferences } = req.body;
    const validator = require('../services/ai/mealPlanValidator.service');
    
    const result = validator.validate(plan, userPreferences);

    res.json({
      success: true,
      validation: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;