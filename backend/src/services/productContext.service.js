/**
 * productContext.service.js
 * Génère le contexte produit pour le routage des micro-fiches
 * Version: 1.0.0
 */

/**
 * Génère le contexte produit à partir des données produit
 * @param {Object} product - Le produit MongoDB
 * @returns {Object} Le contexte produit pour le routage des fiches
 */
function generateProductContext(product) {
  if (!product) {
    return {
      sugarLevel: "unknown",
      satFatLevel: "unknown",
      saltLevel: "unknown",
      processingLevel: "unknown",
      additivesLevel: "unknown"
    };
  }

  const context = {};

  // --- SUCRES ---
  const sugars = product.nutrition?.sugars_100g || 
                 product.foodData?.sugars_100g || 
                 product.nutriments?.sugars_100g || 0;
  
  if (sugars > 22.5) {
    context.sugarLevel = "high";
  } else if (sugars > 5) {
    context.sugarLevel = "medium";
  } else {
    context.sugarLevel = "low";
  }

  // --- GRAISSES SATUREES ---
  const satFat = product.nutrition?.saturated_fat_100g || 
                 product.foodData?.saturatedFat_100g || 
                 product.nutriments?.["saturated-fat_100g"] || 0;
  
  if (satFat > 5) {
    context.satFatLevel = "high";
  } else if (satFat > 1.5) {
    context.satFatLevel = "medium";
  } else {
    context.satFatLevel = "low";
  }

  // --- SEL ---
  const salt = product.nutrition?.salt_100g || 
               product.foodData?.salt_100g || 
               product.nutriments?.salt_100g || 0;
  
  if (salt > 1.5) {
    context.saltLevel = "high";
  } else if (salt > 0.3) {
    context.saltLevel = "medium";
  } else {
    context.saltLevel = "low";
  }

  // --- TRANSFORMATION (NOVA) ---
  const nova = product.nova_group || 
               product.foodData?.novaGroup || 
               product.scores?.processing || null;
  
  if (nova === 4 || nova === "4") {
    context.processingLevel = "ultra_processed";
  } else if (nova === 3 || nova === "3") {
    context.processingLevel = "processed";
  } else if (nova === 2 || nova === "2") {
    context.processingLevel = "ingredients";
  } else if (nova === 1 || nova === "1") {
    context.processingLevel = "unprocessed";
  } else {
    context.processingLevel = "unknown";
  }

  // --- ADDITIFS ---
  const additives = product.additives_extracted || product.additives_tags || 
                    product.foodData?.additives || [];
  const additivesCount = Array.isArray(additives) ? additives.length : 0;
  
  if (additivesCount > 5) {
    context.additivesLevel = "high";
  } else if (additivesCount > 2) {
    context.additivesLevel = "medium";
  } else {
    context.additivesLevel = "low";
  }

  return context;
}

module.exports = {
  generateProductContext
};
