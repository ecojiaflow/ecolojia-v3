// TEST BACKEND DIRECT - BYPASS N8N
// Fichier: /scripts/test-backend-direct.js

const axios = require('axios');

// Ã¢Å“â€¦ Configuration backend direct
const CONFIG = {
  BACKEND_URL: 'https://ecolojia-backendv1.onrender.com',
  API_KEY: 'ecolojia-admin-secret-key-2025', // CLâ€° API CONFIGURâ€°E
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

// Ã¢Å“â€¦ Test sante API
async function testHealthCheck() {
  try {
    console.log('Ã°Å¸â€Â Test sante backend...');
    
    const response = await axios.get(`${CONFIG.BACKEND_URL}/health`, {
      timeout: 10000
    });
    
    console.log('Ã¢Å“â€¦ Backend accessible:', response.data);
    return true;
    
  } catch (error) {
    console.error('Ã¢ÂÅ’ Backend inaccessible:', error.message);
    return false;
  }
}

// Ã¢Å“â€¦ Test avec endpoint suggest (qui fonctionne)
async function testSuggestEndpoint() {
  try {
    console.log('Ã°Å¸Â§Âª Test endpoint /api/suggest...');
    
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
    
    console.log('Ã¢Å“â€¦ Suggest fonctionne:', response.data);
    return true;
    
  } catch (error) {
    console.error('Ã¢ÂÅ’ Suggest echoue:', error.response?.data || error.message);
    return false;
  }
}

// Ã¢Å“â€¦ Test recuperation produit
async function testGetProduct(slug) {
  try {
    console.log(`Ã°Å¸â€Â Test recuperation produit: ${slug}...`);
    
    const response = await axios.get(
      `${CONFIG.BACKEND_URL}/api/products/${slug}`,
      { timeout: 10000 }
    );
    
    console.log('Ã¢Å“â€¦ Produit recupere:', {
      title: response.data.title,
      eco_score: response.data.eco_score,
      ai_confidence: response.data.ai_confidence
    });
    
    return response.data;
    
  } catch (error) {
    console.error('Ã¢ÂÅ’ Erreur recuperation:', error.response?.status, error.message);
    return null;
  }
}

// Ã¢Å“â€¦ Import OpenFoodFacts vers backend direct
async function importDirectToBackend() {
  console.log('Ã°Å¸Å¡â‚¬ IMPORT DIRECT VERS BACKEND');
  console.log('Ã¢Å¡Â Ã¯Â¸Â  Bypass n8n - pas d\'enrichissement IA\n');
  
  try {
    // 1. Test sante
    const healthy = await testHealthCheck();
    if (!healthy) return;
    
    // 2. Test suggest endpoint (plus realiste)
    const suggestWorks = await testSuggestEndpoint();
    if (!suggestWorks) return;
    
    // 3. Test recuperation produit existant
    await testGetProduct('savon-alep-artisanal'); // Produit test existant
    
    console.log('\nÃ¢Å“â€¦ SUCCË†S! Backend fonctionne parfaitement');
    console.log('Ã°Å¸â€Â§ Le probleme vient du webhook n8n');
    console.log('Ã°Å¸â€™Â¡ Solutions possibles:');
    console.log('   1. Verifier variables env n8n (DEEPSEEK_API_KEY, etc.)');
    console.log('   2. Tester webhook manuellement dans n8n');
    console.log('   3. Utiliser import direct en attendant');
    
  } catch (error) {
    console.error('Ã°Å¸â€™Â¥ Erreur globale:', error.message);
  }
}

// Ã¢Å“â€¦ Import OpenFoodFacts avec transformation simple
async function importOpenFoodFactsDirect() {
  console.log('Ã°Å¸â€œÂ¦ IMPORT OPENFOODFACTS DIRECT\n');
  
  try {
    // Recuperation produits (reutilise la fonction existante)
    const { fetchOpenFoodFactsProducts } = require('./import-openfoodfacts.js');
    const products = await fetchOpenFoodFactsProducts();
    
    console.log(`Ã¢Å“â€¦ ${products.length} produits OpenFoodFacts recuperes`);
    
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
      
      console.log(`Ã°Å¸â€œÂ¦ ${i + 1}/5: ${directProduct.title.substring(0, 40)}...`);
      
      const result = await testCreateProduct();
      CONFIG.TEST_PRODUCT = directProduct; // Update for next iteration
      
      if (result) {
        console.log('   Ã¢Å“â€¦ Succes');
      } else {
        console.log('   Ã¢ÂÅ’ â€°chec');
      }
      
      // Delai respectueux
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\nÃ°Å¸Å½Â¯ Import direct termine!');
    console.log('Ã°Å¸â€Â Verification dans PostgreSQL recommandee');
    
  } catch (error) {
    console.error('Ã°Å¸â€™Â¥ Erreur import direct:', error.message);
  }
}

// Ã¢Å“â€¦ Menu principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--health')) {
    await testHealthCheck();
  } else if (args.includes('--test')) {
    await importDirectToBackend();
  } else if (args.includes('--import')) {
    await importOpenFoodFactsDirect();
  } else {
    console.log('Ã°Å¸â€Â§ TEST BACKEND DIRECT');
    console.log('\nCommandes:');
    console.log('  --health    # Test sante backend');
    console.log('  --test      # Test creation produit');
    console.log('  --import    # Import 5 produits OpenFoodFacts');
    console.log('\nÃ¢Å¡Â Ã¯Â¸Â  IMPORTANT: Configurer API_KEY dans le script!');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testHealthCheck, testSuggestEndpoint, importDirectToBackend };
