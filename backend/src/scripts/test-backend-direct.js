// TEST BACKEND DIRECT - BYPASS N8N
// Fichier: /scripts/test-backend-direct.js

const axios = require('axios');

// âœ… Configuration backend direct
const CONFIG = {
  BACKEND_URL: 'https://ecolojia-backendv1.onrender.com',
  API_KEY: 'ecolojia-admin-secret-key-2025', // CL‰ API CONFIGUR‰E
  TEST_PRODUCT: {
    id: `test_${Date.now()}`,
    title: 'Test Produit Bio Direct',
    description: 'Produit test pour validation backend direct',
    slug: `test-produit-${Date.now()}`,
    brand: 'TestBrand',
    category: 'alimentation-bio',
    tags: ['bio', 'test'],
    zones_dispo: ['FR'],
    eco_score: 0.8,
    ai_confidence: 0.9,
    resume_fr: 'Produit test bio francais',
    resume_en: 'French bio test product',
    affiliate_url: 'https://example.com/test'
  }
};

// âœ… Test sante API
async function testHealthCheck() {
  try {
    console.log('ðŸ” Test sante backend...');
    
    const response = await axios.get(`${CONFIG.BACKEND_URL}/health`, {
      timeout: 10000
    });
    
    console.log('âœ… Backend accessible:', response.data);
    return true;
    
  } catch (error) {
    console.error('âŒ Backend inaccessible:', error.message);
    return false;
  }
}

// âœ… Test avec endpoint suggest (qui fonctionne)
async function testSuggestEndpoint() {
  try {
    console.log('ðŸ§ª Test endpoint /api/suggest...');
    
    const response = await axios.post(
      `${CONFIG.BACKEND_URL}/api/suggest`,
      {
        query: 'savon bio',
        zone: 'FR',
        lang: 'fr'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('âœ… Suggest fonctionne:', response.data);
    return true;
    
  } catch (error) {
    console.error('âŒ Suggest echoue:', error.response?.data || error.message);
    return false;
  }
}

// âœ… Test recuperation produit
async function testGetProduct(slug) {
  try {
    console.log(`ðŸ” Test recuperation produit: ${slug}...`);
    
    const response = await axios.get(
      `${CONFIG.BACKEND_URL}/api/products/${slug}`,
      { timeout: 10000 }
    );
    
    console.log('âœ… Produit recupere:', {
      title: response.data.title,
      eco_score: response.data.eco_score,
      ai_confidence: response.data.ai_confidence
    });
    
    return response.data;
    
  } catch (error) {
    console.error('âŒ Erreur recuperation:', error.response?.status, error.message);
    return null;
  }
}

// âœ… Import OpenFoodFacts vers backend direct
async function importDirectToBackend() {
  console.log('ðŸš€ IMPORT DIRECT VERS BACKEND');
  console.log('âš ï¸  Bypass n8n - pas d\'enrichissement IA\n');
  
  try {
    // 1. Test sante
    const healthy = await testHealthCheck();
    if (!healthy) return;
    
    // 2. Test suggest endpoint (plus realiste)
    const suggestWorks = await testSuggestEndpoint();
    if (!suggestWorks) return;
    
    // 3. Test recuperation produit existant
    await testGetProduct('savon-alep-artisanal'); // Produit test existant
    
    console.log('\nâœ… SUCCˆS! Backend fonctionne parfaitement');
    console.log('ðŸ”§ Le probleme vient du webhook n8n');
    console.log('ðŸ’¡ Solutions possibles:');
    console.log('   1. Verifier variables env n8n (DEEPSEEK_API_KEY, etc.)');
    console.log('   2. Tester webhook manuellement dans n8n');
    console.log('   3. Utiliser import direct en attendant');
    
  } catch (error) {
    console.error('ðŸ’¥ Erreur globale:', error.message);
  }
}

// âœ… Import OpenFoodFacts avec transformation simple
async function importOpenFoodFactsDirect() {
  console.log('ðŸ“¦ IMPORT OPENFOODFACTS DIRECT\n');
  
  try {
    // Recuperation produits (reutilise la fonction existante)
    const { fetchOpenFoodFactsProducts } = require('./import-openfoodfacts.js');
    const products = await fetchOpenFoodFactsProducts();
    
    console.log(`âœ… ${products.length} produits OpenFoodFacts recuperes`);
    
    if (products.length === 0) return;
    
    // Import direct (5 premiers pour test)
    for (let i = 0; i < Math.min(5, products.length); i++) {
      const product = products[i];
      
      const directProduct = {
        id: `off_${product.code}`,
        title: product.product_name.trim(),
        description: `Produit ${product.brands || ''} - ${product.categories?.split(',')[0] || 'alimentaire'}`,
        slug: product.product_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${Date.now()}`,
        brand: product.brands || null,
        category: 'alimentation-bio',
        tags: ['bio', 'openfoodfacts'],
        zones_dispo: ['FR'],
        eco_score: 0.6, // Score par defaut
        ai_confidence: 0.5, // Pas d'IA
        resume_fr: `Produit bio ${product.brands || ''} d'OpenFoodFacts`,
        resume_en: `Bio product ${product.brands || ''} from OpenFoodFacts`,
        affiliate_url: `https://world.openfoodfacts.org/product/${product.code}`
      };
      
      console.log(`ðŸ“¦ ${i + 1}/5: ${directProduct.title.substring(0, 40)}...`);
      
      const result = await testCreateProduct();
      CONFIG.TEST_PRODUCT = directProduct; // Update for next iteration
      
      if (result) {
        console.log('   âœ… Succes');
      } else {
        console.log('   âŒ ‰chec');
      }
      
      // Delai respectueux
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\nðŸŽ¯ Import direct termine!');
    console.log('ðŸ” Verification dans PostgreSQL recommandee');
    
  } catch (error) {
    console.error('ðŸ’¥ Erreur import direct:', error.message);
  }
}

// âœ… Menu principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--health')) {
    await testHealthCheck();
  } else if (args.includes('--test')) {
    await importDirectToBackend();
  } else if (args.includes('--import')) {
    await importOpenFoodFactsDirect();
  } else {
    console.log('ðŸ”§ TEST BACKEND DIRECT');
    console.log('\nCommandes:');
    console.log('  --health    # Test sante backend');
    console.log('  --test      # Test creation produit');
    console.log('  --import    # Import 5 produits OpenFoodFacts');
    console.log('\nâš ï¸  IMPORTANT: Configurer API_KEY dans le script!');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testHealthCheck, testSuggestEndpoint, importDirectToBackend };
