import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis';

const redisStore = (prefix: string) => new RedisStore({
  prefix: `rate-limit:${prefix}:`,
  sendCommand: async (command: string, ...args: string[]) => {
    if (!redis) throw new Error('Redis is unavailable');
    return redis.call(command, ...args) as Promise<string | number | boolean | Array<string | number | boolean>>;
  },
});

const limiterOptions = {
  passOnStoreError: true,
  standardHeaders: true,
  legacyHeaders: false,
};

export const publicLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  ...(redis ? { store: redisStore('public') } : {}),
  ...limiterOptions,
  message: { status: 'error', code: 429, message: 'Too many requests, please try again later.' },
});

export const adminLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 200,
  ...(redis ? { store: redisStore('admin') } : {}),
  ...limiterOptions,
  message: { status: 'error', code: 429, message: 'Too many requests, please try again later.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  ...(redis ? { store: redisStore('auth') } : {}),
  skipSuccessfulRequests: true,
  ...limiterOptions,
  message: { status: 'error', code: 429, message: 'Too many login attempts, please try again after 15 minutes.' },
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  ...(redis ? { store: redisStore('contact') } : {}),
  ...limiterOptions,
  message: { status: 'error', code: 429, message: 'Too many contact submissions, please try again later.' },
});

