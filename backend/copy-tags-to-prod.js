require('dotenv').config();
const mongoose = require('mongoose');

async function copyTagsToProduction() {
  // Connexion LOCAL
  const localDb = await mongoose.createConnection(process.env.MONGODB_URI);
  
  console.log('📊 Récupération tags depuis LOCAL...');
  
  const Product = localDb.model('Product', require('./src/models/Product').schema);
  
  // Récupérer TOUS les produits avec tags
  const productsWithTags = await Product.find({
    tags: { $exists: true, $ne: [] }
  }).select('_id barcode tags subcategory').lean();
  
  console.log(`✅ ${productsWithTags.length} produits avec tags récupérés`);
  
  // Préparer bulk update pour prod
  const bulkOps = productsWithTags.map(p => ({
    updateOne: {
      filter: { _id: p._id },
      update: { 
        $set: { 
          tags: p.tags,
          subcategory: p.subcategory 
        } 
      }
    }
  }));
  
  console.log('🚀 Upload vers PRODUCTION...');
  
  // Exécuter par batch de 1000
  for (let i = 0; i < bulkOps.length; i += 1000) {
    const batch = bulkOps.slice(i, i + 1000);
    await Product.bulkWrite(batch);
    console.log(`  Progression: ${Math.min(i + 1000, bulkOps.length)}/${bulkOps.length}`);
  }
  
  console.log('✅ TERMINÉ ! Tags copiés en production.');
  process.exit(0);
}

copyTagsToProduction().catch(console.error);
