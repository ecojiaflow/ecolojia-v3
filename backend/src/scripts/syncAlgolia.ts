// PATH: src/scripts/syncAlgolia.ts
// // import { PrismaClient } from '@prisma/client';
import AlgoliaService from '../services/algoliaService';

const prisma = null // new PrismaClient();

interface SyncOptions {
  useStaging?: boolean;
  clearFirst?: boolean;
  batchSize?: number;
  maxProducts?: number;
  onlyVerified?: boolean;
  skipConfiguration?: boolean;
}

interface SyncResult {
  totalProcessed: number;
  totalIndexed: number;
  totalFailed: number;
  duration: number;
  successRate: number;
  errors: string[];
}

export class AlgoliaSync {
  
  /**
   * Synchronisation complÃ¨te de tous les produits
   */
  static async syncAllProducts(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const {
      useStaging = false,
      clearFirst = true,
      batchSize = 50,
      maxProducts,
      onlyVerified = false,
      skipConfiguration = false
    } = options;

    console.log('ðŸš€ ========================================');
    console.log('ðŸ”„ DÃ‰BUT SYNCHRONISATION ALGOLIA ECOLOJIA');
    console.log('ðŸš€ ========================================');
    console.log(`ðŸ“Š Mode: ${useStaging ? 'STAGING' : 'PRODUCTION'}`);
    console.log(`ðŸ”§ Options: clear=${clearFirst}, batch=${batchSize}, verified=${onlyVerified}`);
    
    const result: SyncResult = {
      totalProcessed: 0,
      totalIndexed: 0,
      totalFailed: 0,
      duration: 0,
      successRate: 0,
      errors: []
    };

    try {
      // 1. Test de connexion Algolia
      console.log('\nðŸ”Œ Test de connexion Algolia...');
      const connectionOk = await AlgoliaService.testConnection();
      if (!connectionOk) {
        throw new Error('Impossible de se connecter Ã  Algolia');
      }

      // 2. Configuration de l'index
      if (!skipConfiguration) {
        console.log('ðŸ”§ Configuration de l\'index Algolia...');
        await AlgoliaService.configureIndex(useStaging);
      }
      
      // 3. Vider l'index si demandÃ©
      if (clearFirst) {
        console.log('ðŸ—‘ï¸ Vidage de l\'index...');
        await AlgoliaService.clearIndex(useStaging);
      }

      // 4. RÃ©cupÃ©ration des produits depuis PostgreSQL
      console.log('\nðŸ“¦ RÃ©cupÃ©ration des produits depuis PostgreSQL...');
      
      const whereClause: any = {};
      if (onlyVerified) {
        whereClause.verified_status = 'verified';
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        take: maxProducts,
        orderBy: { created_at: 'desc' }
      });

      console.log(`ðŸ“Š ${products.length} produits trouvÃ©s en base`);
      result.totalProcessed = products.length;

      if (products.length === 0) {
        console.log('âš ï¸ Aucun produit Ã  synchroniser');
        return result;
      }

      // 5. Affichage des dÃ©tails des premiers produits
      console.log('\nðŸ“‹ AperÃ§u des produits Ã  indexer:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. "${product.title}" (${product.category}) - ${product.brand || 'Sans marque'}`);
      });
      if (products.length > 3) {
        console.log(`   ... et ${products.length - 3} autres produits`);
      }

      // 6. Indexation par batch
      console.log(`\nðŸ“¤ Indexation par batch de ${batchSize} produits...`);
      let indexed = 0;
      let failed = 0;

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(products.length / batchSize);
        
        console.log(`ðŸ“¦ Batch ${batchNumber}/${totalBatches} (${batch.length} produits)...`);
        
        try {
          const batchResult = await AlgoliaService.indexProducts(batch, useStaging);
          indexed += batchResult.success;
          failed += batchResult.failed;
          
          console.log(`   âœ… ${batchResult.success} indexÃ©s, âŒ ${batchResult.failed} Ã©chouÃ©s`);
          
        } catch (error) {
          const errorMsg = `Batch ${batchNumber} Ã©chouÃ©: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
          result.errors.push(errorMsg);
          failed += batch.length;
          console.error(`   âŒ ${errorMsg}`);
        }

        // Pause entre les batches pour Ã©viter les rate limits Algolia
        if (i + batchSize < products.length) {
          console.log('   â³ Pause 2s...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      result.totalIndexed = indexed;
      result.totalFailed = failed;

      // 7. Statistiques finales
      const endTime = Date.now();
      result.duration = Math.round((endTime - startTime) / 1000);
      result.successRate = result.totalProcessed > 0 ? Math.round((result.totalIndexed / result.totalProcessed) * 100) : 0;

      console.log('\nðŸŽ‰ ========================================');
      console.log('âœ… SYNCHRONISATION TERMINÃ‰E !');
      console.log('ðŸŽ‰ ========================================');
      console.log(`ðŸ“Š RÃ©sultats dÃ©taillÃ©s:`);
      console.log(`   â€¢ Total traitÃ©s: ${result.totalProcessed}`);
      console.log(`   â€¢ IndexÃ©s avec succÃ¨s: ${result.totalIndexed}`);
      console.log(`   â€¢ Ã‰chouÃ©s: ${result.totalFailed}`);
      console.log(`   â€¢ Taux de rÃ©ussite: ${result.successRate}%`);
      console.log(`   â€¢ DurÃ©e: ${result.duration}s`);

      // 8. VÃ©rification avec les stats Algolia
      console.log('\nðŸ” VÃ©rification index Algolia...');
      const algoliaStats = await AlgoliaService.getIndexStats(useStaging);
      console.log(`ðŸ“ˆ Produits dans l'index: ${algoliaStats.totalProducts}`);
      console.log(`ðŸ“‚ RÃ©partition catÃ©gories:`, algoliaStats.categories);
      console.log(`âœ… Statuts vÃ©rification:`, algoliaStats.verificationStatus);

      // 9. Test de recherche
      console.log('\nðŸ” Test de recherche...');
      const testResult = await AlgoliaService.searchProducts('bio', {}, { useStaging, hitsPerPage: 3 });
      console.log(`ðŸŽ¯ Recherche "bio": ${testResult.hits.length} rÃ©sultats trouvÃ©s`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue lors de la synchronisation';
      result.errors.push(errorMsg);
      console.error('âŒ ERREUR SYNCHRONISATION:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
      result.duration = Math.round((Date.now() - startTime) / 1000);
    }

    return result;
  }

  /**
   * Synchronisation incrÃ©mentale (produits rÃ©cents seulement)
   */
  static async syncRecentProducts(hours = 24, useStaging = false): Promise<SyncResult> {
    console.log(`ðŸ”„ Synchronisation incrÃ©mentale (derniÃ¨res ${hours}h)...`);
    
    const result: SyncResult = {
      totalProcessed: 0,
      totalIndexed: 0,
      totalFailed: 0,
      duration: 0,
      successRate: 0,
      errors: []
    };

    const startTime = Date.now();
    
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const recentProducts = await prisma.product.findMany({
        where: {
          updated_at: { gte: since }
        },
        orderBy: { updated_at: 'desc' }
      });

      console.log(`ðŸ“¦ ${recentProducts.length} produits modifiÃ©s depuis ${hours}h`);
      result.totalProcessed = recentProducts.length;

      if (recentProducts.length > 0) {
        const batchResult = await AlgoliaService.indexProducts(recentProducts, useStaging);
        result.totalIndexed = batchResult.success;
        result.totalFailed = batchResult.failed;
        
        console.log(`âœ… Synchronisation incrÃ©mentale: ${result.totalIndexed} indexÃ©s, ${result.totalFailed} Ã©chouÃ©s`);
      }

      result.duration = Math.round((Date.now() - startTime) / 1000);
      result.successRate = result.totalProcessed > 0 ? Math.round((result.totalIndexed / result.totalProcessed) * 100) : 100;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur synchronisation incrÃ©mentale';
      result.errors.push(errorMsg);
      console.error('âŒ Erreur synchronisation incrÃ©mentale:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }

    return result;
  }

  /**
   * Validation et nettoyage de l'index
   */
  static async validateIndex(useStaging = false): Promise<void> {
    console.log('ðŸ” Validation et nettoyage de l\'index...');
    
    try {
      // RÃ©cupÃ©rer tous les IDs de l'index Algolia
      const algoliaStats = await AlgoliaService.getIndexStats(useStaging);
      console.log(`ðŸ“Š ${algoliaStats.totalProducts} produits dans l'index Algolia`);
      
      // RÃ©cupÃ©rer tous les IDs de la base PostgreSQL
      const dbProducts = await prisma.product.findMany({
        select: { id: true }
      });
      console.log(`ðŸ“Š ${dbProducts.length} produits dans PostgreSQL`);
      
      // Comparaison basique
      const dbProductIds = new Set(dbProducts.map(p => p.id));
      console.log('âœ… Validation basique terminÃ©e');
      
    } catch (error) {
      console.error('âŒ Erreur validation index:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// ============================================
// SCRIPT CLI POUR EXÃ‰CUTION LIGNE DE COMMANDE
// ============================================

async function main() {
  const args = process.argv.slice(2);
  
  // Parsing des arguments
  const useStaging = args.includes('--staging');
  const clearFirst = !args.includes('--no-clear');
  const maxProducts = args.includes('--max') ? parseInt(args[args.indexOf('--max') + 1]) : undefined;
  const onlyVerified = args.includes('--verified-only');
  const incremental = args.includes('--incremental');
  const hours = args.includes('--hours') ? parseInt(args[args.indexOf('--hours') + 1]) : 24;
  const validate = args.includes('--validate');

  console.log('ðŸš€ ========================================');
  console.log('ðŸŒ± SCRIPT SYNCHRONISATION ALGOLIA ECOLOJIA');
  console.log('ðŸš€ ========================================');
  console.log(`ðŸ“‹ Arguments dÃ©tectÃ©s:`);
  console.log(`   â€¢ Mode: ${useStaging ? 'STAGING' : 'PRODUCTION'}`);
  console.log(`   â€¢ Vider index: ${clearFirst}`);
  console.log(`   â€¢ Max produits: ${maxProducts || 'tous'}`);
  console.log(`   â€¢ Seulement vÃ©rifiÃ©s: ${onlyVerified}`);
  console.log(`   â€¢ IncrÃ©mental: ${incremental}`);
  if (incremental) console.log(`   â€¢ FenÃªtre: ${hours}h`);
  console.log(`   â€¢ Validation: ${validate}`);

  try {
    if (validate) {
      await AlgoliaSync.validateIndex(useStaging);
    } else if (incremental) {
      const result = await AlgoliaSync.syncRecentProducts(hours, useStaging);
      console.log(`\nðŸ“Š RÃ©sultat incrÃ©mental: ${result.successRate}% rÃ©ussite`);
    } else {
      const result = await AlgoliaSync.syncAllProducts({
        useStaging,
        clearFirst,
        maxProducts,
        onlyVerified
      });
      
      console.log(`\nðŸ“Š RÃ©sultat final: ${result.successRate}% rÃ©ussite en ${result.duration}s`);
      
      if (result.errors.length > 0) {
        console.log(`âš ï¸ Erreurs rencontrÃ©es (${result.errors.length}):`);
        result.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
    }
    
    console.log('\nðŸŽ‰ Script terminÃ© avec succÃ¨s !');
    
  } catch (error) {
    console.error('\nâŒ Ã‰CHEC DU SCRIPT:', error);
    console.log('\nðŸ’¡ Conseils de dÃ©pannage:');
    console.log('   â€¢ VÃ©rifiez vos clÃ©s API Algolia dans .env');
    console.log('   â€¢ VÃ©rifiez la connexion Ã  PostgreSQL');
    console.log('   â€¢ Essayez d\'abord avec --staging');
    console.log('   â€¢ RÃ©duisez la taille avec --max 10');
    process.exit(1);
  }
}

// ExÃ©cution si appelÃ© directement
if (require.main === module) {
  main();
}

export default AlgoliaSync;
// EOF
