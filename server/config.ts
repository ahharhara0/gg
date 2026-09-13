/**
 * Production Backend Configuration
 * Hadramout Hyper — Secure Backend
 *
 * All secrets come from environment variables.
 * NEVER hard-code secrets in this file or any other source file.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Attempt to load Firebase applet config if present in workspace
interface AppletFirebaseConfig {
  projectId?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  apiKey?: string;
  authDomain?: string;
  appId?: string;
}

let appletConfig: AppletFirebaseConfig = {};
try {
  const cfgPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(cfgPath)) {
    appletConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  }
} catch {
  // Ignore error if file is unreadable or malformed
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return fallback ?? '';
  }
  return value;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

const resolvedPublicUrl = process.env.PUBLIC_BASE_URL || process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

const defaultCorsOrigins = [
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'http://localhost:3000',
  'https://localhost',
  resolvedPublicUrl,
  process.env.APP_URL ?? '',
  'https://ais-dev-4u7gqbsglzcfpypp6ri5qx-541601394035.europe-west3.run.app',
  'https://ais-pre-4u7gqbsglzcfpypp6ri5qx-541601394035.europe-west3.run.app',
]
  .filter(Boolean)
  .join(',');

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  // Render/Cloud Run provide PORT at runtime; keep 3000 as the local development fallback.
  port: intEnv('PORT', 3000),
  isProduction: process.env.NODE_ENV === 'production',

  /** Public base URL of this backend (used for CORS origin allow-list and webhook URLs). */
  publicBaseUrl: resolvedPublicUrl,

  /** Frontend origin (Capacitor / web) — used for CORS. */
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'capacitor://localhost',

  /**
   * Firebase Admin service account.
   * Pulls automatically from firebase-applet-config.json for project & database IDs.
   * Service account key is only required if server-side admin writes are invoked.
   */
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || appletConfig.projectId || 'predictive-alignment-5pthm',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT ?? '',
    firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId || '',
  },

  /** CORS allow-list for Android WebView / web origins. */
  corsOrigins: (process.env.CORS_ORIGINS ?? defaultCorsOrigins)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  /** Rate limiting — sliding window per IP. */
  rateLimit: {
    windowMs: intEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
    max: intEnv('RATE_LIMIT_MAX', 300), // 300 req per window per IP
    authMax: intEnv('RATE_LIMIT_AUTH_MAX', 10), // 10 auth attempts per window
    sensitiveMax: intEnv('RATE_LIMIT_SENSITIVE_MAX', 30), // 30 sensitive ops per window
  },

  /** Payment gateway configuration (set per provider). */
  payments: {
    gateway: process.env.PAYMENT_GATEWAY ?? 'manual', // 'manual' | 'floosak' | 'stripe' | ...
    // Webhook secret may be empty in dev — webhook verification will reject all webhooks.
    // In production this MUST be set to a strong random value.
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? '',
    webhookToleranceSeconds: intEnv('PAYMENT_WEBHOOK_TOLERANCE_SECONDS', 300),
  },

  /** Idempotency record TTL in seconds (default 24h). */
  idempotencyTtlSeconds: intEnv('IDEMPOTENCY_TTL_SECONDS', 24 * 60 * 60),

  /** Default currency used for server-side price calculation. */
  defaultCurrency: process.env.DEFAULT_CURRENCY ?? 'YER',

  /** VAT rate (0.15 = 15%). */
  vatRate: parseFloat(process.env.VAT_RATE ?? '0.15'),

  /** Free delivery threshold (in default currency). */
  freeDeliveryThreshold: parseFloat(process.env.FREE_DELIVERY_THRESHOLD ?? '150'),

  /** Flat delivery fee when below threshold. */
  deliveryFee: parseFloat(process.env.DELIVERY_FEE ?? '15'),

  /** Staff access — hashes only; plaintext staff codes are never read by the frontend. */
  staff: {
    developerCodeHash: process.env.STAFF_DEVELOPER_CODE_HASH ?? '',
    managerCodeHash: process.env.STAFF_MANAGER_CODE_HASH ?? '',
    auditSalt: process.env.STAFF_AUDIT_SALT ?? 'hadramout-hyper-audit',
  },

  /** Log level — never log secrets. */
  logLevel: process.env.LOG_LEVEL ?? 'info',
} as const;

export type BackendConfig = typeof config;
