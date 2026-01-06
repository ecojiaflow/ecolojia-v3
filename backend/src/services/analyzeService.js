const axios = require('axios');

// ========== FETCH EXTERNAL DATA ==========
async function fetchExternalData(barcode, category) {
  console.log(`[FETCH] Getting data for ${barcode} (${category})`);

  try {
    let url;

    switch(category) {
      case 'food':
        url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
        break;
      case 'cosmetics':
        url = `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`;
        break;
      case 'detergents':
        url = `https://world.openproductsfacts.org/api/v2/product/${barcode}.json`;
        break;
      default:
        console.log(`[FETCH] Unknown category: ${category}`);
        return null;
    }

    const response = await axios.get(url, {
      timeout: 7000,
      headers: { 'User-Agent': 'ECOLOJIA/3.0' }
    });

    if (!response.data || response.data.status !== 1 || !response.data.product) {
      console.log('[FETCH] Product not found');
      return null;
    }

    const product = response.data.product;
    console.log(`[FETCH] Found: ${product.product_name || 'Unknown'}`);

    const additives = [];
    if (product.additives_tags) {
      product.additives_tags.forEach(tag => {
        const match = tag.match(/^en:e(\d+)/i);
        if (match) additives.push(`E${match[1]}`);
      });
    }

    return {
      name: product.product_name || product.product_name_fr || product.product_name_en,
      brand: product.brands,
      nutriScore: product.nutriscore_grade || product.nutrition_grade_fr,
      novaGroup: parseInt(product.nova_group) || null,
      ecoScore: product.ecoscore_grade,
      ingredients: product.ingredients_text || product.ingredients_text_fr,
      additives: additives,
      imageUrl: product.image_url || product.image_front_url,
      allergens: product.allergens_tags || [],
      categories: product.categories_tags || []
    };

  } catch (error) {
    console.error('[FETCH] Error:', error.message);
    return null;
  }
}

// ========== FOOD SCORER ==========
function scoreFood(data) {
  console.log('[SCORE] Calculating food scores...');

  let healthScore = 50;
  let ecoScore = 50;

  if (data.nutriScore) {
    const nutriScoreMap = { 'a': 95, 'b': 85, 'c': 70, 'd': 45, 'e': 25 };
    const nutriValue = nutriScoreMap[data.nutriScore.toLowerCase()] || 50;
    healthScore = Math.round(healthScore * 0.65 + nutriValue * 0.35);
    console.log(`[SCORE] NutriScore ${data.nutriScore} -> ${nutriValue}`);
  }

  if (data.novaGroup) {
    const novaScoreMap = { 1: 95, 2: 80, 3: 55, 4: 25 };
    healthScore = novaScoreMap[data.novaGroup] || 50;
    console.log(`[SCORE] NOVA ${data.novaGroup} -> ${healthScore}`);
  }

  if (data.additives && data.additives.length > 0) {
    const penalty = Math.min(data.additives.length * 5, 40);
    healthScore = Math.round(healthScore * 0.75 + (100 - penalty) * 0.25);
  }

  if (data.ecoScore) {
    const ecoScoreMap = { 'a': 95, 'b': 85, 'c': 70, 'd': 45, 'e': 25 };
    ecoScore = ecoScoreMap[data.ecoScore.toLowerCase()] || 50;
  }

  const globalScore = Math.round((healthScore * 0.7 + ecoScore * 0.3));
  console.log(`[SCORE] Final: Health=${healthScore}, Eco=${ecoScore}, Global=${globalScore}`);

  return {
    overallScore: globalScore,
    healthScore: healthScore,
    environmentScore: ecoScore,
    confidence: 0.65,
    calculatedAt: new Date(),
    scoringVersion: '3.2.0',
    breakdown: {
      nova: { score: data.novaGroup ? (100 - (data.novaGroup - 1) * 25) : null, group: data.novaGroup, label: data.novaGroup ? `Groupe ${data.novaGroup}` : 'Non defini' },
      nutriScore: { score: data.nutriScore ? { 'a': 100, 'b': 80, 'c': 60, 'd': 40, 'e': 20 }[data.nutriScore.toLowerCase()] : null, grade: data.nutriScore, label: data.nutriScore ? `Nutri-Score ${data.nutriScore.toUpperCase()}` : 'Non defini' },
      ecoScore: { score: ecoScore, grade: data.ecoScore, label: data.ecoScore ? `Eco-Score ${data.ecoScore.toUpperCase()}` : 'Non defini' },
      additives: { score: data.additives ? Math.max(0, 100 - data.additives.length * 10) : 100, count: data.additives ? data.additives.length : 0, label: data.additives && data.additives.length > 0 ? `${data.additives.length} additif(s)` : 'Sans additifs' }
    }
  };
}

// ========== COSMETICS SCORER ==========
function scoreCosmetics(data) {
  let safetyScore = 75, ecoScore = 50;
  if (data.ingredients) {
    ['paraben', 'sulfate', 'silicone', 'peg', 'phenoxyethanol'].forEach(h => {
      if (data.ingredients.toLowerCase().includes(h)) safetyScore -= 10;
    });
  }
  return { overallScore: Math.round((safetyScore * 0.8 + ecoScore * 0.2)), healthScore: safetyScore, environmentScore: ecoScore, confidence: 0.5, calculatedAt: new Date(), scoringVersion: '3.2.0' };
}

// ========== DETERGENT SCORER ==========
function scoreDetergent(data) {
  let ecoScore = 70, healthScore = 70;
  if (data.ingredients) {
    ['phosphate', 'chlorine', 'ammonia'].forEach(h => {
      if (data.ingredients.toLowerCase().includes(h)) { ecoScore -= 15; healthScore -= 10; }
    });
  }
  return { overallScore: Math.round((healthScore * 0.3 + ecoScore * 0.7)), healthScore, environmentScore: ecoScore, confidence: 0.5, calculatedAt: new Date(), scoringVersion: '3.2.0' };
}

// ========== MAIN ANALYZE ==========
async function analyzeAutoSvc(input) {
  console.log('\n=== ANALYZE AUTO SERVICE ===');
  const { barcode, name, brand, category = 'food', ingredients } = input;

  try {
    let external = barcode ? await fetchExternalData(barcode, category) : null;

    const merged = {
      barcode: barcode || (external && external.barcode),
      name: name || (external && external.name) || 'Produit inconnu',
      brand: brand || (external && external.brand),
      ingredients: ingredients || (external && external.ingredients),
      nutriScore: external && external.nutriScore,
      novaGroup: external && external.novaGroup,
      ecoScore: external && external.ecoScore,
      additives: external && external.additives,
      imageUrl: external && external.imageUrl,
      category: category
    };

    let calculatedScores;
    switch (category) {
      case 'food': calculatedScores = scoreFood(merged); break;
      case 'cosmetics': calculatedScores = scoreCosmetics(merged); break;
      case 'detergents': calculatedScores = scoreDetergent(merged); break;
      default: calculatedScores = { overallScore: 50, healthScore: 50, environmentScore: 50, confidence: 0.3, calculatedAt: new Date(), scoringVersion: '3.2.0' };
    }

    let savedProduct;
    try {
      const Product = require('../models/Product');
      let product = await Product.findOne(barcode ? { barcode } : { name: merged.name });
      
      if (!product) {
        product = new Product({ barcode: merged.barcode, name: merged.name, brand: merged.brand, category: merged.category, categoryType: merged.category, imageUrl: merged.imageUrl, ingredients_text: merged.ingredients });
      }
      
      product.scores = {
        overallScore: calculatedScores.overallScore,
        healthScore: calculatedScores.healthScore,
        environmentScore: calculatedScores.environmentScore,
        confidence: calculatedScores.confidence,
        calculatedAt: calculatedScores.calculatedAt,
        scoringVersion: calculatedScores.scoringVersion,
        breakdown: calculatedScores.breakdown
      };
      
      product.lastAnalyzedAt = new Date();
      if (merged.imageUrl) product.imageUrl = merged.imageUrl;
      if (merged.ingredients) product.ingredients_text = merged.ingredients;
      
      savedProduct = await product.save();
      console.log('[DB] Saved with scores:', { overallScore: savedProduct.scores?.overallScore, healthScore: savedProduct.scores?.healthScore });
      
    } catch (dbError) {
      console.log('[DB] Save failed:', dbError.message);
      savedProduct = { ...merged, scores: calculatedScores };
    }

    return {
      product: { _id: savedProduct._id?.toString(), barcode: savedProduct.barcode, name: savedProduct.name, brand: savedProduct.brand, category: savedProduct.category || savedProduct.categoryType },
      scores: calculatedScores,
      dataSource: external ? 'external' : 'user_input'
    };

  } catch (error) {
    console.error('[ERROR] analyzeAutoSvc failed:', error);
    throw error;
  }
}

module.exports = { analyzeAutoSvc, fetchExternalData, scoreFood, scoreCosmetics, scoreDetergent };
