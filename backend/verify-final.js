require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const total = await Product.countDocuments();
  const withTags = await Product.countDocuments({ tags: { $exists: true, $ne: [] }});
  const withoutTags = await Product.countDocuments({ $or: [{ tags: { $exists: false }}, { tags: { $size: 0 }}]});
  
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  ÉTAT FINAL BASE                         ║');
  console.log('╚══════════════════════════════════════════╝\n');
  console.log(`Total produits:     ${total.toLocaleString()}`);
  console.log(`✅ Avec tags:       ${withTags.toLocaleString()} (${((withTags/total)*100).toFixed(1)}%)`);
  console.log(`⚠️  Sans tags:       ${withoutTags.toLocaleString()} (${((withoutTags/total)*100).toFixed(1)}%)`);
  
  // Test Nutella
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  TEST NUTELLA                            ║');
  console.log('╚══════════════════════════════════════════╝\n');
  
  const nutella = await Product.findById('691780b7c56dd19f3eddfc2e');
  console.log(`Nutella (${nutella.scores.overallScore}/100):`);
  console.log(`  Tags: ${nutella.tags.join(', ')}`);
  console.log(`  Subcategory: ${nutella.subcategory}`);
  
  // Alternatives
  const alternatives = await Product.find({
    categoryType: 'food',
    tags: { $in: nutella.tags },
    'scores.overallScore': { $gte: 70 },
    _id: { $ne: nutella._id }
  })
  .select('name tags scores.overallScore')
  .sort({ 'scores.overallScore': -1 })
  .limit(5);
  
  console.log('\n🎯 Alternatives trouvées:');
  alternatives.forEach(p => {
    const common = p.tags.filter(t => nutella.tags.includes(t));
    console.log(`  • ${p.name} (${p.scores.overallScore}/100) - ${common.length} tags communs: ${common.join(', ')}`);
  });
  
  process.exit(0);
}

verify().catch(console.error);
