/**
 * ECOLOJIA - Script Batch Regeneration Constitutions V2.0.0 - CORRIGE
 * Corrige l'erreur: "Updating the path would create a conflict"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  batchSize: 50,
  delayBetweenBatches: 1000,
  targetVersion: '2.0.0',
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI
};

// ============================================================================
// ARGUMENTS CLI
// ============================================================================

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : null;

console.log('='.repeat(60));
console.log('ECOLOJIA - REGENERATION CONSTITUTIONS V2.0.0 (CORRIGE)');
console.log('='.repeat(60));
console.log('Mode:', DRY_RUN ? 'DRY RUN (simulation)' : 'PRODUCTION');
console.log('Force:', FORCE ? 'OUI' : 'NON');
console.log('Limite:', LIMIT || 'Aucune (tous les produits)');
console.log('='.repeat(60));

// ============================================================================
// CONNEXION MONGODB
// ============================================================================

async function connectDB() {
  if (!CONFIG.mongoUri) {
    throw new Error('MONGODB_URI non defini dans .env');
  }
  console.log('\n[DB] Connexion MongoDB...');
  await mongoose.connect(CONFIG.mongoUri);
  console.log('[DB] Connecte a:', mongoose.connection.db.databaseName);
}

// ============================================================================
// SCHEMA PRODUIT
// ============================================================================

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', productSchema, 'products');

// ============================================================================
// CHARGEMENT SERVICES - CHEMIN CORRIGE
// ============================================================================

let generateConstitution;

function loadServices() {
  console.log('\n[SERVICES] Chargement...');
  // Chemin relatif depuis scripts/ vers src/services/
  const constitutionPath = path.join(__dirname, '..', 'src', 'services', 'constitution.service.js');
  const constitutionService = require(constitutionPath);
  generateConstitution = constitutionService.generateConstitution;
  console.log('[SERVICES] constitution.service.js charge - Version:', constitutionService.VERSION);
}

// ============================================================================
// REQUETE PRODUITS
// ============================================================================

async function getProductsToUpdate() {
  const query = { categoryType: 'food' };

  if (!FORCE) {
    query['$or'] = [
      { 'constitution.version': { $exists: false } },
      { 'constitution.version': { $ne: CONFIG.targetVersion } },
      { constitution: { $exists: false } }
    ];
  }

  const total = await Product.countDocuments(query);
  console.log('\n[QUERY] Produits a traiter:', LIMIT ? Math.min(total, LIMIT) : total);

  return { query, total: LIMIT ? Math.min(total, LIMIT) : total };
}

// ============================================================================
// TRAITEMENT BATCH - CORRIGE
// ============================================================================

async function processBatch(products, stats) {
  const results = { updated: 0, skipped: 0, errors: 0 };

  for (const product of products) {
    try {
      // Generer nouvelle Constitution
      const newConstitution = generateConstitution(product);

      if (!newConstitution) {
        results.skipped++;
        stats.skipped++;
        continue;
      }

      // CORRECTION: Ajouter migratedAt DANS l'objet constitution AVANT le $set
      const oldVersion = product.constitution?.version || 'none';
      newConstitution.migratedAt = new Date().toISOString();
      newConstitution.migratedFrom = oldVersion;

      if (!DRY_RUN) {
        // CORRECTION: Un seul $set avec l'objet complet
        const result = await Product.updateOne(
          { _id: product._id },
          { $set: { constitution: newConstitution } }
        );

        if (result.modifiedCount === 0) {
          results.errors++;
          stats.errors++;
          continue;
        }
      }

      results.updated++;
      stats.updated++;

      // Log changement de niveau
      const oldLevel = product.constitution?.healthReflex?.level;
      const newLevel = newConstitution.healthReflex?.level;
      if (oldLevel !== newLevel && oldLevel !== undefined) {
        stats.levelChanges.push({
          name: product.name?.substring(0, 30),
          barcode: product.barcode,
          oldLevel,
          newLevel
        });
      }

    } catch (error) {
      results.errors++;
      stats.errors++;
      if (stats.errorDetails.length < 10) {
        stats.errorDetails.push({
          barcode: product.barcode,
          name: product.name?.substring(0, 30),
          error: error.message
        });
      }
    }
  }

  return results;
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

async function main() {
  const startTime = Date.now();
  
  const stats = {
    total: 0,
    processed: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    levelChanges: [],
    errorDetails: []
  };

  try {
    await connectDB();
    loadServices();

    const { query, total } = await getProductsToUpdate();
    stats.total = total;

    if (total === 0) {
      console.log('\n[INFO] Aucun produit a mettre a jour.');
      return;
    }

    const totalBatches = Math.ceil(total / CONFIG.batchSize);
    console.log('\n[PROCESS] Debut du traitement...');
    console.log('[PROCESS] Batches a traiter:', totalBatches);

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const skip = batchNum * CONFIG.batchSize;

      const products = await Product.find(query)
        .skip(skip)
        .limit(CONFIG.batchSize)
        .lean();

      if (products.length === 0) break;

      const batchResults = await processBatch(products, stats);
      stats.processed += products.length;

      const progress = ((stats.processed / total) * 100).toFixed(1);
      console.log(
        `[BATCH ${batchNum + 1}/${totalBatches}]`,
        `Progress: ${stats.processed}/${total} (${progress}%)`,
        `| Updated: ${batchResults.updated}`,
        `| Errors: ${batchResults.errors}`
      );

      if (batchNum < totalBatches - 1) {
        await new Promise(r => setTimeout(r, CONFIG.delayBetweenBatches));
      }
    }

    // Rapport final
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('RAPPORT FINAL');
    console.log('='.repeat(60));
    console.log('Mode:', DRY_RUN ? 'DRY RUN' : 'PRODUCTION');
    console.log('Duree:', duration, 'secondes');
    console.log('Total traites:', stats.processed);
    console.log('Mis a jour:', stats.updated);
    console.log('Erreurs:', stats.errors);
    console.log('Changements de niveau:', stats.levelChanges.length);

    if (stats.levelChanges.length > 0 && stats.levelChanges.length <= 20) {
      console.log('\nChangements de niveau:');
      stats.levelChanges.forEach(c => {
        console.log(`  - ${c.name}: ${c.oldLevel} -> ${c.newLevel}`);
      });
    }

    if (stats.errorDetails.length > 0) {
      console.log('\nPremieres erreurs:');
      stats.errorDetails.forEach(e => {
        console.log(`  - ${e.name}: ${e.error}`);
      });
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n[FATAL]', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n[DB] Deconnecte');
  }
}

main().catch(console.error);
