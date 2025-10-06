require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const { calculateFoodScores, calculateCosmeticScores, calculateDetergentScores } = require('../src/services/scoringEngine');

async function recalculateAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('? MongoDB connecté');

  const products = await Product.find({ 'scores.overallScore': { $exists: false } });
  console.log(`?? ${products.length} produits sans scores\n`);
  
  let success = 0;
  
  for (const product of products) {
    try {
      // Nettoyer valeurs invalides
      if (product.foodData) {
        if (['UNKNOWN', 'NOT-APPLICABLE'].includes(product.foodData.nutriScore)) {
          product.foodData.nutriScore = undefined;
        }
        if (['UNKNOWN', 'NOT-APPLICABLE', 'A-PLUS'].includes(product.foodData.ecoScore)) {
          product.foodData.ecoScore = undefined;
        }
        if (Array.isArray(product.foodData.ingredients)) {
          product.foodData.ingredients = '';
        }
      }
      
      let scores;
      if (product.category === 'food') {
        scores = calculateFoodScores({
        novaGroup: product.foodData?.novaGroup,
        nutriScore: product.foodData?.nutriScore,
        ecoScore: product.foodData?.ecoScore,
        additives: (product.foodData?.additives || []).map(a => a.code || a),
        allergens: [],
        labels: product.foodData?.labels || [],
        packaging: product.packaging,
        origin: product.origin
      });
      } else if (product.category === 'cosmetics') {
        scores = calculateCosmeticScores({
          ingredients: product.cosmeticsData?.ingredients || [],
          endocrineDisruptors: product.cosmeticsData?.endocrineDisruptors || [],
          allergens: product.cosmeticsData?.allergens || [],
          certifications: product.cosmeticsData?.certifications || []
        });
      } else if (product.category === 'detergents') {
        scores = calculateDetergentScores({
          surfactants: product.detergentsData?.surfactants || [],
          composition: product.detergentsData?.composition || [],
          ecoLabels: product.detergentsData?.ecoLabels || [],
          phosphates: product.detergentsData?.phosphates || false
        });
      }
      product.scores = scores;
      await product.save();
      
      success++;
      if (success % 500 === 0) console.log(`  ? ${success}/${products.length}`);
    } catch (err) {
      // Ignorer échecs silencieusement
    }
  }
  
  console.log(`\n?? ${success}/${products.length} produits mis à jour`);
  process.exit(0);
}

recalculateAll().catch(console.error);

