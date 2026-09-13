/**
 * Payment routes.
 *
 *   POST /api/payments/create          — Create a pending payment for an order.
 *   POST /api/payments/webhook         — Receive gateway webhook (signature verified).
 *   POST /api/payments/refund          — Admin/finance: refund a paid order.
 *   GET  /api/payments/:paymentId      — Get payment record.
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { sensitiveRateLimit, generalRateLimit } from '../middleware/rateLimit';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { CreatePaymentSchema, WebhookEventSchema } from '../validators/schemas.js';
import { createPaymentRecord, fetchPaymentRecord, verifyWebhookSignature, processWebhookEvent, refundPayment } from '../services/payments.js';
import { fetchOrderById } from '../services/orders.js';
import { writeAuditLog } from '../services/audit.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { generateSecureId } from '../utils/helpers.js';
import type { AuthenticatedRequest } from '../types/index.js';
import crypto from 'crypto';

const router = Router();

// Create pending payment.
router.post('/create', authenticate, sensitiveRateLimit, idempotencyMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = CreatePaymentSchema.parse(req.body);

  // Verify the caller owns the order.
  const order = await fetchOrderById(parsed.orderId, authReq.uid!, authReq.user!.role);
  if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND', 'الطلب غير موجود');
  if (order.customerId !== authReq.uid && authReq.user!.role === 'customer') {
    throw new ApiError(403, 'NOT_OWNER', 'لا تملك صلاحية الدفع لهذا الطلب');
  }
  if (order.paymentStatus === 'PAID') {
    throw new ApiError(400, 'ALREADY_PAID', 'تم دفع هذا الطلب مسبقًا');
  }

  const payment = await createPaymentRecord({
    orderId: order.id,
    userId: order.customerId,
    amount: order.payableRemaining,
    currency: order.currency,
    gateway: config.payments.gateway,
    paymentMethodId: parsed.paymentMethodId,
    metadata: { paymentMethod: parsed.paymentMethod },
  });

  res.status(201).json({
    success: true,
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    gateway: payment.gateway,
    message: 'تم إنشاء سجل دفع بانتظار التأكيد',
  });
}));

// Webhook receiver — verifies signature + idempotent.
// IMPORTANT: needs raw body — configured via `express.json({ verify })` in index.ts.
router.post('/webhook', generalRateLimit, idempotencyMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const rawBody = (req as any).rawBody ?? JSON.stringify(req.body ?? {});
  const signature = (req.headers['x-payment-signature'] as string | undefined)
    ?? (req.headers['x-webhook-signature'] as string | undefined);
  const timestamp = (req.headers['x-payment-timestamp'] as string | undefined);

  if (!verifyWebhookSignature({ rawBody: typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody), signature, timestamp })) {
    logger.warn('Webhook signature verification failed');
    res.status(401).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'توقيع Webhook غير صالح' } });
    return;
  }

  const parsed = WebhookEventSchema.parse(req.body);
  const eventId = (req.headers['x-webhook-event-id'] as string) ?? generateSecureId('wh');

  const result = await processWebhookEvent({
    paymentId: parsed.paymentId,
    orderId: parsed.orderId,
    amount: parsed.amount,
    currency: parsed.currency,
    status: parsed.status,
    reference: parsed.reference,
    gateway: parsed.event,
    eventId,
    raw: parsed,
  });

  res.status(200).json({ success: true, replayed: result.replayed, result: result.result });
}));

// Get payment record.
router.get('/:paymentId', authenticate, generalRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const payment = await fetchPaymentRecord(req.params.paymentId);
  if (!payment) throw new ApiError(404, 'PAYMENT_NOT_FOUND', 'سجل الدفع غير موجود');
  if (payment.userId !== authReq.uid && !['admin', 'super_admin', 'developer', 'finance'].includes(authReq.user!.role)) {
    throw new ApiError(403, 'NOT_OWNER', 'لا تملك صلاحية الوصول إلى هذا السجل');
  }
  res.json({ success: true, payment });
}));

// Refund — admin/finance only.
router.post('/refund', authenticate, sensitiveRateLimit, idempotencyMiddleware, requirePermission('PROCESS_REFUNDS'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { orderId, reason } = req.body ?? {};
  if (!orderId || !reason) throw new ApiError(400, 'INVALID_REQUEST', 'الطلب وسبب الاسترجاع مطلوبان');
  await refundPayment(orderId, reason, authReq.uid!);

  await writeAuditLog({
    actorUid: authReq.uid!,
    actorRole: authReq.user!.role,
    action: 'PAYMENT_REFUNDED',
    category: 'finance',
    targetId: orderId,
    details: { reason },
    severity: 'critical',
    status: 'SUCCESS',
  });

  res.json({ success: true });
}));

export default router;
