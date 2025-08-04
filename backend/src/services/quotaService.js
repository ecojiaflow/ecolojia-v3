// backend/src/services/quotaService.js
const redis = require('redis');
const User = require('../models/User');

class QuotaService {
  constructor() {
    this.redisClient = null;
    this.LOCK_TTL = 5000; // 5 secondes
    this.initRedis();
  }

  async initRedis() {
    if (process.env.REDIS_URL) {
      try {
        this.redisClient = redis.createClient({ url: process.env.REDIS_URL });
        await this.redisClient.connect();
        console.log('[QuotaService] Redis connected');
      } catch (error) {
        console.error('[QuotaService] Redis connection failed:', error);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MÉTHODES PRINCIPALES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Vérifie et consomme un quota avec gestion de concurrence
   */
  async checkAndConsumeQuota(userId, quotaType) {
    const lockKey = `quota_lock:${userId}:${quotaType}`;
    const lock = await this.acquireLock(lockKey);

    if (!lock) {
      throw new Error('Opération de quota en cours, veuillez réessayer');
    }

    try {
      // Récupérer l'utilisateur
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Déterminer les champs de quota
      const quotaConfig = this.getQuotaConfig(quotaType, user.tier);
      
      // Vérifier si reset nécessaire
      await this.checkAndResetIfNeeded(user, quotaType, quotaConfig);

      // Vérifier le quota
      const currentValue = this.getQuotaValue(user, quotaConfig.field);
      const limit = quotaConfig.limit;

      if (user.tier !== 'premium' && currentValue >= limit) {
        return {
          allowed: false,
          remaining: 0,
          limit,
          resetDate: this.getResetDate(user, quotaConfig.resetField),
          requiresUpgrade: true,
          quotaType
        };
      }

      // Consommer le quota
      const updateField = quotaConfig.incrementField || quotaConfig.field;
      await User.findByIdAndUpdate(userId, {
        $inc: { [updateField]: 1 }
      });

      // Log l'utilisation
      await this.logQuotaUsage(userId, quotaType);

      return {
        allowed: true,
        remaining: user.tier === 'premium' ? -1 : Math.max(0, limit - currentValue - 1),
        limit: user.tier === 'premium' ? -1 : limit,
        resetDate: this.getResetDate(user, quotaConfig.resetField),
        quotaType
      };

    } finally {
      await this.releaseLock(lockKey);
    }
  }

  /**
   * Récupère l'état actuel des quotas d'un utilisateur
   */
  async getQuotaStatus(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const isPremium = user.tier === 'premium';
    
    return {
      tier: user.tier,
      isPremium,
      quotas: {
        scans: {
          used: user.currentUsage?.scansThisMonth || 0,
          limit: isPremium ? -1 : (user.quotas?.scansPerMonth || 30),
          remaining: isPremium ? -1 : Math.max(0, (user.quotas?.scansPerMonth || 30) - (user.currentUsage?.scansThisMonth || 0)),
          resetDate: user.quotas?.scansResetDate || this.getNextMonthReset()
        },
        aiQuestions: {
          used: user.currentUsage?.aiQuestionsToday || 0,
          limit: isPremium ? -1 : (user.quotas?.aiQuestionsPerDay || 0),
          remaining: isPremium ? -1 : Math.max(0, (user.quotas?.aiQuestionsPerDay || 0) - (user.currentUsage?.aiQuestionsToday || 0)),
          resetDate: user.quotas?.aiChatsResetDate || this.getNextDayReset()
        },
        exports: {
          used: user.currentUsage?.exportsThisMonth || 0,
          limit: isPremium ? -1 : (user.quotas?.exportsPerMonth || 0),
          remaining: isPremium ? -1 : Math.max(0, (user.quotas?.exportsPerMonth || 0) - (user.currentUsage?.exportsThisMonth || 0)),
          resetDate: user.quotas?.exportsResetDate || this.getNextMonthReset()
        }
      }
    };
  }

  /**
   * Reset manuel des quotas (pour admin ou cron)
   */
  async resetQuotas(type = 'all') {
    const now = new Date();
    
    if (type === 'daily' || type === 'all') {
      // Reset quotas journaliers
      await User.updateMany(
        { 
          'quotas.aiChatsResetDate': { $lte: now },
          tier: { $ne: 'premium' }
        },
        {
          $set: {
            'currentUsage.aiQuestionsToday': 0,
            'quotas.aiChatsResetDate': this.getNextDayReset()
          }
        }
      );
      console.log('[QuotaService] Daily quotas reset');
    }

    if (type === 'monthly' || type === 'all') {
      // Reset quotas mensuels
      await User.updateMany(
        { 
          'quotas.scansResetDate': { $lte: now },
          tier: { $ne: 'premium' }
        },
        {
          $set: {
            'currentUsage.scansThisMonth': 0,
            'currentUsage.exportsThisMonth': 0,
            'quotas.scansResetDate': this.getNextMonthReset(),
            'quotas.exportsResetDate': this.getNextMonthReset()
          }
        }
      );
      console.log('[QuotaService] Monthly quotas reset');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MÉTHODES PRIVÉES
  // ═══════════════════════════════════════════════════════════════════════

  getQuotaConfig(quotaType, tier) {
    const configs = {
      scan: {
        field: 'currentUsage.scansThisMonth',
        incrementField: 'currentUsage.scansThisMonth',
        resetField: 'quotas.scansResetDate',
        limit: tier === 'premium' ? 999999 : 30,
        resetPeriod: 'monthly'
      },
      aiChat: {
        field: 'currentUsage.aiQuestionsToday',
        incrementField: 'currentUsage.aiQuestionsToday',
        resetField: 'quotas.aiChatsResetDate',
        limit: tier === 'premium' ? 999999 : 0, // 0 pour gratuit = pas d'accès
        resetPeriod: 'daily'
      },
      export: {
        field: 'currentUsage.exportsThisMonth',
        incrementField: 'currentUsage.exportsThisMonth',
        resetField: 'quotas.exportsResetDate',
        limit: tier === 'premium' ? 999999 : 0,
        resetPeriod: 'monthly'
      }
    };

    const config = configs[quotaType];
    if (!config) {
      throw new Error(`Type de quota invalide: ${quotaType}`);
    }

    return config;
  }

  getQuotaValue(user, field) {
    const parts = field.split('.');
    let value = user;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value || 0;
  }

  getResetDate(user, resetField) {
    const parts = resetField.split('.');
    let value = user;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value || new Date();
  }

  async checkAndResetIfNeeded(user, quotaType, config) {
    const resetDate = this.getResetDate(user, config.resetField);
    const now = new Date();

    if (resetDate < now) {
      // Le quota doit être réinitialisé
      const newResetDate = config.resetPeriod === 'daily' 
        ? this.getNextDayReset() 
        : this.getNextMonthReset();

      const updates = {
        [config.field]: 0,
        [config.resetField]: newResetDate
      };

      await User.findByIdAndUpdate(user._id, { $set: updates });
      
      // Mettre à jour l'objet user local
      this.setNestedValue(user, config.field, 0);
      this.setNestedValue(user, config.resetField, newResetDate);
      
      console.log(`[QuotaService] Reset ${quotaType} quota for user ${user._id}`);
    }
  }

  setNestedValue(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
  }

  getNextDayReset() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  getNextMonthReset() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    return nextMonth;
  }

  async logQuotaUsage(userId, quotaType) {
    if (!this.redisClient?.isReady) return;

    try {
      const key = `quota_usage:${userId}:${quotaType}:${new Date().toISOString().split('T')[0]}`;
      await this.redisClient.incr(key);
      await this.redisClient.expire(key, 86400 * 7); // Garder 7 jours
    } catch (error) {
      console.error('[QuotaService] Error logging usage:', error);
    }
  }

  async acquireLock(lockKey) {
    if (!this.redisClient?.isReady) return true; // Pas de lock si pas de Redis

    try {
      const result = await this.redisClient.set(
        lockKey,
        '1',
        {
          PX: this.LOCK_TTL,
          NX: true
        }
      );
      return result === 'OK';
    } catch (error) {
      console.error('[QuotaService] Lock error:', error);
      return true; // En cas d'erreur, on continue
    }
  }

  async releaseLock(lockKey) {
    if (!this.redisClient?.isReady) return;

    try {
      await this.redisClient.del(lockKey);
    } catch (error) {
      console.error('[QuotaService] Unlock error:', error);
    }
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  async getUsageStats(userId, days = 30) {
    if (!this.redisClient?.isReady) {
      return { daily: {}, total: {} };
    }

    const stats = {
      daily: {},
      total: {
        scans: 0,
        aiChats: 0,
        exports: 0
      }
    };

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        stats.daily[dateStr] = {};

        for (const quotaType of ['scan', 'aiChat', 'export']) {
          const key = `quota_usage:${userId}:${quotaType}:${dateStr}`;
          const usage = await this.redisClient.get(key);
          const count = parseInt(usage) || 0;
          
          stats.daily[dateStr][quotaType] = count;
          stats.total[quotaType === 'aiChat' ? 'aiChats' : quotaType + 's'] += count;
        }
      }
    } catch (error) {
      console.error('[QuotaService] Stats error:', error);
    }

    return stats;
  }
}

// Export singleton
module.exports = new QuotaService();