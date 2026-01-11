require('dotenv').config();
const mongoose = require('mongoose');

async function fixChocolateSpreads() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB\n');
  
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
  
  // Patterns pour détecter les pâtes à tartiner chocolatées
  const chocolatePatterns = /nutella|chocolat|cacao|noisette|hazelnut|nocilla|ovomaltine|banania/i;
  
  // Trouver tous les spreads qui sont en fait des chocolate-spreads
  const spreadsToFix = await Product.find({
    subcategory: 'spread',
    $or: [
      { name: chocolatePatterns },
      { ingredients_text: chocolatePatterns }
    ]
  }).select('barcode name subcategory tags ingredients_text').lean();
  
  console.log(`📦 ${spreadsToFix.length} spreads chocolatés à corriger:\n`);
  
  let fixed = 0;
  for (const product of spreadsToFix) {
    console.log(`   Fixing: ${product.name}`);
    
    // Nouveaux tags
    const newTags = new Set(product.tags || []);
    newTags.add('chocolat');
    if (/noisette|hazelnut/i.test(product.name + product.ingredients_text)) {
      newTags.add('noisette');
    }
    if (/cacao/i.test(product.name + product.ingredients_text)) {
      newTags.add('cacao');
    }
    
    await Product.updateOne(
      { barcode: product.barcode },
      {
        $set: {
          subcategory: 'chocolate-spread',
          tags: Array.from(newTags)
        }
      }
    );
    fixed++;
  }
  
  console.log(`\n✅ ${fixed} produits corrigés (spread → chocolate-spread)`);
  
  // Vérifier Nutella
  const nutella = await Product.findOne({ barcode: '3017620422003' })
    .select('name subcategory tags')
    .lean();
  
  console.log('\n📦 Nutella après fix:');
  console.log(`   Subcategory: ${nutella.subcategory}`);
  console.log(`   Tags: ${JSON.stringify(nutella.tags)}`);
  
  await mongoose.disconnect();
}

fixChocolateSpreads().catch(console.error);
