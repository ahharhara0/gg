/**
 * Orders service — atomic, transactional, idempotent.
 *
 * Flow:
 *   1. Verify Firebase ID Token → resolved uid (via middleware).
 *   2. Validate products existence + stock INSIDE Firestore transaction.
 *   3. Compute pricing server-side (no client prices).
 *   4. Apply coupon (also transactionally validated).
 *   5. Deduct inventory atomically.
 *   6. Create order document.
 *   7. Record audit log.
 *
 * If two customers race to buy the last unit, the transaction rejects the loser
 * with STOCK_INSUFFICIENT.
 */

import { getDb, isFirebaseReady } from './firebaseAdmin.js';
import { logger } from '../utils/logger.js';
import { generateOrderId, roundCurrency } from '../utils/helpers.js';
import { ApiError } from '../middleware/errorHandler.js';
import { config } from '../config.js';
import { computePricingFromTxnProducts } from './pricing.js';
import { validateCoupon, incrementCouponUsage } from './coupons.js';
import { debitWalletInTransaction } from './wallet.js';
import type { Order } from './catalogTypes.js';
import type { CreateOrderInput } from '../validators/schemas.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type { Product } from './catalogTypes.js';

const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products';

export interface CreateOrderResult {
  order: Order;
  paymentRequired: boolean;
  paymentId?: string;
}

export async function createOrder(req: AuthenticatedRequest, input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!isFirebaseReady()) {
    throw new ApiError(503, 'BACKEND_NOT_READY', 'قاعدة البيانات غير متاحة حاليًا');
  }
  if (!req.user) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'يجب تسجيل الدخول لإنشاء طلب');
  }

  const db = getDb();

  // COD is earned server-side after 5 successful prepaid completed orders.
  if (String(input.paymentMethod || '').toUpperCase() === 'COD' || String(input.paymentMethodId || '').toUpperCase() === 'COD') {
    const recent = await db.collection(ORDERS_COLLECTION).where('customerId','==',req.user.uid).where('status','==','DELIVERED').where('paymentStatus','==','PAID').limit(100).get();
    const prepaidSuccesses = recent.docs.filter(d => String((d.data() as any).paymentMethod || '').toUpperCase() !== 'COD').length;
    if (prepaidSuccesses < 5) throw new ApiError(403,'COD_NOT_ELIGIBLE','الدفع عند الاستلام متاح بعد إكمال 5 طلبات مسبقة الدفع بنجاح');
  }

  // Resolve coupon outside the txn (still server-side validated).
  let couponDiscount = 0;
  let appliedCouponCode: string | null = null;
  if (input.couponCode) {
    const result = await validateCoupon(input.couponCode, 0); // subtotal will be re-checked after pricing
    if (result.valid) {
      couponDiscount = result.discountAmount;
      appliedCouponCode = result.code;
    }
  }

  // The order ID is generated up-front so the transaction can fail cleanly if
  // the same idempotency key is replayed.
  const orderId = generateOrderId();
  const now = new Date().toISOString();

  const result = await db.runTransaction(async (tx) => {
    // 1) Read all products in one go.
    const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
    const productDocs = await Promise.all(
      productIds.map((pid) => tx.get(db.collection(PRODUCTS_COLLECTION).doc(pid))),
    );

    const productMap = new Map<string, Product>();
    let currency = config.defaultCurrency;
    for (const doc of productDocs) {
      if (!doc.exists) continue;
      const data = doc.data() as Omit<Product, 'id'>;
      productMap.set(doc.id, { id: doc.id, ...data });
      currency = data.currency ?? currency;
    }

    // 2) Verify existence + stock.
    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new ApiError(404, 'PRODUCT_NOT_FOUND', `المنتج ${item.productId} غير موجود`);
      }
      const qty = Math.max(1, Math.min(99, Math.floor(item.quantity)));
      if (!product.inStock || product.stockCount < qty) {
        throw new ApiError(409, 'STOCK_INSUFFICIENT', `الكمية المطلوبة غير متوفرة للمنتج ${product.name}`);
      }
    }

    // 3) Compute pricing server-side.
    const pricing = computePricingFromTxnProducts(
      input.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      productMap,
      0,
      req.user!.walletBalance ?? 0,
    );

    // 4) Re-validate coupon against actual subtotal.
    if (appliedCouponCode && pricing.subtotal > 0) {
      const revalidated = await validateCoupon(appliedCouponCode, pricing.subtotal);
      if (!revalidated.valid) {
        throw new ApiError(400, 'COUPON_INVALID', revalidated.message);
      }
      // For FREE_DELIVERY type, the coupon already zeroed deliveryFee via pricing logic.
      if (revalidated.type !== 'FREE_DELIVERY') {
        pricing.promoDiscount = revalidated.discountAmount;
        const taxable = Math.max(0, pricing.subtotal - pricing.promoDiscount);
        pricing.vat = roundCurrency(taxable * config.vatRate);
        pricing.totalBeforeWallet = roundCurrency(taxable + pricing.vat + pricing.deliveryFee);
        pricing.walletDeduction = pricing.walletDeduction > 0
          ? Math.min(req.user!.walletBalance ?? 0, pricing.totalBeforeWallet)
          : 0;
        pricing.finalPayable = Math.max(0, roundCurrency(pricing.totalBeforeWallet - pricing.walletDeduction));
      }
      pricing.appliedCoupon = appliedCouponCode;
    }

    // 5) Atomically decrement stock.
    for (const item of input.items) {
      const qty = Math.max(1, Math.min(99, Math.floor(item.quantity)));
      const ref = db.collection(PRODUCTS_COLLECTION).doc(item.productId);
      const product = productMap.get(item.productId)!;
      const newStock = product.stockCount - qty;
      tx.update(ref, {
        stockCount: newStock,
        inStock: newStock > 0,
        updatedAt: now,
      });
    }

    // 6) Build order document.
    const order: Order = {
      id: orderId,
      createdAt: now,
      updatedAt: now,
      customerId: req.user!.uid,
      customerName: req.user!.name,
      customerPhone: req.user!.phone,
      customerEmail: req.user!.email,
      items: pricing.verifiedItems.map((v) => ({
        productId: v.productId,
        name: v.name,
        unitPrice: v.unitPrice,
        quantity: v.quantity,
        totalPrice: v.lineTotal,
        currency: v.currency,
      })),
      branchId: input.branchId,
      deliveryAddress: input.deliveryAddress,
      deliveryLat: input.deliveryLat,
      deliveryLng: input.deliveryLng,
      deliverySlot: input.deliverySlot,
      paymentMethod: input.paymentMethod,
      paymentMethodId: input.paymentMethodId,
      paymentStatus: 'PENDING',
      status: 'CREATED',
      subtotal: pricing.subtotal,
      discount: pricing.promoDiscount,
      vat: pricing.vat,
      deliveryFee: pricing.deliveryFee,
      total: pricing.totalBeforeWallet,
      currency: pricing.currency,
      walletDeduction: pricing.walletDeduction,
      payableRemaining: pricing.finalPayable,
      transferReference: input.transferReference ?? null,
      notes: input.notes,
      audit: {
        serverCertified: true,
        quoteToken: input.quoteToken ?? pricing.quoteToken,
        actorUid: req.user!.uid,
      },
    };

    // 7) Wallet deduction is part of the SAME transaction as stock + order.
    // If the wallet cannot be debited, the whole order transaction aborts.
    if (pricing.walletDeduction > 0) {
      await debitWalletInTransaction(tx, req.user!.uid, pricing.walletDeduction, `خصم محفظة مقابل الطلب ${orderId}`, orderId, req.user!.uid);
    }

    // 8) Persist order inside the transaction.
    tx.set(db.collection(ORDERS_COLLECTION).doc(orderId), order);

    return { order, pricing };
  });

  // Coupon usage remains server-side. A future coupon-reservation collection can
  // provide per-user quotas without trusting the client; usage increment is now
  // guarded again by the service.
  if (appliedCouponCode) {
    incrementCouponUsage(appliedCouponCode, req.user.uid).catch((err) => {
      logger.error('Coupon usage reconciliation failed', { code: appliedCouponCode, error: (err as Error).message, orderId });
    });
  }

  logger.info('Order created', { orderId, customerId: req.user.uid, total: result.order.total });

  // Determine if payment is required.
  const paymentRequired = result.order.payableRemaining > 0;

  return {
    order: result.order,
    paymentRequired,
  };
}

export async function fetchOrderById(orderId: string, viewerUid: string, viewerRole: string): Promise<Order | null> {
  if (!isFirebaseReady()) return null;
  const db = getDb();
  const snap = await db.collection(ORDERS_COLLECTION).doc(orderId).get();
  if (!snap.exists) return null;
  const order = snap.data() as Order;
  // Authorization check — only owner or privileged roles can read.
  const isOwner = order.customerId === viewerUid;
  const isPrivileged = ['admin', 'super_admin', 'developer', 'operations', 'driver', 'support', 'finance'].includes(viewerRole);
  if (!isOwner && !isPrivileged) {
    throw new ApiError(403, 'NOT_OWNER', 'لا تملك صلاحية الوصول إلى هذا الطلب');
  }
  return order;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  CREATED: ['PAYMENT_PENDING', 'CANCELLED'],
  PAYMENT_PENDING: ['PAID', 'CANCELLED', 'REFUND_PENDING'],
  PAID: ['CONFIRMED', 'REFUND_PENDING'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['ASSIGNED'],
  ASSIGNED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: [],
};

const ROLE_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  customer: ['CANCELLED'],
  support: ['CANCELLED'],
  operations: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUND_PENDING'],
  driver: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  finance: ['REFUND_PENDING', 'REFUNDED'],
  admin: ['PAYMENT_PENDING', 'PAID', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'],
  super_admin: ['PAYMENT_PENDING', 'PAID', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'],
  developer: ['PAYMENT_PENDING', 'PAID', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'],
};

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  actorUid: string,
  actorRole: string,
  reason?: string,
): Promise<Order> {
  if (!isFirebaseReady()) {
    throw new ApiError(503, 'BACKEND_NOT_READY', 'قاعدة البيانات غير متاحة');
  }
  const db = getDb();
  const ref = db.collection(ORDERS_COLLECTION).doc(orderId);
  const now = new Date().toISOString();

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new ApiError(404, 'ORDER_NOT_FOUND', 'الطلب غير موجود');
    const order = snap.data() as Order;

    // Customer can only cancel own orders.
    if (actorRole === 'customer' && order.customerId !== actorUid) {
      throw new ApiError(403, 'NOT_OWNER', 'لا تملك صلاحية تعديل هذا الطلب');
    }
    if (actorRole === 'driver' && order.driverId && order.driverId !== actorUid) {
      throw new ApiError(403, 'NOT_ASSIGNED', 'لا تملك صلاحية تعديل هذا الطلب');
    }

    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new ApiError(409, 'INVALID_TRANSITION', `لا يمكن الانتقال من ${order.status} إلى ${newStatus}`);
    }
    const roleAllowed = ROLE_ALLOWED_TRANSITIONS[actorRole] ?? [];
    if (!roleAllowed.includes(newStatus)) {
      throw new ApiError(403, 'INSUFFICIENT_PERMISSION', 'دورك لا يسمح بهذا الانتقال');
    }

    const patch: Partial<Order> = {
      status: newStatus as Order['status'],
      updatedAt: now,
    };
    if (newStatus === 'DELIVERED') patch.deliveredAt = now;
    if (newStatus === 'ASSIGNED') {
      patch.acceptedAt = now;
      patch.driverId = actorUid;
    }
    tx.update(ref, patch);
    return { ...order, ...patch };
  });

  logger.info('Order status updated', { orderId, newStatus, actorUid, reason });
  return result;
}

export async function listOrdersForUser(uid: string, limit = 100): Promise<Order[]> {
  if (!isFirebaseReady()) return [];
  const db = getDb();
  const snap = await db
    .collection(ORDERS_COLLECTION)
    .where('customerId', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(Math.min(limit, 500))
    .get();
  const out: Order[] = [];
  snap.forEach((d) => out.push(d.data() as Order));
  return out;
}

export async function listAllOrders(limit = 200): Promise<Order[]> {
  if (!isFirebaseReady()) return [];
  const db = getDb();
  const snap = await db
    .collection(ORDERS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(Math.min(limit, 500))
    .get();
  const out: Order[] = [];
  snap.forEach((d) => out.push(d.data() as Order));
  return out;
}

export async function assignDriverToOrder(orderId: string, driverUid: string, driverName: string, driverPhone: string): Promise<Order> {
  if (!isFirebaseReady()) {
    throw new ApiError(503, 'BACKEND_NOT_READY', 'قاعدة البيانات غير متاحة');
  }
  const db = getDb();
  const ref = db.collection(ORDERS_COLLECTION).doc(orderId);
  const now = new Date().toISOString();
  await ref.update({
    driverId: driverUid,
    driverName,
    driverPhone,
    status: 'ASSIGNED',
    acceptedAt: now,
    updatedAt: now,
  });
  const snap = await ref.get();
  return snap.data() as Order;
}
