const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const withOFFImages = await Product.find({
    imageUrl: { $regex: /openfoodfacts\.org/ }
  }).lean();
  
  console.log(`Produits avec images OFF: ${withOFFImages.length}\n`);
  
  withOFFImages.slice(0, 3).forEach(p => {
    console.log(`${p.name}`);
    console.log(`  Barcode: ${p.barcode}`);
    console.log(`  Image: ${p.imageUrl}\n`);
  });
  
  await mongoose.disconnect();
  process.exit(0);
}

check();