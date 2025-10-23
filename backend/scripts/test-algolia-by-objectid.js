// scripts/test-algolia-by-objectid.js
require('dotenv').config();
const algoliaService = require('../src/services/algolia/algoliaService');

async function testByObjectID() {
  console.log('\n🔍 TEST PAR OBJECTID\n');
  
  try {
    // ObjectID du dashboard qui a healthScore: 92
    const objectID = '68e2c6a146db866b232c59e8';
    
    console.log(`📋 Recherche produit avec objectID: ${objectID}`);
    
    // Recherche par filtre objectID
    const result = await algoliaService.searchProducts('', {}, { 
      hitsPerPage: 5,
      filters: `objectID:${objectID}`
    });
    
    console.log(`\n📊 Résultats: ${result.nbHits} hits`);
    
    if (result.hits && result.hits.length > 0) {
      console.log('\n✅ Produit trouvé:');
      console.log(JSON.stringify(result.hits[0], null, 2));
    } else {
      console.log('\n❌ Aucun produit avec cet objectID');
      
      // Essayer recherche large pour voir structure
      console.log('\n📋 Test recherche large (premiers 3 produits):');
      const broadResult = await algoliaService.searchProducts('', {}, { hitsPerPage: 3 });
      
      broadResult.hits.forEach((hit, index) => {
        console.log(`\n--- Produit ${index + 1} ---`);
        console.log(`ObjectID: ${hit.objectID}`);
        console.log(`Name: ${hit.name || hit.title}`);
        console.log(`HealthScore: ${hit.healthScore}`);
        console.log(`NOVA: ${hit.nova}`);
        console.log(`NutriScore: ${hit.nutriscore}`);
        console.log(`Champs disponibles: ${Object.keys(hit).join(', ')}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testByObjectID();
