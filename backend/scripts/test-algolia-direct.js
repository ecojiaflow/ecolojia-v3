// scripts/test-algolia-direct.js
require('dotenv').config();
const algoliaService = require('../src/services/algolia/algoliaService');

async function testDirect() {
  console.log('\n🔍 TEST DIRECT ALGOLIA\n');
  
  try {
    // Recherche directe
    const result = await algoliaService.searchProducts('nutella', {}, { hitsPerPage: 1 });
    
    console.log('📊 Résultats Algolia bruts:');
    console.log(`   Total: ${result.nbHits}`);
    
    if (result.hits && result.hits.length > 0) {
      console.log('\n✅ Premier hit (structure complète):');
      console.log(JSON.stringify(result.hits[0], null, 2));
    } else {
      console.log('❌ Aucun hit retourné');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testDirect();
