const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product');
const scoringEngine = require('./src/services/scoringEngine');

async function rescore() {
  console.log('\n🔄 Connexion...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté\n');
  
  const cosmetics = await Product.find({ category: 'cosmetics' });
  console.log(`🧴 ${cosmetics.length} cosmétiques à rescorer...\n`);
  
  let rescored = 0;
  for (const p of cosmetics) {
    try {
      const inci = p.cosmeticsData?.ingredients?.map(i => i.inci || i) || [];
      
      const scores = scoringEngine.calculateCosmeticScores({
        ingredients: inci,
        allergens: p.cosmeticsData?.allergens || [],
        endocrineDisruptors: p.cosmeticsData?.endocrineDisruptors || [],
        certifications: p.cosmeticsData?.certifications || [],
        biodegradability: 50,
        packaging: 'plastic',
        origin: 'unknown',
        crueltyFree: false
      });
      
      await Product.updateOne(
        { _id: p._id },
        { $set: { 
          'scores.overallScore': scores.overallScore || 50,
          'scores.healthScore': scores.healthScore || 50,
          'scores.environmentScore': scores.environmentScore || 50,
          'scores.confidence': scores.confidence || 0.5,
          'scores.breakdown': scores.breakdown || {},
          'scores.calculatedAt': new Date()
        }}
      );
      
      rescored++;
      process.stdout.write('.');
      
    } catch (e) {
      console.error(`\n❌ ${p.barcode}:`, e.message);
    }
  }
  
  console.log(`\n✅ ${rescored} produits rescorés\n`);
  
  const stats = await Product.aggregate([
    { $match: { category: 'cosmetics' } },
    { $group: { _id: null, avg: { $avg: '$scores.overallScore' }, 
      min: { $min: '$scores.overallScore' }, max: { $max: '$scores.overallScore' } } }
  ]);
  
  if (stats[0]) {
    console.log('📊 SCORES COSMÉTIQUES :');
    console.log(`   Moyen: ${Math.round(stats[0].avg)}/100`);
    console.log(`   Min: ${Math.round(stats[0].min)}/100`);
    console.log(`   Max: ${Math.round(stats[0].max)}/100`);
  }
  
  process.exit(0);
}

rescore().catch(e => { console.error('❌', e); process.exit(1); });
