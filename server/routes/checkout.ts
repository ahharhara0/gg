/**
 * Checkout / Pricing routes.
 *
 * POST /api/checkout/quote — Server-side valuation. Client sends ONLY productIds + quantities.
 * The server reads prices from Firestore and computes subtotal/vat/discount/total.
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimit';
import { asyncHandler } from '../middleware/errorHandler.js';
import { CheckoutQuoteSchema } from '../validators/schemas.js';
import { computePricing } from '../services/pricing.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Quote (authenticated — needs wallet balance).
router.post('/quote', authenticate, generalRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = CheckoutQuoteSchema.parse(req.body);
  const walletBalance = authReq.user?.walletBalance ?? 0;
  const breakdown = await computePricing(parsed, walletBalance);
  res.json({ success: true, ...breakdown });
}));

// Public quote (no wallet) — for catalog browsing before login.
router.post('/quote/public', generalRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const parsed = CheckoutQuoteSchema.parse(req.body);
  const breakdown = await computePricing(parsed, 0);
  // Strip wallet-specific fields.
  res.json({
    success: true,
    verifiedItems: breakdown.verifiedItems,
    subtotal: breakdown.subtotal,
    promoDiscount: breakdown.promoDiscount,
    appliedCoupon: breakdown.appliedCoupon,
    vat: breakdown.vat,
    deliveryFee: breakdown.deliveryFee,
    totalBeforeWallet: breakdown.totalBeforeWallet,
    currency: breakdown.currency,
    calculatedAt: breakdown.calculatedAt,
    quoteToken: breakdown.quoteToken,
    quoteExpiresAt: breakdown.quoteExpiresAt,
  });
}));

export default router;
