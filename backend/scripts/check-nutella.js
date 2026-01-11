require('dotenv').config();
const mongoose = require('mongoose');

async function checkNutella() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');
  
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
  
  const nutella = await Product.findOne({ barcode: '3017620422003' })
    .select('name subcategory tags ingredients_text')
    .lean();
  
  console.log('📦 NUTELLA - Données actuelles:');
  console.log(`   Nom: ${nutella.name}`);
  console.log(`   Subcategory: ${nutella.subcategory}`);
  console.log(`   Tags: ${JSON.stringify(nutella.tags)}`);
  console.log(`   Ingrédients: ${(nutella.ingredients_text || '').substring(0, 100)}...`);
  
  // Vérifier les alternatives "chocolate-spread"
  const chocolateSpreads = await Product.find({ subcategory: 'chocolate-spread' })
    .select('name subcategory scores.overallScore')
    .limit(5)
    .lean();
  
  console.log('\n📦 Produits "chocolate-spread" en base:');
  if (chocolateSpreads.length === 0) {
    console.log('   ❌ AUCUN produit avec subcategory "chocolate-spread"');
  } else {
    chocolateSpreads.forEach(p => {
      console.log(`   - ${p.name} (score: ${p.scores?.overallScore})`);
    });
  }
  
  // Vérifier tous les spreads
  const allSpreads = await Product.find({ subcategory: 'spread' })
    .select('name subcategory scores.overallScore constitution.healthReflex.level')
    .sort({ 'scores.overallScore': -1 })
    .limit(10)
    .lean();
  
  console.log('\n📦 Top 10 spreads par score:');
  allSpreads.forEach(p => {
    const level = p.constitution?.healthReflex?.level || '?';
    console.log(`   - ${p.name} | Score: ${p.scores?.overallScore} | Niveau: ${level}`);
  });
  
  await mongoose.disconnect();
}

checkNutella().catch(console.error);
