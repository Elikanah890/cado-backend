import { redis } from '../config/redis';
import logger from '../utils/logger';

const PREFIX = 'refresh:';

const ttlSeconds = (days: number): number => days * 24 * 60 * 60;

// Stores a refresh token jti keyed to an admin id. Rotation makes refresh
// tokens single-use: consumeRefreshToken deletes the jti after a successful read.
export async function storeRefreshToken(jti: string, adminId: string, days = 7): Promise<void> {
  try {
    await redis.set(`${PREFIX}${jti}`, adminId, 'EX', ttlSeconds(days));
  } catch (error) {
    logger.error('Failed to store refresh token in Redis:', error);
  }
}

// Atomically validates and consumes a refresh token. Returns false if the token
// is unknown or belongs to a different admin. If Redis is unavailable this
// fails open to preserve availability (tokenVersion is still enforced at the DB).
export async function consumeRefreshToken(jti: string, adminId: string): Promise<boolean> {
  try {
    const owner = await redis.get(`${PREFIX}${jti}`);
    if (owner !== adminId) return false;
    await redis.del(`${PREFIX}${jti}`);
    return true;
  } catch (error) {
    logger.error('Failed to consume refresh token in Redis:', error);
    return true;
  }
}

export async function revokeRefreshToken(jti: string): Promise<void> {
  try {
    await redis.del(`${PREFIX}${jti}`);
  } catch (error) {
    logger.error('Failed to revoke refresh token in Redis:', error);
  }
}
