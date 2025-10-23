// backend/src/services/cache/AnalysisCache.ts

import { cacheManager } from './CacheManager';
import { Logger } from '../../utils/Logger';
import crypto from 'crypto';

const logger = new Logger('AnalysisCache');

interface AnalysisResult {
  id: string;
  productName: string;
  barcode?: string;
  category: 'food' | 'cosmetics' | 'detergents';
  healthScore: number;
  analysis: any; // RÃ©sultat complet de l'analyse IA
  analyzedAt: Date;
  cachedAt?: Date;
}

export class AnalysisCache {
  private readonly PREFIX = 'analysis:';
  private readonly BARCODE_PREFIX = 'barcode:';
  private readonly HASH_PREFIX = 'hash:';
  private readonly TTL = 86400; // 24 heures par dÃ©faut

  /**
   * GÃ©nÃ©rer un hash unique pour un produit
   */
  private generateProductHash(
    productName: string,
    category: string,
    ingredients?: string[]
  ): string {
    const data = {
      name: productName.toLowerCase().trim(),
      category,
      ingredients: ingredients?.sort().join(',') || ''
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Stocker une analyse en cache
   */
  async cacheAnalysis(
    analysis: AnalysisResult,
    ingredients?: string[]
  ): Promise<boolean> {
    try {
      const cachedAnalysis = {
        ...analysis,
        cachedAt: new Date()
      };

      // Cache par ID
      const idKey = `${this.PREFIX}${analysis.id}`;
      await cacheManager.set(idKey, cachedAnalysis, this.TTL);

      // Cache par code-barres si disponible
      if (analysis.barcode) {
        const barcodeKey = `${this.BARCODE_PREFIX}${analysis.barcode}`;
        await cacheManager.set(barcodeKey, analysis.id, this.TTL);
      }

      // Cache par hash (nom + catÃ©gorie + ingrÃ©dients)
      const hash = this.generateProductHash(
        analysis.productName,
        analysis.category,
        ingredients
      );
      const hashKey = `${this.HASH_PREFIX}${hash}`;
      await cacheManager.set(hashKey, analysis.id, this.TTL);

      logger.info(`âœ… Analysis cached: ${analysis.productName} (Score: ${analysis.healthScore})`);
      return true;
    } catch (error) {
      logger.error(`âŒ Error caching analysis:`, error);
      return false;
    }
  }

  /**
   * RÃ©cupÃ©rer une analyse par ID
   */
  async getAnalysisById(id: string): Promise<AnalysisResult | null> {
    try {
      const key = `${this.PREFIX}${id}`;
      return await cacheManager.get<AnalysisResult>(key);
    } catch (error) {
      logger.error(`âŒ Error getting analysis by ID:`, error);
      return null;
    }
  }

  /**
   * RÃ©cupÃ©rer une analyse par code-barres
   */
  async getAnalysisByBarcode(barcode: string): Promise<AnalysisResult | null> {
    try {
      // RÃ©cupÃ©rer l'ID associÃ© au code-barres
      const barcodeKey = `${this.BARCODE_PREFIX}${barcode}`;
      const analysisId = await cacheManager.get<string>(barcodeKey);

      if (!analysisId) return null;

      // RÃ©cupÃ©rer l'analyse par ID
      return await this.getAnalysisById(analysisId);
    } catch (error) {
      logger.error(`âŒ Error getting analysis by barcode:`, error);
      return null;
    }
  }

  /**
   * RÃ©cupÃ©rer une analyse par hash produit
   */
  async getAnalysisByProduct(
    productName: string,
    category: string,
    ingredients?: string[]
  ): Promise<AnalysisResult | null> {
    try {
      // GÃ©nÃ©rer le hash
      const hash = this.generateProductHash(productName, category, ingredients);
      const hashKey = `${this.HASH_PREFIX}${hash}`;

      // RÃ©cupÃ©rer l'ID associÃ© au hash
      const analysisId = await cacheManager.get<string>(hashKey);

      if (!analysisId) {
        logger.info(`âŒ Cache MISS for product: ${productName}`);
        return null;
      }

      // RÃ©cupÃ©rer l'analyse par ID
      const analysis = await this.getAnalysisById(analysisId);
      
      if (analysis) {
        logger.info(`âœ… Cache HIT for product: ${productName} (Score: ${analysis.healthScore})`);
      }

      return analysis;
    } catch (error) {
      logger.error(`âŒ Error getting analysis by product:`, error);
      return null;
    }
  }

  /**
   * VÃ©rifier si une analyse existe pour un produit
   */
  async hasAnalysis(
    productName: string,
    category: string,
    ingredients?: string[]
  ): Promise<boolean> {
    const analysis = await this.getAnalysisByProduct(productName, category, ingredients);
    return analysis !== null;
  }

  /**
   * Invalider une analyse
   */
  async invalidateAnalysis(id: string): Promise<boolean> {
    try {
      // RÃ©cupÃ©rer l'analyse pour obtenir les mÃ©tadonnÃ©es
      const analysis = await this.getAnalysisById(id);
      
      if (!analysis) return false;

      // Supprimer toutes les clÃ©s associÃ©es
      const keysToDelete = [`${this.PREFIX}${id}`];

      if (analysis.barcode) {
        keysToDelete.push(`${this.BARCODE_PREFIX}${analysis.barcode}`);
      }

      // Note: Impossible de supprimer par hash sans connaÃ®tre les ingrÃ©dients originaux
      // Une amÃ©lioration serait de stocker les clÃ©s associÃ©es

      for (const key of keysToDelete) {
        await cacheManager.delete(key);
      }

      logger.info(`ðŸ—‘ï¸ Analysis invalidated: ${id}`);
      return true;
    } catch (error) {
      logger.error(`âŒ Error invalidating analysis:`, error);
      return false;
    }
  }

  /**
   * RÃ©cupÃ©rer les statistiques du cache d'analyses
   */
  async getCacheStats(): Promise<{
    totalAnalyses: number;
    cacheHitRate: number;
    averageCacheAge: number;
    categoriesBreakdown: Record<string, number>;
  }> {
    try {
      // ImplÃ©mentation simplifiÃ©e
      // En production, utiliser des compteurs Redis pour un suivi prÃ©cis
      const stats = await cacheManager.getStats();

      return {
        totalAnalyses: stats.totalKeys,
        cacheHitRate: 0, // Ã€ implÃ©menter avec des compteurs
        averageCacheAge: 0, // Ã€ calculer
        categoriesBreakdown: {
          food: 0,
          cosmetics: 0,
          detergents: 0
        }
      };
    } catch (error) {
      logger.error(`âŒ Error getting cache stats:`, error);
      return {
        totalAnalyses: 0,
        cacheHitRate: 0,
        averageCacheAge: 0,
        categoriesBreakdown: {
          food: 0,
          cosmetics: 0,
          detergents: 0
        }
      };
    }
  }

  /**
   * RÃ©chauffer le cache avec les produits populaires
   */
  async warmupCache(popularProducts: Array<{
    name: string;
    category: string;
    barcode?: string;
  }>): Promise<number> {
    try {
      let warmedCount = 0;

      for (const product of popularProducts) {
        const exists = await this.hasAnalysis(
          product.name,
          product.category
        );

        if (!exists) {
          // Ici, dÃ©clencher une analyse pour rÃ©chauffer le cache
          // Ã€ implÃ©menter selon votre logique mÃ©tier
          logger.info(`ðŸ“¥ Should warm cache for: ${product.name}`);
        } else {
          warmedCount++;
        }
      }

      logger.info(`ðŸ”¥ Cache warmup: ${warmedCount}/${popularProducts.length} already cached`);
      return warmedCount;
    } catch (error) {
      logger.error(`âŒ Error warming up cache:`, error);
      return 0;
    }
  }

  /**
   * Nettoyer les analyses expirÃ©es
   */
  async cleanupExpired(): Promise<number> {
    try {
      // Redis supprime automatiquement les clÃ©s expirÃ©es
      // Cette mÃ©thode peut Ãªtre utilisÃ©e pour un nettoyage manuel si nÃ©cessaire
      const pattern = `${this.PREFIX}*`;
      const deleted = await cacheManager.invalidate(pattern);
      
      logger.info(`ðŸ§¹ Cleaned up ${deleted} expired analyses`);
      return deleted;
    } catch (error) {
      logger.error(`âŒ Error cleaning up analyses:`, error);
      return 0;
    }
  }
}

// Export singleton
export const analysisCache = new AnalysisCache();
