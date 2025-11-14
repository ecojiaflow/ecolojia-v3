// ========================================
// AUDIT MONGODB - BASE ECOLOJIA (CORRIGÉ)
// ========================================

const mongoose = require('mongoose');
require('dotenv').config();

async function auditDatabase() {
  try {
    console.log('\n🔄 Connexion à MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à:', mongoose.connection.db.databaseName);

    const db = mongoose.connection.db;

    // 1. LISTE DES COLLECTIONS
    console.log('\n📚 COLLECTIONS DISPONIBLES:');
    console.log('================================================');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    // 2. STATISTIQUES PAR COLLECTION (méthode corrigée)
    console.log('\n📊 STATISTIQUES PAR COLLECTION:');
    console.log('================================================');
    
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      
      // Estimation taille via échantillon
      let estimatedSize = 0;
      if (count > 0) {
        const sample = await db.collection(col.name).findOne();
        if (sample) {
          estimatedSize = JSON.stringify(sample).length * count / 1024 / 1024;
        }
      }
      
      console.log(`\n📦 ${col.name}`);
      console.log(`   Documents: ${count.toLocaleString()}`);
      console.log(`   Taille estimée: ${estimatedSize.toFixed(2)} MB`);
    }

    // 3. PRODUITS PAR CATÉGORIE
    console.log('\n\n🏷️  PRODUITS PAR CATÉGORIE:');
    console.log('================================================');
    
    const productsCol = db.collection('products');
    const totalProducts = await productsCol.countDocuments();
    
    console.log(`\n📊 Total produits: ${totalProducts.toLocaleString()}`);
    
    // Par categoryType
    const byCategoryType = await productsCol.aggregate([
      { $group: { _id: '$categoryType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📂 Par categoryType:');
    if (byCategoryType.length === 0) {
      console.log('   ⚠️  Aucune catégorie trouvée');
    } else {
      byCategoryType.forEach(cat => {
        const percent = ((cat.count / totalProducts) * 100).toFixed(1);
        console.log(`   ${cat._id || 'Non défini'}: ${cat.count.toLocaleString()} (${percent}%)`);
      });
    }

    // Par category
    const byCategory = await productsCol.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]).toArray();
    
    console.log('\n📂 Top 15 par category:');
    if (byCategory.length === 0) {
      console.log('   ⚠️  Aucune sous-catégorie trouvée');
    } else {
      byCategory.forEach(cat => {
        console.log(`   ${cat._id || 'Non défini'}: ${cat.count.toLocaleString()}`);
      });
    }

    // 4. QUALITÉ DES DONNÉES
    console.log('\n\n✨ QUALITÉ DES DONNÉES:');
    console.log('================================================');
    
    const withBarcode = await productsCol.countDocuments({ 
      barcode: { $exists: true, $ne: null, $ne: '' } 
    });
    const withBrand = await productsCol.countDocuments({ 
      brand: { $exists: true, $ne: null, $ne: '' } 
    });
    const withIngredients = await productsCol.countDocuments({ 
      'ingredients.0': { $exists: true } 
    });
    const withImage = await productsCol.countDocuments({ 
      image_url: { $exists: true, $ne: null, $ne: '' } 
    });
    const withScore = await productsCol.countDocuments({ 
      'scores.overallScore': { $exists: true, $ne: null } 
    });
    const withAiEnrichment = await productsCol.countDocuments({ 
      aiEnriched: true 
    });
    const withNutriscore = await productsCol.countDocuments({ 
      nutriscore_grade: { $exists: true, $ne: null, $ne: '' } 
    });
    const withEcoscore = await productsCol.countDocuments({ 
      ecoscore_grade: { $exists: true, $ne: null, $ne: '' } 
    });

    console.log(`Total produits: ${totalProducts.toLocaleString()}`);
    console.log(`Avec barcode: ${withBarcode.toLocaleString()} (${((withBarcode/totalProducts)*100).toFixed(1)}%)`);
    console.log(`Avec marque: ${withBrand.toLocaleString()} (${((withBrand/totalProducts)*100).toFixed(1)}%)`);
    console.log(`Avec ingrédients: ${withIngredients.toLocaleString()} (${((withIngredients/totalProducts)*100).toFixed(1)}%)`);
    console.log(`Avec image: ${withImage.toLocaleString()} (${((withImage/totalProducts)*100).toFixed(1)}%)`);
    console.log(`Avec score Ecolojia: ${withScore.toLocaleString()} (${((withScore/totalProducts)*100).toFixed(1)}%)`);
    console.log(`Avec Nutri-Score: ${withNutriscore.toLocaleString()} (${((withNutriscore/totalProducts)*100).toFixed(1)}%)`);
    console.log(`Avec Eco-Score: ${withEcoscore.toLocaleString()} (${((withEcoscore/totalProducts)*100).toFixed(1)}%)`);
    console.log(`Enrichis IA: ${withAiEnrichment.toLocaleString()} (${((withAiEnrichment/totalProducts)*100).toFixed(1)}%)`);

    // 5. DISTRIBUTION DES SCORES
    console.log('\n\n📈 DISTRIBUTION DES SCORES:');
    console.log('================================================');
    
    const scoreDistribution = await productsCol.aggregate([
      { $match: { 'scores.overallScore': { $exists: true, $ne: null } } },
      {
        $bucket: {
          groupBy: '$scores.overallScore',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'Hors limite',
          output: { count: { $sum: 1 } }
        }
      }
    ]).toArray();

    if (scoreDistribution.length > 0) {
      scoreDistribution.forEach(bucket => {
        const range = bucket._id === 'Hors limite' ? 'Hors limite' : `${bucket._id}-${bucket._id + 19}`;
        console.log(`   Score ${range}: ${bucket.count.toLocaleString()} produits`);
      });
    } else {
      console.log('   ⚠️  Aucun produit avec score calculé');
    }

    // 6. ESPACE DISPONIBLE (estimation basée sur échantillon)
    console.log('\n\n💾 ESTIMATION ESPACE MONGODB:');
    console.log('================================================');
    
    let totalEstimatedMB = 0;
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      if (count > 0) {
        const sample = await db.collection(col.name).findOne();
        if (sample) {
          const sizePerDoc = JSON.stringify(sample).length / 1024 / 1024;
          totalEstimatedMB += sizePerDoc * count;
        }
      }
    }
    
    const freeTierLimitMB = 512;
    const remainingMB = freeTierLimitMB - totalEstimatedMB;
    
    console.log(`Total estimé utilisé: ${totalEstimatedMB.toFixed(2)} MB`);
    console.log(`Limite Free Tier: ${freeTierLimitMB} MB`);
    console.log(`Espace restant estimé: ${remainingMB.toFixed(2)} MB (${((remainingMB/freeTierLimitMB)*100).toFixed(1)}%)`);
    
    // Estimation capacité pour nouveaux produits
    const avgSizePerProduct = totalProducts > 0 ? (totalEstimatedMB / totalProducts) : 0.05;
    const capacityForNewProducts = Math.floor(remainingMB / avgSizePerProduct);
    
    console.log(`\nTaille moyenne par produit: ${(avgSizePerProduct * 1024).toFixed(2)} KB`);
    console.log(`Capacité nouveaux produits: ~${capacityForNewProducts.toLocaleString()} produits`);

    // 7. ÉCHANTILLON DE PRODUITS
    console.log('\n\n🔍 ÉCHANTILLON DE 5 PRODUITS:');
    console.log('================================================');
    
    const samples = await productsCol.find().limit(5).toArray();
    samples.forEach((prod, i) => {
      console.log(`\n${i+1}. ${prod.name || prod.product_name || 'Sans nom'}`);
      console.log(`   Barcode: ${prod.barcode || 'N/A'}`);
      console.log(`   Marque: ${prod.brand || prod.brands || 'N/A'}`);
      console.log(`   Catégorie: ${prod.categoryType || 'N/A'}`);
      console.log(`   Score: ${prod.scores?.overallScore || 'N/A'}/100`);
      console.log(`   Ingrédients: ${prod.ingredients?.length || 0}`);
      console.log(`   IA enrichi: ${prod.aiEnriched ? 'Oui' : 'Non'}`);
      console.log(`   Source: ${prod.source || 'N/A'}`);
    });

    // 8. DOUBLONS POTENTIELS
    console.log('\n\n🔍 DÉTECTION DOUBLONS (barcode):');
    console.log('================================================');
    
    const duplicates = await productsCol.aggregate([
      { $match: { barcode: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$barcode', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    if (duplicates.length > 0) {
      console.log(`⚠️  ${duplicates.length} barcodes en doublon détectés:`);
      duplicates.forEach(dup => {
        console.log(`   Barcode ${dup._id}: ${dup.count} occurrences`);
      });
    } else {
      console.log('✅ Aucun doublon détecté');
    }

    // 9. RECOMMANDATIONS
    console.log('\n\n💡 RECOMMANDATIONS IMPORT 50K PRODUITS:');
    console.log('================================================');
    
    if (totalEstimatedMB > 450) {
      console.log('⚠️  CRITIQUE: Espace utilisé > 450 MB');
      console.log('   → URGENT: Nettoyer les doublons et données inutiles');
      console.log('   → Ou: Upgrade vers plan payant MongoDB (M2/M5)');
    } else if (remainingMB < 100) {
      console.log('⚠️  ATTENTION: Espace restant < 100 MB');
      console.log('   → Recommandation: Nettoyer avant import');
      console.log('   → Capacité limitée à ~' + capacityForNewProducts.toLocaleString() + ' produits');
    } else if (capacityForNewProducts < 50000) {
      console.log('⚠️  ATTENTION: Capacité < 50K produits');
      console.log(`   → Capacité estimée: ~${capacityForNewProducts.toLocaleString()} produits`);
      console.log('   → Option 1: Import progressif par catégorie');
      console.log('   → Option 2: Upgrade plan MongoDB');
      console.log('   → Option 3: Optimiser taille documents (moins de champs)');
    } else {
      console.log('✅ Espace suffisant pour 50K+ produits');
      console.log(`   → Capacité estimée: ~${capacityForNewProducts.toLocaleString()} produits`);
      console.log('   → Vous pouvez procéder à l\'import complet');
    }

    if (duplicates.length > 0) {
      console.log('\n⚠️  Doublons détectés:');
      console.log('   → Recommandation: Nettoyer les doublons avant import');
      console.log('   → Script de nettoyage disponible si nécessaire');
    }

    console.log('\n================================================');
    console.log('✅ Audit terminé avec succès\n');

  } catch (error) {
    console.error('❌ Erreur audit:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

auditDatabase();