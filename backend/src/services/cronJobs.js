// backend/src/services/cronJobs.js

const cron = require('node-cron');
const OpenFoodFactsIngestion = require('../scripts/ingestOpenFoodFacts');
const AlgoliaSync = require('../scripts/syncAlgolia');
const QuotaService = require('./QuotaService');
const Product = require('../models/Product');

class CronJobsManager {
  constructor() {
    this.jobs = new Map();
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Initialise tous les cron jobs
   */
  initializeJobs() {
    console.log('⏰ Initialisation des cron jobs...');

    // Job 1: Ingestion OpenFoodFacts (quotidien à 3h)
    this.scheduleJob('ingestion-off', '0 3 * * *', async () => {
      console.log('[CRON] Démarrage ingestion OpenFoodFacts');
      try {
        const ingestion = new OpenFoodFactsIngestion();
        await ingestion.run({ limit: 5000 }); // Limite quotidienne
      } catch (error) {
        console.error('[CRON] Erreur ingestion OFF:', error);
      }
    });

    // Job 2: Synchronisation Algolia (toutes les 6h)
    this.scheduleJob('sync-algolia', '0 */6 * * *', async () => {
      console.log('[CRON] Démarrage sync Algolia');
      try {
        const sync = new AlgoliaSync();
        await sync.run({ force: false });
      } catch (error) {
        console.error('[CRON] Erreur sync Algolia:', error);
      }
    });

    // Job 3: Reset quotas mensuels (1er du mois à minuit)
    this.scheduleJob('reset-quotas', '0 0 1 * *', async () => {
      console.log('[CRON] Reset des quotas mensuels');
      try {
        await QuotaService.resetMonthlyQuotas();
      } catch (error) {
        console.error('[CRON] Erreur reset quotas:', error);
      }
    });

    // Job 4: Nettoyage analyses anciennes (quotidien à 4h)
    this.scheduleJob('cleanup-analyses', '0 4 * * *', async () => {
      console.log('[CRON] Nettoyage analyses anciennes');
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const result = await Analysis.deleteMany({
          timestamp: { $lt: sixMonthsAgo },
          userId: null // Seulement les analyses anonymes
        });
        
        console.log(`[CRON] ${result.deletedCount} analyses supprimées`);
      } catch (error) {
        console.error('[CRON] Erreur cleanup:', error);
      }
    });

    // Job 5: Calcul popularité produits (toutes les heures)
    this.scheduleJob('calculate-popularity', '0 * * * *', async () => {
      console.log('[CRON] Calcul popularité produits');
      try {
        await this.calculateProductPopularity();
      } catch (error) {
        console.error('[CRON] Erreur calcul popularité:', error);
      }
    });

    // Job 6: Backup MongoDB (quotidien à 2h) - Production seulement
    if (this.isProduction) {
      this.scheduleJob('backup-mongodb', '0 2 * * *', async () => {
        console.log('[CRON] Backup MongoDB');
        try {
          await this.performMongoBackup();
        } catch (error) {
          console.error('[CRON] Erreur backup:', error);
        }
      });
    }

    // Job 7: Health check (toutes les 5 minutes)
    this.scheduleJob('health-check', '*/5 * * * *', async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('[CRON] Health check failed:', error);
      }
    });

    console.log(`✅ ${this.jobs.size} cron jobs initialisés`);
  }

  /**
   * Programme un job
   */
  scheduleJob(name, schedule, handler) {
    if (this.jobs.has(name)) {
      console.warn(`Job ${name} déjà existant, écrasement...`);
      this.jobs.get(name).stop();
    }

    const job = cron.schedule(schedule, handler, {
      scheduled: true,
      timezone: 'Europe/Paris'
    });

    this.jobs.set(name, job);
    console.log(`✅ Job "${name}" programmé: ${schedule}`);
  }

  /**
   * Calcule la popularité des produits
   */
  async calculateProductPopularity() {
    // Agrégation pour compter les scans par produit sur 30 jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const popularProducts = await Analysis.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo },
          productId: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$productId',
          scanCount: { $sum: 1 }
        }
      },
      {
        $sort: { scanCount: -1 }
      },
      {
        $limit: 1000
      }
    ]);

    // Mettre à jour les produits
    for (const item of popularProducts) {
      await Product.findByIdAndUpdate(item._id, {
        $set: { 
          popularity: item.scanCount,
          lastPopularityUpdate: new Date()
        }
      });
    }

    console.log(`[CRON] Popularité mise à jour pour ${popularProducts.length} produits`);
  }

  /**
   * Backup MongoDB
   */
  async performMongoBackup() {
    const { exec } = require('child_process');
    const path = require('path');
    
    const date = new Date().toISOString().split('T')[0];
    const backupPath = path.join(__dirname, '../../backups', `backup-${date}`);
    
    const command = `mongodump --uri="${process.env.MONGODB_URI}" --out="${backupPath}" --gzip`;
    
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('[CRON] Erreur backup MongoDB:', stderr);
          reject(error);
        } else {
          console.log('[CRON] Backup MongoDB réussi:', backupPath);
          
          // Nettoyer les vieux backups (garder 7 jours)
          this.cleanOldBackups();
          resolve();
        }
      });
    });
  }

  /**
   * Nettoie les vieux backups
   */
  async cleanOldBackups() {
    const fs = require('fs').promises;
    const path = require('path');
    
    const backupsDir = path.join(__dirname, '../../backups');
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    try {
      const files = await fs.readdir(backupsDir);
      
      for (const file of files) {
        const filePath = path.join(backupsDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtimeMs < sevenDaysAgo) {
          await fs.rmdir(filePath, { recursive: true });
          console.log(`[CRON] Backup supprimé: ${file}`);
        }
      }
    } catch (error) {
      console.error('[CRON] Erreur nettoyage backups:', error);
    }
  }

  /**
   * Health check des services
   */
  async performHealthCheck() {
    const health = {
      timestamp: new Date(),
      services: {
        mongodb: false,
        redis: false,
        algolia: false,
        deepseek: false
      },
      stats: {}
    };

    // Check MongoDB
    try {
      const count = await Product.countDocuments();
      health.services.mongodb = true;
      health.stats.products = count;
    } catch (error) {
      console.error('[HEALTH] MongoDB down:', error.message);
    }

    // Check Redis
    try {
      const redis = require('../config/redis');
      await redis.ping();
      health.services.redis = true;
    } catch (error) {
      console.error('[HEALTH] Redis down:', error.message);
    }

    // Check Algolia
    try {
      const algoliaService = require('./search/algoliaService');
      const stats = await algoliaService.getIndexStats();
      health.services.algolia = stats.configured;
      health.stats.algoliaRecords = stats.totalRecords;
    } catch (error) {
      console.error('[HEALTH] Algolia down:', error.message);
    }

    // Sauvegarder le status
    const redis = require('../config/redis');
    await redis.set('health:status', JSON.stringify(health), 'EX', 300);

    // Alerter si un service est down
    const downServices = Object.entries(health.services)
      .filter(([_, status]) => !status)
      .map(([name]) => name);

    if (downServices.length > 0) {
      console.error(`[HEALTH] ⚠️ Services down: ${downServices.join(', ')}`);
      // TODO: Envoyer alerte (email, Slack, etc.)
    }
  }

  /**
   * Arrête tous les jobs
   */
  stopAllJobs() {
    console.log('🛑 Arrêt de tous les cron jobs...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`❌ Job "${name}" arrêté`);
    }
    
    this.jobs.clear();
  }

  /**
   * Liste tous les jobs actifs
   */
  listJobs() {
    const jobsList = [];
    
    for (const [name, job] of this.jobs) {
      jobsList.push({
        name,
        running: job.running !== undefined ? job.running : 'N/A',
        nextExecution: job.nextDates ? job.nextDates()[0] : 'N/A'
      });
    }
    
    return jobsList;
  }

  /**
   * Exécute un job manuellement
   */
  async runJob(jobName) {
    const job = this.jobs.get(jobName);
    
    if (!job) {
      throw new Error(`Job "${jobName}" non trouvé`);
    }
    
    console.log(`🚀 Exécution manuelle du job "${jobName}"`);
    
    // Extraire et exécuter le handler
    if (job._callbacks && job._callbacks[0]) {
      await job._callbacks[0]();
    } else {
      throw new Error(`Impossible d'exécuter le job "${jobName}"`);
    }
  }
}

// Export singleton
module.exports = new CronJobsManager();

// ====================================
// backend/src/routes/admin.routes.js
// ====================================

const router = require('express').Router();
const cronJobs = require('../services/cronJobs');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Protection admin sur toutes les routes
router.use(requireAuth);
router.use(requireAdmin);

// Liste des jobs
router.get('/cron/jobs', (req, res) => {
  const jobs = cronJobs.listJobs();
  res.json({ jobs });
});

// Exécuter un job manuellement
router.post('/cron/jobs/:jobName/run', async (req, res) => {
  try {
    await cronJobs.runJob(req.params.jobName);
    res.json({ 
      success: true, 
      message: `Job "${req.params.jobName}" exécuté` 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health status
router.get('/health', async (req, res) => {
  const redis = require('../config/redis');
  const healthData = await redis.get('health:status');
  
  if (healthData) {
    res.json(JSON.parse(healthData));
  } else {
    res.status(503).json({ error: 'Health data not available' });
  }
});

module.exports = router;