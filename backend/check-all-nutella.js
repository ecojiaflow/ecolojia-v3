require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function checkAllNutella() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const nutellas = await Product.find({ name: /nutella/i });
  
  console.log(`\n📊 ${nutellas.length} produits Nutella trouvés:\n`);
  
  nutellas.forEach(n => {
    console.log(`ID: ${n._id}`);
    console.log(`  Nom: ${n.name}`);
    console.log(`  Score: ${n.scores?.overallScore}/100`);
    console.log(`  Tags: ${JSON.stringify(n.tags)}`);
    console.log(`  Subcategory: ${n.subcategory}`);
    console.log(`  Barcode: ${n.barcode}`);
    console.log('');
  });
  
  process.exit(0);
}

checkAllNutella();
