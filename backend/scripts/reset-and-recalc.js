require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const scoringUnified = require('../src/services/scoringUnified');

async function resetAndRecalculate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté\n');
  
  // SUPPRIMER tous les scores v3.0.0 (anciens)
  const result = await Product.updateMany(
    { 'scores.scoringVersion': '3.0.0' },
    { $unset: { scores: '' } }
  );
  console.log('🗑️  Scores v3.0.0 supprimés:', result.modifiedCount, 'produits\n');
  
  // Recalculer les 100 premiers produits
  const products = await Product.find({ category: 'food' }).limit(100);
  console.log('📦 Recalcul', products.length, 'produits...\n');
  
  let updated = 0;
  for (const product of products) {
    try {
      product.scores = undefined;
      await product.save(); // Middleware calcule
      updated++;
      if (updated % 20 === 0) console.log('   ✅', updated, 'produits mis à jour...');
    } catch (err) {
      console.error('   ❌ Erreur', product.name, ':', err.message);
    }
  }
  
  console.log('\n✅ Recalcul terminé:', updated, '/', products.length);
  
  // Tester Nutella
  const nutella = await Product.findOne({ barcode: '3017620422003' });
  console.log('\n📊 TEST NUTELLA :');
  console.log('Score global :', nutella.scores.overallScore, '/100');
  console.log('Confiance :', Math.round(nutella.scores.confidence * 100), '%');
  console.log('\nBreakdown (8 composantes) :');
  Object.keys(nutella.scores.breakdown).forEach(key => {
    const item = nutella.scores.breakdown[key];
    console.log('  -', key, ':', item.score !== undefined ? item.score + '/100' : 'vide');
  });
  
  await mongoose.disconnect();
  process.exit(0);
}

resetAndRecalculate().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
