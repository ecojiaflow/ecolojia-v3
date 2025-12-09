require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const nutella = await Product.findOne({ 
    name: { $regex: /Biscuits Nutella B-ready/i } 
  }).lean();
  
  console.log('=== VÉRIFICATION POST-MIGRATION ===\n');
  console.log('Produit:', nutella.name);
  console.log('✅ scoringVersion:', nutella.scores?.scoringVersion);
  console.log('✅ overallScore:', nutella.scores?.overallScore);
  console.log('✅ calculatedAt:', nutella.scores?.calculatedAt);
  console.log('\n✅ Breakdown présent:', nutella.scores?.breakdown ? 'OUI' : 'NON');
  
  if (nutella.scores?.breakdown) {
    console.log('\nComposantes V3.2.0:');
    Object.entries(nutella.scores.breakdown).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value.score}/100 (weight: ${value.weight})`);
    });
  }
  
  process.exit(0);
}

verify().catch(console.error);
