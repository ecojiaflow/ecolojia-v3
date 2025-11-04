const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

const STOCK_RECIPES = [
  {
    name: "Porridge banane-amande IG bas",
    slug: "porridge-banane-amande-ig-bas",
    description: "Porridge crémeux aux flocons d'avoine, banane et amandes.",
    category: "breakfast",
    scores: { overallScore: 88, healthScore: 90, environmentScore: 86, confidence: 0.95 },
    nutrition: { perServing: { calories: 380, protein: 12, carbs: 52, fiber: 8, fat: 14, saturatedFat: 2, sugar: 12, salt: 0.1 } },
    ingredients: [
      { name: "Flocons d'avoine complets", quantity: 60, unit: "g", role: "base" },
      { name: "Lait d'amande", quantity: 250, unit: "ml", role: "base" },
      { name: "Banane", quantity: 1, unit: "unité", role: "flavor" }
    ],
    steps: [
      { order: 1, instruction: "Faire chauffer le lait d'amande", duration: 2 },
      { order: 2, instruction: "Ajouter les flocons et cuire 5 min", duration: 5 },
      { order: 3, instruction: "Servir avec la banane", duration: 1 }
    ],
    prepTime: 3,
    cookTime: 6,
    servings: 1,
    difficulty: "easy",
    cost: { perServing: 2.5, total: 2.5 },
    targetProfiles: { dietary: ["vegetarian", "vegan"], goals: ["health"], allergens: [] },
    environmental: { co2PerServing: 0.4, seasonality: "all-year" },
    generatedBy: "manual",
    isPublic: true,
    isPremium: false,
    isStock: true
  }
];

async function seedRecipes() {
  try {
    console.log('[Seed] Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] ✅ Connecté');
    
    const deleteResult = await Recipe.deleteMany({ isStock: true });
    console.log(`[Seed] 🗑️ ${deleteResult.deletedCount} anciennes recettes supprimées`);
    
    const insertResult = await Recipe.insertMany(STOCK_RECIPES);
    console.log(`[Seed] ✅ ${insertResult.length} recettes insérées`);
    
    process.exit(0);
  } catch (error) {
    console.error('[Seed] ❌ Erreur:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedRecipes();
}

module.exports = { STOCK_RECIPES, seedRecipes };