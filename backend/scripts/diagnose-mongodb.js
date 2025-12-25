const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function diagnose() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('\n🔍 DIAGNOSTIC MONGODB\n');
  console.log('='.repeat(60));

  // 1. Chercher les 5 derniers produits modifiés
  const recentlyUpdated = await Product.find()
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

  console.log('\n📋 5 DERNIERS PRODUITS MODIFIÉS:\n');
  
  recentlyUpdated.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name || 'Sans nom'}`);
    console.log(`   ID: ${p._id}`);
    console.log(`   Updated: ${p.updatedAt}`);
    console.log(`   Nutrition présente: ${!!p.nutrition}`);
    console.log(`   Nutrition.energy_kcal: ${p.nutrition?.energy_kcal || 'N/A'}`);
    console.log(`   Ingredients: ${p.ingredients_text ? 'OUI' : 'NON'}`);
    console.log(`   Estimated: ${p.estimated || 'N/A'}`);
    console.log(`   Estimation_source: ${p.estimation_source || 'N/A'}`);
    
    // Afficher TOUTES les clés au premier niveau
    console.log(`   Clés présentes: ${Object.keys(p).join(', ')}`);
    console.log('');
  });

  // 2. Vérifier structure nutrition
  console.log('\n🔬 STRUCTURE NUTRITION DÉTAILLÉE:\n');
  const sample = recentlyUpdated[0];
  if (sample.nutrition) {
    console.log('   nutrition:', JSON.stringify(sample.nutrition, null, 2));
  } else {
    console.log('   ❌ Pas de champ nutrition !');
  }

  // 3. Différentes requêtes de vérification
  console.log('\n📊 TESTS DE REQUÊTES:\n');
  
  const tests = [
    {
      name: 'Produits avec nutrition (any)',
      query: { nutrition: { $exists: true } }
    },
    {
      name: 'Produits avec nutrition.energy_kcal',
      query: { 'nutrition.energy_kcal': { $exists: true } }
    },
    {
      name: 'Produits avec nutrition.energy_kcal non-null',
      query: { 'nutrition.energy_kcal': { $exists: true, $ne: null } }
    },
    {
      name: 'Produits avec nutrition.energy_kcal > 0',
      query: { 'nutrition.energy_kcal': { $gt: 0 } }
    },
    {
      name: 'Produits avec ingredients_text',
      query: { 'ingredients_text': { $exists: true, $ne: null, $ne: '' } }
    },
    {
      name: 'Produits avec estimated=true',
      query: { 'estimated': true }
    },
    {
      name: 'Produits avec estimation_source',
      query: { 'estimation_source': { $exists: true } }
    }
  ];

  for (const test of tests) {
    const count = await Product.countDocuments(test.query);
    console.log(`   ${test.name}: ${count.toLocaleString()}`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  await mongoose.disconnect();
}

diagnose().catch(console.error);
