/**
 * User service — server-side role management with strict privilege-escalation prevention.
 *
 * Rules:
 * 1. New registrations ALWAYS get role = customer (no client-supplied role).
 * 2. Role changes require ASSIGN_ROLES permission.
 * 3. walletBalance is NEVER writable from client; updated only by wallet service.
 */

import { getDb, isFirebaseReady } from './firebaseAdmin.js';
import { adminAuth } from './firebaseAdmin.js';
import { logger } from '../utils/logger.js';
import { normalizePhoneDigits, maskPhone } from '../utils/helpers.js';
import { ApiError } from '../middleware/errorHandler.js';
import { writeAuditLog } from './audit.js';
import type { UserDoc } from './catalogTypes.js';
import type { UserRole } from '../types/index.js';

const USERS_COLLECTION = 'users';

export async function findUserByPhone(phone: string): Promise<UserDoc | null> {
  if (!isFirebaseReady()) return null;
  const normalized = normalizePhoneDigits(phone);
  if (!normalized) return null;
  try {
    const db = getDb();
    const snap = await db.collection(USERS_COLLECTION).where('phoneNormalized', '==', normalized).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...(doc.data() as Omit<UserDoc, 'id'>) };
  } catch {
    return null;
  }
}

export async function fetchUserById(uid: string): Promise<UserDoc | null> {
  if (!isFirebaseReady()) return null;
  try {
    const db = getDb();
    const snap = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...(snap.data() as Omit<UserDoc, 'id'>) };
  } catch {
    return null;
  }
}

/**
 * Create a brand new user record (called after Firebase Authentication succeeds on client).
 *
 * The `firebaseIdToken` is verified server-side — we do NOT trust the `id` field
 * from the request body; the UID is taken from the decoded token.
 */
export async function registerUserAccount(
  firebaseIdToken: string,
  input: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    preferredBranchId?: string;
    deliveryLat?: number;
    deliveryLng?: number;
    storeName?: string;
    merchantCategory?: string;
    vehicleType?: string;
    vehiclePlate?: string;
    nationalId?: string;
  },
): Promise<{ user: UserDoc; created: boolean }> {
  if (!isFirebaseReady()) {
    throw new ApiError(503, 'BACKEND_NOT_READY', 'خدمة المصادقة غير متاحة');
  }
  // Verify the Firebase ID Token server-side.
  const decoded = await adminAuth().verifyIdToken(firebaseIdToken, true);
  const uid = decoded.uid;
  const emailFromToken = decoded.email;
  const phoneFromToken = decoded.phone_number;

  const db = getDb();
  const ref = db.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    // Already registered — return existing record.
    return { user: { id: uid, ...(snap.data() as Omit<UserDoc, 'id'>) }, created: false };
  }

  // NEW user → strict customer role. Status = active.
  // Merchants/drivers must apply separately and be approved.
  const newUser: UserDoc = {
    id: uid,
    name: input.name,
    email: input.email ?? emailFromToken ?? '',
    phone: phoneFromToken ?? input.phone,
    role: 'customer', // FORCED
    status: 'active',
    walletBalance: 0,
    loyaltyPoints: 50, // welcome gift
    ordersCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save phoneNormalized for fast lookup.
  (newUser as any).phoneNormalized = normalizePhoneDigits(newUser.phone);
  (newUser as any).preferredBranchId = input.preferredBranchId ?? 'br-hadramout-aqqad';
  (newUser as any).address = input.address ?? 'حضرموت';
  (newUser as any).deliveryLat = input.deliveryLat ?? 14.541;
  (newUser as any).deliveryLng = input.deliveryLng ?? 49.129;

  await ref.set(newUser);

  await writeAuditLog({
    actorUid: uid,
    actorRole: 'customer',
    action: 'USER_REGISTERED',
    category: 'auth',
    targetId: uid,
    details: { phone: maskPhone(newUser.phone), email: newUser.email },
    severity: 'info',
    status: 'SUCCESS',
  });

  logger.info('New user registered', { uid, phone: maskPhone(newUser.phone) });

  return { user: newUser, created: true };
}

/**
 * Change a user's role.
 * Only roles with ASSIGN_ROLES permission (admin/super_admin/developer) may call this.
 */
export async function changeUserRole(
  targetUid: string,
  newRole: UserRole,
  actorUid: string,
  actorRole: UserRole,
  reason?: string,
): Promise<UserDoc> {
  if (!isFirebaseReady()) {
    throw new ApiError(503, 'BACKEND_NOT_READY', 'قاعدة البيانات غير متاحة');
  }
  if (actorRole !== 'admin' && actorRole !== 'super_admin' && actorRole !== 'developer') {
    throw new ApiError(403, 'INSUFFICIENT_PERMISSION', 'ليس لديك صلاحية تغيير الأدوار');
  }

  const db = getDb();
  const ref = db.collection(USERS_COLLECTION).doc(targetUid);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'USER_NOT_FOUND', 'المستخدم غير موجود');

  const old = snap.data() as UserDoc;
  if (old.role === newRole) return { ...old, id: targetUid };

  // Block privilege escalation ABOVE the actor's own level.
  const ROLE_LEVEL: Record<UserRole, number> = {
    customer: 10, support: 15, driver: 20, merchant: 30,
    finance: 50, operations: 60, admin: 80, manager: 80, super_admin: 95, developer: 100,
  };
  const actorLevel = ROLE_LEVEL[actorRole];
  const targetLevel = ROLE_LEVEL[newRole];
  if (targetLevel > actorLevel) {
    await writeAuditLog({
      actorUid, actorRole,
      action: 'PRIVILEGE_ESCALATION_BLOCKED',
      category: 'security',
      targetId: targetUid,
      details: { attemptedRole: newRole, actorRole },
      severity: 'critical',
      status: 'BLOCKED',
    });
    throw new ApiError(403, 'INSUFFICIENT_PERMISSION', 'لا يمكن منح دور أعلى من مستوى صلاحياتك');
  }

  await ref.update({
    role: newRole,
    status: newRole === 'customer' ? 'active' : old.status,
    updatedAt: new Date().toISOString(),
  });

  await writeAuditLog({
    actorUid, actorRole,
    action: 'USER_ROLE_CHANGED',
    category: 'security',
    targetId: targetUid,
    details: { previousRole: old.role, newRole, reason },
    severity: 'warning',
    status: 'SUCCESS',
  });

  logger.info('User role changed', { targetUid, oldRole: old.role, newRole, actorUid });
  return { ...old, id: targetUid, role: newRole };
}

/**
 * Suspend / activate a user.
 */
export async function setUserStatus(
  targetUid: string,
  status: 'active' | 'pending' | 'suspended',
  actorUid: string,
  actorRole: UserRole,
  reason?: string,
): Promise<void> {
  if (!isFirebaseReady()) {
    throw new ApiError(503, 'BACKEND_NOT_READY', 'قاعدة البيانات غير متاحة');
  }
  const db = getDb();
  const ref = db.collection(USERS_COLLECTION).doc(targetUid);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'USER_NOT_FOUND', 'المستخدم غير موجود');

  await ref.update({ status, updatedAt: new Date().toISOString() });

  await writeAuditLog({
    actorUid, actorRole,
    action: 'USER_STATUS_CHANGED',
    category: 'security',
    targetId: targetUid,
    details: { newStatus: status, reason },
    severity: status === 'suspended' ? 'critical' : 'info',
    status: 'SUCCESS',
  });
}

/**
 * Safe profile update — only fields the user is allowed to modify.
 * Role, status, walletBalance are NEVER writable here.
 */
export async function updateUserProfile(uid: string, patch: {
  name?: string;
  address?: string;
  preferredBranchId?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  savedAddresses?: string[];
  avatar?: string;
}): Promise<UserDoc> {
  if (!isFirebaseReady()) {
    throw new ApiError(503, 'BACKEND_NOT_READY', 'قاعدة البيانات غير متاحة');
  }
  const db = getDb();
  const ref = db.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'USER_NOT_FOUND', 'المستخدم غير موجود');

  const allowedPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) allowedPatch.name = patch.name;
  if (patch.address !== undefined) allowedPatch.address = patch.address;
  if (patch.preferredBranchId !== undefined) allowedPatch.preferredBranchId = patch.preferredBranchId;
  if (patch.deliveryLat !== undefined) allowedPatch.deliveryLat = patch.deliveryLat;
  if (patch.deliveryLng !== undefined) allowedPatch.deliveryLng = patch.deliveryLng;
  if (patch.savedAddresses !== undefined) allowedPatch.savedAddresses = patch.savedAddresses;
  if (patch.avatar !== undefined) allowedPatch.avatar = patch.avatar;
  allowedPatch.updatedAt = new Date().toISOString();

  await ref.update(allowedPatch);
  const newSnap = await ref.get();
  return { id: uid, ...(newSnap.data() as Omit<UserDoc, 'id'>) };
}

export async function listUsers(limit = 200, roleFilter?: UserRole): Promise<UserDoc[]> {
  if (!isFirebaseReady()) return [];
  const db = getDb();
  let q: FirebaseFirestore.Query = db.collection(USERS_COLLECTION);
  if (roleFilter) q = q.where('role', '==', roleFilter);
  q = q.limit(Math.min(limit, 500));
  const snap = await q.get();
  const out: UserDoc[] = [];
  snap.forEach((d) => out.push({ id: d.id, ...(d.data() as Omit<UserDoc, 'id'>) }));
  return out;
}
