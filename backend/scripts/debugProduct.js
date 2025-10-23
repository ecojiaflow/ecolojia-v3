require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => Product.findOne({ name: /Nutella/i }))
  .then(product => {
    console.log('\n🔍 Détails du produit Nutella:\n');
    console.log(JSON.stringify(product, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });
