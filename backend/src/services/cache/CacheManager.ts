// backend/src/services/cache/CacheManager.ts

import { redisClient } from '../../config/redis';
import { Logger } from '../../utils/Logger';

const logger = new Logger('CacheManager');

export class CacheManager {
  private defaultTTL = 3600; // 1 heure par dÃ©faut

  /**
   * RÃ©cupÃ©rer une valeur du cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const startTime = Date.now();
      const data = await redisClient.get(key);
      
      if (data) {
        const duration = Date.now() - startTime;
        logger.info(`âœ… Cache HIT: ${key} (${duration}ms)`);
        return JSON.parse(data) as T;
      }
      
      logger.info(`âŒ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error(`âŒ Cache GET error for ${key}:`, error);
      return null;
    }
  }

  /**
   * DÃ©finir une valeur dans le cache
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const startTime = Date.now();
      const data = JSON.stringify(value);
      const expiry = ttl || this.defaultTTL;
      
      if (ttl && ttl > 0) {
        await redisClient.setex(key, expiry, data);
      } else {
        await redisClient.set(key, data);
      }
      
      const duration = Date.now() - startTime;
      logger.info(`âœ… Cache SET: ${key} (TTL: ${expiry}s, ${duration}ms)`);
      return true;
    } catch (error) {
      logger.error(`âŒ Cache SET error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Supprimer une clÃ© du cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await redisClient.del(key);
      logger.info(`ðŸ—‘ï¸ Cache DELETE: ${key} (${result} keys removed)`);
      return result > 0;
    } catch (error) {
      logger.error(`âŒ Cache DELETE error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalider toutes les clÃ©s correspondant Ã  un pattern
   */
  async invalidate(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern);
      
      if (keys.length === 0) {
        logger.info(`ðŸ” No keys found for pattern: ${pattern}`);
        return 0;
      }
      
      const result = await redisClient.del(...keys);
      logger.info(`ðŸ—‘ï¸ Cache INVALIDATE: ${pattern} (${result} keys removed)`);
      return result;
    } catch (error) {
      logger.error(`âŒ Cache INVALIDATE error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * VÃ©rifier si une clÃ© existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`âŒ Cache EXISTS error for ${key}:`, error);
      return false;
    }
  }

  /**
   * RÃ©cupÃ©rer le TTL restant d'une clÃ©
   */
  async ttl(key: string): Promise<number> {
    try {
      const result = await redisClient.ttl(key);
      return result;
    } catch (error) {
      logger.error(`âŒ Cache TTL error for ${key}:`, error);
      return -1;
    }
  }

  /**
   * RÃ©cupÃ©rer ou calculer une valeur (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // VÃ©rifier le cache d'abord
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Si pas en cache, calculer la valeur
    logger.info(`ðŸ”§ Computing value for: ${key}`);
    const value = await factory();
    
    // Stocker en cache pour les prochaines fois
    await this.set(key, value, ttl);
    
    return value;
  }

  /**
   * IncrÃ©menter un compteur atomique
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      const result = await redisClient.incrby(key, amount);
      logger.info(`ðŸ“ˆ Cache INCREMENT: ${key} +${amount} = ${result}`);
      return result;
    } catch (error) {
      logger.error(`âŒ Cache INCREMENT error for ${key}:`, error);
      throw error;
    }
  }

  /**
   * DÃ©crÃ©menter un compteur atomique
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      const result = await redisClient.decrby(key, amount);
      logger.info(`ðŸ“‰ Cache DECREMENT: ${key} -${amount} = ${result}`);
      return result;
    } catch (error) {
      logger.error(`âŒ Cache DECREMENT error for ${key}:`, error);
      throw error;
    }
  }

  /**
   * RÃ©cupÃ©rer plusieurs clÃ©s en une fois
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];
      
      const values = await redisClient.mget(...keys);
      return values.map(v => v ? JSON.parse(v) as T : null);
    } catch (error) {
      logger.error(`âŒ Cache MGET error:`, error);
      return keys.map(() => null);
    }
  }

  /**
   * DÃ©finir plusieurs clÃ©s en une fois
   */
  async mset(items: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    try {
      const pipeline = redisClient.pipeline();
      
      for (const item of items) {
        const data = JSON.stringify(item.value);
        if (item.ttl && item.ttl > 0) {
          pipeline.setex(item.key, item.ttl, data);
        } else {
          pipeline.set(item.key, data);
        }
      }
      
      await pipeline.exec();
      logger.info(`âœ… Cache MSET: ${items.length} keys set`);
      return true;
    } catch (error) {
      logger.error(`âŒ Cache MSET error:`, error);
      return false;
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  async getStats(): Promise<{
    connected: boolean;
    totalKeys: number;
    memoryUsage: string;
    uptime: number;
  }> {
    try {
      const info = await redisClient.info();
      const dbsize = await redisClient.dbsize();
      
      // Parser les infos Redis
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);
      
      return {
        connected: true,
        totalKeys: dbsize,
        memoryUsage: memoryMatch ? memoryMatch[1].trim() : 'Unknown',
        uptime: uptimeMatch ? parseInt(uptimeMatch[1]) : 0
      };
    } catch (error) {
      logger.error(`âŒ Cache STATS error:`, error);
      return {
        connected: false,
        totalKeys: 0,
        memoryUsage: '0',
        uptime: 0
      };
    }
  }

  /**
   * Nettoyer toutes les clÃ©s (attention!)
   */
  async flush(): Promise<boolean> {
    try {
      await redisClient.flushdb();
      logger.warn(`âš ï¸ Cache FLUSH: All keys deleted!`);
      return true;
    } catch (error) {
      logger.error(`âŒ Cache FLUSH error:`, error);
      return false;
    }
  }
}

// Export singleton
export const cacheManager = new CacheManager();
