require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function checkEnrichment() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const total = await Product.countDocuments({ category: 'food' });
  const withAiEstimations = await Product.countDocuments({
    'scores.aiEstimations': { $exists: true, $ne: null }
  });
  const withHighConfidence = await Product.countDocuments({
    'scores.confidence': { $gte: 0.7 }
  });
  
  console.log(`   Total produits food: ${total}`);
  console.log(`   Avec estimations IA: ${withAiEstimations} (${Math.round(withAiEstimations/total*100)}%)`);
  console.log(`   Avec confiance ≥70%: ${withHighConfidence} (${Math.round(withHighConfidence/total*100)}%)`);
  
  await mongoose.disconnect();
  process.exit(0);
}

checkEnrichment();
