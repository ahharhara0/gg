/**
 * Utility helpers shared across the backend.
 */

import crypto from 'crypto';

/** Normalizes phone numbers (Yemen/KSA aware). */
export function normalizePhoneDigits(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-()+#]/g, '');
  if (cleaned.startsWith('00')) cleaned = cleaned.slice(2);
  if (cleaned.startsWith('967') && cleaned.length >= 12) cleaned = cleaned.slice(3);
  if (cleaned.startsWith('966') && cleaned.length >= 12) cleaned = cleaned.slice(3);
  if (cleaned.startsWith('0') && cleaned.length === 10) cleaned = cleaned.slice(1);
  return cleaned;
}

/** Mask phone for logs / API responses — never return full phone numbers. */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const last4 = phone.slice(-4);
  return `******${last4}`;
}

/** Safe JSON parse with fallback. */
export function safeJsonParse<T = unknown>(input: unknown, fallback: T): T {
  if (typeof input !== 'string') return fallback;
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

/** Cryptographically secure random ID. */
export function generateSecureId(prefix = ''): string {
  const rand = crypto.randomBytes(8).toString('hex');
  return prefix ? `${prefix}_${rand}` : rand;
}

/** Generate order ID (HAD-YYYYMMDD-XXXXXX). */
export function generateOrderId(): string {
  const date = new Date();
  const ymd = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `HAD-${ymd}-${rand}`;
}

/** Generate quote token. */
export function generateQuoteToken(): string {
  return `quote_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

/** Stable hash for idempotency response caching. */
export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/** Round to 2 decimals to avoid float drift. */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Get client IP from request (respects X-Forwarded-For). */
export function getClientIp(req: { headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string } }): string {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const parts = Array.isArray(xff) ? xff.join(',') : xff;
    const first = parts.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.socket.remoteAddress || '127.0.0.1';
}
