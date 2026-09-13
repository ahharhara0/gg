/**
 * Misc routes: complaints, audit logs, system config, user listing.
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireAnyRole } from '../middleware/rbac';
import { sensitiveRateLimit, generalRateLimit } from '../middleware/rateLimit';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { CreateComplaintSchema, ResolveComplaintSchema } from '../validators/schemas.js';
import { writeAuditLog, listAuditLogs } from '../services/audit.js';
import { getDb, isFirebaseReady } from '../services/firebaseAdmin.js';
import { listUsers } from '../services/users.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// ----- Complaints -----
router.post('/complaints', authenticate, sensitiveRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = CreateComplaintSchema.parse(req.body);
  if (!isFirebaseReady()) throw new ApiError(503, 'BACKEND_NOT_READY', 'قاعدة البيانات غير متاحة');
  const db = getDb();
  const id = `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const complaint = {
    id,
    customerUid: authReq.uid,
    customerName: parsed.customerName ?? authReq.user!.name,
    customerPhone: parsed.customerPhone ?? authReq.user!.phone,
    orderId: parsed.orderId ?? null,
    category: parsed.category ?? null,
    subject: parsed.subject ?? null,
    description: parsed.description,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  await db.collection('complaints').doc(id).set(complaint);
  res.status(201).json({ success: true, complaint });
}));

router.get('/complaints', authenticate, generalRateLimit, requireAnyRole('support', 'admin', 'super_admin', 'developer'), asyncHandler(async (_req: Request, res: Response) => {
  if (!isFirebaseReady()) throw new ApiError(503, 'BACKEND_NOT_READY', 'قاعدة البيانات غير متاحة');
  const db = getDb();
  const snap = await db.collection('complaints').orderBy('createdAt', 'desc').limit(200).get();
  const complaints: any[] = [];
  snap.forEach((d) => complaints.push(d.data()));
  res.json({ success: true, complaints });
}));

router.post('/complaints/resolve', authenticate, sensitiveRateLimit, requirePermission('HANDLE_COMPLAINTS'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = ResolveComplaintSchema.parse(req.body);
  if (!isFirebaseReady()) throw new ApiError(503, 'BACKEND_NOT_READY', 'قاعدة البيانات غير متاحة');
  const db = getDb();
  await db.collection('complaints').doc(parsed.complaintId).update({
    status: parsed.status,
    adminReply: parsed.reply,
    adminResponse: parsed.reply,
    updatedAt: new Date().toISOString(),
  });
  await writeAuditLog({
    actorUid: authReq.uid!,
    actorRole: authReq.user!.role,
    action: 'COMPLAINT_RESOLVED',
    category: 'operations',
    targetId: parsed.complaintId,
    details: { status: parsed.status },
    severity: 'info',
    status: 'SUCCESS',
  });
  res.json({ success: true });
}));

// ----- Audit logs (developer/super_admin only) -----
router.get('/audit-logs', authenticate, generalRateLimit, requirePermission('VIEW_AUDIT_LOGS'), asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const actorUid = req.query.actorUid as string | undefined;
  const category = req.query.category as string | undefined;
  const severity = req.query.severity as string | undefined;
  const logs = await listAuditLogs({ actorUid, category, severity, limit });
  res.json({ success: true, logs });
}));

// ----- Users list (admin/operations/support) -----
router.get('/users', authenticate, generalRateLimit, requireAnyRole('admin', 'super_admin', 'developer', 'operations', 'support', 'finance'), asyncHandler(async (req: Request, res: Response) => {
  const roleFilter = req.query.role as any;
  const users = await listUsers(200, roleFilter);
  // Strip sensitive fields.
  const safe = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    walletBalance: u.walletBalance ?? 0,
    createdAt: u.createdAt,
  }));
  res.json({ success: true, users: safe });
}));

export default router;
