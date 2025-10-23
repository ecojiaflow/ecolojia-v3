// backend/scripts/recalculate-scores.js
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const scoringUnified = require('../src/services/scoringUnified');
require('dotenv').config();

async function recalculateAllScores() {
  console.log('ðŸ”„ MIGRATION - Recalcul des scores pour tous les produits');
  console.log('================================================\n');

  try {
    // Connexion MongoDB
    console.log('ðŸ“Š Connexion Ã  MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('âœ… MongoDB connectÃ©\n');

    // Compter les produits
    const totalProducts = await Product.countDocuments();
    console.log(`ðŸ“¦ Total produits Ã  recalculer : ${totalProducts}\n`);

    // Traiter par batch de 100
    const batchSize = 100;
    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (let skip = 0; skip < totalProducts; skip += batchSize) {
      const products = await Product.find()
        .skip(skip)
        .limit(batchSize)
        .lean();

      console.log(`\nðŸ”„ Batch ${Math.floor(skip / batchSize) + 1}/${Math.ceil(totalProducts / batchSize)}`);
      
      for (const product of products) {
        try {
          // PrÃ©parer les donnÃ©es pour le scoring
          const scoringData = {
            novaGroup: product.foodData?.novaGroup,
            nutriScore: product.foodData?.nutriScore,
            ecoScore: product.foodData?.ecoScore,
            additives: product.foodData?.additives || [],
            labels: product.foodData?.labels || [],
            allergens: product.foodData?.allergens || [],
            nutriments: product.foodData?.nutrition?.per100g || {}
          };

          // Recalculer les scores selon la catÃ©gorie
          let newScores;
          if (product.category === 'cosmetics') {
            newScores = scoringUnified.calculateCosmeticScores(scoringData);
          } else if (product.category === 'detergents') {
            newScores = scoringUnified.calculateDetergentScores(scoringData);
          } else {
            newScores = scoringUnified.calculateFoodScores(scoringData);
          }

          // Mettre Ã  jour le produit
          await Product.updateOne(
            { _id: product._id },
            { 
              $set: { 
                scores: newScores,
                lastScoreUpdate: new Date(),
                scoringVersion: '3.0.0'
              }
            }
          );

          processed++;
          updated++;
          
          // Log tous les 50 produits
          if (processed % 50 === 0) {
            const progress = ((processed / totalProducts) * 100).toFixed(1);
            console.log(`   âœ… ${processed}/${totalProducts} (${progress}%) - ${updated} mis Ã  jour, ${errors} erreurs`);
          }

        } catch (error) {
          errors++;
          console.error(`   âŒ Erreur produit ${product.barcode}: ${error.message}`);
        }
      }
    }

    console.log('\n================================================');
    console.log('âœ… MIGRATION TERMINÃ‰E');
    console.log(`ðŸ“Š RÃ©sultats :`);
    console.log(`   - Total traitÃ©s : ${processed}`);
    console.log(`   - Mis Ã  jour : ${updated}`);
    console.log(`   - Erreurs : ${errors}`);
    console.log(`   - Taux de succÃ¨s : ${((updated / processed) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('\nâŒ ERREUR MIGRATION:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nðŸ”Œ Connexion MongoDB fermÃ©e');
  }
}

// Lancer la migration
recalculateAllScores()
  .then(() => {
    console.log('\nâœ… Script terminÃ© avec succÃ¨s');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nâŒ Script terminÃ© avec erreur:', error);
    process.exit(1);
  });