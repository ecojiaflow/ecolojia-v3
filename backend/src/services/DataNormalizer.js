// backend/src/services/DataNormalizer.js
/**
 * Service de normalisation des données produit
 * GARANTIT un format uniforme peu importe la source (OFF, OCR, IA, Manuel)
 */

/**
 * Normalise les données produit vers format ECOLOJIA standard
 * @param {Object} rawProduct - Données brutes (OFF, OCR, IA, etc.)
 * @param {string} source - Source des données: 'OFF', 'OCR', 'AI', 'MANUAL'
 * @returns {Object} Produit normalisé avec TOUTES les propriétés
 */
function normalizeProduct(rawProduct, source = 'OFF') {
  // 1. Métadonnées de base (TOUJOURS présentes)
  const normalized = {
    barcode: rawProduct.barcode || rawProduct.code || null,
    name: rawProduct.name || rawProduct.product_name || rawProduct.generic_name || 'Produit sans nom',
    brand: rawProduct.brand || rawProduct.brands || 'Marque inconnue',
    category: rawProduct.category || detectCategory(rawProduct) || 'food',
    subcategory: rawProduct.subcategory || null,
    imageUrl: rawProduct.imageUrl || rawProduct.image_url || rawProduct.image_front_url || null,
    packaging: rawProduct.packaging || null,
    origin: rawProduct.origin || rawProduct.origins || null,
    categories_tags: rawProduct.categories_tags || [],
    source: source,
    lastSync: new Date()
  };

  // 2. Données alimentaires normalisées
  normalized.foodData = normalizeFoodData(rawProduct, source);
  
  // 3. Données cosmétiques normalisées
  normalized.cosmeticsData = normalizeCosmeticsData(rawProduct, source);
  
  // 4. Données détergents normalisées
  normalized.detergentsData = normalizeDetergentsData(rawProduct, source);

  return normalized;
}

/**
 * Normalise les données alimentaires
 * GARANTIT que tous les champs existent (avec null si manquant)
 */
function normalizeFoodData(rawProduct, source) {
  const foodData = {
    // Scores officiels
    novaGroup: extractNovaGroup(rawProduct),
    nutriScore: extractNutriScore(rawProduct),
    ecoScore: extractEcoScore(rawProduct),
    
    // Additifs
    additives: normalizeAdditives(rawProduct),
    
    // Allergènes
    allergens: normalizeAllergens(rawProduct),
    
    // Ingrédients
    ingredients: extractIngredients(rawProduct),
    
    // Labels
    labels: normalizeLabels(rawProduct),
    
    // Informations nutritionnelles (CRITICAL)
    nutritionalInfo: normalizeNutrition(rawProduct, source)
  };

  return foodData;
}

/**
 * Normalise les informations nutritionnelles
 * GARANTIT sugars, saturatedFat, salt TOUJOURS présents (null si inconnu)
 */
function normalizeNutrition(rawProduct, source) {
  const nutrition = {};
  
  // Chercher dans TOUS les formats possibles
  const sources = [
    rawProduct.nutriments,
    rawProduct.nutriments_100g,
    rawProduct.foodData?.nutrition?.per100g,
    rawProduct.foodData?.nutritionalInfo,
    rawProduct.nutrition,
    {}
  ];
  
  const merged = Object.assign({}, ...sources);
  
  // Extraction robuste avec fallbacks
  nutrition.energy = extractNumber(merged, ['energy', 'energy_100g', 'energy-kcal', 'energy-kcal_100g']);
  nutrition.fat = extractNumber(merged, ['fat', 'fat_100g']);
  nutrition.saturatedFat = extractNumber(merged, ['saturated-fat', 'saturated-fat_100g', 'saturatedFat', 'saturated_fat']);
  nutrition.carbohydrates = extractNumber(merged, ['carbohydrates', 'carbohydrates_100g']);
  nutrition.sugars = extractNumber(merged, ['sugars', 'sugars_100g']);
  nutrition.fiber = extractNumber(merged, ['fiber', 'fiber_100g', 'dietary-fiber', 'dietary-fiber_100g']);
  nutrition.protein = extractNumber(merged, ['proteins', 'proteins_100g', 'protein']);
  nutrition.salt = extractNumber(merged, ['salt', 'salt_100g', 'sodium', 'sodium_100g']) || 
                   (extractNumber(merged, ['sodium', 'sodium_100g']) * 2.5); // Conversion sodium → sel
  
  return nutrition;
}

/**
 * Extrait un nombre depuis plusieurs clés possibles
 * @returns {number|null} Valeur trouvée ou null
 */
function extractNumber(obj, keys) {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && !isNaN(parseFloat(value))) {
      return parseFloat(value);
    }
  }
  return null;
}

/**
 * Extrait NOVA avec fallbacks multiples
 */
function extractNovaGroup(raw) {
  const sources = [
    raw.nova_group,
    raw.novaGroup,
    raw.foodData?.novaGroup,
    raw.nova,
    raw.foodData?.nova
  ];
  
  for (const val of sources) {
    if (val && [1,2,3,4].includes(Number(val))) {
      return Number(val);
    }
  }
  
  return null;
}

/**
 * Extrait Nutri-Score avec normalisation
 */
function extractNutriScore(raw) {
  const sources = [
    raw.nutriscore_grade,
    raw.nutriScore,
    raw.foodData?.nutriScore,
    raw.nutrition_grade_fr
  ];
  
  for (const val of sources) {
    if (val && typeof val === 'string') {
      const normalized = val.toUpperCase();
      if (['A','B','C','D','E'].includes(normalized)) {
        return normalized;
      }
    }
  }
  
  return null;
}

/**
 * Extrait Eco-Score
 */
function extractEcoScore(raw) {
  const sources = [
    raw.ecoscore_grade,
    raw.ecoScore,
    raw.foodData?.ecoScore
  ];
  
  for (const val of sources) {
    if (val && typeof val === 'string') {
      const normalized = val.toUpperCase();
      if (['A','B','C','D','E'].includes(normalized)) {
        return normalized;
      }
    }
  }
  
  return null;
}

/**
 * Normalise les additifs vers format uniforme
 */
function normalizeAdditives(raw) {
  const sources = [
    raw.additives_tags,
    raw.additives,
    raw.foodData?.additives
  ];
  
  const additives = [];
  
  for (const source of sources) {
    if (Array.isArray(source)) {
      for (const item of source) {
        if (typeof item === 'string') {
          // Format: "en:e322" → E322
          const code = item.replace(/^en:/i, '').toUpperCase();
          additives.push({
            tag: item,
            code: code,
            name: code.toLowerCase(),
            riskLevel: 'UNKNOWN',
            healthConcerns: []
          });
        } else if (item && item.code) {
          additives.push(item);
        }
      }
    }
  }
  
  // Dédupliquer par code
  const unique = Array.from(new Map(additives.map(a => [a.code, a])).values());
  return unique;
}

/**
 * Normalise les allergènes
 */
function normalizeAllergens(raw) {
  const sources = [
    raw.allergens_tags,
    raw.allergens,
    raw.foodData?.allergens
  ];
  
  const allergens = [];
  
  for (const source of sources) {
    if (Array.isArray(source)) {
      for (const item of source) {
        if (typeof item === 'string') {
          allergens.push({
            tag: item,
            name: item.replace(/^en:/i, ''),
            riskLevel: 'MEDIUM',
            concerns: []
          });
        } else if (item && item.tag) {
          allergens.push(item);
        }
      }
    }
  }
  
  return allergens;
}

/**
 * Extrait ingrédients
 */
function extractIngredients(raw) {
  const sources = [
    raw.ingredients_text,
    raw.ingredients,
    raw.foodData?.ingredients
  ];
  
  for (const val of sources) {
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  }
  
  return null;
}

/**
 * Normalise les labels
 */
function normalizeLabels(raw) {
  const sources = [
    raw.labels_tags,
    raw.labels,
    raw.foodData?.labels
  ];
  
  const labels = new Set();
  
  for (const source of sources) {
    if (Array.isArray(source)) {
      source.forEach(l => {
        if (typeof l === 'string') labels.add(l);
      });
    } else if (typeof source === 'string') {
      source.split(',').forEach(l => labels.add(l.trim()));
    }
  }
  
  return Array.from(labels).filter(l => l.length > 0);
}

/**
 * Normalise données cosmétiques
 */
function normalizeCosmeticsData(raw, source) {
  return {
    allergens: raw.cosmeticsData?.allergens || [],
    certifications: raw.cosmeticsData?.certifications || [],
    endocrineDisruptors: raw.cosmeticsData?.endocrineDisruptors || [],
    ingredients: raw.cosmeticsData?.ingredients || []
  };
}

/**
 * Normalise données détergents
 */
function normalizeDetergentsData(raw, source) {
  return {
    composition: raw.detergentsData?.composition || [],
    ecoLabels: raw.detergentsData?.ecoLabels || [],
    surfactants: raw.detergentsData?.surfactants || []
  };
}

/**
 * Détecte la catégorie du produit
 */
function detectCategory(raw) {
  const categories = raw.categories_tags || raw.categories || [];
  
  // Logique de détection basée sur les tags
  if (categories.some(c => c.includes('cosmetic') || c.includes('beauty'))) {
    return 'cosmetics';
  }
  
  if (categories.some(c => c.includes('detergent') || c.includes('cleaning'))) {
    return 'detergents';
  }
  
  return 'food'; // Par défaut
}

module.exports = {
  normalizeProduct,
  normalizeNutrition,
  normalizeFoodData
};