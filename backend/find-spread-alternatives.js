require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function findSpreadAlternatives() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('\n🔍 RECHERCHE ALTERNATIVES À TARTINER SAINES\n');
  
  // Chercher purées de fruits à coque
  const nutButters = await Product.find({
    $or: [
      { name: /purée.*noisette/i },
      { name: /purée.*amande/i },
      { name: /beurre.*cacahuète/i },
      { name: /beurre.*amande/i },
      { name: /tahini/i }
    ],
    'scores.overallScore': { $gte: 70 }
  }).select('name scores.overallScore tags').limit(10);
  
  console.log(`✅ PURÉES DE FRUITS À COQUE (${nutButters.length}):`);
  nutButters.forEach(p => {
    console.log(`  ${p.name} (${p.scores.overallScore}/100) - Tags: ${p.tags.join(', ')}`);
  });
  
  // Chercher compotes
  const compotes = await Product.find({
    name: /compote/i,
    'scores.overallScore': { $gte: 75 }
  }).select('name scores.overallScore tags').limit(10);
  
  console.log(`\n✅ COMPOTES (${compotes.length}):`);
  compotes.forEach(p => {
    console.log(`  ${p.name} (${p.scores.overallScore}/100) - Tags: ${p.tags.join(', ')}`);
  });
  
  // Chercher confitures sans sucre ajouté
  const jams = await Product.find({
    name: /confiture/i,
    'scores.overallScore': { $gte: 70 }
  }).select('name scores.overallScore tags').limit(10);
  
  console.log(`\n✅ CONFITURES (${jams.length}):`);
  jams.forEach(p => {
    console.log(`  ${p.name} (${p.scores.overallScore}/100) - Tags: ${p.tags.join(', ')}`);
  });
  
  // Chercher miel
  const honey = await Product.find({
    name: /miel/i,
    'scores.overallScore': { $gte: 70 }
  }).select('name scores.overallScore tags').limit(5);
  
  console.log(`\n✅ MIEL (${honey.length}):`);
  honey.forEach(p => {
    console.log(`  ${p.name} (${p.scores.overallScore}/100) - Tags: ${p.tags.join(', ')}`);
  });
  
  process.exit(0);
}

findSpreadAlternatives();
