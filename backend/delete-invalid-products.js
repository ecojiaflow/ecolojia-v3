// ========================================
// SUPPRESSION PRODUITS BARCODES INVALIDES
// ========================================

const mongoose = require('mongoose');
require('dotenv').config();

async function deleteInvalidProducts() {
  try {
    console.log('\n🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à:', mongoose.connection.db.databaseName);

    const db = mongoose.connection.db;
    const productsCol = db.collection('products');

    // 1. BACKUP AVANT SUPPRESSION
    console.log('\n💾 BACKUP DES PRODUITS À SUPPRIMER...');
    console.log('================================================');

    const toDelete = await productsCol.find({
      $or: [
        { barcode: { $regex: /^DETERGENT_/ } },
        { barcode: { $regex: /^COSMETIC_/ } },
        { barcode: { $regex: /^FOOD_/ } }
      ]
    }).toArray();

    console.log(`📊 Produits à supprimer: ${toDelete.length}`);

    if (toDelete.length > 0) {
      // Sauvegarder dans un fichier JSON
      const fs = require('fs');
      const backupFile = `backup-deleted-products-${Date.now()}.json`;
      fs.writeFileSync(backupFile, JSON.stringify(toDelete, null, 2), 'utf8');
      console.log(`✅ Backup créé: ${backupFile}`);
    }

    // 2. ANALYSE DES PRODUITS À SUPPRIMER
    console.log('\n🔍 ANALYSE DES PRODUITS À SUPPRIMER...');
    console.log('================================================');

    const byPattern = await productsCol.aggregate([
      {
        $match: {
          $or: [
            { barcode: { $regex: /^DETERGENT_/ } },
            { barcode: { $regex: /^COSMETIC_/ } },
            { barcode: { $regex: /^FOOD_/ } }
          ]
        }
      },
      {
        $project: {
          pattern: {
            $cond: [
              { $regexMatch: { input: '$barcode', regex: /^DETERGENT_/ } },
              'DETERGENT_*',
              {
                $cond: [
                  { $regexMatch: { input: '$barcode', regex: /^COSMETIC_/ } },
                  'COSMETIC_*',
                  'FOOD_*'
                ]
              }
            ]
          }
        }
      },
      {
        $group: { _id: '$pattern', count: { $sum: 1 } }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log('Répartition par pattern:');
    byPattern.forEach(p => {
      console.log(`   ${p._id}: ${p.count} produits`);
    });

    // 3. SUPPRESSION
    console.log('\n\n🗑️  SUPPRESSION EN COURS...');
    console.log('================================================');

    const deleteResult = await productsCol.deleteMany({
      $or: [
        { barcode: { $regex: /^DETERGENT_/ } },
        { barcode: { $regex: /^COSMETIC_/ } },
        { barcode: { $regex: /^FOOD_/ } }
      ]
    });

    console.log(`✅ Produits supprimés: ${deleteResult.deletedCount}`);

    // 4. VÉRIFICATION POST-SUPPRESSION
    console.log('\n\n📊 ÉTAT FINAL DE LA BASE...');
    console.log('================================================');

    const totalProducts = await productsCol.countDocuments();
    const stillInvalid = await productsCol.countDocuments({
      $or: [
        { barcode: { $regex: /^DETERGENT_/ } },
        { barcode: { $regex: /^COSMETIC_/ } },
        { barcode: { $regex: /^FOOD_/ } }
      ]
    });

    const byCategoryType = await productsCol.aggregate([
      { $group: { _id: '$categoryType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log(`\nTotal produits restants: ${totalProducts.toLocaleString()}`);
    console.log(`Barcodes invalides restants: ${stillInvalid}`);

    console.log('\n📂 Distribution par categoryType:');
    byCategoryType.forEach(cat => {
      const percent = ((cat.count / totalProducts) * 100).toFixed(1);
      console.log(`   ${cat._id || 'Non défini'}: ${cat.count.toLocaleString()} (${percent}%)`);
    });

    // 5. VALIDATION BARCODES
    console.log('\n\n✅ VALIDATION BARCODES RESTANTS...');
    console.log('================================================');

    const sampleBarcodes = await productsCol.aggregate([
      { $sample: { size: 10 } },
      { $project: { barcode: 1, name: 1, _id: 0 } }
    ]).toArray();

    console.log('Échantillon de 10 barcodes:');
    sampleBarcodes.forEach((p, i) => {
      const isValid = /^\d{8,13}$/.test(p.barcode);
      const status = isValid ? '✅' : '❌';
      console.log(`${i+1}. ${status} ${p.barcode} - ${p.name || 'Sans nom'}`);
    });

    console.log('\n================================================');
    console.log('✅ Suppression terminée avec succès\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

deleteInvalidProducts();