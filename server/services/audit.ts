/**
 * Audit log service — server-authoritative.
 *
 * Audit logs are written via Firebase Admin SDK — clients have NO direct write
 * path (rules enforce `create: if isSignedIn()` but actorUid is taken from the
 * verified token, NOT from request body).
 *
 * Logs are IMMUTABLE: rules forbid update/delete.
 */

import { getDb, isFirebaseReady } from './firebaseAdmin.js';
import { logger } from '../utils/logger.js';
import { generateSecureId } from '../utils/helpers.js';
import type { AuditLogEntry } from '../types/index.js';

const AUDIT_COLLECTION = 'audit_logs';

export async function writeAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<string> {
  if (!isFirebaseReady()) return 'audit-disabled';
  const db = getDb();
  const id = entry.id ?? generateSecureId('audit');
  const fullEntry: AuditLogEntry = {
    ...entry,
    id,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  };
  try {
    await db.collection(AUDIT_COLLECTION).doc(id).set(fullEntry);
  } catch (err) {
    logger.error('Failed to write audit log', { action: entry.action, error: (err as Error).message });
  }
  return id;
}

export async function listAuditLogs(opts: {
  actorUid?: string;
  category?: string;
  severity?: string;
  limit?: number;
  startAt?: string;
} = {}): Promise<AuditLogEntry[]> {
  if (!isFirebaseReady()) return [];
  const db = getDb();
  let q: FirebaseFirestore.Query = db.collection(AUDIT_COLLECTION);
  if (opts.actorUid) q = q.where('actorUid', '==', opts.actorUid);
  if (opts.category) q = q.where('category', '==', opts.category);
  if (opts.severity) q = q.where('severity', '==', opts.severity);
  q = q.orderBy('timestamp', 'desc').limit(Math.min(opts.limit ?? 100, 500));
  const snap = await q.get();
  const out: AuditLogEntry[] = [];
  snap.forEach((d) => out.push(d.data() as AuditLogEntry));
  return out;
}
