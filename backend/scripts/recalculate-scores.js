require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const { calculateFoodScores } = require('../src/services/scoringEngine');

async function recalculateAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('? MongoDB connecté');

  const products = await Product.find({ category: 'food' });
  console.log(`?? ${products.length} produits food\n`);
  
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
      
      const scores = calculateFoodScores({
        novaGroup: product.foodData?.novaGroup,
        nutriScore: product.foodData?.nutriScore,
        ecoScore: product.foodData?.ecoScore,
        additives: (product.foodData?.additives || []).map(a => a.code || a),
        allergens: [],
        labels: product.foodData?.labels || [],
        packaging: product.packaging,
        origin: product.origin
      });
      
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
