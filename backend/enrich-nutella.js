require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function enrichNutella() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  await Product.findByIdAndUpdate('692e0566120bb9dda7394a53', {
    tags: ['chocolate', 'hazelnut', 'spread', 'sweet', 'snack'],
    subcategory: 'chocolate-spread'
  });
  
  console.log('✅ Nutella enrichi avec tags et subcategory');
  
  const nutella = await Product.findById('692e0566120bb9dda7394a53');
  console.log('Nutella tags:', nutella.tags);
  console.log('Nutella subcategory:', nutella.subcategory);
  
  process.exit(0);
}

enrichNutella();
