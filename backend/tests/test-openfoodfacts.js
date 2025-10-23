// TEST OPENFOODFACTS SIMPLIFIÃƒâ€° - SANS FILTRES COMPLEXES
// Fichier: /tests/test-openfoodfacts.js

const axios = require('axios');
const fs = require('fs');

// Ã¢Å“â€¦ Configuration simplifiÃ©e
const CONFIG = {
  BASE_URL: 'https://world.openfoodfacts.org',
  MAX_PRODUCTS: 20
};

// Ã¢Å“â€¦ Test 1: Recherche basique "bio"
async function testBasicSearch() {
  try {
    console.log('Ã°Å¸â€Â Test 1: Recherche basique "bio"...');
    
    const url = `${CONFIG.BASE_URL}/cgi/search.pl`;
    const params = {
      search_terms: 'bio',
      page_size: 10,
      json: 1,
      fields: 'code,product_name,brands,categories,image_url,countries'
    };

    const response = await axios.get(url, { 
      params,
      timeout: 10000,
      headers: {
        'User-Agent': 'Ecolojia-Test/1.0'
      }
    });

    console.log(`Ã¢Å“â€¦ RÃ©sultats: ${response.data.products?.length || 0} produits`);
    return response.data.products || [];

  } catch (error) {
    console.error('Ã¢ÂÅ’ Erreur test basique:', error.message);
    return [];
  }
}

// Ã¢Å“â€¦ Test 2: Produits populaires franÃ§ais
async function testFrenchProducts() {
  try {
    console.log('Ã°Å¸â€Â Test 2: Produits populaires franÃ§ais...');
    
    const url = `${CONFIG.BASE_URL}/cgi/search.pl`;
    const params = {
      tagtype_0: 'countries',
      tag_contains_0: 'contains',
      tag_0: 'France',
      sort_by: 'popularity_key',
      page_size: 15,
      json: 1,
      fields: 'code,product_name,brands,categories,image_url,labels'
    };

    const response = await axios.get(url, { 
      params,
      timeout: 10000,
      headers: {
        'User-Agent': 'Ecolojia-Test/1.0'
      }
    });

    console.log(`Ã¢Å“â€¦ RÃ©sultats: ${response.data.products?.length || 0} produits franÃ§ais`);
    return response.data.products || [];

  } catch (error) {
    console.error('Ã¢ÂÅ’ Erreur test franÃ§ais:', error.message);
    return [];
  }
}

// Ã¢Å“â€¦ Test 3: API diffÃ©rente - CatÃ©gories
async function testCategories() {
  try {
    console.log('Ã°Å¸â€Â Test 3: API CatÃ©gories...');
    
    const url = `${CONFIG.BASE_URL}/api/v2/search`;
    const params = {
      categories_tags: 'en:organic-products',
      countries_tags: 'en:france',
      fields: 'code,product_name,brands,image_url',
      page_size: 10
    };

    const response = await axios.get(url, { 
      params,
      timeout: 10000,
      headers: {
        'User-Agent': 'Ecolojia-Test/1.0'
      }
    });

    console.log(`Ã¢Å“â€¦ RÃ©sultats: ${response.data.products?.length || 0} produits catÃ©gories`);
    return response.data.products || [];

  } catch (error) {
    console.error('Ã¢ÂÅ’ Erreur test catÃ©gories:', error.message);
    return [];
  }
}

// Ã¢Å“â€¦ Test 4: Produits au hasard
async function testRandomProducts() {
  try {
    console.log('Ã°Å¸â€Â Test 4: Produits alÃ©atoires...');
    
    const url = `${CONFIG.BASE_URL}/cgi/search.pl`;
    const params = {
      page_size: 20,
      json: 1,
      fields: 'code,product_name,brands,categories,image_url,countries,labels'
    };

    const response = await axios.get(url, { 
      params,
      timeout: 10000,
      headers: {
        'User-Agent': 'Ecolojia-Test/1.0'
      }
    });

    console.log(`Ã¢Å“â€¦ RÃ©sultats: ${response.data.products?.length || 0} produits alÃ©atoires`);
    return response.data.products || [];

  } catch (error) {
    console.error('Ã¢ÂÅ’ Erreur test alÃ©atoire:', error.message);
    return [];
  }
}

// Ã¢Å“â€¦ Transformation simple pour Ecolojia
function transformProducts(products, source) {
  return products
    .filter(p => p.product_name && p.product_name.trim().length > 3)
    .map(product => ({
      id: `off_${product.code}`,
      title: product.product_name.trim(),
      description: generateSimpleDescription(product),
      slug: generateSlug(product.product_name),
      brand: product.brands || null,
      category: 'alimentation',
      tags: extractSimpleTags(product),
      images: product.image_url ? [product.image_url] : [],
      zones_dispo: ['FR'],
      affiliate_url: `https://world.openfoodfacts.org/product/${product.code}`,
      eco_score: 0.6, // Score par dÃ©faut pour produits OpenFoodFacts
      ai_confidence: 0.7, // Confiance modÃ©rÃ©e
      resume_fr: `Produit alimentaire ${product.brands || ''} rÃ©fÃ©rencÃ© OpenFoodFacts`,
      resume_en: `Food product ${product.brands || ''} from OpenFoodFacts`,
      source: source,
      external_id: product.code,
      created_at: new Date().toISOString()
    }));
}

// Ã¢Å“â€¦ Fonctions utilitaires simples
function generateSimpleDescription(product) {
  const brand = product.brands ? `de ${product.brands}` : '';
  const categories = product.categories ? ` - ${product.categories.split(',')[0]}` : '';
  return `Produit alimentaire ${brand}${categories}. DonnÃ©es OpenFoodFacts.`;
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40) + `-${Date.now()}`;
}

function extractSimpleTags(product) {
  const tags = ['alimentaire'];
  
  if (product.labels) {
    const labels = product.labels.toLowerCase();
    if (labels.includes('bio') || labels.includes('organic')) tags.push('bio');
    if (labels.includes('vegan')) tags.push('vegan');
    if (labels.includes('gluten')) tags.push('sans-gluten');
  }
  
  if (product.categories) {
    const cats = product.categories.toLowerCase();
    if (cats.includes('boisson')) tags.push('boisson');
    if (cats.includes('snack')) tags.push('collation');
  }
  
  return tags;
}

// Ã¢Å“â€¦ Test principal simplifiÃ©
async function runOpenFoodFactsTest() {
  console.log('Ã°Å¸Å¡â‚¬ TEST OPENFOODFACTS SIMPLIFIÃƒâ€°');
  console.log('Ã°Å¸Å½Â¯ Objectif: Trouver des produits avec diffÃ©rentes approches\n');
  
  const allProducts = [];
  
  try {
    // Test 1: Recherche basique
    const basic = await testBasicSearch();
    if (basic.length > 0) {
      allProducts.push(...transformProducts(basic.slice(0, 5), 'basic-search'));
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // DÃ©lai respectueux
    
    // Test 2: Produits franÃ§ais
    const french = await testFrenchProducts();
    if (french.length > 0) {
      allProducts.push(...transformProducts(french.slice(0, 5), 'french-products'));
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: CatÃ©gories
    const categories = await testCategories();
    if (categories.length > 0) {
      allProducts.push(...transformProducts(categories.slice(0, 5), 'categories-api'));
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: AlÃ©atoires si rien d'autre ne marche
    if (allProducts.length === 0) {
      const random = await testRandomProducts();
      if (random.length > 0) {
        allProducts.push(...transformProducts(random.slice(0, 10), 'random-products'));
      }
    }
    
    // RÃ©sultats
    console.log('\nÃ°Å¸â€œÅ  RÃƒâ€°SULTATS FINAUX:');
    console.log(`Ã¢Å“â€¦ Total produits extraits: ${allProducts.length}`);
    
    if (allProducts.length > 0) {
      // Affichage Ã©chantillon
      console.log('\nÃ°Å¸â€œâ€¹ Ãƒâ€°CHANTILLON:');
      allProducts.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${product.title}`);
        console.log(`   Marque: ${product.brand || 'N/A'}`);
        console.log(`   Source: ${product.source}`);
        console.log(`   Tags: ${product.tags.join(', ')}`);
      });
      
      // Sauvegarde
      const filename = `./openfoodfacts-simple-${Date.now()}.json`;
      fs.writeFileSync(filename, JSON.stringify(allProducts, null, 2));
      console.log(`\nÃ°Å¸â€™Â¾ SauvegardÃ©: ${filename}`);
      
      // Format n8n
      console.log('\nÃ°Å¸â€â€ž EXEMPLE POUR N8N:');
      const example = allProducts[0];
      console.log(JSON.stringify({
        title: example.title,
        description: example.description,
        brand: example.brand,
        affiliate_url: example.affiliate_url,
        zones_dispo: example.zones_dispo
      }, null, 2));
      
      console.log('\nÃ¢Å“â€¦ SUCCÃƒË†S! OpenFoodFacts fonctionne');
      
    } else {
      console.log('\nÃ¢ÂÅ’ Ãƒâ€°CHEC: Aucun produit trouvÃ© avec toutes les mÃ©thodes');
      console.log('Ã°Å¸â€â€ž Recommandation: Tester un autre site (Biocoop)');
    }
    
    return allProducts;
    
  } catch (error) {
    console.error('Ã°Å¸â€™Â¥ Erreur globale:', error.message);
    return [];
  }
}

// Ã¢Å“â€¦ ExÃ©cution
if (require.main === module) {
  runOpenFoodFactsTest().catch(console.error);
}

module.exports = { runOpenFoodFactsTest };