const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const scoringService = require('../src/services/scoringUnified');
require('dotenv').config();

async function calculateAllScores() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('=== M0.3 : CALCUL SCORES POUR 37,696 PRODUITS ===\n');
  
  const total = await Product.countDocuments();
  console.log(`Total produits: ${total}\n`);
  
  const stats = {
    total: total,
    processed: 0,
    success: 0,
    errors: 0,
    startTime: Date.now()
  };
  
  const batchSize = 100;
  const totalBatches = Math.ceil(total / batchSize);
  
  console.log(`Traitement par lots de ${batchSize} produits`);
  console.log(`Total lots: ${totalBatches}\n`);
  
  for (let i = 0; i < totalBatches; i++) {
    const skip = i * batchSize;
    
    const products = await Product.find()
      .skip(skip)
      .limit(batchSize)
      .lean();
    
    const bulkOps = [];
    
    for (const product of products) {
      try {
        // CORRECTION : utiliser calculateScores (avec s)
        const scores = scoringService.calculateScores(product);
        
        if (scores && scores.overallScore !== undefined) {
          bulkOps.push({
            updateOne: {
              filter: { _id: product._id },
              update: {
                $set: {
                  'scores.overall': scores.overallScore,
                  'scores.health': scores.healthScore,
                  'scores.environment': scores.environmentScore,
                  'scores.confidence': scores.confidence,
                  'scores.breakdown': scores.breakdown,
                  'scores.calculatedAt': new Date(),
                  'scores.version': scores.scoringVersion
                }
              }
            }
          });
          stats.success++;
        } else {
          stats.errors++;
        }
      } catch (error) {
        console.error(`Erreur produit ${product._id}:`, error.message);
        stats.errors++;
      }
      
      stats.processed++;
    }
    
    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }
    
    const progress = ((stats.processed / total) * 100).toFixed(1);
    const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
    const eta = stats.processed > 0 
      ? ((elapsed / stats.processed) * (total - stats.processed)).toFixed(0)
      : '?';
    
    if ((i + 1) % 10 === 0 || i === totalBatches - 1) {
      console.log(`Lot ${i + 1}/${totalBatches} | ${stats.processed}/${total} (${progress}%) | ✅ ${stats.success} | ❌ ${stats.errors} | ETA: ${eta}s`);
    }
  }
  
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(0);
  
  console.log('\n=== RÉSULTATS FINAUX ===');
  console.log(`Traités: ${stats.processed}`);
  console.log(`✅ Succès: ${stats.success} (${((stats.success/stats.total)*100).toFixed(1)}%)`);
  console.log(`❌ Erreurs: ${stats.errors} (${((stats.errors/stats.total)*100).toFixed(1)}%)`);
  console.log(`Durée: ${duration}s`);
  
  const withScores = await Product.countDocuments({
    'scores.overall': { $exists: true, $ne: null }
  });
  
  console.log(`\n=== VALIDATION ===`);
  console.log(`Produits avec scores: ${withScores}/${total} (${((withScores/total)*100).toFixed(1)}%)`);
  
  const scoreStats = await Product.aggregate([
    {
      $match: {
        'scores.overall': { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$scores.overall' },
        minScore: { $min: '$scores.overall' },
        maxScore: { $max: '$scores.overall' }
      }
    }
  ]);
  
  if (scoreStats.length > 0) {
    console.log(`\nScore moyen: ${scoreStats[0].avgScore.toFixed(1)}/100`);
    console.log(`Score min: ${scoreStats[0].minScore}/100`);
    console.log(`Score max: ${scoreStats[0].maxScore}/100`);
  }
  
  console.log('\n=== DISTRIBUTION SCORES ===');
  const distribution = await Product.aggregate([
    {
      $match: {
        'scores.overall': { $exists: true, $ne: null }
      }
    },
    {
      $bucket: {
        groupBy: '$scores.overall',
        boundaries: [0, 20, 40, 60, 80, 100],
        default: 100,
        output: {
          count: { $sum: 1 }
        }
      }
    }
  ]);
  
  distribution.forEach(bucket => {
    const range = bucket._id === 100 ? '80-100' : `${bucket._id}-${bucket._id + 20}`;
    const percent = ((bucket.count / withScores) * 100).toFixed(1);
    console.log(`  ${range}: ${bucket.count} produits (${percent}%)`);
  });
  
  if (withScores === total) {
    console.log('\n🎉 100% DES PRODUITS ONT DES SCORES !');
    console.log('✅ M0.3 VALIDÉ - Base production-ready complète');
  } else {
    console.log(`\n⚠️ ${total - withScores} produits sans scores`);
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

calculateAllScores().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
