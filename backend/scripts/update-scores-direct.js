require('dotenv').config();
const mongoose = require('mongoose');
const { calculateFoodScores } = require('../src/services/scoringEngine');

(async function() {
  try {
    console.log('Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const products = await db.collection('products').find({ category: 'food' }).limit(5000).toArray();
    console.log(`Traitement de ${products.length} produits food\n`);
    
    let updated = 0;
    for (const p of products) {
      try {
        const scores = calculateFoodScores({
          novaGroup: p.foodData?.novaGroup,
          nutriScore: p.foodData?.nutriScore?.match(/^[A-E]$/i) ? p.foodData.nutriScore : undefined,
          ecoScore: p.foodData?.ecoScore?.match(/^[A-E]$/i) ? p.foodData.ecoScore : undefined,
          additives: (p.foodData?.additives || []).map(a => a.code || a),
          allergens: [],
          labels: p.foodData?.labels || [],
          packaging: p.packaging,
          origin: p.origin
        });
        
        await db.collection('products').updateOne({ _id: p._id }, { $set: { scores } });
        updated++;
        if (updated % 500 === 0) console.log(`  ${updated}/${products.length}`);
      } catch (err) {
        // Ignorer erreurs individuelles
      }
    }
    console.log(`\n? ${updated} produits mis à jour`);
    process.exit(0);
  } catch (err) {
    console.error('? Erreur:', err.message);
    process.exit(1);
  }
})();
