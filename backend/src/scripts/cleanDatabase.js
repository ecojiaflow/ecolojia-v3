const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * ðŸ§¹ NETTOYAGE BASE POSTGRESQL
 * Supprime tous les produits de test pour avoir une base propre
 */

console.log('ðŸ§¹ ECOLOJIA - Nettoyage base PostgreSQL');
console.log('âš ï¸  ATTENTION: Cette operation va supprimer TOUS les produits !');
console.log('='.repeat(60));

async function cleanDatabase() {
  try {
    console.log('ðŸ” Analyse de la base actuelle...\n');

    // 1. Compter les produits actuels
    const currentCount = await prisma.product.count();
    console.log(`ðŸ“Š Produits actuels en base: ${currentCount}`);

    if (currentCount === 0) {
      console.log('âœ… Base dej  vide - Aucun nettoyage necessaire');
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

    console.log('\nðŸ“‹ Exemples de produits en base:');
    sampleProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} (${product.barcode || 'Sans code-barres'})`);
    });

    console.log('\nðŸ—‘ï¸  Suppression de tous les produits...');

    // 3. Supprimer TOUS les produits
    const deleteResult = await prisma.product.deleteMany({});

    console.log(`âœ… ${deleteResult.count} produits supprimes avec succes`);

    // 4. Verification finale
    const finalCount = await prisma.product.count();
    console.log(`ðŸ“Š Produits restants: ${finalCount}`);

    // 5. Reset des sequences (optionnel pour PostgreSQL)
    try {
      await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('products', 'created_at'), 1, false);`;
      console.log('ðŸ”„ Sequences reinitialisees');
    } catch (error) {
      console.log('âš ï¸  Reinitialisation sequences ignoree');
    }

    console.log('\n' + '='.repeat(60));
    console.log('ðŸŽ‰ BASE NETTOY‰E AVEC SUCCˆS !');
    console.log('ðŸ’¡ Vous pouvez maintenant lancer l\'import de produits reels');
    console.log('ðŸš€ Commande: node scripts/importDirectToDB.js');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('âŒ Erreur lors du nettoyage:', error.message);
    console.error('ðŸ’¡ Details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction de nettoyage selectif (bonus)
async function cleanTestProducts() {
  try {
    console.log('ðŸ§¹ Nettoyage selectif - Produits de test uniquement...\n');

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

    console.log(`âœ… ${deleteResult.count} produits de test supprimes`);

    const remainingCount = await prisma.product.count();
    console.log(`ðŸ“Š Produits reels conserves: ${remainingCount}`);

  } catch (error) {
    console.error('âŒ Erreur nettoyage selectif:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Menu interactif
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--all')) {
    console.log('ðŸ—‘ï¸  Mode: Suppression TOTALE\n');
    await cleanDatabase();
  } else if (args.includes('--test-only')) {
    console.log('ðŸ§¹ Mode: Suppression produits TEST uniquement\n');
    await cleanTestProducts();
  } else {
    console.log('ðŸ”§ SCRIPT NETTOYAGE BASE POSTGRESQL');
    console.log('\nCommandes disponibles:');
    console.log('  node scripts/cleanDatabase.js --all        # Supprime TOUS les produits');
    console.log('  node scripts/cleanDatabase.js --test-only  # Supprime uniquement les produits test');
    console.log('\nâš ï¸  RECOMMAND‰: Utilisez --all pour une base 100% propre');
    console.log('ðŸ’¡ Puis lancez: node scripts/importDirectToDB.js');
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
    rl.question('âš ï¸  Štes-vous sur de vouloir supprimer les produits ? (oui/non): ', (answer) => {
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
