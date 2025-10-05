const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const algoliasearch = require('algoliasearch');
require('dotenv').config();

async function reindex() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_ADMIN_API_KEY
  );
  const index = client.initIndex('products');
  
  // 1. VIDER l'index
  console.log('Vidage Algolia...');
  await index.clearObjects();
  console.log('✅ Index vidé\n');
  
  // 2. Prendre UNIQUEMENT les produits avec vraies images OFF
  const products = await Product.find({
    imageUrl: { $regex: /openfoodfacts\.org/ }
  }).lean();
  
  console.log(`${products.length} produits avec images OFF\n`);
  
  // 3. Indexer
  const objects = products.map(p => ({
    objectID: p.barcode,
    name: p.name,
    brand: p.brand,
    barcode: p.barcode,
    category: p.category || 'food',
    images: [p.imageUrl],  // Array avec l'image
    imageUrl: p.imageUrl,  // Et aussi en direct
    nutriScore: p.nutriScore,
    nova: p.novaGroup,
    ecoScore: p.ecoScore
  }));
  
  await index.saveObjects(objects);
  
  console.log(`✅ ${objects.length} produits réindexés avec images\n`);
  
  // 4. Vérifier
  const check = await index.getObject(products[0].barcode);
  console.log('Vérification:');
  console.log(`  ${check.name}`);
  console.log(`  Image: ${check.imageUrl}`);
  
  await mongoose.disconnect();
  process.exit(0);
}

reindex();