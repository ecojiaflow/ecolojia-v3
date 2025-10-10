const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../src/models/Product');
const { calculateFoodScores } = require('../src/services/scoringEngine');

async function migrateV3() {
  console.log('\n🔄 MIGRATION V3 - BREAKDOWN COMPLET\n');
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté\n');
  
  const products = await Product.find({});
  console.log(`📦 ${products.length} produits\n`);
  
  let success = 0;
  let errors = 0;
  
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    
    try {
      const scores = calculateFoodScores({
        novaGroup: p.foodData?.novaGroup,
        nutriScore: p.foodData?.nutriScore,
        ecoScore: p.foodData?.ecoScore,
        additives: p.foodData?.additives || [],
        allergens: p.foodData?.allergens || [],
        labels: p.foodData?.labels || []
      });
      
      // CRITIQUE: Mettre à jour BREAKDOWN aussi !
      await Product.updateOne(
        { _id: p._id },
        {
          $set: {
            'scores.overallScore': scores.overallScore,
            'scores.healthScore': scores.healthScore,
            'scores.environmentScore': scores.environmentScore,
            'scores.breakdown': scores.breakdown || {},
            'scores.calculatedAt': new Date(),
            'scores.scoringVersion': '3.0.1-final'
          }
        }
      );
      
      success++;
      
      if ((i + 1) % 100 === 0) {
        console.log(`⏳ ${i + 1}/${products.length} (${Math.round((i+1)/products.length*100)}%)`);
      }
      
    } catch (err) {
      console.error(`❌ ${p.barcode}: ${err.message}`);
      errors++;
    }
  }
  
  console.log('\n=== RÉSUMÉ V3 ===');
  console.log(`✅ Succès: ${success}`);
  console.log(`❌ Erreurs: ${errors}`);
  console.log(`📊 Total: ${products.length}\n`);
  
  await mongoose.disconnect();
  console.log('✅ Migration v3 terminée !\n');
}

migrateV3();
