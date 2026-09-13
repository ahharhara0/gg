/** Server-side staff-code authentication and opaque session management. */
import crypto from 'crypto';
import { getDb, isFirebaseReady } from './firebaseAdmin.js';
import { config } from '../config.js';
import { writeAuditLog } from './audit.js';
import { getClientIp, generateSecureId, hashString } from '../utils/helpers.js';
import type { UserRole } from '../types/index.js';

export type StaffRole = 'developer' | 'manager';
const COLLECTION = 'staff_sessions';
const COOKIE_NAME = 'hh_staff_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const CODE_HASH_RE = /^[0-9a-f]{32}:[0-9a-f]{128}$/i;

function parseHash(value: string): { salt: string; hash: Buffer } | null {
  if (!CODE_HASH_RE.test(value)) return null;
  const [salt, hex] = value.split(':');
  return { salt, hash: Buffer.from(hex, 'hex') };
}

export function verifyStaffCode(code: string, expected: string): boolean {
  if (!/^\d{9}$/.test(code)) return false;
  const parsed = parseHash(expected);
  if (!parsed) return false;
  const actual = crypto.scryptSync(code, parsed.salt, 64);
  return crypto.timingSafeEqual(actual, parsed.hash);
}

export function getStaffCodeRole(code: string): StaffRole | null {
  if (verifyStaffCode(code, config.staff.developerCodeHash)) return 'developer';
  if (verifyStaffCode(code, config.staff.managerCodeHash)) return 'manager';
  return null;
}

export function getStaffCookie(req: { headers: { cookie?: string } }): string | null {
  const raw = req.headers.cookie ?? '';
  const match = raw.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) : null;
}

export function setStaffCookie(res: { cookie: (name: string, value: string, options: Record<string, unknown>) => void }, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
}

export function clearStaffCookie(res: { clearCookie: (name: string, options?: Record<string, unknown>) => void }): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'lax',
    path: '/',
  });
}

export async function createStaffSession(role: StaffRole, req: any): Promise<void> {
  if (!isFirebaseReady()) throw new Error('FIREBASE_NOT_READY');
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashString(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  const sessionId = generateSecureId('staff_session');
  const ip = getClientIp(req);
  await getDb().collection(COLLECTION).doc(sessionId).set({
    tokenHash,
    role,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastSeenAt: now.toISOString(),
    ipHash: hashString(`${config.staff.auditSalt}:${ip}`),
    userAgent: String(req.headers['user-agent'] ?? '').slice(0, 300),
  });
  setStaffCookie(req.res, rawToken);
  await writeAuditLog({
    actorUid: `staff:${role}`,
    actorRole: role as UserRole,
    action: 'STAFF_LOGIN_SUCCESS',
    category: 'auth',
    severity: 'critical',
    status: 'SUCCESS',
    requestId: req.requestId,
    details: { sessionId },
    ipAddress: undefined,
    userAgent: String(req.headers['user-agent'] ?? '').slice(0, 300),
  });
}

export async function resolveStaffSession(token: string | null): Promise<{ sessionId: string; role: StaffRole; expiresAt: string } | null> {
  if (!token || !isFirebaseReady()) return null;
  const tokenHash = hashString(token);
  const snap = await getDb().collection(COLLECTION).where('tokenHash', '==', tokenHash).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data() as any;
  if (!['developer', 'manager'].includes(data.role)) return null;
  const expires = new Date(data.expiresAt);
  if (!Number.isFinite(expires.getTime()) || expires.getTime() <= Date.now()) {
    await doc.ref.delete().catch(() => undefined);
    return null;
  }
  await doc.ref.update({ lastSeenAt: new Date().toISOString() }).catch(() => undefined);
  return { sessionId: doc.id, role: data.role, expiresAt: data.expiresAt };
}

export async function revokeStaffSession(token: string | null): Promise<{ role: StaffRole | null }> {
  if (!token || !isFirebaseReady()) return { role: null };
  const tokenHash = hashString(token);
  const snap = await getDb().collection(COLLECTION).where('tokenHash', '==', tokenHash).limit(1).get();
  if (snap.empty) return { role: null };
  const role = snap.docs[0].data().role as StaffRole;
  await snap.docs[0].ref.delete();
  return { role };
}

export const STAFF_COOKIE_NAME = COOKIE_NAME;
export const STAFF_SESSION_TTL_MS = SESSION_TTL_MS;
