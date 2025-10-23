// TEST SCRAPING GREENWEEZ - 10 PRODUITS
// Objectif : Valider extraction donnÃ©es avant automatisation

const axios = require('axios');
const cheerio = require('cheerio');

// Ã¢Å“â€¦ Configuration test
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

// Ã¢Å“â€¦ Headers respectueux
const HEADERS = {
  'User-Agent': CONFIG.USER_AGENT,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
};

// Ã¢Å“â€¦ Fonction dÃ©lai respectueux
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ã¢Å“â€¦ Extraction donnÃ©es produit
async function extractProductData(productUrl) {
  try {
    console.log(`Ã°Å¸â€œÂ¦ Extraction: ${productUrl}`);
    
    const response = await axios.get(productUrl, { 
      headers: HEADERS,
      timeout: 10000 
    });
    
    const $ = cheerio.load(response.data);
    
    // Extraction donnÃ©es Greenweez
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
    
    // Validation donnÃ©es minimales
    if (!product.title || !product.description) {
      throw new Error('DonnÃ©es essentielles manquantes');
    }
    
    console.log(`Ã¢Å“â€¦ Extrait: ${product.title.substring(0, 50)}...`);
    return product;
    
  } catch (error) {
    console.error(`Ã¢ÂÅ’ Erreur extraction ${productUrl}:`, error.message);
    return null;
  }
}

// Ã¢Å“â€¦ DÃ©couverte URLs produits
async function discoverProductUrls(categoryUrl, maxProducts = 5) {
  try {
    console.log(`Ã°Å¸â€Â DÃ©couverte produits: ${categoryUrl}`);
    
    const response = await axios.get(CONFIG.BASE_URL + categoryUrl, { 
      headers: HEADERS,
      timeout: 10000 
    });
    
    const $ = cheerio.load(response.data);
    const productUrls = [];
    
    // SÃ©lecteurs produits Greenweez (ÃƒÂ  ajuster selon structure)
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
    
    console.log(`Ã°Å¸â€œâ€¹ TrouvÃ© ${productUrls.length} produits dans ${categoryUrl}`);
    return productUrls;
    
  } catch (error) {
    console.error(`Ã¢ÂÅ’ Erreur dÃ©couverte ${categoryUrl}:`, error.message);
    return [];
  }
}

// Ã¢Å“â€¦ Test principal
async function runTest() {
  console.log('Ã°Å¸Å¡â‚¬ DÃƒâ€°BUT TEST SCRAPING GREENWEEZ');
  console.log(`Ã°Å¸â€œÅ  Objectif: ${CONFIG.MAX_PRODUCTS} produits`);
  console.log('Ã¢ÂÂ±Ã¯Â¸Â  DÃ©lai respectueux: 2s entre requÃªtes\n');
  
  const allProducts = [];
  
  try {
    // DÃ©couverte URLs produits par catÃ©gorie
    for (const category of CONFIG.TEST_CATEGORIES) {
      if (allProducts.length >= CONFIG.MAX_PRODUCTS) break;
      
      console.log(`\nÃ°Å¸â€œâ€š CatÃ©gorie: ${category}`);
      const remaining = CONFIG.MAX_PRODUCTS - allProducts.length;
      const productUrls = await discoverProductUrls(category, Math.min(remaining, 4));
      
      // Extraction donnÃ©es produits
      for (const url of productUrls) {
        if (allProducts.length >= CONFIG.MAX_PRODUCTS) break;
        
        await delay(CONFIG.DELAY_MS); // Respecter le site
        const productData = await extractProductData(url);
        
        if (productData) {
          allProducts.push(productData);
          console.log(`Ã¢Å“â€¦ ${allProducts.length}/${CONFIG.MAX_PRODUCTS} produits extraits`);
        }
      }
    }
    
    // Ã¢Å“â€¦ RÃ©sultats
    console.log('\nÃ°Å¸Å½Â¯ RÃƒâ€°SULTATS DU TEST:');
    console.log(`Ã°Å¸â€œÂ¦ Produits extraits: ${allProducts.length}/${CONFIG.MAX_PRODUCTS}`);
    console.log(`Ã¢Å“â€¦ Taux de succÃ¨s: ${Math.round((allProducts.length / CONFIG.MAX_PRODUCTS) * 100)}%`);
    
    // Affichage Ã©chantillon
    if (allProducts.length > 0) {
      console.log('\nÃ°Å¸â€œâ€¹ Ãƒâ€°CHANTILLON DONNÃƒâ€°ES:');
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
    
    console.log('\nÃ°Å¸â€™Â¾ DonnÃ©es sauvegardÃ©es dans test-results-*.json');
    console.log('Ã°Å¸â€â€ž PrÃªt pour intÃ©gration n8n workflow !');
    
    return allProducts;
    
  } catch (error) {
    console.error('Ã°Å¸â€™Â¥ Erreur test:', error.message);
    return [];
  }
}

// Ã¢Å“â€¦ Validation donnÃ©es pour n8n
function validateForN8n(products) {
  console.log('\nÃ°Å¸â€Â VALIDATION POUR N8N:');
  
  const validProducts = products.filter(p => {
    const isValid = p.title && p.description && p.title.length > 5;
    if (!isValid) {
      console.log(`Ã¢ÂÅ’ Produit invalide: ${p.title || 'Sans titre'}`);
    }
    return isValid;
  });
  
  console.log(`Ã¢Å“â€¦ Produits valides pour n8n: ${validProducts.length}/${products.length}`);
  
  // Format exemple pour webhook n8n
  if (validProducts.length > 0) {
    const example = validProducts[0];
    console.log('\nÃ°Å¸â€œÂ¤ FORMAT WEBHOOK N8N:');
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

// Ã¢Å“â€¦ ExÃ©cution
if (require.main === module) {
  runTest()
    .then(products => validateForN8n(products))
    .catch(console.error);
}

module.exports = { runTest, extractProductData, discoverProductUrls };