import { AuditLog, AuditSeverity, AuditCategory } from './types';
import { UserRole } from '../../types';
import { auth } from '../../lib/firebase';

const AUDIT_STORAGE_KEY = 'hadramout_audit_logs_v1';

const INITIAL_AUDIT_LOGS: AuditLog[] = [];

class AuditLoggerService {
  private logs: AuditLog[] = [];
  private listeners: Set<(logs: AuditLog[]) => void> = new Set();
  private isFirestoreListening = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.logs = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached audit logs', e);
    }
    this.logs = [];
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.logs.slice(0, 100)));
    } catch (e) {
      console.warn('Failed to save audit logs to localStorage', e);
    }
  }

  private notify() {
    const list = [...this.logs];
    this.listeners.forEach((listener) => listener(list));
  }

  public getLogs(): AuditLog[] {
    return [...this.logs];
  }

  public subscribe(callback: (logs: AuditLog[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.logs]);

    // Load authoritative audit events from the protected backend.
    (async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch('/api/audit-logs?limit=100', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          this.logs = data.logs.map((l:any) => ({ ...l, actorId: l.actorUid, actorName: l.actorName || l.actorUid, targetEntity: l.targetEntity || 'system', details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details || {}) }));
          this.saveToStorage();
          this.notify();
        }
      } catch (err) { console.warn('Audit API load notice:', err); }
    })();
    return () => {
      this.listeners.delete(callback);
    };
  }

  public async logEvent(params: {
    actorId?: string;
    actorName?: string;
    actorRole?: UserRole;
    action: string;
    category: AuditCategory;
    targetEntity: string;
    targetId?: string;
    details: string | Record<string, any>;
    severity?: AuditSeverity;
    status?: 'SUCCESS' | 'BLOCKED' | 'FAILED';
  }): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actorId: params.actorId || 'system',
      actorName: params.actorName || 'النظام المركزي',
      actorRole: params.actorRole || 'developer',
      action: params.action,
      category: params.category,
      targetEntity: params.targetEntity,
      targetId: params.targetId,
      details: typeof params.details === 'object' ? JSON.stringify(params.details) : params.details,
      severity: params.severity || 'info',
      status: params.status || 'SUCCESS',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      ipAddress: '127.0.0.1'
    };

    // Prepend locally first for immediate UI responsiveness
    this.logs = [newLog, ...this.logs.slice(0, 99)];
    this.saveToStorage();
    this.notify();

    // Audit is server-authoritative. The client keeps only a local display cache;
    // authoritative records are written by backend endpoints/services.

    return newLog;
  }

  public clearLocalLogs() {
    this.logs = [];
    this.saveToStorage();
    this.notify();
  }
}

export const auditLogger = new AuditLoggerService();
