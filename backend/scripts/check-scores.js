const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function checkScores() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const withScores = await Product.countDocuments({
    'scores.overall': { $exists: true, $ne: null }
  });
  
  const total = await Product.countDocuments();
  
  console.log(`Produits avec scores: ${withScores}/${total} (${((withScores/total)*100).toFixed(1)}%)`);
  
  await mongoose.disconnect();
}

checkScores();
