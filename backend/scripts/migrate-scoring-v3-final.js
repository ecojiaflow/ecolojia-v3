require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const scoringUnified = require('../src/services/scoringUnified');

console.log('\n🔄 MIGRATION SCORING V3.0.0 - RECALCUL MASSIF\n');
console.log('=' .repeat(60));

async function migrateAllScores() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');
    
    // Récupérer tous les produits food
    const products = await Product.find({ category: 'food' }).lean();
    console.log(`📦 ${products.length} produits à recalculer\n`);
    
    let updated = 0;
    let errors = 0;
    let skipped = 0;
    
    const startTime = Date.now();
    
    // Traiter par batch de 100
    const batchSize = 100;
    const totalBatches = Math.ceil(products.length / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, products.length);
      const batch = products.slice(start, end);
      
      console.log(`\n📊 Batch ${i + 1}/${totalBatches} (${start + 1}-${end})`);
      
      for (const product of batch) {
        try {
          // Préparer données pour scoring
          const nutritionalInfo = product.foodData?.nutritionalInfo || {};
          
          const scoringData = {
            novaGroup: product.foodData?.novaGroup || product.nova_group,
            nutriScore: product.foodData?.nutriScore || product.nutriscore_grade,
            ecoScore: product.foodData?.ecoScore || product.ecoscore_grade,
            additives: (product.foodData?.additives || product.additives_tags || []).map(a => 
              typeof a === 'object' ? (a.code || a.tag || a) : a
            ),
            labels: product.foodData?.labels || product.labels_tags || [],
            packaging: product.packaging || '',
            origin: product.origins || '',
            ingredients: product.foodData?.ingredients || product.ingredients_text || '',
            nutriments: {
              sugars_100g: nutritionalInfo.sugars,
              'saturated-fat_100g': nutritionalInfo.saturatedFat,
              salt_100g: nutritionalInfo.salt
            }
          };
          
          // Calculer scores
          const calculatedScores = scoringUnified.calculateFoodScores(scoringData);
          
          // Mise à jour directe MongoDB
          await Product.updateOne(
            { _id: product._id },
            {
              $set: {
                'scores.overallScore': calculatedScores.overallScore,
                'scores.healthScore': calculatedScores.healthScore,
                'scores.environmentScore': calculatedScores.environmentScore,
                'scores.breakdown': calculatedScores.breakdown,
                'scores.confidence': calculatedScores.confidence,
                'scores.dataCompleteness': calculatedScores.dataCompleteness,
                'scores.calculatedAt': new Date(),
                'scores.scoringVersion': '3.0.0'
              }
            }
          );
          
          updated++;
          
        } catch (err) {
          errors++;
          if (errors <= 5) {
            console.error(`   ❌ Erreur ${product.name || product.barcode}: ${err.message}`);
          }
        }
      }
      
      // Afficher progression
      const progress = Math.round((end / products.length) * 100);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const remaining = Math.round((elapsed / end) * (products.length - end));
      
      console.log(`   ✅ ${updated} produits mis à jour (${progress}%)`);
      console.log(`   ⏱️  Temps écoulé: ${elapsed}s | Restant: ~${remaining}s`);
      
      // Pause entre batches
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Rapport final
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT FINAL');
    console.log('='.repeat(60));
    console.log(`✅ Produits mis à jour : ${updated}`);
    console.log(`❌ Erreurs : ${errors}`);
    console.log(`⏭️  Ignorés : ${skipped}`);
    console.log(`📈 Taux de succès : ${((updated / products.length) * 100).toFixed(1)}%`);
    console.log(`⏱️  Temps total : ${totalTime}s (${Math.round(totalTime / 60)}min)`);
    
    // Vérification Nutella
    console.log('\n🧪 VÉRIFICATION NUTELLA :');
    const nutella = await Product.findOne({ barcode: '3017620422003' });
    if (nutella) {
      console.log(`   Score global : ${nutella.scores.overallScore}/100`);
      console.log(`   Confiance : ${Math.round(nutella.scores.confidence * 100)}%`);
      
      const filledCount = Object.keys(nutella.scores.breakdown || {}).length;
      console.log(`   Composantes : ${filledCount}/8`);
      
      if (nutella.scores.overallScore !== 50 && filledCount === 8) {
        console.log('\n🎉🎉🎉 MIGRATION RÉUSSIE ! 🎉🎉🎉\n');
      }
    }
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

migrateAllScores();
