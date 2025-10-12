require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function recalcNutella() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté');
  
  const nutella = await Product.findOne({ barcode: '3017620422003' });
  if (!nutella) {
    console.log('❌ Nutella introuvable');
    process.exit(1);
  }
  
  console.log('🔄 Recalcul Nutella avec scoringUnified v3.0.0...');
  
  // Forcer recalcul
  nutella.scores = undefined;
  await nutella.save();
  
  // Recharger
  const updated = await Product.findOne({ barcode: '3017620422003' });
  
  console.log('\n📊 NOUVEAU BREAKDOWN :');
  console.log(JSON.stringify(updated.scores.breakdown, null, 2));
  console.log('\n✅ Score global :', updated.scores.overallScore, '/100');
  console.log('✅ Confiance :', Math.round(updated.scores.confidence * 100), '%');
  
  await mongoose.disconnect();
  process.exit(0);
}

recalcNutella().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
