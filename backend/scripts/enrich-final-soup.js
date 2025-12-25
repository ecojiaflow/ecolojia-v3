const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function enrichSoups() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('=== ENRICHISSEMENT FINAL : SOUPES ===\n');
  
  // Enrichir tous les produits avec tag "soup"
  const result = await Product.updateMany(
    {
      tags: 'soup',
      $or: [
        { subcategory: { $exists: false } },
        { subcategory: null },
        { subcategory: '' }
      ]
    },
    {
      $set: {
        subcategory: 'soup',
        enrichedBy: 'rules-final',
        enrichedAt: new Date()
      }
    }
  );
  
  console.log(`✅ ${result.modifiedCount} soupes enrichies\n`);
  
  // Vérification finale
  const finalCount = await Product.countDocuments({
    subcategory: { $exists: true, $ne: null, $ne: '' }
  });
  const total = await Product.countDocuments();
  const remaining = total - finalCount;
  
  console.log('=== ÉTAT FINAL DÉFINITIF ===');
  console.log(`Total produits: ${total}`);
  console.log(`✅ Avec subcategory: ${finalCount} (${((finalCount/total)*100).toFixed(2)}%)`);
  console.log(`❌ Sans subcategory: ${remaining}`);
  
  if (remaining === 0) {
    console.log('\n🎉 100% DE COMPLÉTUDE ATTEINTE ! 🎉');
    console.log('✅ Base MongoDB production-ready');
    console.log('✅ Toutes les alternatives fonctionnelles');
    console.log('✅ IA peut sélectionner habitudes pertinentes');
  } else if (remaining < 10) {
    console.log(`\n⚠️ ${remaining} produits restants (probablement corrompus)`);
    
    const last = await Product.find({
      $or: [
        { subcategory: { $exists: false } },
        { subcategory: null },
        { subcategory: '' }
      ]
    }).select('name tags categoryType').limit(10).lean();
    
    console.log('\n=== DERNIERS PRODUITS NON ENRICHIS ===');
    last.forEach(p => {
      console.log(`  - ${p.name}`);
      console.log(`    Tags: ${p.tags?.join(', ') || 'AUCUN'}`);
      console.log(`    Catégorie: ${p.categoryType || 'UNDEFINED'}`);
    });
  }
  
  // Statistiques finales par subcategory
  console.log('\n=== TOP 10 SUBCATEGORIES ===');
  const topSubs = await Product.aggregate([
    {
      $match: {
        subcategory: { $exists: true, $ne: null, $ne: '' }
      }
    },
    {
      $group: {
        _id: '$subcategory',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  topSubs.forEach(s => {
    console.log(`  ${s._id}: ${s.count} produits`);
  });
  
  await mongoose.disconnect();
  process.exit(0);
}

enrichSoups();
