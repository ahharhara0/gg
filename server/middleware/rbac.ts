/**
 * RBAC middleware — server-side enforcement.
 *
 * Hiding a button in the UI is NOT security. Even if a malicious APK is rebuilt,
 * these checks still reject unauthorized API calls.
 */

import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest, UserRole } from '../types/index.js';

const ROLE_LEVEL: Record<UserRole, number> = {
  customer: 10,
  support: 15,
  driver: 20,
  merchant: 30,
  finance: 50,
  operations: 60,
  admin: 80,
  manager: 80,
  super_admin: 95,
  developer: 100,
};

export function requireRole(minimumRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    const requestId = authReq.requestId ?? 'no-req-id';

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'يجب تسجيل الدخول' },
        requestId,
      });
      return;
    }

    const userRole = authReq.user.role;
    const userLevel = ROLE_LEVEL[userRole] ?? 0;
    const requiredLevel = ROLE_LEVEL[minimumRole];

    if (userLevel < requiredLevel) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'ليس لديك صلاحية للوصول إلى هذه العملية',
        },
        requestId,
      });
      return;
    }

    next();
  };
}

export function requireAnyRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    const requestId = authReq.requestId ?? 'no-req-id';

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'يجب تسجيل الدخول' },
        requestId,
      });
      return;
    }

    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'ليس لديك صلاحية للوصول إلى هذه العملية',
        },
        requestId,
      });
      return;
    }

    next();
  };
}

/**
 * Permission-based check (fine-grained).
 * Mirrors the client-side `permissions.ts` matrix but enforced server-side.
 */
export type Permission =
  | 'MANAGE_USERS'
  | 'ASSIGN_ROLES'
  | 'VIEW_USER_PROFILES'
  | 'ACCEPT_MERCHANTS'
  | 'ACCEPT_DRIVERS'
  | 'MANAGE_CATALOG'
  | 'MANAGE_PRICING'
  | 'ADJUST_INVENTORY'
  | 'MANAGE_ORDERS'
  | 'CANCEL_ORDERS'
  | 'DISPATCH_ORDERS'
  | 'VIEW_ALL_ORDERS'
  | 'TRACK_DELIVERIES'
  | 'MANAGE_CMS'
  | 'MANAGE_BANNERS'
  | 'MANAGE_CATEGORIES'
  | 'VIEW_FINANCE'
  | 'MANAGE_PAYMENTS'
  | 'AUTOMATE_PAYMENTS'
  | 'PROCESS_REFUNDS'
  | 'HANDLE_COMPLAINTS'
  | 'VIEW_AUDIT_LOGS'
  | 'MANAGE_FEATURE_FLAGS'
  | 'CONFIGURE_SYSTEM'
  | 'TOGGLE_MAINTENANCE'
  | 'TRIGGER_KILL_SWITCH'
  | 'MANAGE_FIREBASE'
  | 'RESET_DATABASE'
  | 'EXPORT_DATA'
  | 'VIEW_SYSTEM_METRICS'
  | 'VIEW_SECURITY_CENTER'
  | 'COLLECT_COD';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  developer: [
    'MANAGE_USERS', 'ASSIGN_ROLES', 'VIEW_USER_PROFILES', 'ACCEPT_MERCHANTS', 'ACCEPT_DRIVERS',
    'MANAGE_CATALOG', 'MANAGE_PRICING', 'ADJUST_INVENTORY',
    'MANAGE_ORDERS', 'CANCEL_ORDERS', 'DISPATCH_ORDERS', 'VIEW_ALL_ORDERS', 'TRACK_DELIVERIES',
    'MANAGE_CMS', 'MANAGE_BANNERS', 'MANAGE_CATEGORIES',
    'VIEW_FINANCE', 'MANAGE_PAYMENTS', 'AUTOMATE_PAYMENTS', 'PROCESS_REFUNDS',
    'HANDLE_COMPLAINTS', 'VIEW_AUDIT_LOGS', 'MANAGE_FEATURE_FLAGS', 'CONFIGURE_SYSTEM',
    'TOGGLE_MAINTENANCE', 'TRIGGER_KILL_SWITCH', 'MANAGE_FIREBASE', 'RESET_DATABASE',
    'EXPORT_DATA', 'VIEW_SYSTEM_METRICS', 'VIEW_SECURITY_CENTER', 'COLLECT_COD',
  ],
  super_admin: [
    'MANAGE_USERS', 'ASSIGN_ROLES', 'VIEW_USER_PROFILES', 'ACCEPT_MERCHANTS', 'ACCEPT_DRIVERS',
    'MANAGE_CATALOG', 'MANAGE_PRICING', 'ADJUST_INVENTORY',
    'MANAGE_ORDERS', 'CANCEL_ORDERS', 'DISPATCH_ORDERS', 'VIEW_ALL_ORDERS', 'TRACK_DELIVERIES',
    'MANAGE_CMS', 'MANAGE_BANNERS', 'MANAGE_CATEGORIES',
    'VIEW_FINANCE', 'MANAGE_PAYMENTS', 'AUTOMATE_PAYMENTS', 'PROCESS_REFUNDS',
    'HANDLE_COMPLAINTS', 'VIEW_AUDIT_LOGS', 'MANAGE_FEATURE_FLAGS', 'CONFIGURE_SYSTEM',
    'TOGGLE_MAINTENANCE', 'TRIGGER_KILL_SWITCH', 'MANAGE_FIREBASE', 'RESET_DATABASE',
    'EXPORT_DATA', 'VIEW_SYSTEM_METRICS', 'VIEW_SECURITY_CENTER', 'COLLECT_COD',
  ],
  admin: [
    'MANAGE_USERS', 'VIEW_USER_PROFILES', 'ACCEPT_MERCHANTS', 'ACCEPT_DRIVERS',
    'MANAGE_CATALOG', 'MANAGE_PRICING', 'ADJUST_INVENTORY',
    'MANAGE_ORDERS', 'CANCEL_ORDERS', 'DISPATCH_ORDERS', 'VIEW_ALL_ORDERS', 'TRACK_DELIVERIES',
    'MANAGE_CMS', 'MANAGE_BANNERS', 'MANAGE_CATEGORIES',
    'VIEW_FINANCE', 'MANAGE_PAYMENTS', 'PROCESS_REFUNDS',
    'HANDLE_COMPLAINTS', 'VIEW_AUDIT_LOGS', 'MANAGE_FEATURE_FLAGS', 'CONFIGURE_SYSTEM',
  ],
  manager: [
    'VIEW_USER_PROFILES', 'ACCEPT_MERCHANTS', 'ACCEPT_DRIVERS',
    'MANAGE_CATALOG', 'MANAGE_PRICING', 'ADJUST_INVENTORY',
    'MANAGE_ORDERS', 'CANCEL_ORDERS', 'DISPATCH_ORDERS', 'VIEW_ALL_ORDERS', 'TRACK_DELIVERIES',
    'MANAGE_CMS', 'MANAGE_BANNERS', 'MANAGE_CATEGORIES',
    'VIEW_FINANCE', 'MANAGE_PAYMENTS', 'PROCESS_REFUNDS',
    'HANDLE_COMPLAINTS', 'EXPORT_DATA',
  ],
  operations: ['MANAGE_ORDERS', 'DISPATCH_ORDERS', 'VIEW_ALL_ORDERS', 'TRACK_DELIVERIES'],
  finance: ['VIEW_FINANCE', 'MANAGE_PAYMENTS', 'PROCESS_REFUNDS'],
  merchant: ['MANAGE_CATALOG', 'ADJUST_INVENTORY', 'MANAGE_PRICING'],
  driver: ['DISPATCH_ORDERS', 'TRACK_DELIVERIES', 'COLLECT_COD'],
  support: ['HANDLE_COMPLAINTS', 'VIEW_USER_PROFILES'],
  customer: [],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    const requestId = authReq.requestId ?? 'no-req-id';

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'يجب تسجيل الدخول' },
        requestId,
      });
      return;
    }

    if (!hasPermission(authReq.user.role, permission)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSION',
          message: 'ليس لديك صلاحية للوصول إلى هذه العملية',
        },
        requestId,
      });
      return;
    }

    next();
  };
}

/** Assert that the authenticated user owns the resource OR has admin/operations role. */
export function requireOwnershipOrAdmin(getOwnerId: (req: Request) => string | undefined) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    const requestId = authReq.requestId ?? 'no-req-id';

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'يجب تسجيل الدخول' },
        requestId,
      });
      return;
    }

    const ownerId = getOwnerId(req);
    const isAdminLevel = ['admin', 'super_admin', 'developer', 'operations'].includes(authReq.user.role);

    if (authReq.uid !== ownerId && !isAdminLevel) {
      res.status(403).json({
        success: false,
        error: { code: 'NOT_OWNER', message: 'لا تملك صلاحية الوصول إلى هذا المورد' },
        requestId,
      });
      return;
    }

    next();
  };
}
