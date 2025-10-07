// backend/scripts/migrate-scores-v3.js
// Migration complète scoring V3 - Recalcule tous les produits en DB

const mongoose = require('mongoose');
const { calculateFoodScores, calculateCosmeticScores, calculateDetergentScores } = require('../src/services/scoringEngine');
require('dotenv').config();

// Schema produit simplifié
const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const Product = mongoose.model('Product', ProductSchema);

async function migrateScores() {
  try {
    console.log('\n🔄 MIGRATION SCORING V3');
    console.log('═'.repeat(70));
    
    // Connexion
    console.log('\n📡 Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à la base');

    // Compter produits
    const totalProducts = await Product.countDocuments();
    console.log(`\n📊 Total produits en base: ${totalProducts}`);

    // Récupérer produits par batch (éviter surcharge mémoire)
    const batchSize = 500;
    let processed = 0;
    let updated = 0;
    let errors = 0;

    console.log('\n🔄 Recalcul des scores...\n');

    for (let skip = 0; skip < totalProducts; skip += batchSize) {
      const products = await Product.find({})
        .skip(skip)
        .limit(batchSize)
        .lean(); // Optimisation mémoire

      for (const product of products) {
        try {
          const category = product.category || 'food';
          let newScores;

          if (category === 'food') {
            newScores = calculateFoodScores({
              novaGroup: product.foodData?.novaGroup || product.nova_group,
              nutriScore: product.foodData?.nutriScore || product.nutriscore_grade,
              ecoScore: product.foodData?.ecoScore || product.ecoscore_grade,
              additives: product.foodData?.additives || product.additives_tags || [],
              allergens: product.foodData?.allergens || product.allergens_tags || [],
              labels: product.foodData?.labels || product.labels_tags || [],
              packaging: product.packaging || product.packaging_tags,
              origin: product.origin || product.countries || product.manufacturing_places,
              nutrition: {
                per100g: {
                  sugars: product.nutriments?.sugars_100g || 0,
                  salt: product.nutriments?.salt_100g || 0,
                  saturatedFat: product.nutriments?.['saturated-fat_100g'] || 0,
                  energy: product.nutriments?.['energy-kcal_100g'] || 0,
                  fiber: product.nutriments?.fiber_100g || 0,
                  protein: product.nutriments?.proteins_100g || 0
                }
              },
              ingredients_text: product.ingredients_text || ''
            });
          } else if (category === 'cosmetics') {
            newScores = calculateCosmeticScores(product);
          } else {
            newScores = calculateDetergentScores(product);
          }

          // Mise à jour en DB
          await Product.updateOne(
            { _id: product._id },
            { 
              $set: { 
                scores: newScores,
                scoringVersion: '3.0.0',
                lastScoreUpdate: new Date()
              } 
            }
          );

          updated++;
          processed++;

          // Afficher progression tous les 100 produits
          if (processed % 100 === 0) {
            const percent = ((processed / totalProducts) * 100).toFixed(1);
            console.log(`   Progression: ${processed}/${totalProducts} (${percent}%) - ${updated} mis à jour, ${errors} erreurs`);
          }

        } catch (err) {
          errors++;
          if (errors <= 5) { // Afficher seulement 5 premières erreurs
            console.error(`   ⚠️ Erreur produit ${product._id}: ${err.message}`);
          }
        }
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ MIGRATION TERMINÉE\n');
    console.log(`📊 Statistiques:`);
    console.log(`   Total traités: ${processed}`);
    console.log(`   Mis à jour: ${updated}`);
    console.log(`   Erreurs: ${errors}`);
    console.log(`   Taux succès: ${((updated/processed)*100).toFixed(1)}%\n`);

  } catch (error) {
    console.error('\n❌ ERREUR MIGRATION:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB\n');
  }
}

// Lancer migration
migrateScores();
