const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('../src/models/Product');
const additiveService = require('../src/services/additiveEnrichment.service');
const allergenService = require('../src/services/allergenEnrichment.service');
require('dotenv').config();

async function updateProduct(barcode) {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const { data } = await axios.get(url, { timeout: 10000 });
    
    if (data.status !== 1 || !data.product) return false;
    
    const p = data.product;
    const enrichedAdditives = additiveService.enrichAdditives(p.additives_tags || []);
    const enrichedAllergens = allergenService.enrichAllergens(p.allergens_tags || []);
    
    await Product.findOneAndUpdate(
      { barcode },
      { 
        $set: {
          'foodData.additives': enrichedAdditives,
          'foodData.allergens': enrichedAllergens,
          'foodData.novaGroup': p.nova_group || null,
          'foodData.nutriScore': p.nutriscore_grade?.toUpperCase() || null,
          'foodData.ecoScore': p.ecoscore_grade?.toUpperCase() || null,
          'foodData.ingredients': p.ingredients_text_fr || p.ingredients_text || '',
          'foodData.labels': p.labels_tags || []
        }
      }
    );
    
    return true;
  } catch (err) {
    console.error(`Erreur ${barcode}:`, err.message);
    return false;
  }
}

async function updateAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const products = await Product.find({ category: 'food' }).select('barcode name');
  
  console.log(`🔄 Mise à jour de ${products.length} produits...\n`);
  
  let updated = 0;
  for (const prod of products) {
    if (await updateProduct(prod.barcode)) {
      console.log(`✅ ${prod.name} mis à jour`);
      updated++;
    }
    await new Promise(r => setTimeout(r, 800));
  }
  
  console.log(`\n📊 ${updated}/${products.length} produits mis à jour`);
  process.exit(0);
}

updateAll().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
