require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => Product.find({}))
  .then(products => {
    console.log(`\n📦 ${products.length} produits dans la base:\n`);
    products.forEach(p => {
      console.log(`- ${p.name} (${p.brand}) - NOVA ${p.foodData?.novaGroup || '?'}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });
