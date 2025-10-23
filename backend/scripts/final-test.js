require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function finalTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté\n');
  
  const nutella = await Product.findOne({ barcode: '3017620422003' });
  
  console.log('🔄 Forcer recalcul avec middleware corrigé...\n');
  
  // Vérifier les données sources
  console.log('📊 DONNÉES SOURCES :');
  console.log('   - foodData.novaGroup:', nutella.foodData?.novaGroup);
  console.log('   - foodData.nutriScore:', nutella.foodData?.nutriScore);
  console.log('   - foodData.ecoScore:', nutella.foodData?.ecoScore);
  console.log('   - foodData.nutritionalInfo.sugars:', nutella.foodData?.nutritionalInfo?.sugars);
  console.log('   - foodData.nutritionalInfo.saturatedFat:', nutella.foodData?.nutritionalInfo?.saturatedFat);
  console.log('   - foodData.nutritionalInfo.salt:', nutella.foodData?.nutritionalInfo?.salt);
  
  // Forcer recalcul
  nutella.scores = undefined;
  await nutella.save();
  
  // Recharger
  const updated = await Product.findOne({ barcode: '3017620422003' });
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTAT FINAL - NUTELLA');
  console.log('='.repeat(80));
  console.log('\n🎯 Score global :', updated.scores.overallScore, '/100');
  console.log('🔬 Confiance :', Math.round(updated.scores.confidence * 100), '%');
  console.log('📈 Complétude :', updated.scores.dataCompleteness);
  
  console.log('\n📋 BREAKDOWN (8 COMPOSANTES) :');
  console.log('-'.repeat(80));
  
  const breakdown = updated.scores.breakdown;
  
  console.log('1. NOVA           :', breakdown.nova?.score !== undefined ? breakdown.nova.score + '/100' : 'VIDE', '- Groupe', breakdown.nova?.group || '?');
  console.log('2. Nutri-Score    :', breakdown.nutriScore?.score !== undefined ? breakdown.nutriScore.score + '/100' : 'VIDE', '- Grade', breakdown.nutriScore?.grade || '?');
  console.log('3. Additifs       :', breakdown.additives?.score !== undefined ? breakdown.additives.score + '/100' : 'VIDE', '-', breakdown.additives?.count || 0, 'détectés');
  console.log('4. Sucres         :', breakdown.sugars?.score !== undefined ? breakdown.sugars.score + '/100' : 'VIDE', '-', breakdown.sugars?.value || '?', 'g/100g');
  console.log('5. Graisses sat.  :', breakdown.saturatedFat?.score !== undefined ? breakdown.saturatedFat.score + '/100' : 'VIDE', '-', breakdown.saturatedFat?.value || '?', 'g/100g');
  console.log('6. Sel            :', breakdown.salt?.score !== undefined ? breakdown.salt.score + '/100' : 'VIDE', '-', breakdown.salt?.value || '?', 'g/100g');
  console.log('7. Eco-Score      :', breakdown.ecoScore?.score !== undefined ? breakdown.ecoScore.score + '/100' : 'VIDE', '- Grade', breakdown.ecoScore?.grade || '?');
  console.log('8. Labels         :', breakdown.labels?.score !== undefined ? breakdown.labels.score + '/100' : 'VIDE', '-', breakdown.labels?.isBio ? 'Bio' : 'Non bio');
  
  console.log('\n' + '='.repeat(80));
  
  // Compteur composantes remplies
  const filled = Object.values(breakdown).filter(item => item.score !== undefined).length;
  console.log('\n✅ COMPOSANTES REMPLIES :', filled, '/ 8');
  
  if (filled === 8) {
    console.log('🎉 SUCCÈS COMPLET - Scoring scientifique 8 composantes opérationnel !');
  } else {
    console.log('⚠️  Il manque encore', 8 - filled, 'composantes');
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

finalTest().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
