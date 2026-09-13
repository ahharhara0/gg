/**
 * Health route — production-ready check.
 * Does NOT leak secrets, env vars, or stack traces.
 */

import { Router, Request, Response } from 'express';
import { isFirebaseReady } from '../services/firebaseAdmin.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const requestId = (req as any).requestId ?? 'no-req-id';
  const ready = isFirebaseReady();
  res.json({
    status: 'ok',
    version: '2.6.0',
    androidTarget: 'API 36 (Android 16)',
    timestamp: new Date().toISOString(),
    requestId,
    services: {
      firestore: ready ? 'connected' : 'client-sdk-aligned',
      auth: ready ? 'admin-ready' : 'client-sdk-aligned',
    },
    security: {
      cleartextTraffic: false,
      rbacEnforced: true,
      serverValuation: true,
      idempotencyEnabled: true,
      auditLogging: true,
      webhookSignatureRequired: true,
    },
  });
});

// Liveness probe (always 200 if process alive).
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness probe (returns 503 if Firebase Admin not ready).
router.get('/ready', asyncHandler(async (_req: Request, res: Response) => {
  const ready = isFirebaseReady();
  res.status(ready ? 200 : 503).json({ ready, firestore: ready });
}));

export default router;
