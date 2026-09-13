/**
 * Catalog routes — products & categories.
 *
 * Reads are public (catalog browsing).
 * Writes require MANAGE_CATALOG permission (admin) OR merchant-ownership.
 */

import { Router, Request, Response } from 'express';
import { authenticate, rejectClientControlledFields } from '../middleware/auth';
import { requirePermission, requireAnyRole } from '../middleware/rbac';
import { sensitiveRateLimit, generalRateLimit } from '../middleware/rateLimit';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { UpsertProductSchema } from '../validators/schemas.js';
import { fetchProductById, listProducts, createProduct, updateProduct, deleteProduct } from '../services/catalog.js';
import { writeAuditLog } from '../services/audit.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Public: list products.
router.get('/', generalRateLimit, asyncHandler(async (_req: Request, res: Response) => {
  const products = await listProducts({ limit: 500 });
  res.json({ success: true, products });
}));

// Public: get single product.
router.get('/:productId', generalRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const product = await fetchProductById(req.params.productId);
  if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'المنتج غير موجود');
  res.json({ success: true, product });
}));

// Admin/merchant: create product.
router.post('/', authenticate, sensitiveRateLimit, rejectClientControlledFields, requireAnyRole('admin', 'super_admin', 'developer', 'merchant'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = UpsertProductSchema.parse(req.body);
  const merchantUid = authReq.user!.role === 'merchant' ? authReq.uid : undefined;
  const product = await createProduct(parsed, merchantUid);
  await writeAuditLog({
    actorUid: authReq.uid!,
    actorRole: authReq.user!.role,
    action: 'PRODUCT_CREATED',
    category: 'catalog',
    targetId: product.id,
    details: { name: product.name, price: product.price },
    severity: 'info',
    status: 'SUCCESS',
  });
  res.status(201).json({ success: true, product });
}));

// Admin/merchant: update product.
router.put('/:productId', authenticate, sensitiveRateLimit, requireAnyRole('admin', 'super_admin', 'developer', 'merchant'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = UpsertProductSchema.partial().parse(req.body ?? {});
  delete parsed.id; // Cannot change product ID.
  await updateProduct(req.params.productId, parsed, authReq.uid!);
  await writeAuditLog({
    actorUid: authReq.uid!,
    actorRole: authReq.user!.role,
    action: 'PRODUCT_UPDATED',
    category: 'catalog',
    targetId: req.params.productId,
    details: parsed,
    severity: 'info',
    status: 'SUCCESS',
  });
  res.json({ success: true });
}));

// Admin/merchant: delete product.
router.delete('/:productId', authenticate, sensitiveRateLimit, requireAnyRole('admin', 'super_admin', 'developer', 'merchant'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await deleteProduct(req.params.productId, authReq.uid!);
  await writeAuditLog({
    actorUid: authReq.uid!,
    actorRole: authReq.user!.role,
    action: 'PRODUCT_DELETED',
    category: 'catalog',
    targetId: req.params.productId,
    severity: 'warning',
    status: 'SUCCESS',
  });
  res.json({ success: true });
}));

export default router;
