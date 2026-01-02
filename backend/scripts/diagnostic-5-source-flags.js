/**
 * DIAGNOSTIC 5 : Source des flags healthReflex
 * Ecolojia - 2 janvier 2026
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function runDiagnostic() {
  console.log('\n========================================');
  console.log('DIAGNOSTIC 5 : SOURCE DES FLAGS');
  console.log('========================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');

  // 1. Nutella complet
  console.log('📝 Nutella - Structure complète :');
  const nutella = await Product.findOne({ barcode: '3017620420078' }).lean();
  
  if (nutella) {
    console.log('\n--- CHAMPS NIVEAU 1 ---');
    console.log('nova_group (niveau 1) :', nutella.nova_group);
    console.log('nutriscore_grade (niveau 1) :', nutella.nutriscore_grade);
    
    console.log('\n--- FOODDATA ---');
    console.log('foodData.novaGroup :', nutella.foodData?.novaGroup);
    console.log('foodData.additives :', nutella.foodData?.additives);
    
    console.log('\n--- SCORES ---');
    console.log('scores.overallScore :', nutella.scores?.overallScore);
    console.log('scores.healthScore :', nutella.scores?.healthScore);
    console.log('scores.breakdown :', JSON.stringify(nutella.scores?.breakdown, null, 2));
    
    console.log('\n--- CONSTITUTION ---');
    console.log('healthReflex :', JSON.stringify(nutella.constitution?.healthReflex, null, 2));
    console.log('cards :', nutella.constitution?.cards);
    
    console.log('\n--- NUTRIMENTS ---');
    console.log('nutriments :', JSON.stringify(nutella.nutriments, null, 2));
  }

  // 2. Vérifier nova_group au niveau racine
  console.log('\n\n📊 Champs NOVA au niveau racine :');
  const novaRoot = await Product.countDocuments({
    nova_group: { $exists: true, $ne: null }
  });
  console.log('   nova_group (racine) présent :', novaRoot);

  for (let n = 1; n <= 4; n++) {
    const count = await Product.countDocuments({ nova_group: n });
    console.log(`   nova_group = ${n} :`, count);
  }

  // 3. Vérifier nutriscore_grade au niveau racine
  console.log('\n📊 Champs NutriScore au niveau racine :');
  const nutriRoot = await Product.countDocuments({
    nutriscore_grade: { $exists: true, $ne: null, $ne: '' }
  });
  console.log('   nutriscore_grade (racine) présent :', nutriRoot);

  const grades = ['a', 'b', 'c', 'd', 'e'];
  for (const g of grades) {
    const count = await Product.countDocuments({ nutriscore_grade: g });
    console.log(`   nutriscore_grade = ${g} :`, count);
  }

  // 4. Échantillon de 5 produits ultra_transforme
  console.log('\n📝 5 produits avec flag ultra_transforme :');
  const ultraSample = await Product.find({
    'constitution.healthReflex.flags': 'ultra_transforme'
  })
    .select('barcode name nova_group foodData.novaGroup scores.breakdown.nova')
    .limit(5)
    .lean();

  ultraSample.forEach((p, i) => {
    console.log(`\n   ${i+1}. ${p.name}`);
    console.log(`      nova_group (racine): ${p.nova_group}`);
    console.log(`      foodData.novaGroup: ${p.foodData?.novaGroup}`);
    console.log(`      scores.breakdown.nova: ${JSON.stringify(p.scores?.breakdown?.nova)}`);
  });

  console.log('\n========================================');
  console.log('FIN DIAGNOSTIC 5');
  console.log('========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runDiagnostic().catch(err => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
