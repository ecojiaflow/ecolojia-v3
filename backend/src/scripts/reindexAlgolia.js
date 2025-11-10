const mongoose = require('mongoose');
const algoliaSync = require('../services/algolia/algoliaSync');
require('dotenv').config();

async function reindexAlgolia() {
  try {
    console.log('🔄 Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté\n');

    console.log('🔄 Démarrage réindexation Algolia...');
    console.log('⏳ Cela peut prendre 1-5 minutes...\n');

    // Utiliser le service de sync existant
    await algoliaSync.syncAllProducts();

    console.log('\n✅ RÉINDEXATION TERMINÉE !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur réindexation:', error);
    process.exit(1);
  }
}

reindexAlgolia();