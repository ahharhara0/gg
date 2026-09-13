/**
 * Structured logger — never logs secrets/tokens/PII.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const CURRENT_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel | undefined) ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'token',
  'authorization',
  'auth',
  'idtoken',
  'id_token',
  'apikey',
  'api_key',
  'apikey',
  'secret',
  'privatekey',
  'private_key',
  'otp',
  'otpcode',
  'session',
  'cookie',
  'webhooksecret',
  'webhook_secret',
]);

function scrub(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(scrub);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_KEYS.has(lower)) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = scrub(v);
    }
  }
  return out;
}

function emit(level: LogLevel, message: string, meta?: unknown): void {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[CURRENT_LEVEL]) return;

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta: scrub(meta) } : {}),
  };

  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: unknown) => emit('debug', msg, meta),
  info: (msg: string, meta?: unknown) => emit('info', msg, meta),
  warn: (msg: string, meta?: unknown) => emit('warn', msg, meta),
  error: (msg: string, meta?: unknown) => emit('error', msg, meta),
};
