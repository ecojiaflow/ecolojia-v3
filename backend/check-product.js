// backend/check-product.js
const mongoose = require('mongoose');
require('dotenv').config();

async function checkProduct() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Utiliser directement la collection
  const db = mongoose.connection.db;
  const collection = db.collection('products');
  
  // Trouver le Nutella
  const nutella = await collection.findOne({ barcode: '3017620425035' });
  
  console.log('Nutella dans la base:');
  console.log(JSON.stringify(nutella, null, 2));
  
  process.exit(0);
}

checkProduct();