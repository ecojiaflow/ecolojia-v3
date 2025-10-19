// backend/scripts/recalculate-scores.js
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const scoringUnified = require('../src/services/scoringUnified');
require('dotenv').config();

async function recalculateAllScores() {
  console.log('🔄 MIGRATION - Recalcul des scores pour tous les produits');
  console.log('================================================\n');

  try {
    // Connexion MongoDB
    console.log('📊 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');

    // Compter les produits
    const totalProducts = await Product.countDocuments();
    console.log(`📦 Total produits à recalculer : ${totalProducts}\n`);

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

      console.log(`\n🔄 Batch ${Math.floor(skip / batchSize) + 1}/${Math.ceil(totalProducts / batchSize)}`);
      
      for (const product of products) {
        try {
          // Préparer les données pour le scoring
          const scoringData = {
            novaGroup: product.foodData?.novaGroup,
            nutriScore: product.foodData?.nutriScore,
            ecoScore: product.foodData?.ecoScore,
            additives: product.foodData?.additives || [],
            labels: product.foodData?.labels || [],
            allergens: product.foodData?.allergens || [],
            nutriments: product.foodData?.nutrition?.per100g || {}
          };

          // Recalculer les scores selon la catégorie
          let newScores;
          if (product.category === 'cosmetics') {
            newScores = scoringUnified.calculateCosmeticScores(scoringData);
          } else if (product.category === 'detergents') {
            newScores = scoringUnified.calculateDetergentScores(scoringData);
          } else {
            newScores = scoringUnified.calculateFoodScores(scoringData);
          }

          // Mettre à jour le produit
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
            console.log(`   ✅ ${processed}/${totalProducts} (${progress}%) - ${updated} mis à jour, ${errors} erreurs`);
          }

        } catch (error) {
          errors++;
          console.error(`   ❌ Erreur produit ${product.barcode}: ${error.message}`);
        }
      }
    }

    console.log('\n================================================');
    console.log('✅ MIGRATION TERMINÉE');
    console.log(`📊 Résultats :`);
    console.log(`   - Total traités : ${processed}`);
    console.log(`   - Mis à jour : ${updated}`);
    console.log(`   - Erreurs : ${errors}`);
    console.log(`   - Taux de succès : ${((updated / processed) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('\n❌ ERREUR MIGRATION:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connexion MongoDB fermée');
  }
}

// Lancer la migration
recalculateAllScores()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script terminé avec erreur:', error);
    process.exit(1);
  });