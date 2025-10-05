const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const algoliasearch = require('algoliasearch');
require('dotenv').config();

async function indexToAlgolia() {
  console.log('Indexation Algolia...\n');
  
  await mongoose.connect(process.env.MONGODB_URI);
  
  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_ADMIN_API_KEY  // <-- Corrigé ici
  );
  const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME);
  
  const products = await Product.find({
    barcode: { $exists: true, $ne: '' },
    imageUrl: { $regex: /openfoodfacts\.org/ }
  }).lean();
  
  console.log(`${products.length} produits à indexer\n`);
  
  const objects = products.map(p => ({
    objectID: p.barcode,
    name: p.name,
    brand: p.brand,
    barcode: p.barcode,
    category: p.category || 'food',
    images: [p.imageUrl],
    nutriScore: p.nutriScore,
    nova: p.novaGroup,
    ecoScore: p.ecoScore
  }));
  
  await index.saveObjects(objects);
  console.log(`✅ ${objects.length} produits indexés dans Algolia`);
  
  await mongoose.disconnect();
  process.exit(0);
}

indexToAlgolia().catch(console.error);