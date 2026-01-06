/**
 * recalculate-scores.js
 * Script batch pour recalculer les scores des produits anciens
 * 
 * Usage: node scripts/recalculate-scores.js [--dry-run] [--limit=100]
 * 
 * @version 1.0.1
 * @date 2026-01-06
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 1000;
const MAX_PRODUCTS = process.argv.find(a => a.startsWith('--limit='))
  ? parseInt(process.argv.find(a => a.startsWith('--limit=')).split('=')[1])
  : null;
const DRY_RUN = process.argv.includes('--dry-run');

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

function scoreFood(data) {
  let healthScore = 50;
  let ecoScore = 50;

  if (data.nutriScore) {
    const nutriScoreMap = { 'a': 95, 'b': 85, 'c': 70, 'd': 45, 'e': 25 };
    const nutriValue = nutriScoreMap[data.nutriScore.toLowerCase()] || 50;
    healthScore = Math.round(healthScore * 0.65 + nutriValue * 0.35);
  }

  if (data.novaGroup) {
    const novaScoreMap = { 1: 95, 2: 80, 3: 55, 4: 25 };
    healthScore = novaScoreMap[data.novaGroup] || 50;
  }

  const additivesCount = data.additives?.length || 0;
  if (additivesCount > 0) {
    const penalty = Math.min(additivesCount * 5, 40);
    healthScore = Math.round(healthScore * 0.75 + (100 - penalty) * 0.25);
  }

  if (data.ecoScore) {
    const ecoScoreMap = { 'a': 95, 'b': 85, 'c': 70, 'd': 45, 'e': 25 };
    ecoScore = ecoScoreMap[data.ecoScore.toLowerCase()] || 50;
  }

  const globalScore = Math.round((healthScore * 0.7 + ecoScore * 0.3));

  return {
    overallScore: globalScore,
    healthScore: healthScore,
    environmentScore: ecoScore,
    confidence: 0.65,
    calculatedAt: new Date(),
    scoringVersion: '3.2.0',
    breakdown: {
      nova: { 
        score: data.novaGroup ? (100 - (data.novaGroup - 1) * 25) : null, 
        group: data.novaGroup || null, 
        label: data.novaGroup ? `Groupe ${data.novaGroup}` : 'Non defini' 
      },
      nutriScore: { 
        score: data.nutriScore ? { 'a': 100, 'b': 80, 'c': 60, 'd': 40, 'e': 20 }[data.nutriScore.toLowerCase()] : null, 
        grade: data.nutriScore || null, 
        label: data.nutriScore ? `Nutri-Score ${data.nutriScore.toUpperCase()}` : 'Non defini' 
      },
      ecoScore: { 
        score: ecoScore, 
        grade: data.ecoScore || null, 
        label: data.ecoScore ? `Eco-Score ${data.ecoScore.toUpperCase()}` : 'Non defini' 
      },
      additives: { 
        score: Math.max(0, 100 - additivesCount * 10), 
        count: additivesCount, 
        label: additivesCount > 0 ? `${additivesCount} additif(s)` : 'Sans additifs' 
      }
    }
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('ECOLOJIA - RECALCUL SCORES BATCH');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (simulation)' : 'PRODUCTION'}`);
  console.log(`Limite: ${MAX_PRODUCTS || 'Aucune (tous les produits)'}`);
  console.log('');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI non defini dans .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connecte a MongoDB');

  // Charger le modele avec le bon chemin
  const Product = require(path.join(__dirname, '..', 'src', 'models', 'Product'));

  // Trouver les produits a recalculer
  const query = {
    $or: [
      { categoryType: 'food' },
      { category: 'food' }
    ],
    $and: [
      {
        $or: [
          { 'scores.healthScore': null },
          { 'scores.environmentScore': null },
          { 'scores.overallScore': { $exists: false } },
          { 'scores.scoringVersion': { $ne: '3.2.0' } },
          { 'scores': { $exists: false } }
        ]
      }
    ]
  };

  const totalCount = await Product.countDocuments(query);
  console.log(`Produits a recalculer: ${totalCount}`);

  if (totalCount === 0) {
    console.log('Aucun produit a recalculer !');
    await mongoose.disconnect();
    return;
  }

  const limit = MAX_PRODUCTS ? Math.min(MAX_PRODUCTS, totalCount) : totalCount;
  const batches = Math.ceil(limit / BATCH_SIZE);

  console.log(`Traitement: ${limit} produits en ${batches} batches de ${BATCH_SIZE}`);
  console.log('');

  let processed = 0;
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  for (let batch = 0; batch < batches; batch++) {
    const skip = batch * BATCH_SIZE;
    const products = await Product.find(query)
      .skip(skip)
      .limit(BATCH_SIZE)
      .lean();

    console.log(`\nBatch ${batch + 1}/${batches} (${products.length} produits)`);

    for (const product of products) {
      processed++;

      try {
        const scoringData = {
          nutriScore: product.nutriscore_grade || product.foodData?.nutriScore,
          novaGroup: product.nova_group || product.foodData?.novaGroup,
          ecoScore: product.ecoscore_grade || product.foodData?.ecoScore,
          additives: product.additives_tags || product.foodData?.additives || []
        };

        if (!scoringData.nutriScore && !scoringData.novaGroup) {
          skipped++;
          continue;
        }

        const newScores = scoreFood(scoringData);

        if (DRY_RUN) {
          const name = product.name ? product.name.substring(0, 30) : 'Sans nom';
          console.log(`  [DRY] ${name}... -> ${newScores.overallScore}/100 (health: ${newScores.healthScore}, env: ${newScores.environmentScore})`);
        } else {
          await Product.updateOne(
            { _id: product._id },
            { 
              $set: { 
                scores: newScores,
                updatedAt: new Date()
              } 
            }
          );
          updated++;

          if (updated % 50 === 0) {
            console.log(`  ${updated} produits mis a jour...`);
          }
        }

      } catch (err) {
        errors++;
        console.error(`  Erreur ${product.barcode}: ${err.message}`);
      }
    }

    if (batch < batches - 1) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('RESUME');
  console.log('='.repeat(60));
  console.log(`Traites: ${processed}`);
  console.log(`Mis a jour: ${DRY_RUN ? '0 (dry run)' : updated}`);
  console.log(`Ignores (donnees insuffisantes): ${skipped}`);
  console.log(`Erreurs: ${errors}`);
  console.log('');

  await mongoose.disconnect();
  console.log('Deconnecte de MongoDB');
  console.log('Termine !');
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
