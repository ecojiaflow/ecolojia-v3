require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function checkProdTags() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('\n🔍 VÉRIFICATION MONGODB PROD:\n');
  
  // Nutella
  const nutella = await Product.findById('691780b7c56dd19f3eddfc2e');
  console.log('=== NUTELLA ===');
  console.log('Nom:', nutella?.name);
  console.log('Tags:', nutella?.tags);
  console.log('Subcategory:', nutella?.subcategory);
  
  // Purées de noisettes
  const hazelnut = await Product.find({
    name: /purée.*noisette/i,
    'scores.overallScore': { $gte: 70 }
  }).select('name tags').limit(3);
  
  console.log('\n=== PURÉES DE NOISETTES (3 exemples) ===');
  hazelnut.forEach(p => {
    console.log(`${p.name}: tags=${JSON.stringify(p.tags)}`);
  });
  
  // Total produits avec tags
  const withTags = await Product.countDocuments({
    tags: { $exists: true, $ne: [] }
  });
  const total = await Product.countDocuments();
  
  console.log(`\n=== STATS TAGS ===`);
  console.log(`Total produits: ${total}`);
  console.log(`Avec tags: ${withTags} (${((withTags/total)*100).toFixed(1)}%)`);
  
  process.exit(0);
}

checkProdTags();
