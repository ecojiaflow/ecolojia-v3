const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const product = await Product.findOne({
    barcode: '3178530421224'
  }).lean();
  
  console.log('Produit MongoDB:');
  console.log('  imageUrl:', product.imageUrl);
  console.log('  Type:', typeof product.imageUrl);
  
  // Ce qui sera envoyé à Algolia
  const algoliaObject = {
    objectID: product.barcode,
    name: product.name,
    brand: product.brand,
    imageUrl: product.imageUrl,
    images: [product.imageUrl]
  };
  
  console.log('\nObjet Algolia:');
  console.log(JSON.stringify(algoliaObject, null, 2));
  
  await mongoose.disconnect();
  process.exit(0);
}

debug();