// PATH: backend/scripts/remigrate-scores-final.js
// Re-migration avec nouveau scoring engine PHASE 7-BIS

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../src/models/Product');
const { calculateFoodScores, calculateCosmeticScores, calculateDetergentScores } = require('../src/services/scoringEngine');

async function remigrateScores() {
  console.log('\n🔄 RE-MIGRATION SCORES - Nouveau scoring engine\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');
    
    const products = await Product.find({});
    console.log(`📦 ${products.length} produits à recalculer\n`);
    
    let success = 0;
    let errors = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        let newScores;
        
        if (product.category === 'food' || product.foodData) {
          newScores = calculateFoodScores({
            novaGroup: product.foodData?.novaGroup,
            nutriScore: product.foodData?.nutriScore,
            ecoScore: product.foodData?.ecoScore,
            additives: product.foodData?.additives || [],
            allergens: product.foodData?.allergens || [],
            labels: product.foodData?.labels || []
          });
        } else if (product.category === 'cosmetics' || product.cosmeticsData) {
          newScores = calculateCosmeticScores(product.cosmeticsData || {});
        } else if (product.category === 'detergents' || product.detergentsData) {
          newScores = calculateDetergentScores(product.detergentsData || {});
        } else {
          // Fallback
          newScores = { overallScore: 50, healthScore: 50, environmentScore: 50 };
        }
        
        await Product.updateOne(
          { _id: product._id },
          {
            $set: {
              'scores.overallScore': newScores.overallScore || 50,
              'scores.healthScore': newScores.healthScore || 50,
              'scores.environmentScore': newScores.environmentScore || 50,
              'scores.calculatedAt': new Date(),
              'scores.scoringVersion': '3.0.1'
            }
          }
        );
        
        success++;
        
        if ((i + 1) % 100 === 0) {
          console.log(`⏳ ${i + 1}/${products.length} (${Math.round((i+1)/products.length*100)}%)`);
        }
        
      } catch (err) {
        console.error(`❌ Erreur ${product.barcode}: ${err.message}`);
        errors++;
      }
    }
    
    console.log('\n=== RÉSUMÉ ===');
    console.log(`✅ Succès: ${success}`);
    console.log(`❌ Erreurs: ${errors}`);
    console.log(`📊 Total: ${products.length}\n`);
    
    await mongoose.disconnect();
    console.log('✅ Re-migration terminée !\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

remigrateScores();
