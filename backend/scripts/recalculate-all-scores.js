// backend/scripts/recalculate-all-scores.js
/**
 * Script de migration pour recalculer tous les scores avec la nouvelle version
 * Usage: node scripts/recalculate-all-scores.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const { calculateFoodScores } = require('../src/services/scoringUnified');

const CURRENT_VERSION = '3.1.0';
const BATCH_SIZE = 100;

// Helper function from ocr-analyze.routes.js
function prepareScoringData(product) {
  const productObj = product.toObject ? product.toObject() : product;
  const foodData = productObj.foodData || {};
  const nutriments = (foodData && foodData.nutrition && foodData.nutrition.per100g)
    || (productObj && productObj.nutrition && productObj.nutrition.per100g)
    || {};

  return {
    product_name: productObj.name,
    brands: productObj.brand,
    ingredients_text: foodData.ingredients,
    nova_group: foodData.novaGroup || productObj.nova_group,
    nutriscore_grade: foodData.nutriScore || productObj.nutriscore_grade,
    ecoscore_grade: foodData.ecoScore || productObj.ecoscore_grade,
    additives_tags: foodData.additives || productObj.additives_tags || [],
    labels_tags: foodData.labels || productObj.labels_tags || [],
    nutriments: nutriments
  };
}

async function recalculateAllScores() {
  try {
    console.log('[Migration] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Migration] Connected successfully');

    // Count products needing recalculation
    const totalProducts = await Product.countDocuments({
      category: 'food',
      $or: [
        { 'scores.scoringVersion': { $ne: CURRENT_VERSION } },
        { 'scores.scoringVersion': { $exists: false } },
        { scores: { $exists: false } }
      ]
    });

    console.log(`[Migration] Found ${totalProducts} products to recalculate`);

    if (totalProducts === 0) {
      console.log('[Migration] All products already up to date!');
      process.exit(0);
    }

    let processed = 0;
    let updated = 0;
    let errors = 0;

    // Process in batches
    while (processed < totalProducts) {
      const products = await Product.find({
        category: 'food',
        $or: [
          { 'scores.scoringVersion': { $ne: CURRENT_VERSION } },
          { 'scores.scoringVersion': { $exists: false } },
          { scores: { $exists: false } }
        ]
      })
      .limit(BATCH_SIZE)
      .lean();

      console.log(`\n[Migration] Processing batch ${Math.floor(processed / BATCH_SIZE) + 1}...`);

      for (const product of products) {
        try {
          const scoringData = prepareScoringData(product);
          const scores = calculateFoodScores(scoringData);

          await Product.updateOne(
            { _id: product._id },
            {
              $set: {
                scores: {
                  ...scores,
                  scoringVersion: CURRENT_VERSION,
                  calculatedAt: new Date()
                },
                updatedAt: new Date()
              }
            }
          );

          updated++;
          
          if (updated % 50 === 0) {
            console.log(`[Migration] Progress: ${updated}/${totalProducts} (${Math.round(updated/totalProducts*100)}%)`);
          }
        } catch (error) {
          console.error(`[Migration] Error processing product ${product.barcode}:`, error.message);
          errors++;
        }
      }

      processed += products.length;
    }

    console.log('\n[Migration] ====================================');
    console.log(`[Migration] Migration completed!`);
    console.log(`[Migration] Total processed: ${processed}`);
    console.log(`[Migration] Successfully updated: ${updated}`);
    console.log(`[Migration] Errors: ${errors}`);
    console.log('[Migration] ====================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Migration] Fatal error:', error);
    process.exit(1);
  }
}

// Run migration
console.log('\n========================================');
console.log('ECOLOJIA - Score Recalculation Migration');
console.log(`Target version: ${CURRENT_VERSION}`);
console.log('========================================\n');

recalculateAllScores();
