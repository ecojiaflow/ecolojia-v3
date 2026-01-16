/**
 * audit-data-quality.js
 * Analyse un échantillon de produits pour évaluer la qualité des données
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function auditDataQuality() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connecté à MongoDB\n');

  const db = mongoose.connection.db;
  const collection = db.collection('products');

  // Échantillon de 500 produits aléatoires
  const products = await collection.aggregate([
    { $sample: { size: 500 } }
  ]).toArray();

  console.log(`📊 Analyse de ${products.length} produits\n`);

  // Compteurs
  let stats = {
    total: products.length,
    hasIngredientsText: 0,
    hasAdditivesTags: 0,
    hasAdditivesTagsNotEmpty: 0,
    hasBothComplete: 0,
    hasIngredientsButNoAdditives: 0,
    hasNutriments: 0,
    hasSubcategory: 0,
    hasImages: 0
  };

  // Exemples problématiques
  let examples = {
    missingAdditives: [],
    missingIngredients: [],
    missingNutrition: []
  };

  for (const p of products) {
    const ingredientsText = p.ingredients_text || p.ingredientsText || p.foodData?.ingredients_text || '';
    const additivesTags = p.additives_tags || p.foodData?.additives || [];
    const nutriments = p.nutriments || p.nutrition || p.foodData?.nutritionalInfo || null;
    const subcategory = p.subcategory || p.category || '';
    const image = p.imageUrl || p.images?.front || p.image_url || '';

    const hasIngr = ingredientsText && ingredientsText.length > 10;
    const hasAddi = Array.isArray(additivesTags) && additivesTags.length > 0;
    const hasNutri = nutriments && (nutriments.energy_100g || nutriments.energy || nutriments.energy_kcal);

    if (hasIngr) stats.hasIngredientsText++;
    if (additivesTags && additivesTags.length >= 0) stats.hasAdditivesTags++;
    if (hasAddi) stats.hasAdditivesTagsNotEmpty++;
    if (hasIngr && hasAddi) stats.hasBothComplete++;
    if (hasIngr && !hasAddi) {
      stats.hasIngredientsButNoAdditives++;
      if (examples.missingAdditives.length < 5) {
        examples.missingAdditives.push({
          barcode: p.barcode || p._id,
          name: (p.name || p.product_name || '').substring(0, 40),
          ingredients: ingredientsText.substring(0, 100) + '...'
        });
      }
    }
    if (!hasIngr && examples.missingIngredients.length < 5) {
      examples.missingIngredients.push({
        barcode: p.barcode || p._id,
        name: (p.name || p.product_name || '').substring(0, 40)
      });
    }
    if (hasNutri) stats.hasNutriments++;
    if (subcategory) stats.hasSubcategory++;
    if (image) stats.hasImages++;
  }

  // Affichage résultats
  console.log('═══════════════════════════════════════════════════════');
  console.log('📈 STATISTIQUES DATA QUALITY');
  console.log('═══════════════════════════════════════════════════════\n');

  const pct = (n) => ((n / stats.total) * 100).toFixed(1) + '%';

  console.log(`Total produits analysés:        ${stats.total}`);
  console.log(`─────────────────────────────────────────────────────`);
  console.log(`✅ Ont ingredients_text:        ${stats.hasIngredientsText} (${pct(stats.hasIngredientsText)})`);
  console.log(`✅ Ont additives_tags non vide: ${stats.hasAdditivesTagsNotEmpty} (${pct(stats.hasAdditivesTagsNotEmpty)})`);
  console.log(`✅ Ont nutrition:               ${stats.hasNutriments} (${pct(stats.hasNutriments)})`);
  console.log(`✅ Ont subcategory:             ${stats.hasSubcategory} (${pct(stats.hasSubcategory)})`);
  console.log(`✅ Ont image:                   ${stats.hasImages} (${pct(stats.hasImages)})`);
  console.log(`─────────────────────────────────────────────────────`);
  console.log(`⚠️  Ingredients SANS additives: ${stats.hasIngredientsButNoAdditives} (${pct(stats.hasIngredientsButNoAdditives)})`);
  console.log(`   → Potentiel extraction IA`);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔍 EXEMPLES: Ont ingredients_text MAIS additives vide');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const ex of examples.missingAdditives) {
    console.log(`📦 ${ex.name}`);
    console.log(`   Barcode: ${ex.barcode}`);
    console.log(`   Ingredients: ${ex.ingredients}`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('❌ EXEMPLES: SANS ingredients_text');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const ex of examples.missingIngredients) {
    console.log(`📦 ${ex.name} (${ex.barcode})`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Audit terminé');
}

auditDataQuality().catch(console.error);
