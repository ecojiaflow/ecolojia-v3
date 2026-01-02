/**
 * DIAGNOSTIC 2 : Analyse données NOVA (toutes sources)
 * Ecolojia - 2 janvier 2026
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function runDiagnostic() {
  console.log('\n========================================');
  console.log('DIAGNOSTIC 2 : DONNÉES NOVA (TOUTES SOURCES)');
  console.log('========================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');

  const total = await Product.countDocuments();
  console.log(`📊 Total produits : ${total.toLocaleString()}`);

  // 1. NOVA au niveau racine (nova_group)
  console.log('\n📊 NOVA dans nova_group (niveau racine) :');
  for (let nova = 1; nova <= 4; nova++) {
    const count = await Product.countDocuments({ nova_group: nova });
    console.log(`   NOVA ${nova} : ${count.toLocaleString()}`);
  }
  const novaRootNull = await Product.countDocuments({
    $or: [
      { nova_group: null },
      { nova_group: { $exists: false } }
    ]
  });
  console.log(`   NOVA null/absent : ${novaRootNull.toLocaleString()}`);

  // 2. NOVA dans foodData.novaGroup
  console.log('\n📊 NOVA dans foodData.novaGroup :');
  for (let nova = 1; nova <= 4; nova++) {
    const count = await Product.countDocuments({ 'foodData.novaGroup': nova });
    console.log(`   NOVA ${nova} : ${count.toLocaleString()}`);
  }

  // 3. NOVA dans scores.breakdown.nova.group
  console.log('\n📊 NOVA dans scores.breakdown.nova.group :');
  for (let nova = 1; nova <= 4; nova++) {
    const count = await Product.countDocuments({ 'scores.breakdown.nova.group': nova });
    console.log(`   NOVA ${nova} : ${count.toLocaleString()}`);
  }

  // 4. Produits avec AU MOINS une source NOVA
  console.log('\n📊 Produits avec AU MOINS une source NOVA :');
  const anyNova = await Product.countDocuments({
    $or: [
      { nova_group: { $in: [1, 2, 3, 4] } },
      { 'foodData.novaGroup': { $in: [1, 2, 3, 4] } },
      { 'scores.breakdown.nova.group': { $in: [1, 2, 3, 4] } }
    ]
  });
  console.log(`   Total avec NOVA : ${anyNova.toLocaleString()} (${(anyNova/total*100).toFixed(1)}%)`);

  // 5. Distribution NutriScore (niveau racine)
  console.log('\n📊 NutriScore dans nutriscore_grade (niveau racine) :');
  const grades = ['a', 'b', 'c', 'd', 'e'];
  for (const g of grades) {
    const count = await Product.countDocuments({ nutriscore_grade: g });
    console.log(`   Grade ${g.toUpperCase()} : ${count.toLocaleString()}`);
  }

  console.log('\n========================================');
  console.log('FIN DIAGNOSTIC 2');
  console.log('========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runDiagnostic().catch(err => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
