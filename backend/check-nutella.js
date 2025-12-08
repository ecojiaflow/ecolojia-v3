require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function checkNutella() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const nutella = await Product.findById('692e0566120bb9dda7394a53');
  console.log('Nutella tags:', nutella?.tags);
  console.log('Nutella subcategory:', nutella?.subcategory);
  console.log('Nutella categoryType:', nutella?.categoryType);
  
  process.exit(0);
}

checkNutella();
