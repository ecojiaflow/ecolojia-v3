// backend/src/config/redis.ts

import Redis from 'ioredis';
import { Logger } from '../utils/Logger';

const logger = new Logger('Redis');

// Utiliser l'URL Redis depuis les variables d'environnement
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// CrÃ©er l'instance Redis
export const redisClient = new Redis(REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    if (targetErrors.includes(err.message)) {
      return true;
    }
    return false;
  }
});

// Event handlers
redisClient.on('connect', () => {
  logger.info('âœ… Redis connected successfully');
});

redisClient.on('error', (err) => {
  logger.error('âŒ Redis connection error:', err);
});

redisClient.on('close', () => {
  logger.warn('âš ï¸ Redis connection closed');
});

redisClient.on('reconnecting', (delay: number) => {
  logger.info(`ðŸ”„ Redis reconnecting in ${delay}ms`);
});

// Fonction pour vÃ©rifier la connexion
export const checkRedisConnection = async (): Promise<boolean> => {
  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error('âŒ Redis ping failed:', error);
    return false;
  }
};

// Fonction pour fermer proprement la connexion
export const closeRedisConnection = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info('âœ… Redis connection closed gracefully');
  } catch (error) {
    logger.error('âŒ Error closing Redis connection:', error);
  }
};
