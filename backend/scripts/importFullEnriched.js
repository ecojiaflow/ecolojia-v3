const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('../src/models/Product');
const additiveService = require('../src/services/additiveEnrichment.service');
const allergenService = require('../src/services/allergenEnrichment.service');
const VALID_BARCODES = require('./validBarcodes');
require('dotenv').config();

async function fetchOFF(barcode) {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const { data } = await axios.get(url, { timeout: 10000 });
    
    if (data.status !== 1 || !data.product) return null;
    
    const p = data.product;
    
    const enrichedAdditives = additiveService.enrichAdditives(p.additives_tags || []);
    const enrichedAllergens = allergenService.enrichAllergens(p.allergens_tags || []);
    
    return {
      barcode,
      name: p.product_name || p.product_name_fr || 'Produit sans nom',
      brand: p.brands?.split(',')[0]?.trim() || 'Marque inconnue',
      category: 'food',
      imageUrl: p.image_front_url || p.image_url,
      foodData: {
        novaGroup: p.nova_group || null,
        nutriScore: p.nutriscore_grade?.toUpperCase() || null,
        ecoScore: p.ecoscore_grade?.toUpperCase() || null,
        additives: enrichedAdditives,
        allergens: enrichedAllergens,
        ingredients: p.ingredients_text_fr || p.ingredients_text || '',
        labels: p.labels_tags || []
      }
    };
  } catch (err) {
    console.error(`Erreur ${barcode}:`, err.message);
    return null;
  }
}

async function importAll() {
  console.log('Connexion MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connecté\n');
  
  let imported = 0;
  let failed = 0;
  
  for (const barcode of VALID_BARCODES) {
    const data = await fetchOFF(barcode);
    
    if (data) {
      await Product.findOneAndUpdate(
        { barcode },
        { $set: data },
        { upsert: true, new: true }
      );
      
      const highRiskAdditives = additiveService.getHighRiskAdditives(data.foodData.additives);
      const highRiskAllergens = allergenService.getHighRiskAllergens(data.foodData.allergens);
      
      let warnings = '';
      if (highRiskAdditives.length > 0) warnings += ` ⚠️ ${highRiskAdditives.length} additifs risqués`;
      if (highRiskAllergens.length > 0) warnings += ` 🔴 ${highRiskAllergens.length} allergènes graves`;
      
      console.log(`✅ ${data.name} - NOVA ${data.foodData.novaGroup || '?'}${warnings}`);
      imported++;
    } else {
      console.log(`❌ ${barcode}`);
      failed++;
    }
    
    await new Promise(r => setTimeout(r, 800));
  }
  
  console.log(`\n📊 Import terminé:`);
  console.log(`   ✅ Réussis: ${imported}`);
  console.log(`   ❌ Échoués: ${failed}`);
  console.log(`   📦 Total: ${VALID_BARCODES.length}`);
  
  process.exit(0);
}

importAll().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
