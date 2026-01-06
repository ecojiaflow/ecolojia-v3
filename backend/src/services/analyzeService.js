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
    healthScore = novaValue; // NOVA score devient le score principal
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
  const globalScore = Math.round((healthScore * 0.7 + ecoScore * 0.3));

  console.log(`[SCORE] Final: Health=${healthScore}, Eco=${ecoScore}, Global=${globalScore}`);

  // ✅ RETOUR AU FORMAT ATTENDU PAR LE MODÈLE PRODUCT
  return {
    overallScore: globalScore,
    healthScore: healthScore,
    environmentScore: ecoScore,
    confidence: 0.65,
    calculatedAt: new Date(),
    scoringVersion: '3.2.0',
    breakdown: {
      nova: {
        score: data.novaGroup ? (100 - (data.novaGroup - 1) * 25) : null,
        group: data.novaGroup || null,
        label: data.novaGroup ? `Groupe ${data.novaGroup}` : 'Non défini'
      },
      nutriScore: {
        score: data.nutriScore ? { 'a': 100, 'b': 80, 'c': 60, 'd': 40, 'e': 20 }[data.nutriScore.toLowerCase()] : null,
        grade: data.nutriScore || null,
        label: data.nutriScore ? `Nutri-Score ${data.nutriScore.toUpperCase()}` : 'Non défini'
      },
      ecoScore: {
        score: ecoScore,
        grade: data.ecoScore || null,
        label: data.ecoScore ? `Eco-Score ${data.ecoScore.toUpperCase()}` : 'Non défini'
      },
      additives: {
        score: data.additives ? Math.max(0, 100 - data.additives.length * 10) : 100,
        count: data.additives ? data.additives.length : 0,
        label: data.additives && data.additives.length > 0 ? `${data.additives.length} additif(s)` : 'Sans additifs'
      }
    }
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

  const globalScore = Math.round((safetyScore * 0.8 + ecoScore * 0.2));

  return {
    overallScore: globalScore,
    healthScore: safetyScore,
    environmentScore: ecoScore,
    confidence: 0.5,
    calculatedAt: new Date(),
    scoringVersion: '3.2.0'
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

  const globalScore = Math.round((healthScore * 0.3 + ecoScore * 0.7));

  return {
    overallScore: globalScore,
    healthScore: healthScore,
    environmentScore: ecoScore,
    confidence: 0.5,
    calculatedAt: new Date(),
    scoringVersion: '3.2.0'
  };
}

// ========== INSIGHTS GENERATOR ==========
function generateInsights(data, scores, category) {
  const insights = [];

  // Score global
  if (scores.overallScore >= 80) {
    insights.push('Excellent choix pour votre santé et l\'environnement');
  } else if (scores.overallScore >= 60) {
    insights.push('Produit acceptable avec quelques réserves');
  } else if (scores.overallScore >= 40) {
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
    // Fetch external data TOUJOURS (pas de cache pour l'instant)
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
    let calculatedScores;
    switch (category) {
      case 'food':
        calculatedScores = scoreFood(merged);
        break;
      case 'cosmetics':
        calculatedScores = scoreCosmetics(merged);
        break;
      case 'detergents':
        calculatedScores = scoreDetergent(merged);
        break;
      default:
        calculatedScores = {
          overallScore: 50,
          healthScore: 50,
          environmentScore: 50,
          confidence: 0.3,
          calculatedAt: new Date(),
          scoringVersion: '3.2.0'
        };
    }

    // Generate insights
    const insights = generateInsights(merged, calculatedScores, category);

    // ✅ Prépare le document avec les scores au BON FORMAT
    const fullProductData = {
      ...merged,
      scores: calculatedScores,  // Maintenant au bon format !
      lastAnalyzedAt: new Date(),
      insights: insights
    };

    // Save to DB
    let savedProduct;
    try {
      const Product = require('../models/Product');
      const filter = barcode ? { barcode } : { name: merged.name };

      savedProduct = await Product.findOneAndUpdate(
        filter,
        { $set: fullProductData },
        { new: true, upsert: true, lean: true }
      );

      console.log('[DB] Saved to MongoDB with new scores:', {
        overallScore: savedProduct.scores?.overallScore,
        healthScore: savedProduct.scores?.healthScore,
        environmentScore: savedProduct.scores?.environmentScore
      });
    } catch (dbError) {
      console.log('[DB] Save failed:', dbError.message);
      // Continuer sans MongoDB
      savedProduct = fullProductData;
    }

    // RETOURNER les scores au bon format
    return {
      product: {
        _id: savedProduct._id ? savedProduct._id.toString() : undefined,
        barcode: savedProduct.barcode,
        name: savedProduct.name,
        brand: savedProduct.brand,
        category: savedProduct.category,
        nutriScore: savedProduct.nutriScore,
        novaGroup: savedProduct.novaGroup,
        ecoScore: savedProduct.ecoScore,
        additives: savedProduct.additives
      },
      scores: calculatedScores,
      insights: insights,
      dataSource: external ? 'external' : 'user_input'
    };

  } catch (error) {
    console.error('[ERROR] analyzeAutoSvc failed:', error);
    throw error;
  }
}

// ========== EXPORTS ==========
module.exports = {
  analyzeAutoSvc,
  fetchExternalData,
  scoreFood,
  scoreCosmetics,
  scoreDetergent
};
