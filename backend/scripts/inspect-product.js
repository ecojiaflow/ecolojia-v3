const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function inspectProduct() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Prendre 1 produit "enrichi"
  const product = await Product.findOne({ estimated: true }).lean();

  console.log('\n🔍 INSPECTION PRODUIT "ENRICHI"\n');
  console.log(JSON.stringify(product, null, 2));

  await mongoose.disconnect();
}

inspectProduct().catch(console.error);
