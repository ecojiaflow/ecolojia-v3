// backend/scripts/sync-algolia-filters.js
// Synchronise les produits enrichis vers Algolia avec les nouveaux champs

const algoliasearch = require('algoliasearch');
const mongoose = require('mongoose');
require('dotenv').config();

// ⭐ CORRECTION : Utiliser les bons noms de variables backend
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY;
const ALGOLIA_INDEX = process.env.ALGOLIA_INDEX_NAME || 'products';
const MONGODB_URI = process.env.MONGODB_URI;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
  console.error('❌ Variables Algolia manquantes dans .env');
  console.error('   ALGOLIA_APP_ID:', ALGOLIA_APP_ID ? '✅' : '❌');
  console.error('   ALGOLIA_ADMIN_API_KEY:', ALGOLIA_ADMIN_KEY ? '✅' : '❌');
  process.exit(1);
}

async function syncToAlgolia() {
  console.log('\n========================================');
  console.log('  SYNC MONGODB → ALGOLIA');
  console.log('========================================\n');

  try {
    // Connexion MongoDB
    console.log('📡 Connexion MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté\n');

    // Connexion Algolia
    console.log('📡 Connexion Algolia...');
    console.log(`   App ID: ${ALGOLIA_APP_ID}`);
    console.log(`   Index: ${ALGOLIA_INDEX}\n`);
    
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
    const index = client.initIndex(ALGOLIA_INDEX);
    console.log('✅ Connecté\n');

    // Configurer les attributs Algolia
    console.log('⚙️  Configuration index Algolia...');
    
    await index.setSettings({
      // Attributs searchables
      searchableAttributes: [
        'name',
        'brand',
        'productType',
        'filterMetadata.searchTerms',
        'filterMetadata.categoryLabels'
      ],
      
      // Attributs pour faceting (filtres)
      attributesForFaceting: [
        'categoryType',
        'productType',
        'brand',
        'foodData.novaGroup',
        'foodData.nutriScore',
        'foodData.ecoScore',
        'foodData.labels',
        'cosmeticsData.certifications',
        'detergentsData.ecoLabels',
        'filterMetadata.categoryLabels'
      ],
      
      // Attributs custom ranking
      customRanking: [
        'desc(filterMetadata.popularityScore)',
        'desc(scores.overallScore)'
      ],
      
      // Pagination
      hitsPerPage: 20,
      
      // Typo tolerance
      typoTolerance: true
    });
    
    console.log('✅ Configuration appliquée\n');

    // Charger les produits depuis MongoDB
    console.log('📦 Chargement produits MongoDB...');
    const Product = mongoose.model('Product', require('../src/models/Product').schema);
    
    const products = await Product.find({
      categoryType: { $exists: true }
    })
    .select({
      _id: 1,
      barcode: 1,
      name: 1,
      brand: 1,
      categoryType: 1,
      productType: 1,
      imageUrl: 1,
      'scores.overallScore': 1,
      'foodData.novaGroup': 1,
      'foodData.nutriScore': 1,
      'foodData.ecoScore': 1,
      'foodData.labels': 1,
      'cosmeticsData.certifications': 1,
      'detergentsData.ecoLabels': 1,
      filterMetadata: 1
    })
    .lean();

    console.log(`✅ ${products.length} produits chargés\n`);

    // Transformer pour Algolia
    console.log('🔄 Transformation des données...');
    
    const algoliaObjects = products.map(product => ({
      objectID: product._id.toString(),
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      categoryType: product.categoryType,
      productType: product.productType,
      imageUrl: product.imageUrl,
      
      // Scores (aplatir l'objet)
      overallScore: product.scores?.overallScore || 0,
      
      // Food data (aplatir)
      'foodData.novaGroup': product.foodData?.novaGroup,
      'foodData.nutriScore': product.foodData?.nutriScore,
      'foodData.ecoScore': product.foodData?.ecoScore,
      'foodData.labels': product.foodData?.labels || [],
      
      // Cosmetic data (aplatir)
      'cosmeticsData.certifications': product.cosmeticsData?.certifications || [],
      
      // Detergent data (aplatir)
      'detergentsData.ecoLabels': product.detergentsData?.ecoLabels || [],
      
      // Filter metadata (aplatir)
      'filterMetadata.categoryLabels': product.filterMetadata?.categoryLabels || [],
      'filterMetadata.searchTerms': product.filterMetadata?.searchTerms || [],
      'filterMetadata.popularityScore': product.filterMetadata?.popularityScore || 0
    }));

    console.log('✅ Transformation terminée\n');

    // Envoyer à Algolia par batch de 1000
    console.log('⬆️  Upload vers Algolia...');
    
    const BATCH_SIZE = 1000;
    let uploaded = 0;
    
    for (let i = 0; i < algoliaObjects.length; i += BATCH_SIZE) {
      const batch = algoliaObjects.slice(i, i + BATCH_SIZE);
      await index.saveObjects(batch);
      uploaded += batch.length;
      
      const progress = ((uploaded / algoliaObjects.length) * 100).toFixed(1);
      console.log(`   ⏳ ${progress}% (${uploaded}/${algoliaObjects.length})`);
    }
    
    console.log('\n✅ Upload terminé\n');

    // Statistiques finales
    console.log('========================================');
    console.log('  RÉSULTAT FINAL');
    console.log('========================================\n');
    
    const stats = {
      food: algoliaObjects.filter(p => p.categoryType === 'food').length,
      cosmetic: algoliaObjects.filter(p => p.categoryType === 'cosmetic').length,
      detergent: algoliaObjects.filter(p => p.categoryType === 'detergent').length
    };
    
    console.log(`✅ Total synchronisé : ${algoliaObjects.length}`);
    console.log(`   🥫 Food : ${stats.food}`);
    console.log(`   💄 Cosmetic : ${stats.cosmetic}`);
    console.log(`   🧼 Detergent : ${stats.detergent}\n`);
    
    console.log('🔗 Vérifier dans le dashboard Algolia :');
    console.log(`   https://www.algolia.com/apps/${ALGOLIA_APP_ID}/explorer/browse/${ALGOLIA_INDEX}\n`);

    await mongoose.disconnect();
    console.log('✅ Synchronisation terminée avec succès !\n');
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

syncToAlgolia();