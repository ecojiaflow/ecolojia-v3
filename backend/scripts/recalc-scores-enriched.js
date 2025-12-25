const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const { calculateScores } = require('../src/services/scoringUnified');
require('dotenv').config();

async function recalculateScores() {
  console.log('\n🔄 RECALCUL SCORES - 997 PRODUITS ENRICHIS\n');
  
  await mongoose.connect(process.env.MONGODB_URI);

  const enrichedProducts = await Product.find({
    estimated: true,
    'nutrition.energy_kcal': { $exists: true }
  }).lean();

  console.log(`📦 ${enrichedProducts.length.toLocaleString()} produits à scorer\n`);

  let success = 0, errors = 0;
  const scoreDistribution = { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 };

  for (const product of enrichedProducts) {
    try {
      const scores = calculateScores(product);
      
      // ⚡ CORRECTION : overallScore pas overall
      if (scores && scores.overallScore !== undefined && scores.overallScore > 0) {
        await Product.updateOne(
          { _id: product._id },
          { $set: { scores } }
        );
        
        const score = scores.overallScore;
        if (score < 20) scoreDistribution['0-20']++;
        else if (score < 40) scoreDistribution['20-40']++;
        else if (score < 60) scoreDistribution['40-60']++;
        else if (score < 80) scoreDistribution['60-80']++;
        else scoreDistribution['80-100']++;
        
        success++;
      } else {
        errors++;
      }
    } catch (e) {
      console.error(`[Error] ${product._id}: ${e.message}`);
      errors++;
    }

    if (success % 100 === 0 && success > 0) {
      console.log(`  ✅ ${success}/${enrichedProducts.length}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ SCORING TERMINÉ');
  console.log('='.repeat(50));
  console.log(`Succès: ${success.toLocaleString()}`);
  console.log(`Erreurs: ${errors.toLocaleString()}\n`);
  
  if (success > 0) {
    console.log('📊 DISTRIBUTION SCORES:\n');
    Object.entries(scoreDistribution).forEach(([range, count]) => {
      const pct = ((count / success) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(pct / 2));
      console.log(`  ${range}: ${count.toLocaleString()} (${pct}%) ${bar}`);
    });
  }
  console.log('='.repeat(50) + '\n');

  await mongoose.disconnect();
}

recalculateScores().catch(console.error);
