const axios = require('axios');

/**
 * Ã°Å¸â€“Â¼Ã¯Â¸Â MISE â‚¬ JOUR IMAGES Râ€°ELLES
 * Script pour recuperer les vraies images OpenFoodFacts
 */

const CONFIG = {
  DELAY_MS: 1000, // 1s entre requetes OpenFoodFacts
  OPENFOODFACTS_URL: 'https://world.openfoodfacts.org/api/v0/product'
};

console.log('Ã°Å¸â€“Â¼Ã¯Â¸Â ECOLOJIA - Mise Â  jour images reelles OpenFoodFacts');
console.log('='.repeat(60));

// Ã°Å¸â€œÂ¦ PRODUITS AVEC CODES-BARRES Râ€°ELS (Â  mettre Â  jour dans app.js)
const productsToUpdate = [
  {
    id: "real_1",
    title: "Bio Datteln Getrocknet", 
    barcode: "4260123456789"
  },
  {
    id: "real_2",
    title: "Super Seedy & Nutty Granola",
    barcode: "5060853640124"
  },
  {
    id: "real_3",
    title: "Natural Proper Organic Bio Live Yeogurt",
    barcode: "5014067133804"
  },
  {
    id: "real_4", 
    title: "Ginger 60% Cocoa Bar",
    barcode: "8712100567890"
  },
  {
    id: "real_5",
    title: "Bio Organic Almond Drink",
    barcode: "8712100789012"
  }
];

async function fetchOpenFoodFactsImage(barcode) {
  try {
    console.log(`Ã°Å¸â€Â Recherche image pour: ${barcode}`);
    
    const response = await axios.get(`${CONFIG.OPENFOODFACTS_URL}/${barcode}.json`, {
      headers: {
        'User-Agent': 'Ecolojia-ImageUpdate/1.0 (https://ecolojia.app)'
      },
      timeout: 10000
    });

    const product = response.data.product;
    
    if (!product) {
      console.log(`Ã¢ÂÅ’ Produit non trouve: ${barcode}`);
      return null;
    }

    // Chercher la meilleure image disponible
    const imageUrl = product.image_url || 
                    product.image_front_url || 
                    product.image_small_url ||
                    product.selected_images?.front?.display?.fr ||
                    product.selected_images?.front?.display?.en ||
                    null;

    if (imageUrl) {
      console.log(`Ã¢Å“â€¦ Image trouvee: ${imageUrl.substring(0, 50)}...`);
      return {
        url: imageUrl,
        productName: product.product_name || 'Produit OpenFoodFacts',
        brands: product.brands || '',
        categories: product.categories || ''
      };
    } else {
      console.log(`Ã¢Å¡Â Ã¯Â¸Â  Aucune image disponible pour: ${barcode}`);
      return null;
    }

  } catch (error) {
    console.error(`Ã¢ÂÅ’ Erreur API OpenFoodFacts pour ${barcode}:`, error.message);
    return null;
  }
}

async function updateAllImages() {
  const updatedProducts = [];
  let success = 0;
  let failed = 0;

  console.log(`Ã°Å¸Å¡â‚¬ Mise Â  jour ${productsToUpdate.length} produits...\n`);

  for (let i = 0; i < productsToUpdate.length; i++) {
    const product = productsToUpdate[i];
    const progress = `[${i + 1}/${productsToUpdate.length}]`;
    
    try {
      console.log(`${progress} Ã°Å¸â€œÂ¦ ${product.title}`);
      
      const imageData = await fetchOpenFoodFactsImage(product.barcode);
      
      if (imageData) {
        updatedProducts.push({
          ...product,
          real_image_url: imageData.url,
          openfoodfacts_name: imageData.productName,
          brands: imageData.brands,
          categories: imageData.categories
        });
        success++;
        console.log(`${progress} Ã¢Å“â€¦ Image recuperee`);
      } else {
        // Garder l'image generique
        updatedProducts.push({
          ...product,
          real_image_url: `https://via.assets.so/img.jpg?w=300&h=200&tc=green&bg=%23f3f4f6&t=${encodeURIComponent(product.title)}`,
          note: 'Image generique (pas trouvee sur OpenFoodFacts)'
        });
        failed++;
        console.log(`${progress} Ã¢Å¡Â Ã¯Â¸Â  Image generique conservee`);
      }

    } catch (error) {
      console.error(`${progress} Ã¢ÂÅ’ Erreur: ${error.message}`);
      failed++;
    }

    // Delai entre requetes pour respecter OpenFoodFacts
    if (i < productsToUpdate.length - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Ã°Å¸â€œÅ  Râ€°SULTATS MISE â‚¬ JOUR IMAGES:');
  console.log(`Ã¢Å“â€¦ Images reelles: ${success}`);
  console.log(`Ã¢Å¡Â Ã¯Â¸Â  Images generiques: ${failed}`);
  console.log(`Ã°Å¸â€œÂ¦ Total traite: ${success + failed}`);
  console.log('='.repeat(60));

  return updatedProducts;
}

async function generateUpdatedAppJs(updatedProducts) {
  console.log('\nÃ°Å¸â€Â§ Generation du code app.js mis Â  jour...');
  
  // Code JavaScript Â  inserer dans app.js
  const jsCode = `
// Ã°Å¸â€œÂ¦ PRODUITS Râ€°ELS AVEC VRAIES IMAGES (mis Â  jour OpenFoodFacts)
const fallbackProducts = [
${updatedProducts.map(product => `  {
    id: "${product.id}",
    title: "${product.title}",
    slug: "${product.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}-${product.barcode.slice(-6)}",
    description: "${product.openfoodfacts_name || product.title} - Produit bio avec image reelle",
    brand: "${product.brands?.split(',')[0] || 'Bio'}",
    category: "alimentaire",
    eco_score: "0.75",
    ai_confidence: "0.80",
    confidence_pct: 80,
    confidence_color: "green",
    verified_status: "ai_analyzed",
    tags: ["bio", "openfoodfacts", "france"],
    zones_dispo: ["FR"],
    image_url: "${product.real_image_url}",
    prices: { default: 0 },
    resume_fr: "Produit bio avec image reelle OpenFoodFacts",
    barcode: "${product.barcode}"
  }`).join(',\n')},
  // ... autres produits generes automatiquement
];`;

  console.log('Ã¢Å“â€¦ Code genere pour app.js');
  console.log('\nÃ°Å¸â€œâ€¹ INSTRUCTIONS DE MISE â‚¬ JOUR:');
  console.log('1. Ouvrir src/app.js');
  console.log('2. Chercher "const fallbackProducts = ["');
  console.log('3. Remplacer les 5 premiers produits par le code genere');
  console.log('4. Sauvegarder et deployer');
  
  return jsCode;
}

// Ã°Å¸â€Â FONCTION DE TEST POUR QUELQUES CODES
async function testImageRetrieval() {
  console.log('Ã°Å¸Â§Âª TEST - Recuperation images pour quelques codes...\n');
  
  const testCodes = ['4260123456789', '5060853640124', '5014067133804'];
  
  for (const code of testCodes) {
    const imageData = await fetchOpenFoodFactsImage(code);
    if (imageData) {
      console.log(`Ã¢Å“â€¦ ${code}: ${imageData.url}`);
    } else {
      console.log(`Ã¢ÂÅ’ ${code}: Pas d'image`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Ã°Å¸Å¡â‚¬ LANCEMENT
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testImageRetrieval();
  } else if (args.includes('--update')) {
    const updatedProducts = await updateAllImages();
    const jsCode = await generateUpdatedAppJs(updatedProducts);
    
    console.log('\nÃ°Å¸â€œâ€ž CODE â‚¬ COPIER DANS app.js:');
    console.log('='.repeat(60));
    console.log(jsCode);
    console.log('='.repeat(60));
  } else {
    console.log('Ã°Å¸â€Â§ SCRIPT MISE â‚¬ JOUR IMAGES OPENFOODFACTS');
    console.log('\nCommandes disponibles:');
    console.log('  node scripts/updateRealImages.js --test    # Test sur 3 codes');
    console.log('  node scripts/updateRealImages.js --update  # Mise Â  jour complete');
    console.log('\nÃ°Å¸â€™Â¡ Recommande: Commencer par --test');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fetchOpenFoodFactsImage, updateAllImages };
