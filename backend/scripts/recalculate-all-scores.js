// backend/scripts/recalculate-all-scores.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const scoringUnified = require('../src/services/scoringUnified');

console.log('🔄 RECALCUL MASSIF DES SCORES - ECOLOJIA V3.0.0');
console.log('='.repeat(60));

async function recalculateAllScores() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');
    
    let updated = 0;
    let errors = 0;
    
    const products = await Product.find({ category: 'food' }).lean();
    console.log('📦 ' + products.length + ' produits à traiter\n');
    
    const batchSize = 50;
    const totalBatches = Math.ceil(products.length / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, products.length);
      const batch = products.slice(start, end);
      
      console.log('📊 Batch ' + (i + 1) + '/' + totalBatches + ' (' + (start + 1) + '-' + end + ')');
      
      for (const product of batch) {
        try {
          const scores = scoringUnified.calculateFoodScores({
            novaGroup: product.nova_group || product.foodData?.novaGroup,
            nutriScore: product.nutriscore_grade || product.foodData?.nutriScore,
            ecoScore: product.ecoscore_grade || product.foodData?.ecoScore,
            additives: product.additives_tags || product.foodData?.additives || [],
            labels: product.labels_tags || product.foodData?.labels || [],
            packaging: product.packaging || product.packaging_tags?.[0],
            origin: product.origins || product.origins_tags?.[0],
            ingredients: product.ingredients_text || product.foodData?.ingredients,
            nutriments: product.nutriments || product.foodData?.nutritionalInfo || {}
          });
          
          await Product.updateOne(
            { _id: product._id },
            {
              '': {
                'scores.overallScore': scores.overallScore,
                'scores.healthScore': scores.healthScore,
                'scores.environmentScore': scores.environmentScore,
                'scores.breakdown': scores.breakdown,
                'scores.confidence': scores.confidence,
                'scores.dataCompleteness': scores.dataCompleteness,
                'scores.calculatedAt': new Date(),
                'scores.scoringVersion': '3.0.0'
              }
            }
          );
          
          updated++;
          
          if (updated % 100 === 0) {
            console.log('   ✅ ' + updated + '/' + products.length + ' produits mis à jour...');
          }
          
        } catch (err) {
          errors++;
          console.error('   ❌ Erreur ' + product.name + ': ' + err.message);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAPPORT FINAL');
    console.log('='.repeat(60));
    console.log('✅ Produits mis à jour : ' + updated);
    console.log('❌ Erreurs : ' + errors);
    console.log('📈 Taux de succès : ' + ((updated / products.length) * 100).toFixed(1) + '%');
    console.log('\n✅ Recalcul terminé avec succès!');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

recalculateAllScores();
