/**
 * Coupons service — Firestore-backed (no hardcoded coupon list).
 */

import { getDb, isFirebaseReady } from './firebaseAdmin.js';
import { logger } from '../utils/logger.js';
import { roundCurrency } from '../utils/helpers.js';
import type { CouponDefinition } from './catalogTypes.js';

const COUPONS_COLLECTION = 'coupons';

export async function findCouponByCode(code: string): Promise<CouponDefinition | null> {
  if (!isFirebaseReady()) return null;
  const normalized = code.trim().toUpperCase();
  try {
    const db = getDb();
    const snap = await db.collection(COUPONS_COLLECTION).doc(normalized).get();
    if (!snap.exists) return null;
    return { ...(snap.data() as Omit<CouponDefinition, 'id'>), id: snap.id };
  } catch {
    return null;
  }
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  type?: CouponDefinition['type'];
  discountAmount: number;
  message: string;
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
  const fail = (message: string, type?: CouponDefinition['type']): CouponValidationResult => ({
    valid: false,
    code,
    type,
    discountAmount: 0,
    message,
  });

  const coupon = await findCouponByCode(code);
  if (!coupon) return fail('رمز الكوبون غير موجود أو منتهي الصلاحية');

  if (!coupon.isActive) return fail('هذا الكوبون غير مفعّل حاليًا', coupon.type);

  const now = new Date();
  if (coupon.endDate && new Date(coupon.endDate) < now) {
    return fail('انتهت صلاحية هذا الكوبون', coupon.type);
  }
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return fail('هذا الكوبون لم يبدأ بعد', coupon.type);
  }
  if (coupon.usageLimit && (coupon.usageCount ?? 0) >= coupon.usageLimit) {
    return fail('تم استخدام هذا الكوبون بالكامل', coupon.type);
  }
  if (subtotal < coupon.minOrder) {
    return fail(`الحد الأدنى لتفعيل هذا الكوبون هو ${coupon.minOrder} ر.ي`, coupon.type);
  }

  let discount = 0;
  if (coupon.type === 'PERCENTAGE') {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else if (coupon.type === 'FIXED') {
    discount = Math.min(coupon.value, subtotal);
  } else if (coupon.type === 'FREE_DELIVERY') {
    discount = 15; // delivery fee waived (matches server-side deliveryFee constant)
  }

  return {
    valid: true,
    code: coupon.code,
    type: coupon.type,
    discountAmount: roundCurrency(discount),
    message: 'تم تفعيل كود الخصم بنجاح',
  };
}

/** Record one usage against a coupon (called atomically inside order creation transaction). */
export async function incrementCouponUsage(code: string, userId: string): Promise<void> {
  if (!isFirebaseReady()) return;
  const normalized = code.trim().toUpperCase();
  const db = getDb();
  const ref = db.collection(COUPONS_COLLECTION).doc(normalized);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const data = snap.data() as CouponDefinition;
    tx.update(ref, {
      usageCount: (data.usageCount ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    });
  });
  logger.info('Coupon usage incremented', { code: normalized, userId });
}
