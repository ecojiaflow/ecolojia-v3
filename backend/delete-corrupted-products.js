require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://salim:Salimbenamara78@ecolojia.mongodb.net/ecolojia?retryWrites=true&w=majority';

async function deleteCorruptedProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté MongoDB\n');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));
    
    // 1. Récupérer les produits corrompus (sans categoryType)
    console.log('🔍 IDENTIFICATION PRODUITS CORROMPUS...');
    const corruptedProducts = await Product.find({ 
      categoryType: { $exists: false } 
    }).lean();
    
    console.log(`  Trouvés: ${corruptedProducts.length} produits sans categoryType\n`);
    
    if (corruptedProducts.length === 0) {
      console.log('✅ Aucun produit à supprimer');
      await mongoose.disconnect();
      return;
    }
    
    // 2. Backup avant suppression
    const backupPath = path.join(__dirname, 'backup-deleted-products.json');
    fs.writeFileSync(backupPath, JSON.stringify({
      date: new Date().toISOString(),
      count: corruptedProducts.length,
      products: corruptedProducts
    }, null, 2), 'utf8');
    
    console.log(`💾 BACKUP CRÉÉ: ${backupPath}\n`);
    
    // 3. Lister ce qui sera supprimé
    console.log('📋 PRODUITS QUI SERONT SUPPRIMÉS:\n');
    corruptedProducts.forEach((p, idx) => {
      console.log(`  ${idx + 1}. _id: ${p._id}`);
      console.log(`     Barcode: ${p.code || 'N/A'}`);
      console.log(`     Nom: ${p.product_name || 'N/A'}`);
      console.log(`     CategoryType: ${p.categoryType || 'undefined'}`);
      console.log('');
    });
    
    // 4. Suppression
    console.log('🗑️  SUPPRESSION EN COURS...\n');
    
    const result = await Product.deleteMany({ 
      categoryType: { $exists: false } 
    });
    
    console.log(`✅ SUPPRESSION RÉUSSIE:`);
    console.log(`  • Produits supprimés: ${result.deletedCount}`);
    
    // 5. Vérification post-suppression
    console.log('\n🔍 VÉRIFICATION POST-SUPPRESSION:');
    
    const stillWithout = await Product.countDocuments({ 
      categoryType: { $exists: false } 
    });
    console.log(`  • Produits sans categoryType restants: ${stillWithout}`);
    
    const totalProducts = await Product.countDocuments({});
    console.log(`  • Total produits en base: ${totalProducts}`);
    
    // 6. Nouvelle répartition catégories
    console.log('\n📊 NOUVELLE RÉPARTITION CATÉGORIES:');
    const byCategory = await Product.aggregate([
      { $group: { _id: '$categoryType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    byCategory.forEach(cat => {
      console.log(`  • ${cat._id}: ${cat.count} produits`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Déconnecté MongoDB');
    console.log('\n🎉 NETTOYAGE BASE TERMINÉ !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

deleteCorruptedProducts();