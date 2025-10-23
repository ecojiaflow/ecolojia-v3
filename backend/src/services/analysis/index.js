// PATH: backend/src/services/analysis/index.js
// Service d'analyse orchestrÃ© pour les 3 catÃ©gories

const foodExpert = require('../expert/food.rules');
const cosmeticsExpert = require('../expert/cosmetics.rules');
const detergentsExpert = require('../expert/detergents.rules');
const openFactsService = require('../external/openFactsService');
const normalizeProduct = require('../normalizer/normalizeProduct');

async function analyzeProduct(productData, options = {}) {
  try {
    // Si on a un barcode, rÃ©cupÃ©rer les donnÃ©es
    if (productData.barcode && !productData.ingredients) {
      const externalData = await openFactsService.getProductByBarcode(
        productData.barcode,
        productData.category
      );
      if (externalData) {
        productData = { ...productData, ...externalData };
      }
    }

    // Normaliser les donnÃ©es
    const normalizedProduct = normalizeProduct(productData);
    
    // Analyser selon la catÃ©gorie
    let analysis;
    switch (normalizedProduct.category) {
      case 'cosmetics':
        analysis = await cosmeticsExpert.analyze(normalizedProduct);
        break;
      case 'detergents':
        analysis = await detergentsExpert.analyze(normalizedProduct);
        break;
      case 'food':
      default:
        analysis = await foodExpert.analyze(normalizedProduct);
        break;
    }

    return {
      success: true,
      ...analysis,
      category: normalizedProduct.category,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('[analyzeProduct] Error:', error);
    throw error;
  }
}

function getSupportedCategories() {
  return {
    main: ['food', 'cosmetics', 'detergents'],
    aliases: {
      'alimentaire': 'food',
      'cosmÃ©tique': 'cosmetics',
      'dÃ©tergent': 'detergents'
    }
  };
}

module.exports = {
  analyzeProduct,
  getSupportedCategories
};
