require('dotenv').config();
const mongoose = require('mongoose');

async function fixSkyr() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
  
  const result = await Product.updateOne(
    { barcode: '3033490004743' },
    { $set: { subcategory: 'yogurt' } }
  );
  
  console.log('Skyr corrige:', result.modifiedCount ? 'OK' : 'Deja fait');
  await mongoose.disconnect();
}

fixSkyr();
