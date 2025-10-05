const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('../src/models/Product');
const additiveService = require('../src/services/additiveEnrichment.service');
require('dotenv').config();

const BARCODES = [
  '3017620422003', '5449000000996', '3228857000166', '3270190207641',
  '7622210449283', '3168930010883', '3245390313416', '8076809513012',
  '3038350000019', '3560071175900', '3560070462933', '3596710396269',
  '3029330003533', '3168930009467', '3250391682348', '20724696',
  '3229820129488', '3270160671267', '3017620429712', '3270160471690',
  '8711327531314', '3083680085908', '3228881000804', '3274080005003',
  '3045320073379', '3274080005607', '3228857001873', '3017620425035'
];

async function fetchOFF(barcode) {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const { data } = await axios.get(url, { timeout: 10000 });
    
    if (data.status !== 1 || !data.product) return null;
    
    const p = data.product;
    
    // ✅ Enrichissement automatique des additifs
    const enrichedAdditives = additiveService.enrichAdditives(p.additives_tags || []);
    
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
        allergens: p.allergens_tags || [],
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
  
  for (const barcode of BARCODES) {
    const data = await fetchOFF(barcode);
    
    if (data) {
      await Product.findOneAndUpdate(
        { barcode },
        { $set: data },
        { upsert: true, new: true }
      );
      
      const additivesCount = data.foodData.additives.length;
      const highRisk = data.foodData.additives.filter(a => 
        a.riskLevel === 'HIGH' || a.riskLevel === 'VERY_HIGH'
      ).length;
      
      console.log(`✅ ${data.name} - NOVA ${data.foodData.novaGroup || '?'} - ${additivesCount} additifs${highRisk > 0 ? ` (⚠️ ${highRisk} à risque)` : ''}`);
      imported++;
    } else {
      console.log(`❌ ${barcode} - Non trouvé`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\nImport terminé: ${imported}/${BARCODES.length} produits enrichis`);
  process.exit(0);
}

importAll().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
