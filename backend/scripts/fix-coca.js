require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté');
  
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
  
  // Corriger Coca-Cola 1.5L
  const result = await Product.updateOne(
    { barcode: '3033490004743' },
    { $set: { subcategory: 'soda' } }
  );
  
  console.log('Coca-Cola 1.5L:', result.modifiedCount > 0 ? '✅ Corrigé' : '⚠️ Non modifié');
  
  await mongoose.disconnect();
}

fix();
