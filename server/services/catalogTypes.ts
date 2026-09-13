/** Subset of the frontend Product type, used server-side. */
export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  price: number;
  originalPrice?: number;
  currency: string;
  unit: string;
  image?: string;
  rating?: number;
  reviewsCount?: number;
  inStock: boolean;
  stockCount: number;
  badge?: string;
  origin?: string;
  description?: string;
  merchantId?: string;
  merchantName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CouponDefinition {
  id?: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_DELIVERY';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  startDate?: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usageCount?: number;
  userUsageLimit?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: Array<{
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    currency: string;
  }>;
  branchId?: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliverySlot?: string;
  paymentMethod: string;
  paymentMethodId?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'COD_PENDING' | 'PENDING_REFUND';
  paymentReference?: string;
  status: 'CREATED' | 'PAYMENT_PENDING' | 'PAID' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED';
  subtotal: number;
  discount: number;
  vat: number;
  deliveryFee: number;
  total: number;
  currency: string;
  walletDeduction: number;
  payableRemaining: number;
  transferReference?: string | null;
  notes?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  acceptedAt?: string;
  deliveredAt?: string;
  audit?: Record<string, unknown>;
}

export interface WalletAccount {
  userId: string;
  balance: number;
  currency: string;
  frozenBalance?: number;
  updatedAt: string;
  createdAt?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  orderId?: string;
  paymentReference?: string;
  timestamp: string;
  hashProof?: string;
  immutable: true;
  actorUid?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  gateway: string;
  gatewayPaymentId?: string;
  gatewayReference?: string;
  paymentMethodId?: string;
  createdAt: string;
  updatedAt?: string;
  verifiedAt?: string;
  webhookReceivedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface UserDoc {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: 'developer' | 'super_admin' | 'admin' | 'manager' | 'operations' | 'finance' | 'merchant' | 'driver' | 'support' | 'customer';
  status: 'active' | 'pending' | 'suspended';
  walletBalance?: number;
  walletAccountId?: string;
  loyaltyPoints?: number;
  ordersCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
