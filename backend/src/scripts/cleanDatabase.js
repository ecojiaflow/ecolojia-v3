const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Ã°Å¸Â§Â¹ NETTOYAGE BASE POSTGRESQL
 * Supprime tous les produits de test pour avoir une base propre
 */

console.log('Ã°Å¸Â§Â¹ ECOLOJIA - Nettoyage base PostgreSQL');
console.log('Ã¢Å¡Â Ã¯Â¸Â  ATTENTION: Cette operation va supprimer TOUS les produits !');
console.log('='.repeat(60));

async function cleanDatabase() {
  try {
    console.log('Ã°Å¸â€Â Analyse de la base actuelle...\n');

    // 1. Compter les produits actuels
    const currentCount = await prisma.product.count();
    console.log(`Ã°Å¸â€œÅ  Produits actuels en base: ${currentCount}`);

    if (currentCount === 0) {
      console.log('Ã¢Å“â€¦ Base dejÂ  vide - Aucun nettoyage necessaire');
      return;
    }

    // 2. Afficher quelques exemples de produits
    const sampleProducts = await prisma.product.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        barcode: true,
        created_at: true,
        verified_status: true
      }
    });

    console.log('\nÃ°Å¸â€œâ€¹ Exemples de produits en base:');
    sampleProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} (${product.barcode || 'Sans code-barres'})`);
    });

    console.log('\nÃ°Å¸â€”â€˜Ã¯Â¸Â  Suppression de tous les produits...');

    // 3. Supprimer TOUS les produits
    const deleteResult = await prisma.product.deleteMany({});

    console.log(`Ã¢Å“â€¦ ${deleteResult.count} produits supprimes avec succes`);

    // 4. Verification finale
    const finalCount = await prisma.product.count();
    console.log(`Ã°Å¸â€œÅ  Produits restants: ${finalCount}`);

    // 5. Reset des sequences (optionnel pour PostgreSQL)
    try {
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('products', 'created_at'), 1, false);`;
      console.log('Ã°Å¸â€â€ž Sequences reinitialisees');
    } catch (error) {
      console.log('Ã¢Å¡Â Ã¯Â¸Â  Reinitialisation sequences ignoree');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Ã°Å¸Å½â€° BASE NETTOYâ€°E AVEC SUCCË†S !');
    console.log('Ã°Å¸â€™Â¡ Vous pouvez maintenant lancer l\'import de produits reels');
    console.log('Ã°Å¸Å¡â‚¬ Commande: node scripts/importDirectToDB.js');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Ã¢ÂÅ’ Erreur lors du nettoyage:', error.message);
    console.error('Ã°Å¸â€™Â¡ Details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction de nettoyage selectif (bonus)
async function cleanTestProducts() {
  try {
    console.log('Ã°Å¸Â§Â¹ Nettoyage selectif - Produits de test uniquement...\n');

    // Supprimer uniquement les produits "test" ou mock
    const deleteResult = await prisma.product.deleteMany({
      where: {
        OR: [
          { title: { contains: 'test', mode: 'insensitive' } },
          { title: { contains: 'mock', mode: 'insensitive' } },
          { title: { contains: 'exemple', mode: 'insensitive' } },
          { description: { contains: 'mock', mode: 'insensitive' } },
          { barcode: null }, // Produits sans code-barres (probablement des tests)
          { verified_status: 'manual_review' }, // Statut de test
          {
            title: {
              in: [
                'Shampooing Bio Lavande',
                'Dentifrice Menthe Naturel',
                'Savon Artisanal Karite',
                'Creme Visage Aloe Vera',
                'Huile d\'Olive Extra Vierge'
              ]
            }
          }
        ]
      }
    });

    console.log(`Ã¢Å“â€¦ ${deleteResult.count} produits de test supprimes`);

    const remainingCount = await prisma.product.count();
    console.log(`Ã°Å¸â€œÅ  Produits reels conserves: ${remainingCount}`);

  } catch (error) {
    console.error('Ã¢ÂÅ’ Erreur nettoyage selectif:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Menu interactif
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--all')) {
    console.log('Ã°Å¸â€”â€˜Ã¯Â¸Â  Mode: Suppression TOTALE\n');
    await cleanDatabase();
  } else if (args.includes('--test-only')) {
    console.log('Ã°Å¸Â§Â¹ Mode: Suppression produits TEST uniquement\n');
    await cleanTestProducts();
  } else {
    console.log('Ã°Å¸â€Â§ SCRIPT NETTOYAGE BASE POSTGRESQL');
    console.log('\nCommandes disponibles:');
    console.log('  node scripts/cleanDatabase.js --all        # Supprime TOUS les produits');
    console.log('  node scripts/cleanDatabase.js --test-only  # Supprime uniquement les produits test');
    console.log('\nÃ¢Å¡Â Ã¯Â¸Â  RECOMMANDâ€°: Utilisez --all pour une base 100% propre');
    console.log('Ã°Å¸â€™Â¡ Puis lancez: node scripts/importDirectToDB.js');
  }
}

// Confirmation interactive (securite)
function askConfirmation() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Ã¢Å¡Â Ã¯Â¸Â  Å tes-vous sur de vouloir supprimer les produits ? (oui/non): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'yes');
    });
  });
}

// Lancement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { cleanDatabase, cleanTestProducts };
