const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const fs = require('fs');
require('dotenv').config();

async function createMapping() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('=== CRÉATION MAPPING TAGS → SUBCATEGORY ===\n');
  
  // 1. Récupérer produits avec subcategory
  const productsWithSub = await Product.find({
    subcategory: { $exists: true, $ne: null, $ne: '' },
    tags: { $exists: true, $not: { $size: 0 } }
  }).select('subcategory tags categoryType').lean();
  
  console.log(`Produits analysés: ${productsWithSub.length}\n`);
  
  // 2. Construire mapping
  const mapping = {};
  
  productsWithSub.forEach(p => {
    // Trier tags pour créer clé unique
    const tagKey = p.tags.sort().join('|');
    
    if (!mapping[tagKey]) {
      mapping[tagKey] = {
        subcategory: p.subcategory,
        categoryType: p.categoryType,
        count: 0,
        examples: []
      };
    }
    
    mapping[tagKey].count++;
    if (mapping[tagKey].examples.length < 3) {
      mapping[tagKey].examples.push(p.subcategory);
    }
  });
  
  // 3. Créer mapping par tags individuels (plus flexible)
  const tagToSubcategory = {};
  
  productsWithSub.forEach(p => {
    p.tags.forEach(tag => {
      if (!tagToSubcategory[tag]) {
        tagToSubcategory[tag] = {};
      }
      
      if (!tagToSubcategory[tag][p.subcategory]) {
        tagToSubcategory[tag][p.subcategory] = 0;
      }
      
      tagToSubcategory[tag][p.subcategory]++;
    });
  });
  
  // 4. Pour chaque tag, garder la subcategory la plus fréquente
  const simplifiedMapping = {};
  
  Object.keys(tagToSubcategory).forEach(tag => {
    const subcategories = tagToSubcategory[tag];
    const sorted = Object.entries(subcategories)
      .sort((a, b) => b[1] - a[1]);
    
    simplifiedMapping[tag] = {
      primary: sorted[0][0],
      count: sorted[0][1],
      alternatives: sorted.slice(1, 3).map(s => ({ name: s[0], count: s[1] }))
    };
  });
  
  // 5. Export
  const output = {
    exactMapping: mapping,
    tagMapping: simplifiedMapping,
    stats: {
      totalProducts: productsWithSub.length,
      uniqueTagCombinations: Object.keys(mapping).length,
      uniqueTags: Object.keys(simplifiedMapping).length
    }
  };
  
  fs.writeFileSync(
    'scripts/tags-subcategory-mapping.json',
    JSON.stringify(output, null, 2),
    'utf8'
  );
  
  console.log('=== MAPPING CRÉÉ ===');
  console.log(`Combinaisons exactes: ${Object.keys(mapping).length}`);
  console.log(`Tags uniques: ${Object.keys(simplifiedMapping).length}`);
  console.log(`\nTop 10 tags → subcategory:`);
  
  Object.entries(simplifiedMapping)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .forEach(([tag, data]) => {
      console.log(`  "${tag}" → "${data.primary}" (${data.count} fois)`);
    });
  
  console.log('\n✅ Mapping exporté: scripts/tags-subcategory-mapping.json');
  
  await mongoose.disconnect();
  process.exit(0);
}

createMapping().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
