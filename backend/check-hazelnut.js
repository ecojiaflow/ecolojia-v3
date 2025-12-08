require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('\n🔍 PURÉES DE NOISETTES:\n');
  
  const hazelnut = await Product.find({
    name: /purée.*noisette/i,
    'scores.overallScore': { $gte: 70 }
  })
  .select('name tags subcategory scores.overallScore')
  .sort({ 'scores.overallScore': -1 })
  .limit(10);
  
  hazelnut.forEach(p => {
    console.log(`${p.name} (${p.scores.overallScore}/100)`);
    console.log(`  Tags: ${p.tags?.join(', ') || 'AUCUN'}`);
    console.log(`  Subcategory: ${p.subcategory || 'AUCUNE'}\n`);
  });
  
  process.exit(0);
}

check().catch(console.error);
