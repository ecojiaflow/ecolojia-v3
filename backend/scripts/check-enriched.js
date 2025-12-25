const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function checkEnriched() {
  await mongoose.connect(process.env.MONGODB_URI);

  const stats = {
    total: await Product.countDocuments(),
    enriched: await Product.countDocuments({
      'nutrition.energy_kcal': { $exists: true, $ne: null },
      'ingredients_text': { $exists: true, $ne: null, $ne: '' }
    }),
    withNutrition: await Product.countDocuments({
      'nutrition.energy_kcal': { $exists: true, $ne: null }
    }),
    withIngredients: await Product.countDocuments({
      'ingredients_text': { $exists: true, $ne: null, $ne: '' }
    })
  };

  console.log('\n📊 ÉTAT BASE DE DONNÉES\n');
  console.log('='.repeat(50));
  console.log(`Total produits: ${stats.total.toLocaleString()}`);
  console.log(`Produits COMPLETS (nutrition + ingrédients): ${stats.enriched.toLocaleString()}`);
  console.log(`  → ${((stats.enriched / stats.total) * 100).toFixed(1)}% de la base`);
  console.log(`Produits avec nutrition: ${stats.withNutrition.toLocaleString()}`);
  console.log(`Produits avec ingrédients: ${stats.withIngredients.toLocaleString()}`);
  console.log('='.repeat(50));
  
  console.log('\n✅ SUFFISANT POUR DÉVELOPPEMENT ?');
  if (stats.enriched >= 500) {
    console.log(`✅ OUI ! ${stats.enriched} produits enrichis = largement suffisant`);
    console.log('   → Peut développer toutes les features (M2-M6)');
    console.log('   → Peut tester scoring, alternatives, habitudes');
    console.log('   → Peut générer contenu automatisé\n');
  } else {
    console.log(`⚠️  Seulement ${stats.enriched} produits - recommandé minimum 500\n`);
  }

  // Exemples de produits enrichis
  const samples = await Product.find({
    'nutrition.energy_kcal': { $exists: true, $ne: null },
    'ingredients_text': { $exists: true, $ne: null, $ne: '' }
  }).limit(5).lean();

  console.log('📋 EXEMPLES PRODUITS ENRICHIS:\n');
  samples.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   Energy: ${p.nutrition.energy_kcal} kcal`);
    console.log(`   Ingrédients: ${p.ingredients_text.substring(0, 50)}...`);
    console.log(`   Source: ${p.estimation_source || 'unknown'}\n`);
  });

  await mongoose.disconnect();
}

checkEnriched().catch(console.error);
