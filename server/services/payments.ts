/**
 * Payment service — server-side payment lifecycle.
 *
 * Clients can NEVER mark an order as PAID themselves.
 * Only verified payment gateway webhooks can update `paymentStatus`.
 */

import { getDb, isFirebaseReady } from './firebaseAdmin.js';
import { logger } from '../utils/logger.js';
import { generateSecureId } from '../utils/helpers.js';
import { ApiError } from '../middleware/errorHandler.js';
import { config } from '../config.js';
import { recordWalletCredit } from './wallet.js';
import { updateOrderStatus } from './orders.js';
import type { PaymentRecord } from './catalogTypes.js';
import type { Order } from './catalogTypes.js';

const PAYMENTS_COLLECTION = 'payments';
const WEBHOOK_EVENTS_COLLECTION = 'payment_webhook_events';

export async function createPaymentRecord(input: {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  gateway: string;
  paymentMethodId?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaymentRecord> {
  if (!isFirebaseReady()) {
    throw new ApiError(503, 'BACKEND_NOT_READY', 'قاعدة البيانات غير متاحة');
  }
  const db = getDb();
  const id = generateSecureId('pay');
  const record: PaymentRecord = {
    id,
    orderId: input.orderId,
    userId: input.userId,
    amount: input.amount,
    currency: input.currency,
    status: 'PENDING',
    gateway: input.gateway,
    paymentMethodId: input.paymentMethodId,
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  };
  await db.collection(PAYMENTS_COLLECTION).doc(id).set(record);
  logger.info('Payment record created', { paymentId: id, orderId: input.orderId });
  return record;
}

export async function fetchPaymentRecord(id: string): Promise<PaymentRecord | null> {
  if (!isFirebaseReady()) return null;
  const db = getDb();
  const snap = await db.collection(PAYMENTS_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as PaymentRecord;
}

export interface WebhookContext {
  rawBody: string;
  signature: string | undefined;
  timestamp: string | undefined;
}

/**
 * Verify webhook signature.
 *
 * For demonstration we use an HMAC-SHA256 of the raw body using `PAYMENT_WEBHOOK_SECRET`.
 * Real gateways (Stripe, Floosak, etc.) have their own signature schemes — wire them in
 * `verifyGatewaySignature()` when integrating a specific provider.
 */
export function verifyWebhookSignature(ctx: WebhookContext): boolean {
  if (!config.payments.webhookSecret) {
    logger.warn('Webhook secret not configured — rejecting all webhooks');
    return false;
  }
  if (!ctx.signature) return false;

  // Replay protection — reject events older than tolerance window.
  if (ctx.timestamp) {
    const ts = Number(ctx.timestamp);
    if (Number.isFinite(ts)) {
      const ageSeconds = Math.abs(Date.now() / 1000 - ts);
      if (ageSeconds > config.payments.webhookToleranceSeconds) {
        logger.warn('Webhook rejected — timestamp out of tolerance', { age: ageSeconds });
        return false;
      }
    }
  }

  // HMAC verification.
  // Expected format: `t=<unix_ts>,v1=<hex_hmac>`
  try {
    const crypto = require('crypto') as typeof import('crypto');
    const expected = crypto
      .createHmac('sha256', config.payments.webhookSecret)
      .update(ctx.rawBody)
      .digest('hex');
    const received = ctx.signature.startsWith('sha256=') ? ctx.signature.slice(7) : ctx.signature;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: (err as Error).message });
    return false;
  }
}

/**
 * Idempotent webhook processor.
 * Each webhook event is recorded by its event ID — replays return the original result.
 */
export async function processWebhookEvent(event: {
  paymentId?: string; orderId?: string; amount?: number; currency?: string; status?: string; reference?: string; gateway?: string; eventId: string; raw: unknown;
}): Promise<{ replayed: boolean; result?: { orderId: string; status: string } }> {
  if (!isFirebaseReady()) throw new ApiError(503, 'BACKEND_NOT_READY', 'قاعدة البيانات غير متاحة');
  const db=getDb(); const eventRef=db.collection(WEBHOOK_EVENTS_COLLECTION).doc(event.eventId);
  const result=await db.runTransaction(async tx=>{
    const existing=await tx.get(eventRef);
    if(existing.exists) return {replayed:true,result:existing.data()?.result};
    if(!event.orderId) throw new ApiError(400,'WEBHOOK_INVALID','orderId مطلوب');
    const orderRef=db.collection('orders').doc(event.orderId);
    const orderSnap=await tx.get(orderRef);
    if(!orderSnap.exists) throw new ApiError(404,'ORDER_NOT_FOUND','الطلب المرتبط بالدفع غير موجود');
    const order=orderSnap.data() as Order;
    if(typeof event.amount!=='number' || event.amount!==order.payableRemaining) throw new ApiError(400,'PAYMENT_AMOUNT_MISMATCH','مبلغ الدفع لا يطابق المبلغ المستحق');
    if(event.currency!==order.currency) throw new ApiError(400,'PAYMENT_CURRENCY_MISMATCH','عملة الدفع لا تطابق عملة الطلب');
    const normalized=String(event.status||'').toUpperCase();
    const success=normalized==='SUCCEEDED'||normalized==='SUCCESS'||normalized==='PAID';
    const failed=normalized==='FAILED'||normalized==='FAILURE';
    if(!success && !failed) throw new ApiError(400,'WEBHOOK_STATUS_UNSUPPORTED','حالة الدفع غير مدعومة');
    if(event.paymentId){
      const paymentRef=db.collection(PAYMENTS_COLLECTION).doc(event.paymentId); const paySnap=await tx.get(paymentRef);
      if(paySnap.exists) tx.update(paymentRef,{status:success?'SUCCEEDED':'FAILED',gatewayReference:event.reference??null,verifiedAt:new Date().toISOString(),webhookReceivedAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
    }
    const finalStatus=success?'PAID':'FAILED';
    tx.update(orderRef,{paymentStatus:finalStatus,paymentReference:event.reference??event.paymentId??null, ...(success?{status:order.status==='CREATED'?'PAID':order.status}:{}),updatedAt:new Date().toISOString()});
    const output={orderId:order.id,status:finalStatus};
    tx.create(eventRef,{eventId:event.eventId,paymentId:event.paymentId??null,orderId:event.orderId,status:event.status,amount:event.amount,currency:event.currency,raw:event.raw,receivedAt:new Date().toISOString(),result:output});
    return {replayed:false,result:output};
  });
  return result as any;
}

export async function refundPayment(orderId: string, reason: string, actorUid: string): Promise<void> {
  if(!isFirebaseReady()) throw new ApiError(503,'BACKEND_NOT_READY','قاعدة البيانات غير متاحة');
  const db=getDb(); const orderRef=db.collection('orders').doc(orderId); const snap=await orderRef.get();
  if(!snap.exists) throw new ApiError(404,'ORDER_NOT_FOUND','الطلب غير موجود');
  const order=snap.data() as Order;
  if(order.paymentStatus!=='PAID') throw new ApiError(400,'NOT_PAID','لا يمكن استرجاع المبلغ لطلب غير مدفوع');
  if(order.status==='REFUNDED'||order.status==='REFUND_PENDING') throw new ApiError(409,'REFUND_ALREADY_REQUESTED','تم طلب الاسترجاع مسبقًا');
  // Wallet-funded portion can be returned immediately through the immutable ledger.
  if(order.walletDeduction && order.walletDeduction>0){
    await recordWalletCredit(order.customerId,order.walletDeduction,`استرجاع محفظة مقابل الطلب ${orderId} - ${reason}`,orderId,undefined,actorUid);
  }
  // Bank/manual portion remains pending until an authorized operator confirms the real-world refund.
  await orderRef.update({paymentStatus:'PENDING_REFUND',status:'REFUND_PENDING',refundRequestedAt:new Date().toISOString(),refundReason:reason,refundRequestedBy:actorUid,updatedAt:new Date().toISOString()});
  logger.info('Refund request created',{orderId,reason,actorUid});
}

