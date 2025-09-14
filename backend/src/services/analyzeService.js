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
    
    // Parse additives
    const additives = [];
    if (product.additives_tags) {
      product.additives_tags.forEach(tag => {
        const match = tag.match(/^en:e(\d+)/i);
        if (match) {
          additives.push(`E${match[1]}`);
        }
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
  
  let healthScore = 50; // Base score
  let ecoScore = 50;
  
  // 1. NutriScore impact (35% du score santé)
  if (data.nutriScore) {
    const nutriScoreMap = {
      'a': 95, 'b': 85, 'c': 70, 'd': 45, 'e': 25
    };
    const nutriValue = nutriScoreMap[data.nutriScore.toLowerCase()] || 50;
    healthScore = Math.round(healthScore * 0.65 + nutriValue * 0.35);
    console.log(`[SCORE] NutriScore ${data.nutriScore} → ${nutriValue}`);
  }
  
  // 2. NOVA group impact (40% du score santé)
  if (data.novaGroup) {
    const novaScoreMap = {
      1: 95,  // Non transformé
      2: 80,  // Peu transformé
      3: 55,  // Transformé
      4: 25   // Ultra-transformé
    };
    const novaValue = novaScoreMap[data.novaGroup] || 50;
    healthScore = Math.round(healthScore * 0.6 + novaValue * 0.4);
    console.log(`[SCORE] NOVA ${data.novaGroup} → ${novaValue}`);
  }
  
  // 3. Additives impact (25% du score santé)
  if (data.additives && data.additives.length > 0) {
    const additivesPenalty = Math.min(data.additives.length * 5, 40);
    healthScore = Math.round(healthScore * 0.75 + (100 - additivesPenalty) * 0.25);
    console.log(`[SCORE] ${data.additives.length} additifs → -${additivesPenalty}`);
  }
  
  // 4. EcoScore
  if (data.ecoScore) {
    const ecoScoreMap = {
      'a': 95, 'b': 85, 'c': 70, 'd': 45, 'e': 25
    };
    ecoScore = ecoScoreMap[data.ecoScore.toLowerCase()] || 50;
    console.log(`[SCORE] EcoScore ${data.ecoScore} → ${ecoScore}`);
  }
  
  // Calcul score global
  const global = Math.round((healthScore * 0.7 + ecoScore * 0.3));
  
  console.log(`[SCORE] Final: Health=${healthScore}, Eco=${ecoScore}, Global=${global}`);
  
  return {
    health: healthScore,
    eco: ecoScore,
    global: global
  };
}

// ========== COSMETICS SCORER ==========
function scoreCosmetics(data) {
  console.log('[SCORE] Calculating cosmetics scores...');
  
  let safetyScore = 75; // Base score
  let ecoScore = 50;
  
  // Analyse basique des ingrédients
  if (data.ingredients) {
    const harmful = ['paraben', 'sulfate', 'silicone', 'peg', 'phenoxyethanol'];
    const ingredientsLower = data.ingredients.toLowerCase();
    
    harmful.forEach(ingredient => {
      if (ingredientsLower.includes(ingredient)) {
        safetyScore -= 10;
        console.log(`[SCORE] Found harmful: ${ingredient}`);
      }
    });
  }
  
  const global = Math.round((safetyScore * 0.8 + ecoScore * 0.2));
  
  return {
    health: safetyScore,
    eco: ecoScore,
    global: global
  };
}

// ========== DETERGENT SCORER ==========
function scoreDetergent(data) {
  console.log('[SCORE] Calculating detergent scores...');
  
  let ecoScore = 70; // Base score
  let healthScore = 70;
  
  // Analyse basique
  if (data.ingredients) {
    const harmful = ['phosphate', 'chlorine', 'ammonia'];
    const ingredientsLower = data.ingredients.toLowerCase();
    
    harmful.forEach(ingredient => {
      if (ingredientsLower.includes(ingredient)) {
        ecoScore -= 15;
        healthScore -= 10;
        console.log(`[SCORE] Found harmful: ${ingredient}`);
      }
    });
  }
  
  const global = Math.round((healthScore * 0.3 + ecoScore * 0.7));
  
  return {
    health: healthScore,
    eco: ecoScore,
    global: global
  };
}

// ========== INSIGHTS GENERATOR ==========
function generateInsights(data, scores, category) {
  const insights = [];
  
  // Score global
  if (scores.global >= 80) {
    insights.push('Excellent choix pour votre santé et l\'environnement');
  } else if (scores.global >= 60) {
    insights.push('Produit acceptable avec quelques réserves');
  } else if (scores.global >= 40) {
    insights.push('Produit à consommer avec modération');
  } else {
    insights.push('Produit déconseillé pour une consommation régulière');
  }
  
  // Insights spécifiques par catégorie
  if (category === 'food') {
    if (data.novaGroup === 4) {
      insights.push('Produit ultra-transformé (NOVA 4) - privilégiez des alternatives moins transformées');
    }
    if (data.additives && data.additives.length > 5) {
      insights.push(`Contient ${data.additives.length} additifs - recherchez des produits plus naturels`);
    }
    if (data.nutriScore && ['d', 'e'].includes(data.nutriScore.toLowerCase())) {
      insights.push('NutriScore défavorable - consommez occasionnellement');
    }
  }
  
  return insights;
}

// ========== MAIN ANALYZE FUNCTION ==========
async function analyzeAutoSvc(input) {
  console.log('\n=== ANALYZE AUTO SERVICE ===');
  console.log('Input:', JSON.stringify(input));
  
  const { barcode, name, brand, category = 'food', ingredients, forceRefresh } = input;
  
  try {
    // MongoDB cache check (avec gestion d'erreur)
    if (!forceRefresh && barcode) {
      try {
        const Product = require('../models/Product');
        const cached = await Product.findOne({ barcode }).lean();
        if (cached && cached.scores && cached.scores.global) {
          console.log('[CACHE] Found in MongoDB');
          return formatAnalyzeResult(cached, 'cache');
        }
      } catch (dbError) {
        console.log('[CACHE] MongoDB not available:', dbError.message);
      }
    }
    
    // Fetch external data
    let external = null;
    if (barcode) {
      external = await fetchExternalData(barcode, category);
    }
    
    // Merge all data
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
    
    console.log('[MERGE] Product data:', {
      name: merged.name,
      nutriScore: merged.nutriScore,
      novaGroup: merged.novaGroup,
      additives: merged.additives?.length || 0
    });
    
    // Calculate scores based on category
    let scores;
    switch (category) {
      case 'food':
        scores = scoreFood(merged);
        break;
      case 'cosmetics':
        scores = scoreCosmetics(merged);
        break;
      case 'detergents':
        scores = scoreDetergent(merged);
        break;
      default:
        scores = { health: 50, eco: 50, global: 50 };
    }
    
    // Generate insights
    const insights = generateInsights(merged, scores, category);
    
    // Save to DB if possible
    try {
      const Product = require('../models/Product');
      const productData = Object.assign({}, merged, { 
        scores, 
        lastAnalyzedAt: new Date(),
        insights: insights 
      });
      
      const filter = barcode ? { barcode } : { name: merged.name };
      const saved = await Product.findOneAndUpdate(
        filter,
        { $set: productData },
        { new: true, upsert: true, lean: true }
      );
      
      console.log('[DB] Saved to MongoDB');
      return formatAnalyzeResult(saved, external ? 'external' : 'user_input', insights);
      
    } catch (dbError) {
      console.log('[DB] Save failed:', dbError.message);
      
      // Return without saving
      return {
        product: {
          barcode: merged.barcode,
          name: merged.name,
          brand: merged.brand,
          category: merged.category,
          nutriScore: merged.nutriScore,
          novaGroup: merged.novaGroup,
          ecoScore: merged.ecoScore
        },
        scores: scores,
        insights: insights,
        dataSource: external ? 'external' : 'user_input'
      };
    }
    
  } catch (error) {
    console.error('[ERROR] analyzeAutoSvc failed:', error);
    throw error;
  }
}

// ========== FORMAT RESULT ==========
function formatAnalyzeResult(product, dataSource, insights) {
  return {
    product: {
      _id: product._id ? product._id.toString() : undefined,
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      category: product.category,
      nutriScore: product.nutriScore,
      novaGroup: product.novaGroup,
      ecoScore: product.ecoScore,
      additives: product.additives
    },
    scores: product.scores,
    insights: insights || product.insights || [],
    dataSource: dataSource
  };
}

// ========== EXPORTS ==========
module.exports = {
  analyzeAutoSvc,
  fetchExternalData,
  scoreFood,
  scoreCosmetics,
  scoreDetergent
};