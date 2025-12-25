const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function analyzeRemaining() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('=== ANALYSE PRODUITS RESTANTS SANS SUBCATEGORY ===\n');
  
  // 1. Total restants
  const remaining = await Product.countDocuments({
    $or: [
      { subcategory: { $exists: false } },
      { subcategory: null },
      { subcategory: '' }
    ]
  });
  
  console.log(`Total produits sans subcategory: ${remaining}\n`);
  
  // 2. Avec tags vs sans tags
  const withTags = await Product.countDocuments({
    $or: [
      { subcategory: { $exists: false } },
      { subcategory: null },
      { subcategory: '' }
    ],
    tags: { $exists: true, $not: { $size: 0 } }
  });
  
  const withoutTags = await Product.countDocuments({
    $or: [
      { subcategory: { $exists: false } },
      { subcategory: null },
      { subcategory: '' }
    ],
    $or: [
      { tags: { $exists: false } },
      { tags: { $size: 0 } }
    ]
  });
  
  console.log('--- RÉPARTITION ---');
  console.log(`Avec tags (non matchés): ${withTags}`);
  console.log(`Sans tags (corrompus): ${withoutTags}`);
  
  // 3. Par categoryType
  console.log('\n--- PAR CATÉGORIE ---');
  const categories = ['food', 'cosmetic', 'detergent', null, ''];
  
  for (const cat of categories) {
    const filter = cat 
      ? { categoryType: cat }
      : { $or: [{ categoryType: null }, { categoryType: '' }, { categoryType: { $exists: false } }] };
    
    const count = await Product.countDocuments({
      ...filter,
      $or: [
        { subcategory: { $exists: false } },
        { subcategory: null },
        { subcategory: '' }
      ]
    });
    
    if (count > 0) {
      console.log(`  ${cat || 'UNDEFINED'}: ${count}`);
    }
  }
  
  // 4. Échantillon produits avec tags (non matchés)
  console.log('\n--- ÉCHANTILLON AVEC TAGS (non matchés) ---');
  const sampleWithTags = await Product.find({
    $or: [
      { subcategory: { $exists: false } },
      { subcategory: null },
      { subcategory: '' }
    ],
    tags: { $exists: true, $not: { $size: 0 } }
  })
    .select('name brand categoryType tags')
    .limit(20)
    .lean();
  
  sampleWithTags.forEach(p => {
    console.log(`\nNom: ${p.name}`);
    console.log(`Catégorie: ${p.categoryType || 'UNDEFINED'}`);
    console.log(`Tags: ${p.tags.join(', ')}`);
  });
  
  // 5. Échantillon produits sans tags (corrompus)
  console.log('\n--- ÉCHANTILLON SANS TAGS (corrompus) ---');
  const sampleWithoutTags = await Product.find({
    $or: [
      { subcategory: { $exists: false } },
      { subcategory: null },
      { subcategory: '' }
    ],
    $or: [
      { tags: { $exists: false } },
      { tags: { $size: 0 } }
    ]
  })
    .select('name brand categoryType tags ingredients_text')
    .limit(10)
    .lean();
  
  sampleWithoutTags.forEach(p => {
    console.log(`\nNom: ${p.name}`);
    console.log(`Catégorie: ${p.categoryType || 'UNDEFINED'}`);
    console.log(`Tags: ${p.tags || 'UNDEFINED'}`);
    console.log(`Ingrédients: ${p.ingredients_text ? 'OUI' : 'NON'}`);
  });
  
  // 6. Statistiques complétude globale
  console.log('\n=== RECOMMANDATIONS ===');
  
  if (withTags > 0) {
    console.log(`\n✅ ${withTags} produits avec tags → Enrichissement IA (Phase 2)`);
    console.log(`   Coût estimé: ~$${((withTags * 0.14) / 1000000 * 100).toFixed(2)}`);
  }
  
  if (withoutTags > 0) {
    console.log(`\n❌ ${withoutTags} produits corrompus → Nettoyage ou suppression`);
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

analyzeRemaining().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
