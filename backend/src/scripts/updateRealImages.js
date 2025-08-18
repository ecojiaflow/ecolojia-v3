const axios = require('axios');

/**
 * ðŸ–¼ï¸ MISE € JOUR IMAGES R‰ELLES
 * Script pour recuperer les vraies images OpenFoodFacts
 */

const CONFIG = {
  DELAY_MS: 1000, // 1s entre requetes OpenFoodFacts
  OPENFOODFACTS_URL: 'https://world.openfoodfacts.org/api/v0/product'
};

console.log('ðŸ–¼ï¸ ECOLOJIA - Mise   jour images reelles OpenFoodFacts');
console.log('='.repeat(60));

// ðŸ“¦ PRODUITS AVEC CODES-BARRES R‰ELS (  mettre   jour dans app.js)
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
    console.log(`ðŸ” Recherche image pour: ${barcode}`);
    
    const response = await axios.get(`${CONFIG.OPENFOODFACTS_URL}/${barcode}.json`, {
      headers: {
        'User-Agent': 'Ecolojia-ImageUpdate/1.0 (https://ecolojia.app)'
      },
      timeout: 10000
    });

    const product = response.data.product;
    
    if (!product) {
      console.log(`âŒ Produit non trouve: ${barcode}`);
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
      console.log(`âœ… Image trouvee: ${imageUrl.substring(0, 50)}...`);
      return {
        url: imageUrl,
        productName: product.product_name || 'Produit OpenFoodFacts',
        brands: product.brands || '',
        categories: product.categories || ''
      };
    } else {
      console.log(`âš ï¸  Aucune image disponible pour: ${barcode}`);
      return null;
    }

  } catch (error) {
    console.error(`âŒ Erreur API OpenFoodFacts pour ${barcode}:`, error.message);
    return null;
  }
}

async function updateAllImages() {
  const updatedProducts = [];
  let success = 0;
  let failed = 0;

  console.log(`ðŸš€ Mise   jour ${productsToUpdate.length} produits...\n`);

  for (let i = 0; i < productsToUpdate.length; i++) {
    const product = productsToUpdate[i];
    const progress = `[${i + 1}/${productsToUpdate.length}]`;
    
    try {
      console.log(`${progress} ðŸ“¦ ${product.title}`);
      
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
        console.log(`${progress} âœ… Image recuperee`);
      } else {
        // Garder l'image generique
        updatedProducts.push({
          ...product,
          real_image_url: `https://via.assets.so/img.jpg?w=300&h=200&tc=green&bg=%23f3f4f6&t=${encodeURIComponent(product.title)}`,
          note: 'Image generique (pas trouvee sur OpenFoodFacts)'
        });
        failed++;
        console.log(`${progress} âš ï¸  Image generique conservee`);
      }

    } catch (error) {
      console.error(`${progress} âŒ Erreur: ${error.message}`);
      failed++;
    }

    // Delai entre requetes pour respecter OpenFoodFacts
    if (i < productsToUpdate.length - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_MS));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('ðŸ“Š R‰SULTATS MISE € JOUR IMAGES:');
  console.log(`âœ… Images reelles: ${success}`);
  console.log(`âš ï¸  Images generiques: ${failed}`);
  console.log(`ðŸ“¦ Total traite: ${success + failed}`);
  console.log('='.repeat(60));

  return updatedProducts;
}

async function generateUpdatedAppJs(updatedProducts) {
  console.log('\nðŸ”§ Generation du code app.js mis   jour...');
  
  // Code JavaScript   inserer dans app.js
  const jsCode = `
// ðŸ“¦ PRODUITS R‰ELS AVEC VRAIES IMAGES (mis   jour OpenFoodFacts)
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

  console.log('âœ… Code genere pour app.js');
  console.log('\nðŸ“‹ INSTRUCTIONS DE MISE € JOUR:');
  console.log('1. Ouvrir src/app.js');
  console.log('2. Chercher "const fallbackProducts = ["');
  console.log('3. Remplacer les 5 premiers produits par le code genere');
  console.log('4. Sauvegarder et deployer');
  
  return jsCode;
}

// ðŸ” FONCTION DE TEST POUR QUELQUES CODES
async function testImageRetrieval() {
  console.log('ðŸ§ª TEST - Recuperation images pour quelques codes...\n');
  
  const testCodes = ['4260123456789', '5060853640124', '5014067133804'];
  
  for (const code of testCodes) {
    const imageData = await fetchOpenFoodFactsImage(code);
    if (imageData) {
      console.log(`âœ… ${code}: ${imageData.url}`);
    } else {
      console.log(`âŒ ${code}: Pas d'image`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// ðŸš€ LANCEMENT
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testImageRetrieval();
  } else if (args.includes('--update')) {
    const updatedProducts = await updateAllImages();
    const jsCode = await generateUpdatedAppJs(updatedProducts);
    
    console.log('\nðŸ“„ CODE € COPIER DANS app.js:');
    console.log('='.repeat(60));
    console.log(jsCode);
    console.log('='.repeat(60));
  } else {
    console.log('ðŸ”§ SCRIPT MISE € JOUR IMAGES OPENFOODFACTS');
    console.log('\nCommandes disponibles:');
    console.log('  node scripts/updateRealImages.js --test    # Test sur 3 codes');
    console.log('  node scripts/updateRealImages.js --update  # Mise   jour complete');
    console.log('\nðŸ’¡ Recommande: Commencer par --test');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fetchOpenFoodFactsImage, updateAllImages };
