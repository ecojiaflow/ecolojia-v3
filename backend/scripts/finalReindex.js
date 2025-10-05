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
  
  console.log('Vidage...');
  await index.clearObjects();
  
  const products = await Product.find({
    imageUrl: { $regex: /openfoodfacts\.org/ }
  }).lean();
  
  console.log(`Indexation de ${products.length} produits...\n`);
  
  // Mapping exact qui fonctionne
  const objects = products.map(p => ({
    objectID: p.barcode,
    name: p.name,
    brand: p.brand,
    barcode: p.barcode,
    category: p.category || 'food',
    imageUrl: p.imageUrl,
    images: [p.imageUrl],
    nutriScore: p.nutriScore,
    nova: p.novaGroup
  }));
  
  await index.saveObjects(objects);
  console.log(`✅ ${objects.length} indexés\n`);
  
  // Vérifier directement dans Algolia
  await new Promise(r => setTimeout(r, 1000)); // Attendre indexation
  const check = await index.getObject(products[0].barcode);
  console.log('Vérif Algolia:');
  console.log(`  ${check.name}`);
  console.log(`  imageUrl: ${check.imageUrl}`);
  console.log(`  images[0]: ${check.images?.[0]}`);
  
  await mongoose.disconnect();
  process.exit(0);
}

reindex();