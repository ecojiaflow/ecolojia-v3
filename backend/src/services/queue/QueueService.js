// backend/src/services/queue/QueueService.js â€“ version autoâ€‘compatible BullMQ v3 & v4
// -----------------------------------------------------------------------------
const { Queue, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('../../utils/logger');

// QueueScheduler existe en BullMQ v3, supprime en v4
let QueueScheduler = null;
try {
  // eslint-disable-next-line node/no-extraneous-require
  ({ QueueScheduler } = require('bullmq'));
} catch (_) {
  /* BullMQ v4 : pas de QueueScheduler */
}

class QueueService {
  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    this.connection = new IORedis(redisUrl);

    /** @type {Record<string, import('bullmq').Queue>} */
    this.queues = {};
    /** @type {Record<string, import('bullmq').QueueScheduler>} */
    this.schedulers = {};
    /** @type {Record<string, import('bullmq').QueueEvents>} */
    this.events = {};
  }

  /** Initialise Redis et la queue par defaut */
  async initialize() {
    try {
      await this.connection.connect();
      logger.info('[QueueService] âœ… BullMQ Redis connection verified');
    } catch (err) {
      logger.error('[QueueService] âŒ Redis connection failed', err);
      throw err;
    }
    await this.createQueue('image-analysis');
  }

  /** Cree une queue si necessaire */
  async createQueue(queueName) {
    if (this.queues[queueName]) return this.queues[queueName];

    if (QueueScheduler && typeof QueueScheduler === 'function') {
      // BullMQ v3 : Scheduler disponible
      this.schedulers[queueName] = new QueueScheduler(queueName, {
        connection: this.connection,
      });
    } else {
      // BullMQ v4 : simple warning, la queue fonctionnera mais sans redrive automatique
      console.warn(`[QueueService] QueueScheduler not available â€“ running without scheduler (BullMQ v4)`);
    }

    this.queues[queueName] = new Queue(queueName, {
      connection: this.connection,
    });

    this.events[queueName] = new QueueEvents(queueName, {
      connection: this.connection,
    });
    this.events[queueName].on('failed', ({ jobId, failedReason }) =>
      logger.error(`[${queueName}] Job ${jobId} failed: ${failedReason}`),
    );
    this.events[queueName].on('completed', ({ jobId }) =>
      logger.debug(`[${queueName}] Job ${jobId} completed`),
    );

    logger.info(`[QueueService] Queue '${queueName}' ready`);
    return this.queues[queueName];
  }

  /** Ajoute un job   la queue */
  async addJob(queueName, data, opts = {}) {
    const queue = this.queues[queueName] || (await this.createQueue(queueName));
    return queue.add(queueName, data, opts);
  }

  /** Recupere un job par son ID */
  async getJob(queueName, jobId) {
    const queue = this.queues[queueName];
    if (!queue) throw new Error(`Queue '${queueName}' not found`);
    return queue.getJob(jobId);
  }

  /** Fermeture propre de toutes les ressources */
  async shutdown() {
    await Promise.all(Object.values(this.schedulers).map((s) => s?.close?.()));
    await Promise.all(Object.values(this.queues).map((q) => q.close()));
    if (this.connection.status !== 'end') {
      await this.connection.quit();
    }
  }
}

module.exports = new QueueService();
