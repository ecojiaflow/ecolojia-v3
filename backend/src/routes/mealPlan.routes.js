const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware');
const mealPlanService = require('../services/mealPlan.service');

// POST /api/meal-plan - Créer un nouveau plan repas
router.post('/', authenticateUser, async (req, res) => {
  try {
    const mealPlan = await mealPlanService.createMealPlan(req.user._id, req.body);
    res.status(201).json({ success: true, mealPlan });
  } catch (error) {
    console.error('[MealPlan] Create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/meal-plan - Obtenir tous les plans repas de l'utilisateur
router.get('/', authenticateUser, async (req, res) => {
  try {
    const mealPlans = await mealPlanService.getUserMealPlans(req.user._id);
    res.json({ success: true, mealPlans });
  } catch (error) {
    console.error('[MealPlan] Get all error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/meal-plan/:id - Obtenir un plan repas spécifique
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const mealPlan = await mealPlanService.getMealPlanById(req.user._id, req.params.id);
    res.json({ success: true, mealPlan });
  } catch (error) {
    console.error('[MealPlan] Get by ID error:', error);
    res.status(404).json({ success: false, error: error.message });
  }
});

// POST /api/meal-plan/:id/meals - Ajouter un repas au plan
router.post('/:id/meals', authenticateUser, async (req, res) => {
  try {
    const mealPlan = await mealPlanService.addMealToPlan(
      req.user._id,
      req.params.id,
      req.body
    );
    res.json({ success: true, mealPlan });
  } catch (error) {
    console.error('[MealPlan] Add meal error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/meal-plan/:id/meals/:mealId - Supprimer un repas du plan
router.delete('/:id/meals/:mealId', authenticateUser, async (req, res) => {
  try {
    const mealPlan = await mealPlanService.removeMealFromPlan(
      req.user._id,
      req.params.id,
      req.params.mealId
    );
    res.json({ success: true, mealPlan });
  } catch (error) {
    console.error('[MealPlan] Remove meal error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/meal-plan/:id/meals/:mealId - Modifier un repas du plan
router.put('/:id/meals/:mealId', authenticateUser, async (req, res) => {
  try {
    const mealPlan = await mealPlanService.updateMeal(
      req.user._id,
      req.params.id,
      req.params.mealId,
      req.body
    );
    res.json({ success: true, mealPlan });
  } catch (error) {
    console.error('[MealPlan] Update meal error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/meal-plan/:id - Supprimer un plan repas
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const result = await mealPlanService.deleteMealPlan(req.user._id, req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[MealPlan] Delete error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/meal-plan/:id/stats - Obtenir les statistiques du plan repas
router.get('/:id/stats', authenticateUser, async (req, res) => {
  try {
    const stats = await mealPlanService.getWeekStats(req.user._id, req.params.id);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('[MealPlan] Stats error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;