require('dotenv').config();
const mongoose = require('mongoose');

// Copie de la fonction de scoring depuis scoringEngine
function calculateFoodScores(foodData) {
  const {
    novaGroup,
    nutriScore,
    ecoScore,
    additives = [],
    allergens = [],
    labels = [],
    packaging,
    origin
  } = foodData;

  // Score santé (0-100)
  let healthScore = 50;

  // NOVA impact (-30 à +20)
  if (novaGroup === 1) healthScore += 20;
  else if (novaGroup === 2) healthScore += 10;
  else if (novaGroup === 3) healthScore -= 10;
  else if (novaGroup === 4) healthScore -= 30;

  // Nutri-Score impact (-20 à +20)
  if (nutriScore === 'A') healthScore += 20;
  else if (nutriScore === 'B') healthScore += 10;
  else if (nutriScore === 'C') healthScore += 0;
  else if (nutriScore === 'D') healthScore -= 10;
  else if (nutriScore === 'E') healthScore -= 20;

  // Additifs impact
  const additivesCount = Array.isArray(additives) ? additives.length : 0;
  healthScore -= Math.min(additivesCount * 5, 30);

  // Score environnement (0-100)
  let environmentScore = 50;

  // Eco-Score impact
  if (ecoScore === 'A') environmentScore += 30;
  else if (ecoScore === 'B') environmentScore += 15;
  else if (ecoScore === 'C') environmentScore += 0;
  else if (ecoScore === 'D') environmentScore -= 15;
  else if (ecoScore === 'E') environmentScore -= 30;

  // Labels bio/équitables
  const bioLabels = ['en:organic', 'en:eu-organic', 'fr:ab-agriculture-biologique'];
  const hasBio = Array.isArray(labels) && labels.some(l => bioLabels.includes(l));
  if (hasBio) environmentScore += 20;

  // Packaging
  if (packaging && packaging.toLowerCase().includes('recyclable')) {
    environmentScore += 10;
  }

  // Origine locale (France)
  if (origin && (origin.toLowerCase().includes('france') || origin.toLowerCase().includes('fr'))) {
    environmentScore += 10;
  }

  // Normalisation 0-100
  healthScore = Math.max(0, Math.min(100, healthScore));
  environmentScore = Math.max(0, Math.min(100, environmentScore));

  // Score global pondéré (70% santé, 30% environnement)
  const overallScore = Math.round(healthScore * 0.7 + environmentScore * 0.3);

  return {
    overallScore,
    healthScore: Math.round(healthScore),
    environmentScore: Math.round(environmentScore),
    details: {
      nova: novaGroup,
      nutriScore,
      ecoScore,
      additivesCount,
      hasBioLabel: hasBio
    }
  };
}

async function recalculateScores() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    console.log('\n🔄 RECALCUL DES SCORES POUR TOUS LES PRODUITS FOOD\n');

    const products = await db.collection('products')
      .find({ category: 'food' })
      .toArray();

    console.log(`📦 ${products.length} produits à traiter\n`);

    let updated = 0;
    let errors = 0;

    for (const product of products) {
      try {
        const foodData = product.foodData || {};
        
        const scores = calculateFoodScores({
          novaGroup: foodData.novaGroup,
          nutriScore: foodData.nutriScore,
          ecoScore: foodData.ecoScore,
          additives: foodData.additives || [],
          allergens: foodData.allergens || [],
          labels: foodData.labels || [],
          packaging: product.packaging,
          origin: product.origin
        });

        await db.collection('products').updateOne(
          { _id: product._id },
          { 
            $set: { 
              scores,
              updatedAt: new Date()
            } 
          }
        );

        updated++;

        if (updated % 500 === 0) {
          console.log(`  ✓ ${updated}/${products.length} scores calculés`);
        }

      } catch (err) {
        console.error(`Erreur produit ${product.barcode}:`, err.message);
        errors++;
      }
    }

    console.log(`\n✅ ${updated} scores recalculés avec succès`);
    if (errors > 0) {
      console.log(`⚠️  ${errors} erreurs rencontrées`);
    }

    // Statistiques scores
    console.log('\n📊 DISTRIBUTION DES SCORES:\n');
    const scoreStats = await db.collection('products').aggregate([
      { $match: { category: 'food', 'scores.overallScore': { $exists: true } } },
      {
        $bucket: {
          groupBy: '$scores.overallScore',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'Hors limites',
          output: { count: { $sum: 1 } }
        }
      }
    ]).toArray();

    scoreStats.forEach(bucket => {
      const range = bucket._id === 'Hors limites' 
        ? 'Hors limites' 
        : `${bucket._id}-${bucket._id + 20}`;
      console.log(`  Score ${range.padEnd(15)} : ${bucket.count} produits`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Recalcul terminé\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ ERREUR CRITIQUE:', err.message);
    process.exit(1);
  }
}

recalculateScores();