require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const axios = require('axios');

async function importCosmetics(limit = 50) {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('? MongoDB connecté');

  const categories = ['shampoos', 'face-creams', 'shower-gels', 'deodorants', 'toothpastes'];
  let imported = 0;

  for (const category of categories) {
    console.log(`\n?? Import catégorie: ${category}`);
    
    try {
      const { data } = await axios.get(
        `https://world.openbeautyfacts.org/category/${category}.json?page_size=${limit/categories.length}`
      );

      for (const obfProduct of data.products || []) {
        const product = {
          barcode: obfProduct.code,
          name: obfProduct.product_name || obfProduct.product_name_en,
          brand: obfProduct.brands,
          category: 'cosmetics',
          imageUrl: obfProduct.image_url,
          cosmeticsData: {
            inciList: obfProduct.ingredients_text,
            ingredients: (obfProduct.ingredients || []).map(i => ({
              inci: i.text || i.id,
              function: i.function || 'Unknown',
              origin: 'unknown'
            })),
            certifications: obfProduct.labels_tags || []
          }
        };

        await Product.updateOne(
          { barcode: product.barcode },
          { $set: product },
          { upsert: true }
        );
        
        imported++;
        if (imported % 10 === 0) console.log(`  ? ${imported} produits importés`);
      }
    } catch (err) {
      console.error(`? Erreur ${category}:`, err.message);
    }
  }

  console.log(`\n? Total: ${imported} cosmétiques importés`);
  process.exit(0);
}

importCosmetics(50).catch(console.error);
