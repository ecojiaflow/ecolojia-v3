/**
 * extract-additives.js
 * Extraction des additifs depuis ingredients_text via REGEX
 * Production-ready, scalable, robuste
 * 
 * Usage:
 *   node scripts/extract-additives.js --dry-run    (test sans modification)
 *   node scripts/extract-additives.js --apply      (applique les modifications)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const BATCH_SIZE = 500;

// ═══════════════════════════════════════════════════════════════════
// REGEX PATTERNS POUR ADDITIFS (EU Standard)
// ═══════════════════════════════════════════════════════════════════

// Pattern principal : E suivi de 3-4 chiffres, optionnel lettre suffix
// Gère : E322, E 322, e322, E-322, E1442, E160a, E 160 a
const E_CODE_PATTERN = /\bE[- ]?(\d{3,4})\s?([a-z]?)\b/gi;

// Additifs courants écrits en toutes lettres (mapping vers code E)
const ADDITIVE_NAMES = {
  'lécithine': 'E322',
  'lecithine': 'E322',
  'lécithines': 'E322',
  'lecithines': 'E322',
  'lecithin': 'E322',
  'pectine': 'E440',
  'pectines': 'E440',
  'pectin': 'E440',
  'carraghénane': 'E407',
  'carraghénanes': 'E407',
  'carrageenan': 'E407',
  'gomme xanthane': 'E415',
  'xanthan gum': 'E415',
  'gomme guar': 'E412',
  'guar gum': 'E412',
  'gomme arabique': 'E414',
  'acide citrique': 'E330',
  'citric acid': 'E330',
  'acide ascorbique': 'E300',
  'ascorbic acid': 'E300',
  'sorbate de potassium': 'E202',
  'potassium sorbate': 'E202',
  'benzoate de sodium': 'E211',
  'sodium benzoate': 'E211',
  'nitrite de sodium': 'E250',
  'sodium nitrite': 'E250',
  'nitrate de sodium': 'E251',
  'glutamate monosodique': 'E621',
  'monosodium glutamate': 'E621',
  'msg': 'E621',
  'aspartame': 'E951',
  'sucralose': 'E955',
  'stevia': 'E960',
  'dioxyde de titane': 'E171',
  'titanium dioxide': 'E171',
  'caramel': 'E150',
  'caramel colorant': 'E150a',
  'colorant caramel': 'E150a'
};

// ═══════════════════════════════════════════════════════════════════
// FONCTION D'EXTRACTION
// ═══════════════════════════════════════════════════════════════════

function extractAdditives(ingredientsText) {
  if (!ingredientsText || typeof ingredientsText !== 'string') {
    return { codes: [], sources: [] };
  }

  const text = ingredientsText.toLowerCase();
  const foundCodes = new Set();
  const sources = [];

  // 1. Extraction codes E-xxx
  let match;
  const regex = new RegExp(E_CODE_PATTERN.source, 'gi');
  while ((match = regex.exec(ingredientsText)) !== null) {
    const number = match[1];
    const suffix = (match[2] || '').toLowerCase();
    const code = `E${number}${suffix}`.toUpperCase();
    
    // Valider que c'est un code E plausible (100-1999)
    const num = parseInt(number, 10);
    if (num >= 100 && num <= 1999) {
      foundCodes.add(code);
      sources.push({ code, method: 'regex', match: match[0] });
    }
  }

  // 2. Extraction par noms courants
  for (const [name, code] of Object.entries(ADDITIVE_NAMES)) {
    if (text.includes(name)) {
      if (!foundCodes.has(code)) {
        foundCodes.add(code);
        sources.push({ code, method: 'name_match', match: name });
      }
    }
  }

  return {
    codes: Array.from(foundCodes).sort(),
    sources
  };
}

// ═══════════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isApply = args.includes('--apply');

  if (!isDryRun && !isApply) {
    console.log('Usage:');
    console.log('  node scripts/extract-additives.js --dry-run    (test sans modification)');
    console.log('  node scripts/extract-additives.js --apply      (applique les modifications)');
    process.exit(1);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🧪 EXTRACTION ADDITIFS — ${isDryRun ? 'MODE DRY-RUN (test)' : '⚠️  MODE APPLY (modifications)'}`);
  console.log(`${'═'.repeat(60)}\n`);

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connecté à MongoDB\n');

  const db = mongoose.connection.db;
  const collection = db.collection('products');

  // Compter les produits à traiter
  const totalCount = await collection.countDocuments({
    $or: [
      { ingredients_text: { $exists: true, $ne: '' } },
      { ingredientsText: { $exists: true, $ne: '' } },
      { 'foodData.ingredients_text': { $exists: true, $ne: '' } }
    ]
  });

  console.log(`📦 Produits avec ingredients_text: ${totalCount}\n`);

  // Stats
  let stats = {
    processed: 0,
    withAdditives: 0,
    noAdditives: 0,
    updated: 0,
    errors: 0,
    totalAdditivesFound: 0
  };

  // Exemples pour affichage
  const examples = [];

  // Traitement par batch
  let skip = 0;
  while (skip < totalCount) {
    const products = await collection.find({
      $or: [
        { ingredients_text: { $exists: true, $ne: '' } },
        { ingredientsText: { $exists: true, $ne: '' } },
        { 'foodData.ingredients_text': { $exists: true, $ne: '' } }
      ]
    })
    .skip(skip)
    .limit(BATCH_SIZE)
    .toArray();

    if (products.length === 0) break;

    const bulkOps = [];

    for (const product of products) {
      stats.processed++;

      // Trouver ingredients_text
      const ingredientsText = 
        product.ingredients_text || 
        product.ingredientsText || 
        product.foodData?.ingredients_text || 
        '';

      const { codes, sources } = extractAdditives(ingredientsText);

      if (codes.length > 0) {
        stats.withAdditives++;
        stats.totalAdditivesFound += codes.length;

        // Garder des exemples
        if (examples.length < 10) {
          examples.push({
            barcode: product.barcode || product._id,
            name: (product.name || product.product_name || '').substring(0, 35),
            additives: codes,
            sample: ingredientsText.substring(0, 80)
          });
        }

        // Préparer la mise à jour
        if (isApply) {
          bulkOps.push({
            updateOne: {
              filter: { _id: product._id },
              update: {
                $set: {
                  additives_extracted: codes,
                  'dataQuality.additivesSource': 'regex_extracted',
                  'dataQuality.additivesExtractedAt': new Date(),
                  'dataQuality.additivesCount': codes.length
                }
              }
            }
          });
        }
      } else {
        stats.noAdditives++;
      }
    }

    // Exécuter les mises à jour par batch
    if (isApply && bulkOps.length > 0) {
      try {
        const result = await collection.bulkWrite(bulkOps, { ordered: false });
        stats.updated += result.modifiedCount;
      } catch (err) {
        console.error(`❌ Erreur batch: ${err.message}`);
        stats.errors++;
      }
    }

    skip += BATCH_SIZE;
    
    // Progress
    const pct = ((skip / totalCount) * 100).toFixed(1);
    process.stdout.write(`\r⏳ Progression: ${Math.min(skip, totalCount)}/${totalCount} (${pct}%)`);
  }

  console.log('\n');

  // ═══════════════════════════════════════════════════════════════════
  // RAPPORT FINAL
  // ═══════════════════════════════════════════════════════════════════

  console.log(`${'═'.repeat(60)}`);
  console.log('📊 RAPPORT FINAL');
  console.log(`${'═'.repeat(60)}\n`);

  console.log(`Produits traités:            ${stats.processed}`);
  console.log(`─────────────────────────────────────────`);
  console.log(`✅ Avec additifs trouvés:    ${stats.withAdditives} (${((stats.withAdditives/stats.processed)*100).toFixed(1)}%)`);
  console.log(`⚪ Sans additifs détectés:   ${stats.noAdditives} (${((stats.noAdditives/stats.processed)*100).toFixed(1)}%)`);
  console.log(`─────────────────────────────────────────`);
  console.log(`📍 Total additifs extraits:  ${stats.totalAdditivesFound}`);
  console.log(`📍 Moyenne par produit:      ${(stats.totalAdditivesFound/stats.withAdditives).toFixed(1)} additifs`);
  
  if (isApply) {
    console.log(`─────────────────────────────────────────`);
    console.log(`💾 Produits mis à jour:      ${stats.updated}`);
    console.log(`❌ Erreurs:                  ${stats.errors}`);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('🔍 EXEMPLES EXTRACTIONS');
  console.log(`${'═'.repeat(60)}\n`);

  for (const ex of examples) {
    console.log(`📦 ${ex.name}`);
    console.log(`   Barcode: ${ex.barcode}`);
    console.log(`   Additifs: ${ex.additives.join(', ')}`);
    console.log(`   Source: "${ex.sample}..."`);
    console.log('');
  }

  if (isDryRun) {
    console.log(`${'═'.repeat(60)}`);
    console.log('ℹ️  MODE DRY-RUN — Aucune modification effectuée');
    console.log('   Pour appliquer: node scripts/extract-additives.js --apply');
    console.log(`${'═'.repeat(60)}`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Terminé');
}

main().catch(console.error);
