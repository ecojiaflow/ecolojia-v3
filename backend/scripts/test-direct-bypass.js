require('dotenv').config();
const mongoose = require('mongoose');

// FORCER RECHARGEMENT DU MODULE (bypass cache)
delete require.cache[require.resolve('./src/models/Product')];
delete require.cache[require.resolve('./src/services/scoringUnified')];

const Product = require('./src/models/Product');
const scoringUnified = require('./src/services/scoringUnified');

async function testDirect() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté\n');
  
  const nutella = await Product.findOne({ barcode: '3017620422003' });
  
  console.log('📊 DONNÉES NUTELLA :');
  console.log('   - foodData.novaGroup:', nutella.foodData?.novaGroup);
  console.log('   - foodData.nutriScore:', nutella.foodData?.nutriScore);
  console.log('   - foodData.ecoScore:', nutella.foodData?.ecoScore);
  console.log('   - nutritionalInfo.sugars:', nutella.foodData?.nutritionalInfo?.sugars);
  console.log('   - nutritionalInfo.saturatedFat:', nutella.foodData?.nutritionalInfo?.saturatedFat);
  console.log('   - nutritionalInfo.salt:', nutella.foodData?.nutritionalInfo?.salt);
  
  // CALCUL DIRECT (bypass middleware)
  const nutritionalInfo = nutella.foodData?.nutritionalInfo || {};
  
  const scoringData = {
    novaGroup: nutella.foodData?.novaGroup,
    nutriScore: nutella.foodData?.nutriScore,
    ecoScore: nutella.foodData?.ecoScore,
    additives: (nutella.foodData?.additives || []).map(a => a.code || a.tag || a),
    labels: nutella.foodData?.labels || [],
    packaging: nutella.packaging || '',
    origin: nutella.origins || '',
    ingredients: nutella.foodData?.ingredients || '',
    nutriments: {
      sugars_100g: nutritionalInfo.sugars,
      'saturated-fat_100g': nutritionalInfo.saturatedFat,
      salt_100g: nutritionalInfo.salt
    }
  };
  
  console.log('\n🧪 CALCUL DIRECT scoringUnified...');
  const calculatedScores = scoringUnified.calculateFoodScores(scoringData);
  
  console.log('\n📊 RÉSULTAT CALCUL :');
  console.log('   overallScore:', calculatedScores.overallScore);
  console.log('   confidence:', calculatedScores.confidence);
  console.log('\n   Breakdown:');
  Object.keys(calculatedScores.breakdown).forEach(key => {
    const item = calculatedScores.breakdown[key];
    console.log('      -', key, ':', item.score || 'VIDE');
  });
  
  // SAUVEGARDE MANUELLE
  console.log('\n💾 Sauvegarde manuelle dans MongoDB...');
  
  await Product.updateOne(
    { barcode: '3017620422003' },
    { 
      $set: { 
        scores: {
          overallScore: calculatedScores.overallScore,
          healthScore: calculatedScores.healthScore,
          environmentScore: calculatedScores.environmentScore,
          breakdown: calculatedScores.breakdown,
          confidence: calculatedScores.confidence,
          dataCompleteness: calculatedScores.dataCompleteness,
          calculatedAt: new Date(),
          scoringVersion: '3.0.0'
        }
      }
    }
  );
  
  console.log('✅ Sauvegardé !');
  
  // VÉRIFICATION
  const updated = await Product.findOne({ barcode: '3017620422003' });
  
  console.log('\n🎯 VÉRIFICATION FINALE :');
  console.log('   Score global:', updated.scores.overallScore);
  
  if (updated.scores.breakdown) {
    const filled = Object.values(updated.scores.breakdown).filter(item => item.score !== undefined).length;
    console.log('   Composantes remplies:', filled, '/ 8');
    
    if (filled === 8) {
      console.log('\n🎉🎉🎉 SUCCÈS TOTAL ! 8/8 COMPOSANTES 🎉🎉🎉\n');
    } else {
      console.log('\n⚠️  Encore', 8 - filled, 'composantes manquantes\n');
    }
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

testDirect().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
