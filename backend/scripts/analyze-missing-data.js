const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function analyzeProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Échantillon de 100 produits
  const products = await Product.find().limit(100).lean();
  
  const stats = {
    totalAnalyzed: products.length,
    hasNutrition: 0,
    hasIngredients: 0,
    hasAdditives: 0,
    hasNovaGroup: 0,
    hasNutriScore: 0,
    hasEcoScore: 0,
    completelyEmpty: 0
  };
  
  products.forEach(p => {
    const hasNutrition = p.nutrition && (
      p.nutrition.energy_kcal || 
      p.nutrition.fat || 
      p.nutrition.sugars || 
      p.nutrition.proteins
    );
    
    if (hasNutrition) stats.hasNutrition++;
    if (p.ingredients_text) stats.hasIngredients++;
    if (p.additives_tags?.length > 0) stats.hasAdditives++;
    if (p.nova_group) stats.hasNovaGroup++;
    if (p.nutrition_grade_fr) stats.hasNutriScore++;
    if (p.ecoscore_grade) stats.hasEcoScore++;
    
    if (!hasNutrition && !p.ingredients_text && !p.additives_tags?.length) {
      stats.completelyEmpty++;
    }
  });
  
  console.log('\n=== ANALYSE ÉCHANTILLON 100 PRODUITS ===\n');
  console.log(`Produits avec nutrition: ${stats.hasNutrition}/100 (${((stats.hasNutrition/100)*100).toFixed(1)}%)`);
  console.log(`Produits avec ingrédients: ${stats.hasIngredients}/100 (${((stats.hasIngredients/100)*100).toFixed(1)}%)`);
  console.log(`Produits avec additifs: ${stats.hasAdditives}/100 (${((stats.hasAdditives/100)*100).toFixed(1)}%)`);
  console.log(`Produits avec NOVA: ${stats.hasNovaGroup}/100 (${((stats.hasNovaGroup/100)*100).toFixed(1)}%)`);
  console.log(`Produits avec Nutri-Score: ${stats.hasNutriScore}/100 (${((stats.hasNutriScore/100)*100).toFixed(1)}%)`);
  console.log(`Produits avec Eco-Score: ${stats.hasEcoScore}/100 (${((stats.hasEcoScore/100)*100).toFixed(1)}%)`);
  console.log(`Produits complètement vides: ${stats.completelyEmpty}/100 (${((stats.completelyEmpty/100)*100).toFixed(1)}%)`);
  
  // Afficher 3 exemples de produits
  console.log('\n=== EXEMPLES PRODUITS ===\n');
  for (let i = 0; i < 3; i++) {
    const p = products[i];
    console.log(`Produit ${i+1}: ${p.name || 'Sans nom'}`);
    console.log(`  Barcode: ${p.barcode || 'N/A'}`);
    console.log(`  Nutrition: ${p.nutrition ? 'OUI' : 'NON'}`);
    console.log(`  Ingrédients: ${p.ingredients_text ? 'OUI' : 'NON'}`);
    console.log(`  NOVA: ${p.nova_group || 'N/A'}`);
    console.log(`  Subcategory: ${p.subcategory || 'N/A'}`);
    console.log(`  Tags: ${p.tags?.join(', ') || 'N/A'}`);
    console.log('');
  }
  
  await mongoose.disconnect();
}

analyzeProducts().catch(console.error);
