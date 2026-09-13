/**
 * Coupon routes — server-side validation only.
 */

import { Router, Request, Response } from 'express';
import { sensitiveRateLimit } from '../middleware/rateLimit';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidateCouponSchema } from '../validators/schemas.js';
import { validateCoupon } from '../services/coupons.js';

const router = Router();

// Validate coupon code (public — does not reveal existence, but rate-limited).
router.post('/validate', sensitiveRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const parsed = ValidateCouponSchema.parse(req.body);
  const result = await validateCoupon(parsed.couponCode, parsed.subtotal);
  if (!result.valid) {
    res.status(404).json({ valid: false, message: result.message });
    return;
  }
  res.json({
    valid: true,
    code: result.code,
    type: result.type,
    discountAmount: result.discountAmount,
    message: result.message,
  });
}));

export default router;
