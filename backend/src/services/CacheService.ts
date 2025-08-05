// PATH: backend/src/services/CacheService.ts
import Redis from 'ioredis';
import { createHash } from 'crypto';

/**
 * 🚀 Service de Cache Redis pour ECOLOJIA
 * Objectif: Support 1000+ utilisateurs simultanés avec 90% réduction coûts IA
 */
export class CacheService {
  private redis: Redis;
  private readonly defaultTTL = 3600; // 1 heure par défaut
  private readonly analysisPrefix = 'analysis:';
  private readonly sessionPrefix = 'session:';
  private readonly quotaPrefix = 'quota:';
  private readonly rateLimitPrefix = 'ratelimit:';

  constructor() {
    console.log('🔄 Initializing Redis connection...');
    
    // Support REDIS_URL ou variables séparées
    if (process.env.REDIS_URL) {
      console.log('📡 Using REDIS_URL for connection');
      
      // Redis Cloud Frankfurt n'utilise PAS TLS sur ce endpoint
      this.redis = new Redis(process.env.REDIS_URL, {
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          console.log(`🔄 Redis reconnection attempt ${times}, delay: ${delay}ms`);
          return delay;
        }
      });
      
    } else {
      // Configuration avec variables séparées
      console.log('📡 Using individual Redis variables');
      
      const redisConfig: any = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        
        // Options de performance
        enableReadyCheck: true,
        enableOfflineQueue: true,
        connectTimeout: 10000,
        maxRetriesPerRequest: 3,
        
        // Reconnexion automatique
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          console.log(`🔄 Redis reconnection attempt ${times}, delay: ${delay}ms`);
          return delay;
        },
        
        // Gestion erreurs
        reconnectOnError: (err: Error) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            console.error('⚠️ Redis is in readonly mode, reconnecting...');
            return true;
          }
          return false;
        }
      };

      // Support TLS pour Redis Cloud
      if (process.env.REDIS_TLS === 'true') {
        console.log('🔒 TLS enabled for Redis Cloud');
        redisConfig.tls = {
          rejectUnauthorized: false,
          servername: process.env.REDIS_HOST
        };
      }

      this.redis = new Redis(redisConfig);
    }

    // Event listeners pour monitoring
    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
      console.log(`📍 Connected to: ${process.env.REDIS_HOST || 'from REDIS_URL'}`);
    });

    this.redis.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });

    this.redis.on('ready', () => {
      console.log('🚀 Redis ready for operations');
    });

    this.redis.on('close', () => {
      console.log('🔌 Redis connection closed');
    });

    this.redis.on('reconnecting', (delay: number) => {
      console.log(`🔄 Redis reconnecting in ${delay}ms...`);
    });
  }

  /**
   * 🔍 Génère une clé de cache unique pour une analyse produit
   */
  private generateAnalysisCacheKey(productData: any, category: string): string {
    const dataToHash = {
      category,
      barcode: productData.barcode,
      name: productData.name || productData.product_name,
      ingredients: productData.ingredients,
      composition: productData.composition,
      inci: productData.inci,
      // Ignorer les champs qui changent souvent
      _exclude: ['timestamp', 'userId', 'sessionId']
    };

    const hash = createHash('md5')
      .update(JSON.stringify(dataToHash))
      .digest('hex');

    return `${this.analysisPrefix}${category}:${hash}`;
  }

  /**
   * 📊 Cache une analyse de produit
   */
  async cacheAnalysis(
    productData: any, 
    category: string, 
    analysisResult: any, 
    ttl?: number
  ): Promise<void> {
    try {
      const key = this.generateAnalysisCacheKey(productData, category);
      const cacheData = {
        result: analysisResult,
        cachedAt: new Date().toISOString(),
        hitCount: 0,
        category,
        version: process.env.ANALYSIS_VERSION || '1.0'
      };

      await this.redis.setex(
        key,
        ttl || this.defaultTTL,
        JSON.stringify(cacheData)
      );

      console.log(`✅ Analysis cached: ${key.substring(0, 50)}...`);
    } catch (error) {
      console.error('❌ Cache analysis error:', error);
      // Ne pas faire échouer la requête si le cache échoue
    }
  }

  /**
   * 🎯 Récupère une analyse depuis le cache
   */
  async getAnalysis(productData: any, category: string): Promise<any | null> {
    try {
      const key = this.generateAnalysisCacheKey(productData, category);
      const cached = await this.redis.get(key);

      if (!cached) {
        return null;
      }

      const cacheData = JSON.parse(cached);
      
      // Incrémenter le compteur de hits
      cacheData.hitCount = (cacheData.hitCount || 0) + 1;
      await this.redis.setex(
        key,
        this.defaultTTL,
        JSON.stringify(cacheData)
      );

      console.log(`✅ Cache hit: ${key.substring(0, 50)}... (hits: ${cacheData.hitCount})`);
      
      return {
        ...cacheData.result,
        _cache: {
          hit: true,
          cachedAt: cacheData.cachedAt,
          hitCount: cacheData.hitCount
        }
      };
    } catch (error) {
      console.error('❌ Get analysis cache error:', error);
      return null;
    }
  }

  /**
   * 🔐 Cache une session utilisateur
   */
  async cacheSession(token: string, sessionData: any, ttl?: number): Promise<void> {
    try {
      const key = `${this.sessionPrefix}${token}`;
      await this.redis.setex(
        key,
        ttl || 86400, // 24h par défaut pour sessions
        JSON.stringify({
          ...sessionData,
          lastAccess: new Date().toISOString()
        })
      );
    } catch (error) {
      console.error('❌ Cache session error:', error);
    }
  }

  /**
   * 🔍 Récupère une session depuis le cache
   */
  async getSession(token: string): Promise<any | null> {
    try {
      const key = `${this.sessionPrefix}${token}`;
      const cached = await this.redis.get(key);
      
      if (!cached) {
        return null;
      }

      const sessionData = JSON.parse(cached);
      
      // Mise à jour last access
      sessionData.lastAccess = new Date().toISOString();
      await this.redis.expire(key, 86400); // Renouveler TTL
      
      return sessionData;
    } catch (error) {
      console.error('❌ Get session cache error:', error);
      return null;
    }
  }

  /**
   * 🗑️ Supprime une session du cache
   */
  async deleteSession(token: string): Promise<void> {
    try {
      const key = `${this.sessionPrefix}${token}`;
      await this.redis.del(key);
    } catch (error) {
      console.error('❌ Delete session error:', error);
    }
  }

  /**
   * 📊 Gestion des quotas utilisateur
   */
  async incrementQuota(userId: string, action: string): Promise<number> {
    try {
      const monthKey = new Date().toISOString().substring(0, 7); // YYYY-MM
      const key = `${this.quotaPrefix}${userId}:${action}:${monthKey}`;
      
      const count = await this.redis.incr(key);
      
      // Expirer à la fin du mois suivant
      const daysUntilNextMonth = this.getDaysUntilNextMonth();
      await this.redis.expire(key, daysUntilNextMonth * 86400);
      
      return count;
    } catch (error) {
      console.error('❌ Increment quota error:', error);
      return 0;
    }
  }

  /**
   * 🔍 Récupère le quota actuel
   */
  async getQuota(userId: string, action: string): Promise<number> {
    try {
      const monthKey = new Date().toISOString().substring(0, 7);
      const key = `${this.quotaPrefix}${userId}:${action}:${monthKey}`;
      
      const count = await this.redis.get(key);
      return parseInt(count || '0', 10);
    } catch (error) {
      console.error('❌ Get quota error:', error);
      return 0;
    }
  }

  /**
   * 🛡️ Rate limiting par IP/User
   */
  async checkRateLimit(
    identifier: string, 
    maxRequests: number = 100, 
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    try {
      const key = `${this.rateLimitPrefix}${identifier}`;
      const current = await this.redis.incr(key);
      
      if (current === 1) {
        await this.redis.expire(key, windowSeconds);
      }
      
      const ttl = await this.redis.ttl(key);
      const resetAt = new Date(Date.now() + ttl * 1000);
      
      return {
        allowed: current <= maxRequests,
        remaining: Math.max(0, maxRequests - current),
        resetAt
      };
    } catch (error) {
      console.error('❌ Rate limit check error:', error);
      // En cas d'erreur, on autorise la requête
      return { allowed: true, remaining: maxRequests, resetAt: new Date() };
    }
  }

  /**
   * 📊 Statistiques de cache
   */
  async getCacheStats(): Promise<any> {
    try {
      const info = await this.redis.info('stats');
      const dbSize = await this.redis.dbsize();
      
      // Compter les types de clés
      const analysisKeys = await this.redis.keys(`${this.analysisPrefix}*`);
      const sessionKeys = await this.redis.keys(`${this.sessionPrefix}*`);
      const quotaKeys = await this.redis.keys(`${this.quotaPrefix}*`);
      
      return {
        connected: this.redis.status === 'ready',
        totalKeys: dbSize,
        breakdown: {
          analyses: analysisKeys.length,
          sessions: sessionKeys.length,
          quotas: quotaKeys.length
        },
        performance: this.parseRedisInfo(info),
        memory: await this.redis.info('memory')
      };
    } catch (error) {
      console.error('❌ Get cache stats error:', error);
      return { error: 'Unable to get cache stats' };
    }
  }

  /**
   * 🧹 Nettoyage des clés expirées
   */
  async cleanupExpiredKeys(): Promise<number> {
    try {
      // Redis gère automatiquement l'expiration, mais on peut forcer un scan
      const deleted = await this.redis.eval(`
        local deleted = 0
        local cursor = "0"
        repeat
          local result = redis.call("SCAN", cursor, "COUNT", 100)
          cursor = result[1]
          for _, key in ipairs(result[2]) do
            if redis.call("TTL", key) == -1 then
              redis.call("DEL", key)
              deleted = deleted + 1
            end
          end
        until cursor == "0"
        return deleted
      `, 0);
      
      console.log(`🧹 Cleaned up ${deleted} expired keys`);
      return Number(deleted);
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      return 0;
    }
  }

  /**
   * 🔄 Invalidate cache patterns
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      const deleted = await this.redis.del(...keys);
      console.log(`🗑️ Invalidated ${deleted} keys matching pattern: ${pattern}`);
      return deleted;
    } catch (error) {
      console.error('❌ Invalidate pattern error:', error);
      return 0;
    }
  }

  /**
   * 🔌 Fermeture propre de la connexion
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('👋 Redis disconnected gracefully');
    } catch (error) {
      console.error('❌ Redis disconnect error:', error);
    }
  }

  // Méthodes utilitaires privées

  private getDaysUntilNextMonth(): number {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const stats: any = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      }
    });
    
    return {
      totalCommandsProcessed: stats.total_commands_processed,
      instantaneousOpsPerSec: stats.instantaneous_ops_per_sec,
      hitRate: this.calculateHitRate(stats),
      connectedClients: stats.connected_clients,
      usedMemory: stats.used_memory_human
    };
  }

  private calculateHitRate(stats: any): string {
    const hits = parseInt(stats.keyspace_hits || '0');
    const misses = parseInt(stats.keyspace_misses || '0');
    const total = hits + misses;
    
    if (total === 0) return '0%';
    return `${((hits / total) * 100).toFixed(2)}%`;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
