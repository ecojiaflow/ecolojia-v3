require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function checkCategoryType() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Vérifier purées de noisettes
  const hazelnut = await Product.find({
    name: /purée.*noisette/i,
    'scores.overallScore': { $gte: 70 }
  }).select('name categoryType').limit(5);
  
  console.log('\n🔍 CategoryType des purées de noisettes:\n');
  hazelnut.forEach(p => {
    console.log(`${p.name}: categoryType = "${p.categoryType}"`);
  });
  
  // Vérifier beurres cacahuète
  const peanut = await Product.find({
    name: /beurre.*cacahuète/i,
    tags: 'chocolate',
    'scores.overallScore': { $gte: 70 }
  }).select('name categoryType').limit(3);
  
  console.log('\n🔍 CategoryType des beurres cacahuète:\n');
  peanut.forEach(p => {
    console.log(`${p.name}: categoryType = "${p.categoryType}"`);
  });
  
  process.exit(0);
}

checkCategoryType();
