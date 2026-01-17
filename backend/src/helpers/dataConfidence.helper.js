/**
 * dataConfidence.helper.js
 * Calcule un score de confiance sur les données produit
 * Retourne: high (vert), medium (jaune), low (rouge)
 */

function calculateDataConfidence(product) {
  if (!product) {
    return { level: 'low', score: 0, missing: ['product'], message: 'Produit non disponible' };
  }

  let score = 0;
  const missing = [];
  const present = [];

  // 1. Nutrition (30 points)
  const nutrition = product.nutriments || product.nutrition || product.foodData?.nutritionalInfo;
  const hasEnergy = nutrition?.energy_100g || nutrition?.energy || nutrition?.energy_kcal;
  const hasSugars = nutrition?.sugars_100g || nutrition?.sugars;
  const hasSalt = nutrition?.salt_100g || nutrition?.salt;
  
  if (hasEnergy && hasSugars && hasSalt) {
    score += 30;
    present.push('nutrition_complete');
  } else if (hasEnergy || hasSugars) {
    score += 15;
    present.push('nutrition_partielle');
    missing.push('nutrition_incomplete');
  } else {
    missing.push('nutrition');
  }

  // 2. Additifs (20 points)
  const additives = product.additives_extracted || product.additives_tags || product.foodData?.additives || [];
  const hasAdditives = Array.isArray(additives) && additives.length > 0;
  const hasIngredientsText = product.ingredients_text && product.ingredients_text.length > 20;
  
  if (hasAdditives) {
    score += 20;
    present.push('additifs');
  } else if (hasIngredientsText) {
    // A des ingrédients mais pas d'additifs détectés = probablement produit simple
    score += 15;
    present.push('ingredients_sans_additifs');
  } else {
    missing.push('additifs');
  }

  // 3. Ingrédients (15 points)
  if (hasIngredientsText) {
    score += 15;
    present.push('ingredients');
  } else {
    missing.push('ingredients');
  }

  // 4. Catégorie/Subcategory (15 points)
  const hasSubcategory = product.subcategory && product.subcategory !== 'other' && product.subcategory !== 'unknown';
  if (hasSubcategory) {
    score += 15;
    present.push('categorie');
  } else {
    missing.push('categorie');
  }

  // 5. NOVA Group (10 points)
  const nova = product.nova_group || product.foodData?.novaGroup;
  if (nova && nova >= 1 && nova <= 4) {
    score += 10;
    present.push('nova');
  } else {
    missing.push('nova');
  }

  // 6. Nutri-Score (10 points)
  const nutriScore = product.nutriscore_grade || product.foodData?.nutriScore;
  if (nutriScore && ['a', 'b', 'c', 'd', 'e'].includes(nutriScore.toLowerCase())) {
    score += 10;
    present.push('nutriscore');
  } else {
    missing.push('nutriscore');
  }

  // Déterminer le niveau
  let level, message;
  if (score >= 70) {
    level = 'high';
    message = 'Donnees completes';
  } else if (score >= 40) {
    level = 'medium';
    message = 'Donnees partielles';
  } else {
    level = 'low';
    message = 'Donnees limitees';
  }

  return {
    level,
    score,
    missing,
    present,
    message
  };
}

module.exports = { calculateDataConfidence };
