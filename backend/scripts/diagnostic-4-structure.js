/**
 * DIAGNOSTIC 4 : Structure produit (champs disponibles)
 * Ecolojia - 1er janvier 2026
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function runDiagnostic() {
  console.log('\n========================================');
  console.log('DIAGNOSTIC 4 : STRUCTURE PRODUIT');
  console.log('========================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');

  const total = await Product.countDocuments();

  // 1. Champs clés pour les rules triggers
  console.log('📊 Disponibilité des champs clés :\n');

  const fields = [
    { name: 'barcode', path: 'barcode' },
    { name: 'name', path: 'name' },
    { name: 'brand', path: 'brand' },
    { name: 'categoryType', path: 'categoryType' },
    { name: 'subcategory', path: 'subcategory' },
    { name: 'tags', path: 'tags.0' },  // Au moins 1 tag
    { name: 'ingredients_text (>20 chars)', path: null, custom: true },
    { name: 'foodData.novaGroup', path: 'foodData.novaGroup' },
    { name: 'foodData.nutriscoreGrade', path: 'foodData.nutriscoreGrade' },
    { name: 'scores.overallScore', path: 'scores.overallScore' },
    { name: 'scores.breakdown.nova.group', path: 'scores.breakdown.nova.group' },
    { name: 'scores.breakdown.nutriScore.grade', path: 'scores.breakdown.nutriScore.grade' },
    { name: 'scores.breakdown.additives.count', path: 'scores.breakdown.additives.count' },
    { name: 'constitution.healthReflex', path: 'constitution.healthReflex' },
    { name: 'constitution.cards', path: 'constitution.cards.0' },
    { name: 'rawData', path: 'rawData' },
    { name: 'openFoodFacts', path: 'openFoodFacts' }
  ];

  for (const field of fields) {
    let count;
    if (field.custom && field.name.includes('ingredients_text')) {
      count = await Product.countDocuments({
        ingredients_text: { $exists: true, $ne: null, $ne: '', $ne: 'flour sugar', $regex: /.{20,}/ }
      });
    } else {
      count = await Product.countDocuments({
        [field.path]: { $exists: true, $ne: null }
      });
    }
    const pct = (count/total*100).toFixed(1);
    const status = pct > 80 ? '✅' : pct > 50 ? '🟡' : pct > 10 ? '🟠' : '🔴';
    console.log(`   ${status} ${field.name.padEnd(40)} : ${count.toLocaleString().padStart(6)} (${pct.padStart(5)}%)`);
  }

  // 2. Échantillon produit complet
  console.log('\n📝 Structure d\'un produit exemple (Nutella) :');
  const sample = await Product.findOne({ barcode: '3017620420078' }).lean();
  if (sample) {
    const keys = Object.keys(sample);
    console.log(`   Clés niveau 1 : ${keys.join(', ')}`);
    
    if (sample.scores) {
      console.log(`   scores.breakdown keys : ${Object.keys(sample.scores.breakdown || {}).join(', ')}`);
    }
    if (sample.constitution) {
      console.log(`   constitution keys : ${Object.keys(sample.constitution).join(', ')}`);
    }
    if (sample.foodData) {
      console.log(`   foodData keys : ${Object.keys(sample.foodData).join(', ')}`);
    }
  }

  // 3. Vérifier existence de rawData ou backup
  console.log('\n📊 Sources de restauration potentielles :');
  const hasRawData = await Product.countDocuments({ rawData: { $exists: true, $ne: null } });
  console.log(`   Produits avec rawData : ${hasRawData.toLocaleString()}`);
  
  const hasOpenFoodFacts = await Product.countDocuments({ openFoodFacts: { $exists: true, $ne: null } });
  console.log(`   Produits avec openFoodFacts : ${hasOpenFoodFacts.toLocaleString()}`);

  console.log('\n========================================');
  console.log('FIN DIAGNOSTIC 4');
  console.log('========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runDiagnostic().catch(err => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
