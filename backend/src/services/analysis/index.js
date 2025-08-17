// PATH: backend/src/services/analysis/index.js
// Service d'analyse orchestré pour les 3 catégories

const foodExpert = require('../expert/food.rules');
const cosmeticsExpert = require('../expert/cosmetics.rules');
const detergentsExpert = require('../expert/detergents.rules');
const openFactsService = require('../external/openFactsService');
const normalizeProduct = require('../normalizer/normalizeProduct');

async function analyzeProduct(productData, options = {}) {
  try {
    // Si on a un barcode, récupérer les données
    if (productData.barcode && !productData.ingredients) {
      const externalData = await openFactsService.getProductByBarcode(
        productData.barcode,
        productData.category
      );
      if (externalData) {
        productData = { ...productData, ...externalData };
      }
    }

    // Normaliser les données
    const normalizedProduct = normalizeProduct(productData);
    
    // Analyser selon la catégorie
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
      'cosmétique': 'cosmetics',
      'détergent': 'detergents'
    }
  };
}

module.exports = {
  analyzeProduct,
  getSupportedCategories
};
