// TEST SCRAPING GREENWEEZ - 10 PRODUITS
// Objectif : Valider extraction données avant automatisation

const axios = require('axios');
const cheerio = require('cheerio');

// âœ… Configuration test
const CONFIG = {
  BASE_URL: 'https://www.greenweez.com',
  TEST_CATEGORIES: [
    '/cosmetiques-bio',
    '/alimentation-bio', 
    '/maison-ecologique'
  ],
  MAX_PRODUCTS: 10,
  DELAY_MS: 2000, // Respecter le site
  USER_AGENT: 'Mozilla/5.0 (compatible; EcologiaBot/1.0)'
};

// âœ… Headers respectueux
const HEADERS = {
  'User-Agent': CONFIG.USER_AGENT,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
};

// âœ… Fonction délai respectueux
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// âœ… Extraction données produit
async function extractProductData(productUrl) {
  try {
    console.log(`ðŸ“¦ Extraction: ${productUrl}`);
    
    const response = await axios.get(productUrl, { 
      headers: HEADERS,
      timeout: 10000 
    });
    
    const $ = cheerio.load(response.data);
    
    // Extraction données Greenweez
    const product = {
      title: $('h1.product-name, .product-title, h1').first().text().trim(),
      description: $('.product-description, .description, .product-summary').first().text().trim(),
      price: $('.price, .product-price, .current-price').first().text().trim(),
      brand: $('.brand, .product-brand, .manufacturer').first().text().trim(),
      image: $('img.product-image, .product-photo img').first().attr('src'),
      availability: $('.availability, .stock-status').first().text().trim(),
      affiliate_url: productUrl,
      extracted_at: new Date().toISOString()
    };
    
    // Validation données minimales
    if (!product.title || !product.description) {
      throw new Error('Données essentielles manquantes');
    }
    
    console.log(`âœ… Extrait: ${product.title.substring(0, 50)}...`);
    return product;
    
  } catch (error) {
    console.error(`âŒ Erreur extraction ${productUrl}:`, error.message);
    return null;
  }
}

// âœ… Découverte URLs produits
async function discoverProductUrls(categoryUrl, maxProducts = 5) {
  try {
    console.log(`ðŸ” Découverte produits: ${categoryUrl}`);
    
    const response = await axios.get(CONFIG.BASE_URL + categoryUrl, { 
      headers: HEADERS,
      timeout: 10000 
    });
    
    const $ = cheerio.load(response.data);
    const productUrls = [];
    
    // Sélecteurs produits Greenweez (Ã  ajuster selon structure)
    $('a[href*="/produit/"], .product-link, .product-item a').each((i, element) => {
      if (productUrls.length >= maxProducts) return false;
      
      const href = $(element).attr('href');
      if (href && href.includes('/')) {
        const fullUrl = href.startsWith('http') ? href : CONFIG.BASE_URL + href;
        if (!productUrls.includes(fullUrl)) {
          productUrls.push(fullUrl);
        }
      }
    });
    
    console.log(`ðŸ“‹ Trouvé ${productUrls.length} produits dans ${categoryUrl}`);
    return productUrls;
    
  } catch (error) {
    console.error(`âŒ Erreur découverte ${categoryUrl}:`, error.message);
    return [];
  }
}

// âœ… Test principal
async function runTest() {
  console.log('ðŸš€ DÃ‰BUT TEST SCRAPING GREENWEEZ');
  console.log(`ðŸ“Š Objectif: ${CONFIG.MAX_PRODUCTS} produits`);
  console.log('â±ï¸  Délai respectueux: 2s entre requêtes\n');
  
  const allProducts = [];
  
  try {
    // Découverte URLs produits par catégorie
    for (const category of CONFIG.TEST_CATEGORIES) {
      if (allProducts.length >= CONFIG.MAX_PRODUCTS) break;
      
      console.log(`\nðŸ“‚ Catégorie: ${category}`);
      const remaining = CONFIG.MAX_PRODUCTS - allProducts.length;
      const productUrls = await discoverProductUrls(category, Math.min(remaining, 4));
      
      // Extraction données produits
      for (const url of productUrls) {
        if (allProducts.length >= CONFIG.MAX_PRODUCTS) break;
        
        await delay(CONFIG.DELAY_MS); // Respecter le site
        const productData = await extractProductData(url);
        
        if (productData) {
          allProducts.push(productData);
          console.log(`âœ… ${allProducts.length}/${CONFIG.MAX_PRODUCTS} produits extraits`);
        }
      }
    }
    
    // âœ… Résultats
    console.log('\nðŸŽ¯ RÃ‰SULTATS DU TEST:');
    console.log(`ðŸ“¦ Produits extraits: ${allProducts.length}/${CONFIG.MAX_PRODUCTS}`);
    console.log(`âœ… Taux de succès: ${Math.round((allProducts.length / CONFIG.MAX_PRODUCTS) * 100)}%`);
    
    // Affichage échantillon
    if (allProducts.length > 0) {
      console.log('\nðŸ“‹ Ã‰CHANTILLON DONNÃ‰ES:');
      allProducts.slice(0, 3).forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   Prix: ${product.price}`);
        console.log(`   Marque: ${product.brand}`);
        console.log(`   Description: ${product.description.substring(0, 100)}...`);
      });
    }
    
    // Sauvegarde test
    const fs = require('fs');
    fs.writeFileSync(
      `./test-results-${Date.now()}.json`, 
      JSON.stringify(allProducts, null, 2)
    );
    
    console.log('\nðŸ’¾ Données sauvegardées dans test-results-*.json');
    console.log('ðŸ”„ Prêt pour intégration n8n workflow !');
    
    return allProducts;
    
  } catch (error) {
    console.error('ðŸ’¥ Erreur test:', error.message);
    return [];
  }
}

// âœ… Validation données pour n8n
function validateForN8n(products) {
  console.log('\nðŸ” VALIDATION POUR N8N:');
  
  const validProducts = products.filter(p => {
    const isValid = p.title && p.description && p.title.length > 5;
    if (!isValid) {
      console.log(`âŒ Produit invalide: ${p.title || 'Sans titre'}`);
    }
    return isValid;
  });
  
  console.log(`âœ… Produits valides pour n8n: ${validProducts.length}/${products.length}`);
  
  // Format exemple pour webhook n8n
  if (validProducts.length > 0) {
    const example = validProducts[0];
    console.log('\nðŸ“¤ FORMAT WEBHOOK N8N:');
    console.log(JSON.stringify({
      title: example.title,
      description: example.description,
      brand: example.brand,
      affiliate_url: example.affiliate_url,
      zones_dispo: ['FR']
    }, null, 2));
  }
  
  return validProducts;
}

// âœ… Exécution
if (require.main === module) {
  runTest()
    .then(products => validateForN8n(products))
    .catch(console.error);
}

module.exports = { runTest, extractProductData, discoverProductUrls };