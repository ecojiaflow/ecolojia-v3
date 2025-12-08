require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function checkNutButterTags() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const nutellaTags = ['chocolate', 'hazelnut', 'spread', 'sweet', 'snack'];
  console.log('\n🎯 Tags Nutella:', nutellaTags);
  console.log('\n🔍 Vérification purées score ≥70:\n');
  
  // Purées de noisettes
  const hazelnut = await Product.find({
    name: /purée.*noisette/i,
    'scores.overallScore': { $gte: 70 }
  }).select('name scores.overallScore tags');
  
  console.log(`PURÉES DE NOISETTES (${hazelnut.length}):`);
  hazelnut.forEach(p => {
    const common = p.tags.filter(t => nutellaTags.includes(t));
    console.log(`  ${p.name} (${p.scores.overallScore}/100)`);
    console.log(`    Tags: ${p.tags.join(', ')}`);
    console.log(`    Communs (${common.length}): ${common.join(', ')}`);
  });
  
  // Beurres de cacahuètes avec chocolat
  const peanutChoc = await Product.find({
    name: /beurre.*cacahuète/i,
    tags: 'chocolate',
    'scores.overallScore': { $gte: 70 }
  }).select('name scores.overallScore tags');
  
  console.log(`\nBEURRES CACAHUÈTE CHOCOLAT (${peanutChoc.length}):`);
  peanutChoc.forEach(p => {
    const common = p.tags.filter(t => nutellaTags.includes(t));
    console.log(`  ${p.name} (${p.scores.overallScore}/100)`);
    console.log(`    Tags: ${p.tags.join(', ')}`);
    console.log(`    Communs (${common.length}): ${common.join(', ')}`);
  });
  
  process.exit(0);
}

checkNutButterTags();
