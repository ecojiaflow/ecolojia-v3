require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => Product.deleteMany({ 'foodData.novaGroup': { $exists: false } }))
  .then(result => {
    console.log(`🗑️ ${result.deletedCount} anciens produits supprimés`);
    process.exit(0);
  });
