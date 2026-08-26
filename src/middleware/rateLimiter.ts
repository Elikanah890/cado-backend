import rateLimit, { MemoryStore } from 'express-rate-limit';

export const publicLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', code: 429, message: 'Too many requests, please try again later.' },
});

export const adminLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 50 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', code: 429, message: 'Too many requests, please try again later.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: new MemoryStore(),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', code: 429, message: 'Too many login attempts, please try again after 15 minutes.' },
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', code: 429, message: 'Too many contact submissions, please try again later.' },
});

