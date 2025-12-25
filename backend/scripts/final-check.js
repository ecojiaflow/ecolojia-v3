const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function quickCheck() {
  await mongoose.connect(process.env.MONGODB_URI);

  const stats = {
    total: await Product.countDocuments(),
    enriched: await Product.countDocuments({ estimated: true }),
    withScores: await Product.countDocuments({ 
      'scores.overallScore': { $exists: true, $gt: 0 } 
    })
  };

  console.log('\n✅ ÉTAT FINAL BASE DE DONNÉES\n');
  console.log('='.repeat(50));
  console.log(`Total produits: ${stats.total.toLocaleString()}`);
  console.log(`Produits enrichis: ${stats.enriched.toLocaleString()}`);
  console.log(`Produits avec scores: ${stats.withScores.toLocaleString()}`);
  console.log('='.repeat(50));
  
  console.log('\n🎯 PRÊT POUR:');
  console.log('  ✅ Développement M2-M6');
  console.log('  ✅ Tests API complets');
  console.log('  ✅ Tests alternatives');
  console.log('  ✅ Génération contenu automatisé\n');

  await mongoose.disconnect();
}

quickCheck().catch(console.error);
