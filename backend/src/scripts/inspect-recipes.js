// ✅ CHARGER .env EN PREMIER
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

console.log('🔍 Chargement configuration...');
console.log(`📌 MONGODB_URI présent : ${process.env.MONGODB_URI ? 'OUI' : 'NON'}`);

// Connexion MongoDB avec l'URI du .env
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => {
    console.error('❌ Erreur MongoDB:', err.message);
    process.exit(1);
  });

async function inspectRecipes() {
  try {
    console.log('\n========================================');
    console.log('🔍 INSPECTION RECETTES EN BASE');
    console.log('========================================\n');
    
    // Compter les recettes
    const count = await Recipe.countDocuments();
    console.log(`📊 Total recettes : ${count}\n`);
    
    if (count === 0) {
      console.log('⚠️  Aucune recette en base !');
      process.exit(0);
    }
    
    // Prendre 3 exemples
    const recipes = await Recipe.find().limit(3).lean();
    
    recipes.forEach((recipe, index) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📄 RECETTE ${index + 1} : ${recipe.name}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`   Category : ${recipe.category}`);
      console.log(`   Ingredients (type) : ${typeof recipe.ingredients}`);
      console.log(`   Ingredients (length) : ${recipe.ingredients?.length || 0}`);
      
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        console.log(`\n   📋 Premier ingrédient :`);
        console.log(`      Type : ${typeof recipe.ingredients[0]}`);
        
        if (typeof recipe.ingredients[0] === 'string') {
          console.log(`\n      ❌ FORMAT INCORRECT (string) :`);
          console.log(`         "${recipe.ingredients[0].substring(0, 80)}..."`);
        } else if (recipe.ingredients[0].name) {
          console.log(`\n      ✅ FORMAT CORRECT (objet) :`);
          console.log(`         name: ${recipe.ingredients[0].name}`);
          console.log(`         quantity: ${recipe.ingredients[0].quantity}`);
          console.log(`         unit: ${recipe.ingredients[0].unit}`);
        } else {
          console.log(`\n      ⚠️  FORMAT INCONNU :`);
          console.log(`         ${JSON.stringify(recipe.ingredients[0], null, 2)}`);
        }
        
        // Afficher tous les ingrédients si peu nombreux
        if (recipe.ingredients.length <= 5) {
          console.log(`\n   📋 Tous les ingrédients :`);
          recipe.ingredients.forEach((ing, i) => {
            if (typeof ing === 'string') {
              console.log(`      ${i + 1}. ❌ "${ing.substring(0, 50)}..."`);
            } else {
              console.log(`      ${i + 1}. ✅ ${ing.name} (${ing.quantity} ${ing.unit})`);
            }
          });
        }
      }
    });
    
    console.log('\n\n========================================');
    console.log('✅ INSPECTION TERMINÉE');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur :', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Attendre connexion avant inspection
setTimeout(inspectRecipes, 2000);