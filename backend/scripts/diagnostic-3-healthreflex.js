/**
 * DIAGNOSTIC 3 : Analyse healthReflex actuel
 * Ecolojia - 1er janvier 2026
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function runDiagnostic() {
  console.log('\n========================================');
  console.log('DIAGNOSTIC 3 : HEALTHREFLEX');
  console.log('========================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');

  const total = await Product.countDocuments();
  console.log(`📊 Total produits : ${total.toLocaleString()}`);

  // 1. Distribution par niveau
  console.log('\n📊 Distribution healthReflex.level :');
  for (let level = 1; level <= 3; level++) {
    const count = await Product.countDocuments({
      'constitution.healthReflex.level': level
    });
    const pct = (count/total*100).toFixed(1);
    const bar = '█'.repeat(Math.round(pct/5));
    console.log(`   Niveau ${level} : ${count.toLocaleString().padStart(6)} (${pct.padStart(5)}%) ${bar}`);
  }

  const noLevel = await Product.countDocuments({
    $or: [
      { 'constitution.healthReflex.level': null },
      { 'constitution.healthReflex.level': { $exists: false } },
      { 'constitution.healthReflex': { $exists: false } }
    ]
  });
  console.log(`   Pas de niveau : ${noLevel.toLocaleString().padStart(6)} (${(noLevel/total*100).toFixed(1)}%)`);

  // 2. Distribution par sublevel
  console.log('\n📊 Distribution healthReflex.sublevel (Niveau 3) :');
  const occasions = await Product.countDocuments({
    'constitution.healthReflex.sublevel': 'occasions'
  });
  console.log(`   occasions : ${occasions.toLocaleString()}`);

  const limitStrongly = await Product.countDocuments({
    'constitution.healthReflex.sublevel': 'limit_strongly'
  });
  console.log(`   limit_strongly : ${limitStrongly.toLocaleString()}`);

  // 3. Flags les plus fréquents
  console.log('\n📊 Flags les plus fréquents :');
  const flagsAgg = await Product.aggregate([
    { $unwind: '$constitution.healthReflex.flags' },
    { $group: { _id: '$constitution.healthReflex.flags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  if (flagsAgg.length === 0) {
    console.log('   ⚠️ Aucun flag trouvé');
  } else {
    flagsAgg.forEach((f, i) => {
      console.log(`   ${(i+1).toString().padStart(2)}. ${f._id} : ${f.count.toLocaleString()}`);
    });
  }

  // 4. Exemple Nutella
  console.log('\n📝 Vérification Nutella (3017620420078) :');
  const nutella = await Product.findOne({ barcode: '3017620420078' })
    .select('name constitution.healthReflex scores.breakdown.nova scores.breakdown.nutriScore')
    .lean();
  if (nutella) {
    console.log(`   Nom : ${nutella.name}`);
    console.log(`   Level : ${nutella.constitution?.healthReflex?.level}`);
    console.log(`   Sublevel : ${nutella.constitution?.healthReflex?.sublevel}`);
    console.log(`   Flags : ${JSON.stringify(nutella.constitution?.healthReflex?.flags)}`);
    console.log(`   NOVA : ${nutella.scores?.breakdown?.nova?.group}`);
    console.log(`   NutriScore : ${nutella.scores?.breakdown?.nutriScore?.grade}`);
  } else {
    console.log('   ⚠️ Nutella non trouvé');
  }

  console.log('\n========================================');
  console.log('FIN DIAGNOSTIC 3');
  console.log('========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runDiagnostic().catch(err => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
