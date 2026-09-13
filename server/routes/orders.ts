/**
 * Orders routes — atomic creation, idempotent, server-side pricing.
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireOwnershipOrAdmin } from '../middleware/rbac';
import { sensitiveRateLimit, generalRateLimit, perUserRateLimit } from '../middleware/rateLimit';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { CreateOrderSchema, UpdateOrderStatusSchema, CancelOrderSchema } from '../validators/schemas.js';
import { createOrder, fetchOrderById, listOrdersForUser, listAllOrders, updateOrderStatus, assignDriverToOrder } from '../services/orders.js';
import { writeAuditLog } from '../services/audit.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Create order — REQUIRES idempotency key + authentication.
router.post('/create', authenticate, sensitiveRateLimit, perUserRateLimit(20), idempotencyMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = CreateOrderSchema.parse(req.body);
  const result = await createOrder(authReq, parsed);

  await writeAuditLog({
    actorUid: authReq.uid!,
    actorRole: authReq.user!.role,
    action: 'ORDER_CREATED',
    category: 'operations',
    targetId: result.order.id,
    details: { total: result.order.total, itemCount: result.order.items.length, paymentRequired: result.paymentRequired },
    severity: 'info',
    status: 'SUCCESS',
    requestId: authReq.requestId,
  });

  res.status(201).json({
    success: true,
    order: result.order,
    paymentRequired: result.paymentRequired,
    paymentId: result.paymentId,
    message: 'تم إنشاء الطلب بنجاح على الخادم',
  });
}));

// Get order by ID (owner or admin/operations only).
router.get('/:orderId', authenticate, generalRateLimit, requireOwnershipOrAdmin((req) => (req.params.orderId as string)), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const order = await fetchOrderById(req.params.orderId, authReq.uid!, authReq.user!.role);
  if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND', 'الطلب غير موجود');
  res.json({ success: true, order });
}));

// List my orders.
router.get('/', authenticate, generalRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  // Admin/operations see all orders; customers see only their own.
  const role = authReq.user!.role;
  if (['admin', 'super_admin', 'developer', 'operations', 'support', 'finance'].includes(role)) {
    const orders = await listAllOrders(200);
    res.json({ success: true, orders });
  } else {
    const orders = await listOrdersForUser(authReq.uid!, 100);
    res.json({ success: true, orders });
  }
}));

// Update status (operations/admin/driver/finance).
router.post('/update-status', authenticate, sensitiveRateLimit, requirePermission('MANAGE_ORDERS'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = UpdateOrderStatusSchema.parse(req.body);
  const order = await updateOrderStatus(parsed.orderId, parsed.newStatus, authReq.uid!, authReq.user!.role, parsed.reason);

  await writeAuditLog({
    actorUid: authReq.uid!,
    actorRole: authReq.user!.role,
    action: 'ORDER_STATUS_UPDATED',
    category: 'operations',
    targetId: parsed.orderId,
    details: { newStatus: parsed.newStatus, reason: parsed.reason },
    severity: 'info',
    status: 'SUCCESS',
  });

  res.json({ success: true, order });
}));

// Cancel order (customer cancels own, or admin/operations cancels any).
router.post('/cancel', authenticate, sensitiveRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = CancelOrderSchema.parse(req.body);
  const order = await updateOrderStatus(parsed.orderId, 'CANCELLED', authReq.uid!, authReq.user!.role, parsed.reason);

  await writeAuditLog({
    actorUid: authReq.uid!,
    actorRole: authReq.user!.role,
    action: 'ORDER_CANCELLED',
    category: 'operations',
    targetId: parsed.orderId,
    details: { reason: parsed.reason },
    severity: 'warning',
    status: 'SUCCESS',
  });

  res.json({ success: true, order });
}));

// Assign driver (operations/admin).
router.post('/assign-driver', authenticate, sensitiveRateLimit, requirePermission('DISPATCH_ORDERS'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { orderId, driverUid, driverName, driverPhone } = req.body ?? {};
  if (!orderId || !driverUid || !driverName || !driverPhone) {
    throw new ApiError(400, 'INVALID_REQUEST', 'بيانات تعيين السائق غير مكتملة');
  }
  const order = await assignDriverToOrder(orderId, driverUid, driverName, driverPhone);
  res.json({ success: true, order });
}));

export default router;
