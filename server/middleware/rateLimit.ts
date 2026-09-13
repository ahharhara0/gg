/**
 * Rate limiting middleware.
 * Different limits for general / auth / sensitive endpoints.
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

const standardHandler = (req: any, res: any) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'تم تجاوز عدد المحاولات المسموح بها. حاول لاحقًا.',
    },
    requestId: req.requestId ?? 'no-req-id',
  });
};

export const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    return ip;
  },
  handler: standardHandler,
});

export const authRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    return `auth:${ip}`;
  },
  handler: standardHandler,
});

export const sensitiveRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.sensitiveMax,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    return `sensitive:${ip}`;
  },
  handler: standardHandler,
});

/** Per-user rate limit (after authentication). */
export function perUserRateLimit(max: number, windowMs: number = config.rateLimit.windowMs) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => `uid:${req.uid ?? 'anonymous'}`,
    handler: standardHandler,
  });
}
