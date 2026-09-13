import { UserRole } from '../../types';

export type AuditCategory = 
  | 'security'
  | 'operations'
  | 'catalog'
  | 'system'
  | 'finance'
  | 'auth';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: string; // ISO 8601
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  category: AuditCategory;
  targetEntity: string;
  targetId?: string;
  details: string | Record<string, any>;
  severity: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'BLOCKED' | 'FAILED';
}

export interface AuditLogFilter {
  category?: AuditCategory | 'all';
  severity?: AuditSeverity | 'all';
  actorRole?: UserRole | 'all';
  search?: string;
}
