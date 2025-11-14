// ========================================
// NETTOYAGE CATÉGORIES - SYNCHRONISATION
// ========================================

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupCategories() {
  try {
    console.log('\n🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à:', mongoose.connection.db.databaseName);

    const db = mongoose.connection.db;
    const productsCol = db.collection('products');

    // 1. ANALYSE DES PRODUITS NON CATÉGORISÉS
    console.log('\n🔍 ANALYSE DES PRODUITS NON CATÉGORISÉS...');
    console.log('================================================');
    
    const uncategorized = await productsCol.find({
      $or: [
        { categoryType: { $exists: false } },
        { categoryType: null },
        { categoryType: '' }
      ]
    }).limit(10).toArray();

    console.log(`\n📊 Échantillon de 10 produits non catégorisés:`);
    uncategorized.forEach((prod, i) => {
      console.log(`\n${i+1}. ${prod.name || 'Sans nom'}`);
      console.log(`   category: ${prod.category || 'N/A'}`);
      console.log(`   categoryType: ${prod.categoryType || 'undefined'}`);
      console.log(`   barcode: ${prod.barcode}`);
    });

    // 2. MAPPING AUTOMATIQUE
    console.log('\n\n🔄 APPLICATION DU MAPPING...');
    console.log('================================================');

    // Mapping category → categoryType
    const mappings = [
      { from: 'food', to: 'food' },
      { from: 'foods', to: 'food' },
      { from: 'cosmetics', to: 'cosmetic' },
      { from: 'cosmetic', to: 'cosmetic' },
      { from: 'detergents', to: 'detergent' },
      { from: 'detergent', to: 'detergent' }
    ];

    let totalFixed = 0;

    for (const mapping of mappings) {
      const result = await productsCol.updateMany(
        {
          category: mapping.from,
          $or: [
            { categoryType: { $exists: false } },
            { categoryType: null },
            { categoryType: '' }
          ]
        },
        {
          $set: { categoryType: mapping.to }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ ${mapping.from} → ${mapping.to}: ${result.modifiedCount} produits mis à jour`);
        totalFixed += result.modifiedCount;
      }
    }

    console.log(`\n✅ Total corrigé: ${totalFixed} produits`);

    // 3. VÉRIFICATION POST-CORRECTION
    console.log('\n\n📊 VÉRIFICATION POST-CORRECTION...');
    console.log('================================================');

    const totalProducts = await productsCol.countDocuments();
    const stillUncategorized = await productsCol.countDocuments({
      $or: [
        { categoryType: { $exists: false } },
        { categoryType: null },
        { categoryType: '' }
      ]
    });

    const byCategoryType = await productsCol.aggregate([
      { $group: { _id: '$categoryType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log(`\nTotal produits: ${totalProducts.toLocaleString()}`);
    console.log(`Encore non catégorisés: ${stillUncategorized.toLocaleString()} (${((stillUncategorized/totalProducts)*100).toFixed(1)}%)`);
    
    console.log('\n📂 Distribution par categoryType:');
    byCategoryType.forEach(cat => {
      const percent = ((cat.count / totalProducts) * 100).toFixed(1);
      console.log(`   ${cat._id || 'Non défini'}: ${cat.count.toLocaleString()} (${percent}%)`);
    });

    // 4. PRODUITS RESTANTS SANS CATÉGORIE
    if (stillUncategorized > 0) {
      console.log('\n\n⚠️  PRODUITS RESTANTS SANS CATÉGORIE:');
      console.log('================================================');
      
      const remaining = await productsCol.find({
        $or: [
          { categoryType: { $exists: false } },
          { categoryType: null },
          { categoryType: '' }
        ]
      }).limit(10).toArray();

      console.log('Échantillon de 10 produits:');
      remaining.forEach((prod, i) => {
        console.log(`\n${i+1}. ${prod.name || 'Sans nom'}`);
        console.log(`   category: ${prod.category || 'N/A'}`);
        console.log(`   barcode: ${prod.barcode}`);
      });

      console.log('\n💡 Options:');
      console.log('   A) Les supprimer (données incomplètes)');
      console.log('   B) Les catégoriser manuellement');
      console.log('   C) Les laisser (seront exclus des recherches)');
    } else {
      console.log('\n✅ Tous les produits sont catégorisés !');
    }

    console.log('\n================================================');
    console.log('✅ Nettoyage terminé\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupCategories();