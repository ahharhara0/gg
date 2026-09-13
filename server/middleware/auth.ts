/**
 * Firebase Authentication verification middleware.
 *
 * Verifies the client-supplied Firebase ID Token via Firebase Admin SDK.
 * On success, attaches the verified `uid` and resolved user role to the request.
 *
 * Zero-trust: clients can NEVER supply their own UID/role — they must come
 * from a verified Firebase token + Firestore `users/{uid}` lookup.
 */

import { Request, Response, NextFunction } from 'express';
import { adminAuth, getDb, isFirebaseReady } from '../services/firebaseAdmin.js';
import { logger } from '../utils/logger.js';
import { getStaffCookie, resolveStaffSession } from '../services/staffAuth.js';
import type { AuthenticatedRequest, UserRole } from '../types/index.js';

const FORBIDDEN_FIELDS_CLIENT_CAN_SET = new Set(['role', 'status', 'walletBalance', 'permissions']);

export interface FirestoreUserDoc {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  status?: 'active' | 'pending' | 'suspended';
  walletBalance?: number;
}

/**
 * Resolve a verified Firebase UID to its Firestore user document.
 * Returns the canonical role/status/walletBalance — clients can NEVER override these.
 */
export async function resolveUserByUid(uid: string): Promise<FirestoreUserDoc | null> {
  if (!isFirebaseReady()) {
    logger.warn('Firebase Admin not ready — user resolution rejected');
    return null;
  }
  const db = getDb();
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as Partial<FirestoreUserDoc>;
  return {
    id: uid,
    name: data.name ?? 'عميل حضرموت',
    email: data.email,
    phone: data.phone ?? '',
    role: (data.role as UserRole) ?? 'customer',
    status: data.status ?? 'active',
    walletBalance: data.walletBalance ?? 0,
  };
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const requestId = authReq.requestId ?? 'no-req-id';

  const header = req.headers.authorization;

  // Staff sessions use an opaque HttpOnly cookie. The browser never receives the staff role as an authorization secret.
  if (!header || !header.startsWith('Bearer ')) {
    try {
      const staff = await resolveStaffSession(getStaffCookie(req));
      if (staff) {
        authReq.uid = `staff:${staff.role}`;
        authReq.user = {
          uid: `staff:${staff.role}`,
          email: `${staff.role}@hadramouthyper.internal`,
          phone: '',
          name: staff.role === 'developer' ? 'مهندس النظام / المطور' : 'المدير',
          role: staff.role,
          status: 'active',
          walletBalance: 0,
        };
        (authReq as any).staffSession = staff;
        next();
        return;
      }
    } catch (err) {
      logger.warn('Staff session resolution failed', { requestId });
    }

    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: 'يجب تسجيل الدخول للمتابعة' },
      requestId,
    });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: 'رمز الدخول غير صالح' },
      requestId,
    });
    return;
  }

  try {
    const decoded = await adminAuth().verifyIdToken(token, true);
    const uid = decoded.uid;

    if (!isFirebaseReady()) {
      res.status(503).json({
        success: false,
        error: { code: 'BACKEND_NOT_READY', message: 'خدمة المصادقة غير متاحة حاليًا' },
        requestId,
      });
      return;
    }

    const userDoc = await resolveUserByUid(uid);
    if (!userDoc) {
      // User exists in Firebase Auth but not yet in Firestore `users/{uid}`.
      // Treat as a brand-new customer — they must complete registration flow first.
      logger.info('Authenticated Firebase user has no Firestore record', { uid, requestId });
      res.status(403).json({
        success: false,
        error: { code: 'USER_PROFILE_MISSING', message: 'يجب إكمال بيانات الحساب أولًا' },
        requestId,
      });
      return;
    }

    if (userDoc.status === 'suspended') {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'تم إيقاف هذا الحساب. تواصل مع الدعم.' },
        requestId,
      });
      return;
    }

    authReq.uid = uid;
    authReq.user = {
      uid,
      email: userDoc.email,
      phone: userDoc.phone,
      name: userDoc.name,
      role: userDoc.role,
      status: userDoc.status ?? 'active',
      walletBalance: userDoc.walletBalance ?? 0,
    };

    next();
  } catch (err: any) {
    const code = err?.code === 'auth/id-token-expired' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    const msg =
      code === 'TOKEN_EXPIRED'
        ? 'انتهت الجلسة. يرجى إعادة تسجيل الدخول.'
        : 'رمز الدخول غير صالح أو منتهي';
    res.status(401).json({
      success: false,
      error: { code, message: msg },
      requestId,
    });
  }
}

/** Optional auth — proceeds even if token missing, but attaches user when present. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  try {
    const token = header.slice('Bearer '.length).trim();
    if (token && isFirebaseReady()) {
      const decoded = await adminAuth().verifyIdToken(token, true);
      const userDoc = await resolveUserByUid(decoded.uid);
      if (userDoc && userDoc.status !== 'suspended') {
        authReq.uid = decoded.uid;
        authReq.user = {
          uid: decoded.uid,
          email: userDoc.email,
          phone: userDoc.phone,
          name: userDoc.name,
          role: userDoc.role,
          status: userDoc.status ?? 'active',
          walletBalance: userDoc.walletBalance ?? 0,
        };
      }
    }
  } catch (err) {
    // Optional auth — swallow errors.
  }
  next();
}

/** Assert that the request body does not contain fields the client is forbidden from setting. */
export function rejectClientControlledFields(req: Request, res: Response, next: NextFunction): void {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const offenders = Object.keys(body).filter((k) => FORBIDDEN_FIELDS_CLIENT_CAN_SET.has(k.toLowerCase()));
  if (offenders.length > 0) {
    res.status(422).json({
      success: false,
      error: {
        code: 'FORBIDDEN_FIELD',
        message: `لا يمكن تعيين هذه الحقول من العميل: ${offenders.join(', ')}`,
      },
      requestId: (req as any).requestId,
    });
    return;
  }
  next();
}
