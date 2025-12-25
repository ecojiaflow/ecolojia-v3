const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function analyzeFields() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('=== ANALYSE BASE MONGODB ===\n');
  
  // 1. Stats globales
  const total = await Product.countDocuments();
  console.log(`Total produits: ${total}\n`);
  
  // 2. Analyse subcategory
  console.log('--- SUBCATEGORY ---');
  const subNull = await Product.countDocuments({ subcategory: null });
  const subEmpty = await Product.countDocuments({ subcategory: '' });
  const subUndefined = await Product.countDocuments({ subcategory: { $exists: false } });
  const subExists = await Product.countDocuments({ 
    subcategory: { $exists: true, $ne: null, $ne: '' } 
  });
  
  console.log(`  null: ${subNull}`);
  console.log(`  "": ${subEmpty}`);
  console.log(`  undefined: ${subUndefined}`);
  console.log(`  ✅ avec valeur: ${subExists}`);
  console.log(`  % complétude: ${((subExists/total)*100).toFixed(1)}%\n`);
  
  // 3. Analyse tags
  console.log('--- TAGS ---');
  const tagsNull = await Product.countDocuments({ tags: null });
  const tagsEmpty = await Product.countDocuments({ tags: { $size: 0 } });
  const tagsUndefined = await Product.countDocuments({ tags: { $exists: false } });
  const tagsExists = await Product.countDocuments({ 
    tags: { $exists: true, $not: { $size: 0 } } 
  });
  
  console.log(`  null: ${tagsNull}`);
  console.log(`  []: ${tagsEmpty}`);
  console.log(`  undefined: ${tagsUndefined}`);
  console.log(`  ✅ avec valeurs: ${tagsExists}`);
  console.log(`  % complétude: ${((tagsExists/total)*100).toFixed(1)}%\n`);
  
  // 4. Analyse par categoryType
  console.log('--- PAR CATÉGORIE ---');
  const categories = ['food', 'cosmetic', 'detergent'];
  for (const cat of categories) {
    const catTotal = await Product.countDocuments({ categoryType: cat });
    const catWithSub = await Product.countDocuments({ 
      categoryType: cat,
      subcategory: { $exists: true, $ne: null, $ne: '' }
    });
    const catWithTags = await Product.countDocuments({ 
      categoryType: cat,
      tags: { $exists: true, $not: { $size: 0 } }
    });
    
    console.log(`  ${cat}:`);
    console.log(`    Total: ${catTotal}`);
    console.log(`    Avec subcategory: ${catWithSub} (${((catWithSub/catTotal)*100).toFixed(1)}%)`);
    console.log(`    Avec tags: ${catWithTags} (${((catWithTags/catTotal)*100).toFixed(1)}%)`);
  }
  
  // 5. Échantillon valeurs existantes subcategory
  console.log('\n--- TOP 20 SUBCATEGORIES EXISTANTES ---');
  const subSample = await Product.aggregate([
    { 
      $match: { 
        subcategory: { $exists: true, $ne: null, $ne: '' } 
      } 
    },
    { $group: { _id: '$subcategory', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);
  
  subSample.forEach(s => {
    console.log(`  "${s._id}": ${s.count} produits`);
  });
  
  // 6. Échantillon tags existants
  console.log('\n--- TOP 20 TAGS EXISTANTS ---');
  const tagsSample = await Product.aggregate([
    { $match: { tags: { $exists: true, $not: { $size: 0 } } } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);
  
  tagsSample.forEach(t => {
    console.log(`  "${t._id}": ${t.count} occurrences`);
  });
  
  // 7. Incohérences
  const withSubNoTags = await Product.countDocuments({
    subcategory: { $exists: true, $ne: null, $ne: '' },
    $or: [
      { tags: { $exists: false } },
      { tags: null },
      { tags: { $size: 0 } }
    ]
  });
  
  console.log('\n--- INCOHÉRENCES ---');
  console.log(`Produits avec subcategory MAIS sans tags: ${withSubNoTags}`);
  
  const withTagsNoSub = await Product.countDocuments({
    tags: { $exists: true, $not: { $size: 0 } },
    $or: [
      { subcategory: { $exists: false } },
      { subcategory: null },
      { subcategory: '' }
    ]
  });
  
  console.log(`Produits avec tags MAIS sans subcategory: ${withTagsNoSub}`);
  
  // 8. Export échantillons
  console.log('\n--- EXPORT ÉCHANTILLONS ---');
  
  const samples = {
    withBoth: await Product.find({
      subcategory: { $exists: true, $ne: null, $ne: '' },
      tags: { $exists: true, $not: { $size: 0 } }
    }).select('name brand categoryType subcategory tags').limit(10).lean(),
    
    withSubOnly: await Product.find({
      subcategory: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { tags: { $exists: false } },
        { tags: { $size: 0 } }
      ]
    }).select('name brand categoryType subcategory tags').limit(10).lean(),
    
    withNone: await Product.find({
      $or: [
        { subcategory: { $in: [null, ''] } },
        { subcategory: { $exists: false } }
      ],
      $or: [
        { tags: { $exists: false } },
        { tags: { $size: 0 } }
      ]
    }).select('name brand categoryType subcategory tags ingredients_text').limit(10).lean()
  };
  
  require('fs').writeFileSync(
    'scripts/samples-analysis.json',
    JSON.stringify(samples, null, 2),
    'utf8'
  );
  
  console.log('✅ Échantillons exportés: scripts/samples-analysis.json');
  
  await mongoose.disconnect();
  process.exit(0);
}

analyzeFields().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
