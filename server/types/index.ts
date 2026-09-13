/**
 * Centralized type definitions shared across backend modules.
 */

export type UserRole =
  | 'developer'
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'operations'
  | 'finance'
  | 'merchant'
  | 'driver'
  | 'support'
  | 'customer';

export interface AuthenticatedRequest extends Express.Request {
  uid?: string;
  user?: {
    uid: string;
    email?: string;
    phone?: string;
    name?: string;
    role: UserRole;
    status: 'active' | 'pending' | 'suspended';
    walletBalance?: number;
  };
  requestId?: string;
  idempotencyKey?: string;
  staffSession?: { sessionId: string; role: 'developer' | 'manager'; expiresAt: string };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  requestId?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface VerifiedOrderItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  inStock: boolean;
  currency: string;
}

export interface PricingBreakdown {
  verifiedItems: VerifiedOrderItem[];
  subtotal: number;
  promoDiscount: number;
  appliedCoupon: string | null;
  vat: number;
  deliveryFee: number;
  totalBeforeWallet: number;
  walletDeduction: number;
  finalPayable: number;
  currency: string;
  calculatedAt: string;
  quoteToken: string;
  quoteExpiresAt: string;
}

export interface AuditLogEntry {
  id?: string;
  actorUid: string;
  actorRole: UserRole;
  action: string;
  category: 'security' | 'operations' | 'catalog' | 'system' | 'finance' | 'auth';
  targetId?: string;
  targetEntity?: string;
  details?: Record<string, unknown> | string;
  severity: 'info' | 'warning' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  timestamp: string;
  status: 'SUCCESS' | 'BLOCKED' | 'FAILED';
}

export interface IdempotencyRecord {
  key: string;
  endpoint: string;
  uid?: string;
  responsePayload: unknown;
  statusCode: number;
  createdAt: string;
  expiresAt: string;
}
