require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function findAlternatives() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Tags Nutella
  const nutellaTags = ['chocolate', 'hazelnut', 'spread', 'sweet', 'snack'];
  
  console.log('\n🔍 RECHERCHE ALTERNATIVES POUR NUTELLA');
  console.log('Tags recherchés:', nutellaTags);
  console.log('Score minimum: 70\n');
  
  // Chercher produits avec tags similaires
  const alternatives = await Product.find({
    tags: { $in: nutellaTags },
    'scores.overallScore': { $gte: 70 },
    categoryType: 'food'
  }).select('name barcode tags scores.overallScore').limit(20);
  
  console.log(`✅ ${alternatives.length} produits trouvés:\n`);
  
  alternatives.forEach(p => {
    const commonTags = p.tags.filter(t => nutellaTags.includes(t));
    console.log(`${p.name} (${p.scores.overallScore}/100)`);
    console.log(`  Tags communs (${commonTags.length}): ${commonTags.join(', ')}`);
    console.log(`  Tous tags: ${p.tags.join(', ')}`);
    console.log('');
  });
  
  process.exit(0);
}

findAlternatives();
