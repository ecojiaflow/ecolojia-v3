// scripts/reindex-algolia-with-scores.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const algoliaService = require('../src/services/algolia/algoliaService');

async function reindexWithScores() {
  console.log('\n🔄 RÉINDEXATION ALGOLIA AVEC SCORES\n');
  
  try {
    // Connexion MongoDB
    console.log('📡 Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');

    // Vérifier configuration Algolia
    if (!algoliaService.isConfigured()) {
      throw new Error('❌ Algolia non configuré - vérifier .env');
    }
    console.log('✅ Algolia configuré\n');

    // Compter produits avec scores
    const totalProducts = await Product.countDocuments({});
    const withScores = await Product.countDocuments({ 'scores.healthScore': { $exists: true, $ne: null } });
    
    console.log(`📊 Statistiques MongoDB:`);
    console.log(`   Total produits: ${totalProducts}`);
    console.log(`   Avec scores: ${withScores}`);
    console.log(`   Sans scores: ${totalProducts - withScores}\n`);

    // Récupérer TOUS les produits (par batch)
    console.log('📦 Récupération produits...');
    const batchSize = 100;
    let processed = 0;
    let indexed = 0;
    let errors = 0;

    for (let skip = 0; skip < totalProducts; skip += batchSize) {
      const products = await Product.find({})
        .skip(skip)
        .limit(batchSize)
        .lean();

      if (products.length === 0) break;

      // Indexer batch
      try {
        const result = await algoliaService.indexProducts(products, false);
        indexed += result.success;
        errors += result.failed;
        processed += products.length;

        const progress = Math.round((processed / totalProducts) * 100);
        console.log(`   Batch ${Math.floor(skip / batchSize) + 1}: ${products.length} produits | Progrès: ${progress}%`);
      } catch (error) {
        console.error(`   ❌ Erreur batch ${skip}-${skip + batchSize}:`, error.message);
        errors += products.length;
      }

      // Pause pour ne pas surcharger
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ RÉINDEXATION TERMINÉE');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 Résultats:`);
    console.log(`   ✅ Indexés: ${indexed}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log(`   📦 Traités: ${processed}\n`);

    // Vérifier un produit exemple
    console.log('🔍 Vérification exemple (recherche Nutella)...');
    const testSearch = await algoliaService.searchProducts('nutella', {}, { hitsPerPage: 1 });
    
    if (testSearch.hits.length > 0) {
      const firstHit = testSearch.hits[0];
      console.log(`\n✅ Exemple produit indexé:`);
      console.log(`   Nom: ${firstHit.title || firstHit.name}`);
      console.log(`   Health Score: ${firstHit.healthScore}`);
      console.log(`   NOVA: ${firstHit.nova}`);
      console.log(`   NutriScore: ${firstHit.nutriscore}`);
      console.log(`   EcoScore: ${firstHit.ecoscore}\n`);
    } else {
      console.log('⚠️ Aucun résultat - attendre quelques secondes pour indexation\n');
    }

    // Configurer index
    // TEMPORAIREMENT DÉSACTIVÉconsole.log('⚙️ Configuration index Algolia...');
    //await algoliaService.configureIndex(false);
    console.log('✅ Index configuré\n');

    await mongoose.disconnect();
    console.log('✅ Déconnexion MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    process.exit(1);
  }
}

reindexWithScores();

