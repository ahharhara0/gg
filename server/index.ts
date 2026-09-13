/**
 * Production Backend entry point — Hadramout Hyper.
 *
 * Architecture:
 *   Android APK (client)
 *        |  HTTPS Authorization: Bearer <Firebase ID Token>
 *        v
 *   This Express backend (Cloud Run / Node.js production)
 *        |
 *        +-- Firebase Admin SDK (verifyIdToken)
 *        +-- Firestore (source of truth)
 *        +-- Server-side pricing
 *        +-- Idempotency records
 *        +-- Payment gateway webhooks
 *        +-- Audit logs
 *
 * The APK is treated as UNTRUSTED. All sensitive operations require:
 *   1. Valid Firebase ID Token
 *   2. Resolved UID (NOT client-supplied)
 *   3. RBAC permission check
 *   4. Idempotency key (where appropriate)
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { config } from './config.js';
import { initializeFirebaseAdmin, isFirebaseReady } from './services/firebaseAdmin.js';
import { logger } from './utils/logger.js';

import { requestIdMiddleware } from './middleware/requestId.js';
import { generalRateLimit } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import couponsRouter from './routes/coupons.js';
import checkoutRouter from './routes/checkout.js';
import ordersRouter from './routes/orders.js';
import walletRouter from './routes/wallet.js';
import paymentsRouter from './routes/payments.js';
import miscRouter from './routes/misc.js';
import controlRouter from './routes/control.js';

const app = express();
const PORT = config.port;

// -------------------------------------------------------------
// Security middleware
// -------------------------------------------------------------

// Helmet sets safe HTTP headers (CSP, X-Content-Type-Options, etc.).
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — only allow listed origins (Capacitor scheme + production domain).
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / no-origin (mobile WebView, curl, server-to-server).
      if (!origin) return cb(null, true);
      if (config.corsOrigins.includes(origin)) return cb(null, true);
      // Allow Capacitor / Ionic schemes, localhost, and *.run.app preview domains.
      if (
        origin.startsWith('capacitor://') ||
        origin.startsWith('ionic://') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('https://localhost') ||
        origin.endsWith('.run.app') ||
        origin.endsWith('.google.com') ||
        origin.includes('googleusercontent.com')
      ) {
        return cb(null, true);
      }
      // In dev mode allow origin for preview flexibility
      if (!config.isProduction) {
        return cb(null, true);
      }
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key', 'X-Payment-Signature', 'X-Payment-Timestamp', 'X-Webhook-Signature', 'X-Webhook-Event-Id'],
  }),
);

// Compression (gzip).
app.use(compression());

// JSON body parser with raw-body capture for webhook signature verification.
app.use(
  express.json({
    limit: '2mb',
    verify: (req: any, _res, buf) => {
      // Capture raw body for webhook signature verification.
      req.rawBody = buf.toString('utf8');
    },
  }),
);

// Trust first proxy hop (for X-Forwarded-For / secure cookies on Cloud Run).
app.set('trust proxy', 1);

// Request ID — every request gets a traceable ID.
app.use(requestIdMiddleware);

// Simple request logger (no PII / secrets).
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  const authHeader = req.headers.authorization;
  const hasAuth = !!authHeader?.startsWith('Bearer ');
  _res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('request', {
      method: req.method,
      path: req.path,
      status: _res.statusCode,
      durationMs: duration,
      authenticated: hasAuth,
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim(),
      requestId: (req as any).requestId,
    });
  });
  next();
});

// -------------------------------------------------------------
// Routes
// -------------------------------------------------------------

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'Hadramout Hyper Production Backend',
    version: '2.6.0',
    endpoints: [
      '/api/health',
      '/api/auth/check-phone',
      '/api/auth/staff-code',
      '/api/auth/staff-logout',
      '/api/auth/register-user',
      '/api/auth/me',
      '/api/auth/profile',
      '/api/auth/update-role',
      '/api/auth/update-status',
      '/api/products',
      '/api/coupons/validate',
      '/api/checkout/quote',
      '/api/checkout/quote/public',
      '/api/orders/create',
      '/api/orders',
      '/api/orders/:orderId',
      '/api/orders/update-status',
      '/api/orders/cancel',
      '/api/orders/assign-driver',
      '/api/wallet/balance',
      '/api/wallet/transactions',
      '/api/wallet/topup',
      '/api/wallet/credit',
      '/api/wallet/debit',
      '/api/payments/create',
      '/api/payments/webhook',
      '/api/payments/:paymentId',
      '/api/payments/refund',
      '/api/complaints',
      '/api/complaints/resolve',
      '/api/audit-logs',
      '/api/users',
    ],
  });
});

// Health (no rate limit — needed for probes).
app.use('/api/health', healthRouter);

// General rate limit for all subsequent /api/* routes.
app.use('/api', generalRateLimit);

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api', miscRouter); // complaints, audit-logs, users
app.use('/api/control', controlRouter);

// -------------------------------------------------------------
// Vite Middleware (dev) & SPA Static Serving (prod)
// -------------------------------------------------------------

async function startServer() {
  // Initialize Firebase Admin (degrades gracefully if creds missing).
  initializeFirebaseAdmin();
  if (!isFirebaseReady()) {
    logger.warn('Backend starting in DEGRADED mode — Firebase Admin not initialized. Auth/orders/wallet will reject requests.');
  } else {
    logger.info('Firebase Admin ready');
  }

  // 404 handler for unhandled /api/* routes (must run BEFORE Vite middleware)
  app.use('/api', notFoundHandler);

  // In development, mount Vite middleware to serve client React SPA and handle HMR
  if (!config.isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      // Don't intercept /api/* routes — let them 404 properly.
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized error handler
  app.use(errorHandler);

  // Graceful shutdown.
  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
    // Force-close after 10s if hanging.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Hadramout Hyper production backend listening on 0.0.0.0:${PORT}`, {
      env: config.env,
      firebaseReady: isFirebaseReady(),
      publicBaseUrl: config.publicBaseUrl,
    });
  });

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
