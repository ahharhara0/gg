/**
 * Pricing service — server-side valuation, single source of truth.
 * Reads prices from Firestore `products/{id}` only. NEVER trusts client-supplied prices.
 */

import { fetchProductsByIds } from './catalog.js';
import { validateCoupon } from './coupons.js';
import { config } from '../config.js';
import { roundCurrency, generateQuoteToken } from '../utils/helpers.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { VerifiedOrderItem, PricingBreakdown } from '../types/index.js';
import type { CheckoutQuoteInput } from '../validators/schemas.js';
import type { Product } from './catalogTypes.js';

export interface PricingInput extends CheckoutQuoteInput {}

export async function computePricing(input: PricingInput, walletBalance: number = 0): Promise<PricingBreakdown> {
  if (!input.items || input.items.length === 0) {
    throw new ApiError(400, 'EMPTY_CART', 'لا يمكن حساب تسعيرة لسلة فارغة');
  }

  // Deduplicate product IDs.
  const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
  const productMap = await fetchProductsByIds(productIds);

  const verifiedItems: VerifiedOrderItem[] = [];
  let subtotal = 0;
  let currency = config.defaultCurrency;

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', `المنتج ${item.productId} غير موجود`);
    }
    // Honor per-item currency from product (all products in same order must share currency).
    currency = product.currency ?? config.defaultCurrency;

    const qty = Math.max(1, Math.min(99, Math.floor(item.quantity)));
    const unitPrice = product.price; // SERVER-SIDE PRICE ONLY
    const lineTotal = roundCurrency(unitPrice * qty);
    subtotal += lineTotal;

    verifiedItems.push({
      productId: product.id,
      name: product.name,
      unitPrice,
      quantity: qty,
      lineTotal,
      inStock: product.inStock && product.stockCount >= qty,
      currency,
    });
  }

  subtotal = roundCurrency(subtotal);

  // Coupon validation — server-side.
  let promoDiscount = 0;
  let appliedCoupon: string | null = null;
  if (input.couponCode) {
    const result = await validateCoupon(input.couponCode, subtotal);
    if (result.valid) {
      promoDiscount = result.discountAmount;
      appliedCoupon = result.code;
    }
  }

  const taxable = Math.max(0, subtotal - promoDiscount);
  const vat = roundCurrency(taxable * config.vatRate);

  // Delivery fee — free if subtotal >= threshold OR free-delivery coupon applied.
  const deliveryFee = subtotal >= config.freeDeliveryThreshold || appliedCoupon === 'FREEDELIVERY' ? 0 : config.deliveryFee;

  const totalBeforeWallet = roundCurrency(taxable + vat + deliveryFee);

  // Wallet deduction — server-side walletBalance is REQUIRED (passed by authenticated caller).
  let walletDeduction = 0;
  if (input.useWallet && walletBalance > 0) {
    walletDeduction = Math.min(walletBalance, totalBeforeWallet);
  }

  const finalPayable = Math.max(0, roundCurrency(totalBeforeWallet - walletDeduction));

  const now = Date.now();
  const quoteToken = generateQuoteToken();
  const expiresAt = new Date(now + 15 * 60 * 1000).toISOString(); // 15-minute TTL

  return {
    verifiedItems,
    subtotal,
    promoDiscount,
    appliedCoupon,
    vat,
    deliveryFee,
    totalBeforeWallet,
    walletDeduction,
    finalPayable,
    currency,
    calculatedAt: new Date(now).toISOString(),
    quoteToken,
    quoteExpiresAt: expiresAt,
  };
}

/** Compute pricing inside a Firestore transaction (used by create-order flow).
 * Reads products inside the txn so stock is reserved atomically. */
export function computePricingFromTxnProducts(
  items: Array<{ productId: string; quantity: number }>,
  products: Map<string, Product>,
  couponDiscount: number,
  walletBalance: number,
): PricingBreakdown {
  const verifiedItems: VerifiedOrderItem[] = [];
  let subtotal = 0;
  let currency = config.defaultCurrency;

  for (const item of items) {
    const product = products.get(item.productId);
    if (!product) {
      throw new ApiError(404, 'PRODUCT_NOT_FOUND', `المنتج ${item.productId} غير موجود`);
    }
    currency = product.currency ?? config.defaultCurrency;
    const qty = Math.max(1, Math.min(99, Math.floor(item.quantity)));
    const unitPrice = product.price;
    const lineTotal = roundCurrency(unitPrice * qty);
    subtotal += lineTotal;
    verifiedItems.push({
      productId: product.id,
      name: product.name,
      unitPrice,
      quantity: qty,
      lineTotal,
      inStock: product.inStock && product.stockCount >= qty,
      currency,
    });
  }
  subtotal = roundCurrency(subtotal);
  const promoDiscount = roundCurrency(couponDiscount);
  const taxable = Math.max(0, subtotal - promoDiscount);
  const vat = roundCurrency(taxable * config.vatRate);
  const deliveryFee = subtotal >= config.freeDeliveryThreshold ? 0 : config.deliveryFee;
  const totalBeforeWallet = roundCurrency(taxable + vat + deliveryFee);
  const walletDeduction = walletBalance > 0 ? Math.min(walletBalance, totalBeforeWallet) : 0;
  const finalPayable = Math.max(0, roundCurrency(totalBeforeWallet - walletDeduction));

  const quoteToken = generateQuoteToken();
  return {
    verifiedItems,
    subtotal,
    promoDiscount,
    appliedCoupon: null,
    vat,
    deliveryFee,
    totalBeforeWallet,
    walletDeduction,
    finalPayable,
    currency,
    calculatedAt: new Date().toISOString(),
    quoteToken,
    quoteExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}
