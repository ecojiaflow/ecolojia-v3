const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const axios = require('axios');
require('dotenv').config();

async function importCosmetics() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🧴 Import cosmétiques OpenBeautyFacts...');
  
  const categories = ['shampoos', 'shower-gels', 'deodorants', 'face-creams', 'body-lotions', 'toothpastes'];
  let imported = 0;
  
  for (const cat of categories) {
    console.log(`\n📦 ${cat}...`);
    try {
      const { data } = await axios.get(`https://world.openbeautyfacts.org/category/${cat}.json`, { 
        params: { page_size: 200 }, timeout: 10000 
      });
      
      for (const p of (data.products || [])) {
        if (!p.code || !p.product_name || await Product.exists({ barcode: p.code })) continue;
        
        await Product.create({
          barcode: p.code,
          name: p.product_name,
          brand: p.brands || 'Unknown',
          category: 'cosmetics',
          subcategory: cat,
          imageUrl: p.image_url || p.image_small_url,
          cosmeticsData: {
            inciList: p.ingredients_text || ''
          }
        });
        
        imported++;
        if (imported % 50 === 0) console.log(`  ✅ ${imported}`);
      }
    } catch (error) {
      console.error(`  ❌ ${cat}: ${error.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n🎉 Importés: ${imported}`);
  await mongoose.disconnect();
  process.exit(0);
}

importCosmetics().catch(console.error);
