// backend/scripts/enrich-nutrition-from-off.js
// Enrichissement nutrition depuis OpenFoodFacts API
// Respecte rate limiting : 100 req/min

const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// Schema produit
const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const Product = mongoose.model('Product', ProductSchema);

// Configuration
const RATE_LIMIT = 100; // Max 100 requêtes/minute
const DELAY_MS = (60 * 1000) / RATE_LIMIT; // ~600ms entre requêtes
const BATCH_SIZE = 100; // Sauvegarder tous les 100 produits
const MAX_RETRIES = 3;

// Stats globales
const stats = {
  total: 0,
  processed: 0,
  enriched: 0,
  notFound: 0,
  errors: 0,
  skipped: 0,
  startTime: Date.now()
};

// Log des erreurs
const errorLog = [];

// Fonction sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction fetch OpenFoodFacts avec retry
async function fetchFromOFF(barcode, retries = MAX_RETRIES) {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'ECOLOJIA-V3/3.0.0 (enrichment script)',
      }
    });

    if (response.data.status === 1 && response.data.product) {
      return response.data.product;
    }
    return null;

  } catch (error) {
    if (retries > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
      console.log(`   ⚠️ Retry ${MAX_RETRIES - retries + 1}/${MAX_RETRIES} pour ${barcode}`);
      await sleep(2000); // Attendre 2s avant retry
      return fetchFromOFF(barcode, retries - 1);
    }
    throw error;
  }
}

// Extraire nutrition depuis produit OFF
function extractNutrition(offProduct) {
  const nutriments = offProduct.nutriments || {};
  
  return {
    per100g: {
      sugars: nutriments.sugars_100g || nutriments.sugars || 0,
      salt: nutriments.salt_100g || nutriments.salt || (nutriments.sodium_100g ? nutriments.sodium_100g * 2.5 : 0),
      saturatedFat: nutriments['saturated-fat_100g'] || nutriments['saturated_fat_100g'] || nutriments.saturated_fat || 0,
      energy: nutriments['energy-kcal_100g'] || nutriments.energy_kcal || nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0,
      fiber: nutriments.fiber_100g || nutriments.fiber || 0,
      protein: nutriments.proteins_100g || nutriments.protein_100g || nutriments.protein || 0
    }
  };
}

// Enrichir un produit
async function enrichProduct(product) {
  try {
    // Vérifier si déjà enrichi
    if (product.foodData?.nutrition?.per100g?.sugars !== undefined) {
      stats.skipped++;
      return { updated: false, reason: 'already-enriched' };
    }

    // Vérifier barcode
    if (!product.barcode) {
      stats.skipped++;
      return { updated: false, reason: 'no-barcode' };
    }

    // Fetch OpenFoodFacts
    const offProduct = await fetchFromOFF(product.barcode);
    
    if (!offProduct) {
      stats.notFound++;
      errorLog.push({ barcode: product.barcode, error: 'not-found-on-off' });
      return { updated: false, reason: 'not-found' };
    }

    // Extraire nutrition
    const nutrition = extractNutrition(offProduct);
    
    // Vérifier si données valides
    const hasValidData = nutrition.per100g.sugars > 0 || 
                         nutrition.per100g.salt > 0 || 
                         nutrition.per100g.saturatedFat > 0 ||
                         nutrition.per100g.energy > 0;

    if (!hasValidData) {
      stats.notFound++;
      return { updated: false, reason: 'no-nutrition-data' };
    }

    // Mettre à jour en DB
    await Product.updateOne(
      { _id: product._id },
      { 
        $set: { 
          'foodData.nutrition': nutrition,
          nutritionEnrichedAt: new Date(),
          nutritionSource: 'openfoodfacts'
        } 
      }
    );

    stats.enriched++;
    return { updated: true, nutrition };

  } catch (error) {
    stats.errors++;
    errorLog.push({ 
      barcode: product.barcode, 
      productId: product._id,
      error: error.message 
    });
    return { updated: false, reason: 'error', error: error.message };
  }
}

// Fonction principale
async function enrichNutrition() {
  console.log('\n🔄 ENRICHISSEMENT NUTRITION DEPUIS OPENFOODFACTS');
  console.log('═'.repeat(70));
  console.log(`📊 Rate limit: ${RATE_LIMIT} req/min (${DELAY_MS}ms entre requêtes)`);
  console.log(`🔄 Retry automatique: ${MAX_RETRIES} tentatives`);
  console.log(`💾 Sauvegarde batch: tous les ${BATCH_SIZE} produits\n`);

  try {
    // Connexion DB
    console.log('📡 Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté\n');

    // Compter produits food sans nutrition
    const query = {
      category: 'food',
      barcode: { $exists: true, $ne: null },
      'foodData.nutrition.per100g.sugars': { $exists: false }
    };

    stats.total = await Product.countDocuments(query);
    console.log(`📦 Produits à enrichir: ${stats.total}\n`);

    if (stats.total === 0) {
      console.log('✅ Tous les produits sont déjà enrichis !');
      return;
    }

    // Estimation durée
    const estimatedMinutes = Math.ceil((stats.total * DELAY_MS) / (60 * 1000));
    console.log(`⏱️ Durée estimée: ${estimatedMinutes} minutes\n`);
    console.log('🔄 Enrichissement en cours...\n');

    // Traiter par batch
    const batchSize = 50;
    for (let skip = 0; skip < stats.total; skip += batchSize) {
      const products = await Product.find(query)
        .skip(skip)
        .limit(batchSize)
        .lean();

      for (const product of products) {
        const result = await enrichProduct(product);
        stats.processed++;

        // Afficher progression tous les 50 produits
        if (stats.processed % 50 === 0) {
          const percent = ((stats.processed / stats.total) * 100).toFixed(1);
          const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
          const rate = (stats.processed / elapsed * 60).toFixed(1);
          
          console.log(`   ${stats.processed}/${stats.total} (${percent}%) - ` +
                     `Enrichis: ${stats.enriched}, Non trouvés: ${stats.notFound}, ` +
                     `Erreurs: ${stats.errors}, Déjà ok: ${stats.skipped} - ` +
                     `${rate} prod/min`);
        }

        // Rate limiting
        await sleep(DELAY_MS);
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ ENRICHISSEMENT TERMINÉ\n');
    
    // Stats finales
    const duration = Math.floor((Date.now() - stats.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    console.log('📊 Statistiques:');
    console.log(`   Total traités: ${stats.processed}`);
    console.log(`   ✅ Enrichis: ${stats.enriched}`);
    console.log(`   ⚠️ Non trouvés OFF: ${stats.notFound}`);
    console.log(`   ❌ Erreurs: ${stats.errors}`);
    console.log(`   ⏭️ Déjà enrichis: ${stats.skipped}`);
    console.log(`   ⏱️ Durée: ${minutes}m ${seconds}s`);
    console.log(`   📈 Taux succès: ${((stats.enriched/stats.processed)*100).toFixed(1)}%\n`);

    // Sauvegarder log erreurs
    if (errorLog.length > 0) {
      fs.writeFileSync(
        'enrichment-errors.json',
        JSON.stringify(errorLog, null, 2)
      );
      console.log(`⚠️ ${errorLog.length} erreurs loggées dans enrichment-errors.json\n`);
    }

  } catch (error) {
    console.error('\n❌ ERREUR ENRICHISSEMENT:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB\n');
  }
}

// Lancer enrichissement
enrichNutrition();
