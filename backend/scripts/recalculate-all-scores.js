require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/product.model');

async function recalculateAllScores() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté');

  const products = await Product.find();
  console.log(`📊 ${products.length} produits à recalculer`);

  let updated = 0;

  for (const product of products) {
    try {
      // Calculer NOVA (0-100, inversé : groupe 1=100, groupe 4=0)
      const novaGroup = product.foodData?.novaGroup || 3;
      const novaScore = Math.max(0, 100 - (novaGroup - 1) * 33);

      // Calculer Additifs (0-100, moins = mieux)
      const additivesCount = product.foodData?.additives?.length || 0;
      const additivesScore = Math.max(0, 100 - additivesCount * 10);

      // Calculer Éthique (labels bio, pas huile palme)
      const isBio = product.labels_tags?.some(l => l.includes('bio')) || false;
      const hasPalmOil = product.ingredients?.some(i => 
        i.name?.toLowerCase().includes('palm') || 
        i.name?.toLowerCase().includes('palme')
      ) || false;
      const ethicsScore = (isBio ? 50 : 0) + (hasPalmOil ? 0 : 50);

      // HealthScore = moyenne des 3
      const healthScore = Math.round((novaScore + additivesScore + ethicsScore) / 3);

      // EnvironmentScore (Eco-Score)
      const ecoScoreGrade = product.foodData?.ecoScore || 'c';
      const ecoScoreMap = { a: 90, b: 75, c: 50, d: 25, e: 10 };
      const environmentScore = ecoScoreMap[ecoScoreGrade.toLowerCase()] || 50;

      // OverallScore = Santé × 0.7 + Env × 0.3
      const overallScore = Math.round(healthScore * 0.7 + environmentScore * 0.3);

      // Mise à jour
      product.scores = {
        healthScore,
        environmentScore,
        overallScore,
        breakdown: {
          nova: { score: novaScore, impact: novaScore - 50 },
          additives: { score: additivesScore, impact: additivesScore - 50 },
          ethics: { score: ethicsScore, impact: ethicsScore - 50 },
          ecoscore: { score: environmentScore, impact: environmentScore - 50 }
        }
      };

      await product.save();
      updated++;

      if (updated % 100 === 0) {
        console.log(`✅ ${updated}/${products.length} produits mis à jour`);
      }
    } catch (err) {
      console.error(`❌ Erreur produit ${product._id}:`, err.message);
    }
  }

  console.log(`\n✅ Recalcul terminé: ${updated} produits mis à jour`);
  process.exit(0);
}

recalculateAllScores().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
