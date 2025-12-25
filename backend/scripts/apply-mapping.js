const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const fs = require('fs');
require('dotenv').config();

async function applyMapping() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('=== APPLICATION MAPPING TAGS → SUBCATEGORY ===\n');
  
  // 1. Charger le mapping
  const mapping = JSON.parse(
    fs.readFileSync('scripts/tags-subcategory-mapping.json', 'utf8')
  );
  
  console.log(`Mapping chargé:`);
  console.log(`  - ${Object.keys(mapping.exactMapping).length} combinaisons exactes`);
  console.log(`  - ${Object.keys(mapping.tagMapping).length} tags uniques\n`);
  
  // 2. Récupérer produits sans subcategory
  const productsToEnrich = await Product.find({
    $or: [
      { subcategory: { $exists: false } },
      { subcategory: null },
      { subcategory: '' }
    ],
    tags: { $exists: true, $not: { $size: 0 } }
  }).select('_id name tags categoryType').lean();
  
  console.log(`Produits à enrichir: ${productsToEnrich.length}\n`);
  
  // 3. Statistiques
  const stats = {
    total: productsToEnrich.length,
    exactMatch: 0,
    tagMatch: 0,
    noMatch: 0,
    updated: 0
  };
  
  // 4. Fonction de matching
  function findSubcategory(product) {
    if (!product.tags || product.tags.length === 0) return null;
    
    // Stratégie 1 : Correspondance exacte (tags triés)
    const tagKey = product.tags.sort().join('|');
    if (mapping.exactMapping[tagKey]) {
      stats.exactMatch++;
      return mapping.exactMapping[tagKey].subcategory;
    }
    
    // Stratégie 2 : Tag le plus pertinent
    // Chercher quel tag a le mapping le plus fort
    let bestMatch = null;
    let bestScore = 0;
    
    for (const tag of product.tags) {
      if (mapping.tagMapping[tag]) {
        const score = mapping.tagMapping[tag].count;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = mapping.tagMapping[tag].primary;
        }
      }
    }
    
    if (bestMatch) {
      stats.tagMatch++;
      return bestMatch;
    }
    
    stats.noMatch++;
    return null;
  }
  
  // 5. Traiter par lots
  const batchSize = 1000;
  const totalBatches = Math.ceil(productsToEnrich.length / batchSize);
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, productsToEnrich.length);
    const batch = productsToEnrich.slice(start, end);
    
    const bulkOps = [];
    
    for (const product of batch) {
      const subcategory = findSubcategory(product);
      
      if (subcategory) {
        bulkOps.push({
          updateOne: {
            filter: { _id: product._id },
            update: {
              $set: {
                subcategory: subcategory,
                enrichedBy: 'mapping',
                enrichedAt: new Date()
              }
            }
          }
        });
      }
    }
    
    if (bulkOps.length > 0) {
      const result = await Product.bulkWrite(bulkOps);
      stats.updated += result.modifiedCount;
    }
    
    const progress = ((end / productsToEnrich.length) * 100).toFixed(1);
    console.log(`Batch ${i + 1}/${totalBatches} : ${end}/${productsToEnrich.length} (${progress}%)`);
  }
  
  // 6. Résultats finaux
  console.log('\n=== RÉSULTATS ===');
  console.log(`Total produits analysés: ${stats.total}`);
  console.log(`✅ Match exact: ${stats.exactMatch} (${((stats.exactMatch/stats.total)*100).toFixed(1)}%)`);
  console.log(`✅ Match par tag: ${stats.tagMatch} (${((stats.tagMatch/stats.total)*100).toFixed(1)}%)`);
  console.log(`❌ Pas de match: ${stats.noMatch} (${((stats.noMatch/stats.total)*100).toFixed(1)}%)`);
  console.log(`\n🎯 Produits enrichis: ${stats.updated}`);
  console.log(`📝 Restant pour Phase 2 (IA): ${stats.noMatch}`);
  
  // 7. Vérification finale
  const finalCheck = await Product.countDocuments({
    subcategory: { $exists: true, $ne: null, $ne: '' }
  });
  
  const totalProducts = await Product.countDocuments();
  
  console.log(`\n=== ÉTAT FINAL BASE ===`);
  console.log(`Total produits: ${totalProducts}`);
  console.log(`Avec subcategory: ${finalCheck} (${((finalCheck/totalProducts)*100).toFixed(1)}%)`);
  console.log(`Sans subcategory: ${totalProducts - finalCheck} (${(((totalProducts - finalCheck)/totalProducts)*100).toFixed(1)}%)`);
  
  await mongoose.disconnect();
  process.exit(0);
}

applyMapping().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
