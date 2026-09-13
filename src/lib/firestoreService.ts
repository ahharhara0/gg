/**
 * Firestore Service Layer
 *
 * NOTE: This module now acts as a thin adapter over the secure backend API.
 * Sensitive write operations (orders, wallet, products) go through `/api/*`
 * endpoints which enforce Firebase Auth, RBAC, idempotency, and server-side
 * pricing. Direct client-side Firestore writes for sensitive data are REMOVED.
 *
 * Function names are PRESERVED so existing components keep working without
 * UI changes. Internal implementation now delegates to the backend.
 */

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  FirestoreError,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Product, CategoryConfig, PaymentMethodConfig, AppUser, Order } from '../types';
import { PRODUCTS, CATEGORIES, APP_USERS } from '../data/initialCatalog';
import { INITIAL_PAYMENT_METHODS } from '../data/paymentMethodsData';

// Firestore collections (kept for read subscriptions — public catalog data).
export const PRODUCTS_COLLECTION = 'products';
export const CATEGORIES_COLLECTION = 'categories';
export const PAYMENT_METHODS_COLLECTION = 'payment_methods';
export const USERS_COLLECTION = 'users';
export const ORDERS_COLLECTION = 'orders';
export const WALLET_TRANSACTIONS_COLLECTION = 'wallet_transactions';

/**
 * Get the current user's Firebase ID Token for authenticated API calls.
 */
async function getAuthToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken(false);
  } catch (err) {
    console.warn('Failed to fetch Firebase ID token', err);
    return null;
  }
}

async function apiCall<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  const res = await fetch(path, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message ?? 'API error') as Error & { code?: string; statusCode?: number };
    err.code = data?.error?.code;
    err.statusCode = res.status;
    throw err;
  }
  return data as T;
}

/**
 * Seed initial catalog data to Firestore — for development / first-time setup only.
 * In production, seeding should be done via a CLI script, NOT via the running app.
 *
 * This function now respects a `VITE_ENABLE_SEED` env flag — when unset in
 * production, it is a no-op.
 */
export async function seedInitialFirestoreData() {
  // Skip seeding in production builds unless explicitly enabled.
  const isProd = import.meta.env?.PROD;
  const enableSeed = import.meta.env?.VITE_ENABLE_SEED === 'true';
  if (isProd && !enableSeed) {
    return;
  }

  try {
    const prodSnap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (prodSnap.empty) {
      for (const p of PRODUCTS) {
        await setDoc(doc(db, PRODUCTS_COLLECTION, p.id), p);
      }
      console.log('Seeded initial products to Firestore');
    }

    const catSnap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    if (catSnap.empty) {
      for (let i = 0; i < CATEGORIES.length; i++) {
        const cat = { ...CATEGORIES[i], order: i, isVisible: true };
        await setDoc(doc(db, CATEGORIES_COLLECTION, cat.id), cat);
      }
      console.log('Seeded initial categories to Firestore');
    }

    const pmSnap = await getDocs(collection(db, PAYMENT_METHODS_COLLECTION));
    if (pmSnap.empty) {
      for (const pm of INITIAL_PAYMENT_METHODS) {
        await setDoc(doc(db, PAYMENT_METHODS_COLLECTION, pm.id), pm);
      }
      console.log('Seeded initial payment methods to Firestore');
    }
    // NOTE: We no longer auto-seed users (APP_USERS) into Firestore `users` collection.
    // Production users MUST register through the Firebase Authentication flow,
    // which creates a real `users/{uid}` document via the secure backend API.
  } catch (err) {
    console.warn('Firestore seed notice:', (err as Error).message);
  }
}

/**
 * Subscribe to Products real-time updates (read-only — safe for public catalog).
 */
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (error: FirestoreError) => void
) {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((d) => items.push(d.data() as Product));
      if (items.length > 0) onUpdate(items);
    },
    (error) => {
      console.warn('Products live listener fallback:', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to Categories real-time updates (read-only).
 */
export function subscribeToCategories(
  onUpdate: (categories: CategoryConfig[]) => void,
  onError?: (error: FirestoreError) => void
) {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: CategoryConfig[] = [];
      snapshot.forEach((d) => items.push(d.data() as CategoryConfig));
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (items.length > 0) onUpdate(items);
    },
    (error) => {
      console.warn('Categories live listener fallback:', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to Payment Methods real-time updates (read-only).
 */
export function subscribeToPaymentMethods(
  onUpdate: (methods: PaymentMethodConfig[]) => void,
  onError?: (error: FirestoreError) => void
) {
  const colRef = collection(db, PAYMENT_METHODS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: PaymentMethodConfig[] = [];
      snapshot.forEach((d) => items.push(d.data() as PaymentMethodConfig));
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      if (items.length > 0) onUpdate(items);
    },
    (error) => {
      console.warn('Payment methods live listener fallback:', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * PRODUCT CRUD — now delegates to backend (admin/merchant only).
 * Server enforces RBAC, so even if a customer's APK calls these, the backend rejects.
 */
export async function dbSaveProduct(product: Product) {
  try {
    await apiCall('/api/products' + (product.id ? `/${product.id}` : ''), {
      method: product.id ? 'PUT' : 'POST',
      body: JSON.stringify(product),
    });
  } catch (err) {
    console.warn('dbSaveProduct (delegated to backend):', err);
    throw err;
  }
}

export async function dbDeleteProduct(productId: string) {
  try {
    await apiCall(`/api/products/${productId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('dbDeleteProduct (delegated to backend):', err);
    throw err;
  }
}

export async function dbSaveCategories(categories: CategoryConfig[]) {
  await apiCall('/api/control/categories', { method:'PUT', body: JSON.stringify({categories}) });
}

export async function dbSavePaymentMethods(methods: PaymentMethodConfig[]) {
  await apiCall('/api/control/payment-methods', { method:'PUT', body: JSON.stringify({methods}) });
}

export async function dbDeletePaymentMethod(methodId: string) {
  await apiCall(`/api/control/payment-methods/${encodeURIComponent(methodId)}`, { method:'DELETE' });
}

/**
 * ORDER CREATION — now delegates to backend.
 * Backend enforces:
 *   - Firebase ID Token verification
 *   - Server-side price calculation (no client prices trusted)
 *   - Coupon validation
 *   - Stock reservation (atomic transaction)
 *   - Idempotency (Idempotency-Key header)
 *   - Audit logging
 */
export async function dbSaveOrder(order: Order) {
  // The order passed in is the CLIENT-SIDE draft. Only `items[].productId` and
  // `items[].quantity` are trusted; everything else is recomputed server-side.
  const body = {
    items: order.items.map((ci) => ({
      productId: ci.product.id,
      quantity: ci.quantity,
    })),
    couponCode: (order as any).couponCode,
    useWallet: (order as any).useWallet ?? false,
    deliveryAddress: order.deliveryAddress,
    deliveryLat: order.deliveryLat,
    deliveryLng: order.deliveryLng,
    deliverySlot: (order as any).deliverySlot,
    paymentMethod: order.paymentMethod,
    branchId: order.pickupBranchId,
    transferReference: (order as any).transferReference,
    notes: order.customerNotes,
    quoteToken: (order as any).quoteToken,
  };

  const idempotencyKey = (order as any).idempotencyKey || `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const token = await getAuthToken();
  const res = await fetch('/api/orders/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message ?? 'فشل إنشاء الطلب') as Error & { code?: string };
    err.code = data?.error?.code;
    throw err;
  }
  return data.order as Order;
}

/**
 * Subscribe to Orders real-time updates (read-only).
 * NOTE: Orders are filtered by user via Firestore rules — customers only see their own.
 */
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  onError?: (error: FirestoreError) => void
) {
  const colRef = collection(db, ORDERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((d) => list.push(d.data() as Order));
      if (list.length > 0) onUpdate(list);
    },
    (error) => {
      console.warn('Orders live listener error:', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * WALLET TRANSACTION RECORDING — now delegates to backend.
 * Clients CANNOT write wallet_transactions directly (rules forbid).
 * Backend records transactions inside Firestore transactions and updates
 * the `wallet_accounts/{uid}` balance atomically.
 */
export async function dbRecordWalletTransaction(tx: {
  id?: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  reason: string;
  orderId?: string;
  balanceAfter: number;
}) {
  // Map old client-side API → new server-side API.
  // The server records the transaction with proper authorization.
  const endpoint = tx.type === 'CREDIT' ? '/api/wallet/credit' : '/api/wallet/debit';
  try {
    const result = await apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        userId: tx.userId,
        type: tx.type,
        amount: tx.amount,
        reason: tx.reason,
        orderId: tx.orderId,
      }),
      headers: { 'Idempotency-Key': tx.id || `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` },
    });
    return result.transaction;
  } catch (err) {
    console.warn('dbRecordWalletTransaction (delegated to backend):', err);
    return null;
  }
}

/**
 * WALLET TOP-UP — opens a pending payment record on the backend.
 * Actual credit happens only when the payment gateway webhook confirms the transfer.
 */
export async function requestWalletTopUp(amount: number, paymentMethodId?: string, transferReference?: string) {
  return apiCall<{ paymentId: string; amount: number; status: string }>('/api/wallet/topup', {
    method: 'POST',
    body: JSON.stringify({ amount, paymentMethodId, transferReference }),
    headers: { 'Idempotency-Key': `topup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` },
  });
}

/**
 * FETCH WALLET BALANCE — server-authoritative.
 */
export async function fetchWalletBalance() {
  return apiCall<{ balance: number; currency: string; transactions: any[] }>('/api/wallet/balance');
}

/**
 * FETCH CURRENT USER PROFILE — server-authoritative.
 */
export async function fetchCurrentUserProfile() {
  return apiCall<{ user: AppUser }>('/api/auth/me');
}

/**
 * UPDATE USER PROFILE — only safe fields (no role/wallet/status).
 */
export async function updateUserProfile(patch: Partial<AppUser>) {
  return apiCall<{ user: AppUser }>('/api/auth/profile', {
    method: 'POST',
    body: JSON.stringify(patch),
  });
}

/**
 * CHECK PHONE — server-side check (replaces local APP_USERS lookup).
 */
export async function checkPhoneInBackend(phone: string) {
  return apiCall<{ exists: boolean; maskedPhone: string; user?: Partial<AppUser> }>('/api/auth/check-phone', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

/**
 * SERVER-SIDE PRICING QUOTE — single source of truth.
 */
export async function fetchServerQuote(items: Array<{ productId: string; quantity: number }>, couponCode?: string, useWallet = false) {
  return apiCall<{ subtotal: number; promoDiscount: number; appliedCoupon: string | null; vat: number; deliveryFee: number; totalBeforeWallet: number; walletDeduction: number; finalPayable: number; currency: string; quoteToken: string; quoteExpiresAt: string }>('/api/checkout/quote', {
    method: 'POST',
    body: JSON.stringify({ items, couponCode, useWallet }),
  });
}

/**
 * VALIDATE COUPON — server-side validation only.
 */
export async function validateCouponServer(couponCode: string, subtotal = 0) {
  try {
    const result = await apiCall<{ valid: boolean; code?: string; type?: string; discountAmount?: number; message?: string }>('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ couponCode, subtotal }),
    });
    return result;
  } catch (err: any) {
    return { valid: false, message: err?.message ?? 'كوبون غير صالح' };
  }
}
