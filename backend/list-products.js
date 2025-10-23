// backend/list-products.js
const mongoose = require('mongoose');
require('dotenv').config();

// IMPORTANT: Importer le modÃ¨le Product existant
const Product = require('./src/models/Product');

async function listProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const products = await Product.find()
    .select('name brand nutriscore_grade nova_group barcode')
    .limit(20)
    .sort({ name: 1 });
  
  console.log('\nÃ°Å¸â€œÂ¦ PRODUITS DANS LA BASE:');
  console.log('========================');
  
  products.forEach(p => {
    console.log(`${p.name || 'Sans nom'} (${p.brand || 'Sans marque'})`);
    console.log(`  Ã°Å¸â€œÅ  Nutri-Score: ${p.nutriscore_grade || 'N/A'} | NOVA: ${p.nova_group || 'N/A'}`);
    console.log(`  Ã°Å¸â€Â¢ Code: ${p.barcode}`);
    console.log('');
  });
  
  const total = await Product.countDocuments();
  console.log(`\nTotal: ${total} produits`);
  
  process.exit(0);
}

listProducts();