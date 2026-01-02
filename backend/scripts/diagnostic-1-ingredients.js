/**
 * DIAGNOSTIC 1 : Analyse corruption ingredients_text
 * Ecolojia - 1er janvier 2026
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function runDiagnostic() {
  console.log('\n========================================');
  console.log('DIAGNOSTIC 1 : INGREDIENTS_TEXT');
  console.log('========================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');

  const total = await Product.countDocuments();
  console.log(`📊 Total produits : ${total.toLocaleString()}`);

  // 1. Produits avec "flour sugar" exactement
  const flourSugar = await Product.countDocuments({
    ingredients_text: 'flour sugar'
  });
  console.log(`\n🔴 Produits avec "flour sugar" : ${flourSugar.toLocaleString()} (${(flourSugar/total*100).toFixed(1)}%)`);

  // 2. Produits avec ingredients_text vide ou null
  const empty = await Product.countDocuments({
    $or: [
      { ingredients_text: null },
      { ingredients_text: '' },
      { ingredients_text: { $exists: false } }
    ]
  });
  console.log(`⚪ Produits sans ingredients_text : ${empty.toLocaleString()} (${(empty/total*100).toFixed(1)}%)`);

  // 3. Produits avec ingredients_text valide (> 20 caractères, pas "flour sugar")
  const valid = await Product.countDocuments({
    ingredients_text: { 
      $exists: true, 
      $ne: null, 
      $ne: '', 
      $ne: 'flour sugar',
      $regex: /.{20,}/  // Au moins 20 caractères
    }
  });
  console.log(`✅ Produits avec ingredients_text valide : ${valid.toLocaleString()} (${(valid/total*100).toFixed(1)}%)`);

  // 4. Échantillon de 5 produits "flour sugar"
  console.log('\n📝 Échantillon 5 produits "flour sugar" :');
  const sampleFlour = await Product.find({ ingredients_text: 'flour sugar' })
    .select('barcode name brand')
    .limit(5)
    .lean();
  sampleFlour.forEach((p, i) => {
    console.log(`   ${i+1}. ${p.barcode} | ${p.name} | ${p.brand}`);
  });

  // 5. Échantillon de 5 produits avec ingredients valides
  console.log('\n📝 Échantillon 5 produits avec ingredients valides :');
  const sampleValid = await Product.find({ 
    ingredients_text: { $regex: /.{50,}/ } 
  })
    .select('barcode name ingredients_text')
    .limit(5)
    .lean();
  sampleValid.forEach((p, i) => {
    const preview = p.ingredients_text?.substring(0, 80) + '...';
    console.log(`   ${i+1}. ${p.barcode} | ${p.name}`);
    console.log(`      → ${preview}`);
  });

  // 6. Vérifier si OpenFoodFacts original existe
  console.log('\n📝 Vérification champs OpenFoodFacts originaux :');
  const withOFF = await Product.countDocuments({
    'rawData.ingredients_text': { $exists: true, $ne: null, $ne: '' }
  });
  console.log(`   rawData.ingredients_text présent : ${withOFF.toLocaleString()}`);

  const withOFF2 = await Product.countDocuments({
    'openFoodFacts.ingredients_text': { $exists: true, $ne: null, $ne: '' }
  });
  console.log(`   openFoodFacts.ingredients_text présent : ${withOFF2.toLocaleString()}`);

  console.log('\n========================================');
  console.log('FIN DIAGNOSTIC 1');
  console.log('========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runDiagnostic().catch(err => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
