const { fetchExternalData } = require('./offClient');
const Product = require('../models/Product');

/**
 * Enrichit et sauvegarde un produit depuis OpenFoodFacts/OpenBeautyFacts
 */
async function enrichProduct(barcode, category = 'food') {
  console.log(`[Enrichment] Fetching ${barcode} from ${category}`);
  
  // 1. Appeler OFF/OBF
  const offData = await fetchExternalData(barcode, category);
  
  if (!offData || !offData.name) {
    console.log(`[Enrichment] Aucune donnée trouvée pour ${barcode}`);
    return null;
  }

  // 2. Logs des données reçues
  console.log(`[Enrichment] 📦 Données reçues de OFF:`, {
    name: offData.name,
    brand: offData.brand,
    nutriScore: offData.nutriScore,
    novaGroup: offData.novaGroup,
    ecoScore: offData.ecoScore,
    additives: offData.additives?.length || 0,
    imageUrl: offData.imageUrl ? 'present' : 'missing',
    ingredients: offData.ingredients ? 'present' : 'missing'
  });

  // 3. Structure selon le schéma Product.js
  const productData = {
    barcode: barcode,
    name: offData.name || 'Produit sans nom',
    brand: offData.brand || 'Marque inconnue',
    category: category,
    imageUrl: offData.imageUrl || null,
    
    // Données alimentaires dans foodData (selon schéma)
    foodData: {
      // Ingredients
      ingredients: offData.ingredients ? [offData.ingredients] : [],
      
      // Additifs - conversion en objets selon additiveSchema
      additives: (offData.additives || []).map(tag => ({
        code: tag.replace('en:', '').toUpperCase(), // "en:e322" -> "E322"
        name: tag.replace('en:', '').toUpperCase(),
        function: 'Unknown',
        riskLevel: 'LOW'
      })),
      
      // Scores - ATTENTION: novaScore (pas novaGroup) selon schéma
      novaScore: offData.novaGroup || null,
      nutriScore: offData.nutriScore || null,
      ecoScore: offData.ecoScore || null,
      
      // Allergènes vides par défaut
      allergens: []
    },
    
    // Métadonnées
    viewCount: 0,
    scanCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  console.log(`[Enrichment] 📋 ProductData structuré pour MongoDB:`, {
    name: productData.name,
    brand: productData.brand,
    category: productData.category,
    imageUrl: productData.imageUrl ? 'present' : 'null',
    foodData: {
      nutriScore: productData.foodData.nutriScore,
      novaScore: productData.foodData.novaScore,
      ecoScore: productData.foodData.ecoScore,
      additives: productData.foodData.additives.length
    }
  });

  // 4. Sauvegarder dans MongoDB
  try {
    // Supprimer l'ancien produit s'il existe (force la mise à jour complète)
    await Product.deleteOne({ barcode: barcode });
    
    // Créer le produit avec toutes les nouvelles données
    const product = await Product.create(productData);
    
    console.log(`[Enrichment] ✅ Produit MongoDB sauvegardé:`, {
      _id: product._id,
      name: product.name,
      brand: product.brand,
      nutriScore: product.foodData?.nutriScore,
      novaScore: product.foodData?.novaScore,
      ecoScore: product.foodData?.ecoScore,
      additives: product.foodData?.additives?.length || 0
    });
    
    return product;
    
  } catch (error) {
    console.error(`[Enrichment] ❌ Erreur MongoDB:`, error.message);
    if (error.errors) {
      console.error(`[Enrichment] Détails validation:`, error.errors);
    }
    return null;
  }
}

/**
 * Vérifie si un produit nécessite un enrichissement
 */
function needsEnrichment(product) {
  if (!product) return true;
  if (!product.name || product.name === 'Produit sans nom') return true;
  if (!product.brand || product.brand === 'Marque inconnue') return true;
  
  // Vérifier si les données foodData sont absentes
  if (!product.foodData || !product.foodData.nutriScore) return true;
  
  // Enrichir si trop ancien (>30 jours)
  if (product.updatedAt) {
    const daysSince = (Date.now() - product.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) return true;
  }
  
  return false;
}

module.exports = { enrichProduct, needsEnrichment };