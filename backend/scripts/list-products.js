const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function listProducts() {
  await mongoose.connect(process.env.MONGODB_URI);

  console.log('\n📦 LISTE PRODUITS DISPONIBLES\n');

  const products = await Product.find({})
    .select('name brand scores.overall scores.novaGroup')
    .limit(30)
    .lean();

  products.forEach((p, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${p.name.substring(0, 50).padEnd(50)} | Score: ${(p.scores?.overall || 'N/A').toString().padStart(3)} | NOVA: ${p.scores?.novaGroup || 'N/A'}`);
  });

  console.log(`\n✅ Total produits : ${await Product.countDocuments()}\n`);

  await mongoose.disconnect();
}

listProducts().catch(console.error);
