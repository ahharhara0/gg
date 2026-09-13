/**
 * Wallet routes — server-side ledger, append-only.
 *
 * Clients CANNOT:
 *  - Set walletBalance directly
 *  - Create wallet_transactions directly
 *  - Modify existing transactions
 *
 * All operations go through these routes, which use Firebase Admin to update
 * the `wallet_accounts/{uid}` balance AND append an immutable ledger entry
 * inside a Firestore transaction.
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireOwnershipOrAdmin } from '../middleware/rbac';
import { sensitiveRateLimit, generalRateLimit, perUserRateLimit } from '../middleware/rateLimit';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { WalletTransactSchema, WalletTopUpSchema } from '../validators/schemas.js';
import { getWalletBalance, recordWalletCredit, recordWalletDebit, listWalletTransactions } from '../services/wallet.js';
import { writeAuditLog } from '../services/audit.js';
import { createPaymentRecord } from '../services/payments.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Get my wallet balance + recent transactions.
router.get('/balance', authenticate, generalRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const balance = await getWalletBalance(authReq.uid!);
  const transactions = await listWalletTransactions(authReq.uid!, 20);
  res.json({ success: true, balance, currency: 'YER', transactions });
}));

// Get full transaction history (paginated).
router.get('/transactions', authenticate, generalRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const transactions = await listWalletTransactions(authReq.uid!, limit);
  res.json({ success: true, transactions });
}));

// Top up wallet (requires external payment — creates a PaymentRecord).
router.post('/topup', authenticate, sensitiveRateLimit, perUserRateLimit(10), idempotencyMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = WalletTopUpSchema.parse(req.body);

  // Create a pending payment record.
  const payment = await createPaymentRecord({
    orderId: `wallet_topup_${authReq.uid}_${Date.now()}`,
    userId: authReq.uid!,
    amount: parsed.amount,
    currency: 'YER',
    gateway: 'manual',
    paymentMethodId: parsed.paymentMethodId,
    metadata: { type: 'wallet_topup', transferReference: parsed.transferReference },
  });

  res.status(201).json({
    success: true,
    paymentId: payment.id,
    amount: parsed.amount,
    currency: 'YER',
    status: 'PENDING',
    message: 'بانتظار تأكيد التحويل المالي',
  });
}));

// Admin/finance: credit a wallet (after verifying real payment received).
router.post('/credit', authenticate, sensitiveRateLimit, idempotencyMiddleware, requirePermission('MANAGE_PAYMENTS'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = WalletTransactSchema.parse(req.body);
  // The target user must come from the request body — but the actor must be admin/finance.
  const targetUid = (req.body?.userId as string) || authReq.uid!;
  if (!targetUid) throw new ApiError(400, 'INVALID_REQUEST', 'معرّف المستخدم مطلوب');

  const tx = await recordWalletCredit(
    targetUid,
    parsed.amount,
    parsed.reason,
    parsed.orderId,
    undefined,
    authReq.uid!,
  );

  await writeAuditLog({
    actorUid: authReq.uid!,
    actorRole: authReq.user!.role,
    action: 'WALLET_CREDITED',
    category: 'finance',
    targetId: targetUid,
    details: { amount: parsed.amount, reason: parsed.reason, txId: tx.id },
    severity: 'warning',
    status: 'SUCCESS',
  });

  res.json({ success: true, transaction: tx, newBalance: tx.balanceAfter });
}));

// Admin/finance: debit a wallet.
router.post('/debit', authenticate, sensitiveRateLimit, idempotencyMiddleware, requirePermission('MANAGE_PAYMENTS'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = WalletTransactSchema.parse(req.body);
  const targetUid = (req.body?.userId as string) || authReq.uid!;
  if (!targetUid) throw new ApiError(400, 'INVALID_REQUEST', 'معرّف المستخدم مطلوب');

  const tx = await recordWalletDebit(
    targetUid,
    parsed.amount,
    parsed.reason,
    parsed.orderId,
    authReq.uid!,
  );

  await writeAuditLog({
    actorUid: authReq.uid!,
    actorRole: authReq.user!.role,
    action: 'WALLET_DEBITED',
    category: 'finance',
    targetId: targetUid,
    details: { amount: parsed.amount, reason: parsed.reason, txId: tx.id },
    severity: 'warning',
    status: 'SUCCESS',
  });

  res.json({ success: true, transaction: tx, newBalance: tx.balanceAfter });
}));

export default router;
