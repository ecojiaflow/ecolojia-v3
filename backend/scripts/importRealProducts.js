const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('../src/models/Product');
require('dotenv').config();

async function fetchFromOFF(barcode) {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const { data } = await axios.get(url, { timeout: 7000 });
    
    if (data.status !== 1 || !data.product) return null;
    
    const p = data.product;
    return {
      name: p.product_name,
      brand: p.brands?.split(',')[0]?.trim(),
      ingredients: p.ingredients_text,
      nutriScore: p.nutriscore_grade?.toUpperCase(),
      novaGroup: p.nova_group,
      ecoScore: p.ecoscore_grade?.toUpperCase(),
      imageUrl: p.image_url,
      additivesTags: p.additives_tags || []
    };
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
    return null;
  }
}

const BARCODES = [
  '3017620422003', '3270190207641', '3270160471690', '3228857000166',
  '5449000000996', '3168930010883', '3245390313416', '8076809513012',
  '3038350000019', '7622210449283', '3560071175900', '3560070462933',
  '3596710396269', '3029330003533', '3168930009467', '3250391682348',
  '20724696', '3229820129488', '3270160671267', '3017620429712'
];

async function importProducts() {
  console.log('🚀 Import depuis OpenFoodFacts...\n');
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté\n');
  
  let imported = 0;
  
  for (const barcode of BARCODES) {
    console.log(`📦 ${barcode}...`);
    
    const offData = await fetchFromOFF(barcode);
    
    if (!offData) {
      console.log('  ⏭️  Non trouvé\n');
      continue;
    }
    
    const product = await Product.findOneAndUpdate(
      { barcode },
      {
        barcode,
        name: offData.name || 'Sans nom',
        brand: offData.brand || 'Inconnu',
        category: 'food',
        imageUrl: offData.imageUrl || '/placeholder-image.jpg',
        nutriScore: offData.nutriScore,
        novaGroup: offData.novaGroup,
        ecoScore: offData.ecoScore,
        additivesTags: offData.additivesTags,
        foodData: {
          ingredients: offData.ingredients
        },
        source: 'openfoodfacts',
        lastEnriched: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log(`  ✅ ${product.name}`);
    console.log(`     Nutri: ${offData.nutriScore || 'N/A'} | Nova: ${offData.novaGroup || 'N/A'}`);
    console.log(`     Image: ${offData.imageUrl ? '✓' : '✗'}\n`);
    
    imported++;
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n✨ ${imported}/${BARCODES.length} produits importés`);
  await mongoose.disconnect();
  process.exit(0);
}

importProducts().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});