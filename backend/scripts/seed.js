// PATH: backend/scripts/seed.js
// VERSION: 1.0.0 - CLI Seeds Manager
require('dotenv').config();
const { MongoClient } = require('mongodb');
const SeedManager = require('../src/services/seedManager');

/**
 * ═══════════════════════════════════════════════════════════════
 * CLI SEEDS - INTERFACE LIGNE DE COMMANDE
 * ═══════════════════════════════════════════════════════════════
 *
 * Commandes disponibles :
 * - node scripts/seed.js seed              : Appliquer tous les seeds
 * - node scripts/seed.js unseed <name>     : Rollback un seed
 * - node scripts/seed.js status            : Afficher status
 *
 * Exemples :
 * node scripts/seed.js seed
 * node scripts/seed.js unseed 001-categories
 * node scripts/seed.js status
 */

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecolojia';

/**
 * Affichage formaté
 */
function displayBanner() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║            ECOLOJIA - SEEDS MANAGER V1.0.0             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
}

function displayUsage() {
  console.log('Usage:');
  console.log('  node scripts/seed.js seed              - Appliquer tous les seeds');
  console.log('  node scripts/seed.js unseed <name>     - Rollback un seed');
  console.log('  node scripts/seed.js status            - Afficher status');
  console.log('\nExemples:');
  console.log('  node scripts/seed.js seed');
  console.log('  node scripts/seed.js unseed 001-categories');
  console.log('  node scripts/seed.js status\n');
}

/**
 * Commande: seed (appliquer tous)
 */
async function runSeedAll(seedManager) {
  console.log('🌱 Application de tous les seeds...\n');

  const result = await seedManager.seedAll();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 RÉSULTAT:');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Total seeds      : ${result.total}`);
  console.log(`✅ Appliqués     : ${result.applied}`);
  console.log(`⏭️  Ignorés       : ${result.skipped}`);
  console.log(`❌ Échecs        : ${result.results.filter(r => !r.success).length}`);
  console.log(`⏱️  Durée         : ${result.durationMs}ms\n`);

  // Détails par seed
  if (result.results.length > 0) {
    console.log('📋 DÉTAILS:\n');
    result.results.forEach(r => {
      if (r.success) {
        console.log(`  ✅ ${r.name}`);
        console.log(`     ${r.description}`);
        console.log(`     Records: ${r.recordsCreated || 0} | Durée: ${r.durationMs}ms\n`);
      } else if (!r.skipped) {
        console.log(`  ❌ ${r.name}`);
        console.log(`     Erreur: ${r.error}\n`);
      }
    });
  }

  if (result.applied > 0) {
    console.log('✅ Seeds appliqués avec succès!\n');
    return 0;
  } else if (result.skipped === result.total) {
    console.log('ℹ️  Tous les seeds sont déjà appliqués.\n');
    return 0;
  } else {
    console.log('⚠️  Certains seeds ont échoué.\n');
    return 1;
  }
}

/**
 * Commande: unseed (rollback)
 */
async function runUnseed(seedManager, seedName) {
  console.log(`🔄 Rollback du seed: ${seedName}...\n`);

  // Ajouter .js si pas présent
  const filename = seedName.endsWith('.js') ? seedName : `${seedName}.js`;

  const result = await seedManager.unseed(filename);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 RÉSULTAT:');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (result.success) {
    console.log(`✅ Seed rollback: ${result.name}`);
    console.log(`   ${result.description}`);
    console.log(`   Records supprimés: ${result.recordsDeleted || 0}`);
    console.log(`   Durée: ${result.durationMs}ms\n`);
    return 0;
  } else if (result.skipped) {
    console.log(`ℹ️  Seed non appliqué: ${seedName}`);
    console.log('   (Rien à rollback)\n');
    return 0;
  } else {
    console.log(`❌ Échec rollback: ${seedName}\n`);
    return 1;
  }
}

/**
 * Commande: status
 */
async function runStatus(seedManager) {
  console.log('📊 Récupération du status...\n');

  const status = await seedManager.status();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 STATUS SEEDS:');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`Total seeds      : ${status.total}`);
  console.log(`✅ Appliqués     : ${status.applied}`);
  console.log(`⏳ En attente    : ${status.pending}\n`);

  // Seeds appliqués
  const appliedSeeds = status.seeds.filter(s => s.status === 'applied');
  if (appliedSeeds.length > 0) {
    console.log('✅ SEEDS APPLIQUÉS:\n');
    appliedSeeds.forEach(s => {
      const date = new Date(s.appliedAt).toLocaleString('fr-FR');
      console.log(`  • ${s.name}`);
      console.log(`    ${s.description || 'N/A'}`);
      console.log(`    Appliqué le: ${date}`);
      console.log(`    Records: ${s.recordsCreated || 0}\n`);
    });
  }

  // Seeds en attente
  const pendingSeeds = status.seeds.filter(s => s.status === 'pending');
  if (pendingSeeds.length > 0) {
    console.log('⏳ SEEDS EN ATTENTE:\n');
    pendingSeeds.forEach(s => {
      console.log(`  • ${s.name} (${s.filename})\n`);
    });
  }

  return 0;
}

/**
 * Main
 */
async function main() {
  displayBanner();

  // Récupérer commande
  const command = process.argv[2];
  const arg = process.argv[3];

  if (!command) {
    displayUsage();
    process.exit(1);
  }

  let client;

  try {
    // Connexion MongoDB
    console.log('🔌 Connexion à MongoDB...');
    console.log(`   URI: ${MONGODB_URI}\n`);

    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db();
    console.log('✅ Connecté à MongoDB\n');

    // Initialiser SeedManager
    const seedManager = new SeedManager(db);

    // Exécuter commande
    let exitCode = 0;

    switch (command) {
      case 'seed':
        exitCode = await runSeedAll(seedManager);
        break;

      case 'unseed':
        if (!arg) {
          console.error('❌ Erreur: Nom du seed requis\n');
          console.log('Usage: node scripts/seed.js unseed <seed-name>\n');
          exitCode = 1;
        } else {
          exitCode = await runUnseed(seedManager, arg);
        }
        break;

      case 'status':
        exitCode = await runStatus(seedManager);
        break;

      default:
        console.error(`❌ Commande inconnue: ${command}\n`);
        displayUsage();
        exitCode = 1;
    }

    process.exit(exitCode);

  } catch (error) {
    console.error('\n❌ ERREUR:');
    console.error('═══════════════════════════════════════════════════════════\n');
    console.error(`Message: ${error.message}`);
    console.error(`Stack: ${error.stack}\n`);
    process.exit(1);

  } finally {
    // Fermer connexion MongoDB
    if (client) {
      await client.close();
      console.log('🔌 Connexion MongoDB fermée\n');
    }
  }
}

// Exécution
main();
