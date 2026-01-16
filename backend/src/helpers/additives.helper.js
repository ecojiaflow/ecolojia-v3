/**
 * additives.helper.js
 * Helper centralisé pour récupérer les additifs d'un produit
 * Priorité: additives_extracted > foodData.additives > additives_tags
 */

function getAdditives(product) {
  if (!product) return [];
  
  // Priorité 1: Extraction regex (notre enrichissement)
  if (Array.isArray(product.additives_extracted) && product.additives_extracted.length > 0) {
    return product.additives_extracted;
  }
  
  // Priorité 2: foodData.additives (si présent et non vide)
  const foodDataAdditives = product.foodData?.additives;
  if (Array.isArray(foodDataAdditives) && foodDataAdditives.length > 0) {
    return foodDataAdditives.map(a => a.code || a.tag || a);
  }
  
  // Priorité 3: additives_tags (OpenFoodFacts original)
  if (Array.isArray(product.additives_tags) && product.additives_tags.length > 0) {
    return product.additives_tags;
  }
  
  return [];
}

function getAdditivesCount(product) {
  return getAdditives(product).length;
}

module.exports = { getAdditives, getAdditivesCount };
