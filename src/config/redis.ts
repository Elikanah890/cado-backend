import Redis from 'ioredis';
import logger from '../utils/logger';

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

function createRedis(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.warn('REDIS_URL is not configured; continuing without Redis');
    return null;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
    });

    client.on('error', (error) => {
      logger.warn(`Redis warning: ${error.message}`);
    });
    client.on('connect', () => {
      logger.info('Redis connected');
    });
    return client;
  } catch (error) {
    logger.warn(`Redis not available: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
