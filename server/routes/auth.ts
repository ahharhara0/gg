/**
 * Auth routes.
 *
 * Endpoints:
 *   POST /api/auth/check-phone        — Check if phone number is registered (rate-limited).
 *   POST /api/auth/register-user      — Register new user (requires Firebase ID Token).
 *   POST /api/auth/update-role        — Admin: change user role (with escalation prevention).
 *   POST /api/auth/update-status      — Admin: suspend/activate user.
 *   GET  /api/auth/me                 — Get current authenticated user profile.
 *   POST /api/auth/profile            — Update own profile (no role/wallet/status).
 */

import { Router, Request, Response } from 'express';
import { authenticate, rejectClientControlledFields } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { authRateLimit, sensitiveRateLimit } from '../middleware/rateLimit';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { CheckPhoneSchema, RegisterUserSchema, UpdateUserRoleSchema } from '../validators/schemas.js';
import { findUserByPhone, registerUserAccount, changeUserRole, setUserStatus, fetchUserById, updateUserProfile } from '../services/users.js';
import { writeAuditLog } from '../services/audit.js';
import { maskPhone, getClientIp, hashString } from '../utils/helpers.js';
import { isFirebaseReady } from '../services/firebaseAdmin.js';
import { createStaffSession, getStaffCodeRole, getStaffCookie, revokeStaffSession, clearStaffCookie } from '../services/staffAuth.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// 1) Check phone (rate-limited heavily — abuse vector).
router.post('/check-phone', authRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const parsed = CheckPhoneSchema.parse(req.body);
  const user = await findUserByPhone(parsed.phone);
  res.json({
    exists: !!user,
    maskedPhone: maskPhone(parsed.phone),
    user: user
      ? {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          status: user.status,
          email: user.email,
          walletBalance: user.walletBalance ?? 0,
        }
      : undefined,
  });
}));


// Staff code login — the code is verified only on the server and is never persisted.
router.post('/staff-code', authRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (!/^\d{9}$/.test(code)) {
    throw new ApiError(401, 'INVALID_STAFF_CREDENTIALS', 'بيانات الدخول غير صحيحة.');
  }
  if (!isFirebaseReady()) {
    throw new ApiError(503, 'BACKEND_NOT_READY', 'خدمة المصادقة غير متاحة حاليًا.');
  }
  const role = getStaffCodeRole(code);
  if (!role) {
    await writeAuditLog({
      actorUid: 'anonymous',
      actorRole: 'customer',
      action: 'STAFF_LOGIN_FAILED',
      category: 'auth',
      severity: 'critical',
      status: 'FAILED',
      requestId: (req as any).requestId,
      details: { ipHash: hashString(`${process.env.STAFF_AUDIT_SALT ?? 'hadramout-hyper-audit'}:${getClientIp(req as any)}`) },
      userAgent: String(req.headers['user-agent'] ?? '').slice(0, 300),
    });
    throw new ApiError(401, 'INVALID_STAFF_CREDENTIALS', 'بيانات الدخول غير صحيحة.');
  }
  await createStaffSession(role, req as any);
  res.json({ success: true, role });
}));

router.post('/staff-logout', asyncHandler(async (req: Request, res: Response) => {
  const { role } = await revokeStaffSession(getStaffCookie(req));
  clearStaffCookie(res as any);
  if (role) {
    await writeAuditLog({
      actorUid: `staff:${role}`,
      actorRole: role,
      action: 'STAFF_LOGOUT',
      category: 'auth',
      severity: 'info',
      status: 'SUCCESS',
      requestId: (req as any).requestId,
    });
  }
  res.json({ success: true });
}));

// 2) Register user — REQUIRES Firebase ID Token.
router.post('/register-user', authRateLimit, rejectClientControlledFields, asyncHandler(async (req: Request, res: Response) => {
  const parsed = RegisterUserSchema.parse(req.body);
  // Firebase ID Token MUST be present — verified server-side.
  if (!parsed.firebaseIdToken) {
    throw new ApiError(400, 'MISSING_TOKEN', 'يجب توفير رمز Firebase ID Token');
  }
  const { user, created } = await registerUserAccount(parsed.firebaseIdToken, {
    name: parsed.name,
    phone: parsed.phone,
    email: parsed.email,
    address: parsed.address,
    preferredBranchId: parsed.preferredBranchId,
    deliveryLat: parsed.deliveryLat,
    deliveryLng: parsed.deliveryLng,
    storeName: parsed.storeName,
    merchantCategory: parsed.merchantCategory,
    vehicleType: parsed.vehicleType,
    vehiclePlate: parsed.vehiclePlate,
    nationalId: parsed.nationalId,
  });
  res.status(created ? 201 : 200).json({
    success: true,
    user,
    message: created ? 'تم تسجيل المستخدم بنجاح' : 'المستخدم مسجل مسبقًا',
  });
}));

// 3) Get current user profile (authenticated).
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = await fetchUserById(authReq.uid!);
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'المستخدم غير موجود');
  }
  res.json({ success: true, user });
}));

// 4) Update own profile (cannot change role/status/walletBalance).
router.post('/profile', authenticate, rejectClientControlledFields, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const allowedPatch = {
    name: req.body?.name,
    address: req.body?.address,
    preferredBranchId: req.body?.preferredBranchId,
    deliveryLat: req.body?.deliveryLat,
    deliveryLng: req.body?.deliveryLng,
    savedAddresses: req.body?.savedAddresses,
    avatar: req.body?.avatar,
  };
  const updated = await updateUserProfile(authReq.uid!, allowedPatch);
  res.json({ success: true, user: updated });
}));

// 5) Change user role — admin only.
router.post('/update-role', authenticate, sensitiveRateLimit, requirePermission('ASSIGN_ROLES'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = UpdateUserRoleSchema.parse(req.body);
  const user = await changeUserRole(parsed.targetUid, parsed.newRole, authReq.uid!, authReq.user!.role, parsed.reason);
  res.json({ success: true, user });
}));

// 6) Suspend / activate user — admin only.
router.post('/update-status', authenticate, sensitiveRateLimit, requirePermission('MANAGE_USERS'), asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { targetUid, status, reason } = req.body ?? {};
  if (!targetUid || !['active', 'pending', 'suspended'].includes(status)) {
    throw new ApiError(400, 'INVALID_REQUEST', 'بيانات غير صحيحة');
  }
  await setUserStatus(targetUid, status, authReq.uid!, authReq.user!.role, reason);
  res.json({ success: true });
}));

export default router;
