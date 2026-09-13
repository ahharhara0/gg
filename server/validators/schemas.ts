/**
 * Zod schemas for all API request bodies.
 * Centralized input validation — never trust client data.
 */

import { z } from 'zod';

// ----- Primitive helpers -----
const id = z.string().min(1).max(128).regex(/^[a-zA-Z0-9_\-]+$/, 'Invalid ID format');
const phone = z.string().min(4).max(32);
const email = z.string().email().max(254).optional();
const safeText = (max: number) => z.string().min(1).max(max).trim();
const positiveAmount = z.number().positive().max(10_000_000);
const nonNegativeAmount = z.number().nonnegative().max(10_000_000);
const currency = z.enum(['YER', 'SAR']).default('YER');

// ----- Auth schemas -----
export const CheckPhoneSchema = z.object({
  phone,
});

export const RegisterUserSchema = z.object({
  phone,
  name: safeText(120),
  email: email.or(z.literal('').optional()).optional(),
  address: safeText(500).optional(),
  preferredBranchId: id.optional(),
  deliveryLat: z.number().min(-90).max(90).optional(),
  deliveryLng: z.number().min(-180).max(180).optional(),
  storeName: safeText(120).optional(),
  merchantCategory: safeText(120).optional(),
  vehicleType: safeText(60).optional(),
  vehiclePlate: safeText(20).optional(),
  nationalId: safeText(40).optional(),
  firebaseIdToken: z.string().min(20).max(4096).optional(),
}).strict()
  .refine((v) => !v.email || v.email.length === 0 || z.string().email().safeParse(v.email).success, {
    message: 'Invalid email',
    path: ['email'],
  });

export const UpdateUserRoleSchema = z.object({
  targetUid: id,
  newRole: z.enum(['developer', 'super_admin', 'admin', 'manager', 'operations', 'finance', 'merchant', 'driver', 'support', 'customer']),
  reason: safeText(500).optional(),
}).strict();

// ----- Catalog schemas -----
export const ProductIdSchema = z.object({ productId: id });

export const UpsertProductSchema = z.object({
  id: id.optional(),
  name: safeText(200),
  nameEn: safeText(200).optional(),
  category: safeText(80),
  price: nonNegativeAmount,
  originalPrice: nonNegativeAmount.optional(),
  currency,
  unit: safeText(60),
  image: safeText(2048).optional(),
  stockCount: z.number().int().nonnegative().max(1_000_000).default(0),
  inStock: z.boolean().default(true),
  description: safeText(2000).optional(),
  merchantId: id.optional(),
  merchantName: safeText(120).optional(),
}).strict();

// ----- Pricing / Checkout -----
export const QuoteItemSchema = z.object({
  productId: id,
  quantity: z.number().int().min(1).max(99),
}).strip(); // Strip extra fields like `price` — server uses Firestore price only.

export const CheckoutQuoteSchema = z.object({
  items: z.array(QuoteItemSchema).min(1).max(200),
  couponCode: z.string().trim().max(50).optional(),
  useWallet: z.boolean().optional().default(false),
  branchId: id.optional(),
}).strip(); // Strip client-supplied pricing fields silently.

export const CreateOrderSchema = z.object({
  items: z.array(QuoteItemSchema).min(1).max(200),
  couponCode: z.string().trim().max(50).optional(),
  useWallet: z.boolean().optional().default(false),
  deliveryAddress: safeText(500),
  deliveryLat: z.number().min(-90).max(90).optional(),
  deliveryLng: z.number().min(-180).max(180).optional(),
  deliverySlot: safeText(60).optional(),
  paymentMethod: safeText(120),
  paymentMethodId: id.optional(),
  branchId: id.optional(),
  transferReference: safeText(120).optional(),
  notes: safeText(1000).optional(),
  quoteToken: z.string().max(200).optional(),
}).strip(); // Strip any client-supplied pricing fields silently.

// ----- Coupons -----
export const ValidateCouponSchema = z.object({
  couponCode: safeText(50),
  subtotal: nonNegativeAmount.optional().default(0),
}).strict();

// ----- Wallet -----
export const WalletTransactSchema = z.object({
  type: z.enum(['CREDIT', 'DEBIT']),
  amount: positiveAmount,
  reason: safeText(500),
  orderId: id.optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict();

export const WalletTopUpSchema = z.object({
  amount: positiveAmount,
  paymentMethodId: id.optional(),
  transferReference: safeText(120).optional(),
}).strict();

// ----- Payments -----
export const CreatePaymentSchema = z.object({
  orderId: id,
  paymentMethodId: id.optional(),
  paymentMethod: safeText(120).optional(),
  amount: positiveAmount.optional(),
}).strict();

export const WebhookEventSchema = z.object({
  event: z.string().max(100),
  paymentId: z.string().max(200).optional(),
  orderId: z.string().max(200).optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().max(10).optional(),
  status: z.string().max(60).optional(),
  reference: z.string().max(200).optional(),
  timestamp: z.string().max(40).optional(),
  signature: z.string().max(500).optional(),
  // Allow additional gateway-specific fields.
}).passthrough();

// ----- Orders -----
export const UpdateOrderStatusSchema = z.object({
  orderId: id,
  newStatus: z.enum([
    'CREATED', 'PAYMENT_PENDING', 'PAID', 'CONFIRMED', 'PREPARING',
    'READY_FOR_PICKUP', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED',
    'CANCELLED', 'REFUND_PENDING', 'REFUNDED',
  ]),
  reason: safeText(500).optional(),
}).strict();

export const CancelOrderSchema = z.object({
  orderId: id,
  reason: safeText(500),
}).strict();

// ----- Complaints -----
export const CreateComplaintSchema = z.object({
  customerName: safeText(120).optional(),
  customerPhone: phone.optional(),
  orderId: id.optional(),
  category: safeText(60).optional(),
  subject: safeText(200).optional(),
  description: safeText(2000),
}).strict();

export const ResolveComplaintSchema = z.object({
  complaintId: id,
  reply: safeText(2000),
  status: z.enum(['resolved', 'in_progress', 'pending']).default('resolved'),
}).strict();

// ----- File upload -----
export const FileUploadMetadataSchema = z.object({
  fileName: safeText(200),
  contentType: z.string().max(100).optional(),
  sizeBytes: z.number().int().nonnegative().max(10_000_000).optional(),
  purpose: z.enum(['product_image', 'user_avatar', 'complaint_attachment', 'merchant_logo']),
}).strict();

// ----- Type helpers -----
export type CheckPhoneInput = z.infer<typeof CheckPhoneSchema>;
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
export type UpsertProductInput = z.infer<typeof UpsertProductSchema>;
export type CheckoutQuoteInput = z.infer<typeof CheckoutQuoteSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type ValidateCouponInput = z.infer<typeof ValidateCouponSchema>;
export type WalletTransactInput = z.infer<typeof WalletTransactSchema>;
export type WalletTopUpInput = z.infer<typeof WalletTopUpSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type WebhookEventInput = z.infer<typeof WebhookEventSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;
export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;
export type ResolveComplaintInput = z.infer<typeof ResolveComplaintSchema>;
export type FileUploadMetadataInput = z.infer<typeof FileUploadMetadataSchema>;
