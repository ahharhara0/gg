# Hadramout Hyper — Production Backend

Transformed from prototype to **production-ready** backend with full zero-trust security model.

## Architecture Overview

```
Android APK (untrusted client)
    |
    | HTTPS  Authorization: Bearer <Firebase ID Token>
    v
Production Backend (this repo)
    |
    +---- Firebase Admin SDK (verifyIdToken)
    +---- Firestore (single source of truth)
    +---- Server-side pricing (no client prices trusted)
    +---- Firestore transactions (atomic stock reservation)
    +---- Idempotency records (24h TTL)
    +---- Payment gateway webhooks (HMAC signature verified)
    +---- Audit logs (append-only, immutable)
    +---- Rate limiting (auth + sensitive endpoints)
    +---- Zod input validation
```

## File Structure

```
server/
├── config.ts                     — Environment configuration
├── index.ts                      — Express app entry point
├── types/
│   └── index.ts                   — Shared TypeScript types
├── middleware/
│   ├── auth.ts                   — Firebase ID Token verification
│   ├── rbac.ts                   — requireRole / requirePermission / requireOwnershipOrAdmin
│   ├── rateLimit.ts              — express-rate-limit configurations
│   ├── idempotency.ts            — Idempotency-Key middleware
│   ├── errorHandler.ts           — Centralized error handling
│   └── requestId.ts              — X-Request-Id middleware
├── services/
│   ├── firebaseAdmin.ts          — Firebase Admin SDK singleton
│   ├── catalog.ts                — Products CRUD (Firestore)
│   ├── catalogTypes.ts           — Shared types (Product, Order, etc.)
│   ├── coupons.ts                — Coupon validation (Firestore-backed)
│   ├── pricing.ts                — Server-side price calculation
│   ├── orders.ts                 — Atomic order creation with stock reservation
│   ├── wallet.ts                 — Append-only wallet ledger (transactions)
│   ├── payments.ts               — Payment lifecycle + webhook verification
│   ├── users.ts                  — User registration + RBAC role changes
│   └── audit.ts                  — Audit log writer
├── routes/
│   ├── health.ts                 — GET /api/health, /live, /ready
│   ├── auth.ts                   — /api/auth/*
│   ├── products.ts               — /api/products/*
│   ├── coupons.ts                — /api/coupons/*
│   ├── checkout.ts               — /api/checkout/quote, /quote/public
│   ├── orders.ts                 — /api/orders/*
│   ├── wallet.ts                 — /api/wallet/*
│   ├── payments.ts               — /api/payments/*
│   └── misc.ts                   — /api/complaints, /audit-logs, /users
├── validators/
│   └── schemas.ts                — Zod schemas for all endpoints
└── utils/
    ├── logger.ts                 — Structured JSON logger (no secrets)
    └── helpers.ts                — Phone normalization, ID generation, etc.

scripts/
└── securityTest.ts               — 25-test security suite
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/health` | None | Health check (no secrets) |
| GET  | `/api/health/live` | None | Liveness probe |
| GET  | `/api/health/ready` | None | Readiness probe (checks Firebase) |
| POST | `/api/auth/check-phone` | Rate-limited | Check if phone is registered |
| POST | `/api/auth/register-user` | Firebase token | Register new user (forced `customer` role) |
| GET  | `/api/auth/me` | Bearer token | Get current user profile |
| POST | `/api/auth/profile` | Bearer token | Update own profile (no role/wallet) |
| POST | `/api/auth/update-role` | ASSIGN_ROLES | Change user role (with escalation prevention) |
| POST | `/api/auth/update-status` | MANAGE_USERS | Suspend/activate user |
| GET  | `/api/products` | None | List products |
| GET  | `/api/products/:id` | None | Get single product |
| POST | `/api/products` | Admin/Merchant | Create product |
| PUT  | `/api/products/:id` | Admin/Merchant (owner) | Update product |
| DELETE | `/api/products/:id` | Admin/Merchant (owner) | Delete product |
| POST | `/api/coupons/validate` | Rate-limited | Validate coupon code |
| POST | `/api/checkout/quote` | Bearer token | Get server-side pricing (with wallet) |
| POST | `/api/checkout/quote/public` | None | Public pricing quote (no wallet) |
| POST | `/api/orders/create` | Bearer + Idempotency-Key | Create order (atomic) |
| GET  | `/api/orders` | Bearer token | List orders (own or all if admin) |
| GET  | `/api/orders/:id` | Bearer (owner/admin) | Get single order |
| POST | `/api/orders/update-status` | MANAGE_ORDERS | Update order status (state machine) |
| POST | `/api/orders/cancel` | Bearer (owner/admin) | Cancel order |
| POST | `/api/orders/assign-driver` | DISPATCH_ORDERS | Assign driver |
| GET  | `/api/wallet/balance` | Bearer token | Get wallet balance + recent transactions |
| GET  | `/api/wallet/transactions` | Bearer token | Get transaction history |
| POST | `/api/wallet/topup` | Bearer + Idempotency-Key | Initiate wallet top-up |
| POST | `/api/wallet/credit` | MANAGE_PAYMENTS + Idempotency-Key | Credit wallet |
| POST | `/api/wallet/debit` | MANAGE_PAYMENTS + Idempotency-Key | Debit wallet |
| POST | `/api/payments/create` | Bearer + Idempotency-Key | Create pending payment |
| POST | `/api/payments/webhook` | HMAC signature | Payment gateway webhook |
| GET  | `/api/payments/:id` | Bearer (owner/admin) | Get payment record |
| POST | `/api/payments/refund` | PROCESS_REFUNDS + Idempotency-Key | Refund payment |
| POST | `/api/complaints` | Bearer token | Create complaint |
| GET  | `/api/complaints` | Support/Admin | List complaints |
| POST | `/api/complaints/resolve` | HANDLE_COMPLAINTS | Resolve complaint |
| GET  | `/api/audit-logs` | VIEW_AUDIT_LOGS | List audit logs |
| GET  | `/api/users` | Admin/Operations/Support | List users |

## Security Features

### 1. Firebase Authentication (Server-Side Verification)
- Client sends `Authorization: Bearer <Firebase ID Token>`
- Backend uses Firebase Admin SDK `verifyIdToken()` to extract UID
- **UID is NEVER taken from request body** — always from verified token

### 2. RBAC Enforcement
- 9 roles with hierarchical permissions: customer → support → driver → merchant → finance → operations → admin → super_admin → developer
- Permission-based checks via `requirePermission(perm)` middleware
- Privilege escalation prevention: admin can't grant role higher than their own

### 3. Server-Side Pricing
- Client sends ONLY `{productId, quantity}` — never `price`, `total`, `discount`, etc.
- Backend reads product prices from Firestore and computes subtotal, VAT, delivery fee, discount, total
- Zod schema uses `.strip()` to silently drop any client-supplied pricing fields

### 4. Atomic Order Creation
- Single Firestore transaction:
  1. Read all product docs (with locks)
  2. Verify existence + stock
  3. Compute pricing server-side
  4. Decrement inventory atomically
  5. Create order document
- Prevents overselling when two customers race to buy the last unit

### 5. Idempotency
- `Idempotency-Key` header on POST /orders/create, /wallet/*, /payments/*
- Replay returns cached response without re-executing
- 24h TTL via Firestore `idempotency_keys/{key}` collection

### 6. Wallet Ledger (Append-Only)
- `wallet_accounts/{uid}` balance updated inside Firestore transaction
- `wallet_transactions/{txId}` ledger entries are IMMUTABLE (rules forbid update/delete)
- All mutations go through Firebase Admin SDK (clients cannot write directly)

### 7. Payment Webhooks
- HMAC-SHA256 signature verification
- Timestamp-based replay protection (5-min tolerance)
- Idempotent via `payment_webhook_events/{eventId}` collection
- Amount + currency verification (prevents partial-payment attacks)

### 8. Audit Logs
- Written via Firebase Admin SDK (clients cannot write directly under hardened rules)
- Categories: security, operations, catalog, system, finance, auth
- Severity: info, warning, critical
- IMMUTABLE — rules forbid update/delete

### 9. Rate Limiting
- General: 300 req / 15 min / IP
- Auth: 10 attempts / 15 min / IP
- Sensitive: 30 ops / 15 min / IP
- Per-user: 20 orders / 15 min, 10 top-ups / 15 min

### 10. Input Validation (Zod)
- Every endpoint has a schema
- `.strip()` removes unknown fields silently (e.g., client-supplied `price` on quote)
- Strict validation on IDs, phone numbers, amounts, quantities

### 11. Hardened Firestore Rules
- `orders/{id}` create: `if false` (backend only)
- `users/{id}` create: `if false` (backend only)
- `wallet_transactions/{id}` create/update/delete: `if false` (backend only)
- `payments/{id}` create/update: `if false` (backend only)
- `audit_logs/{id}` create/update/delete: `if false` (backend only)
- Self-update of `users/{uid}` blocks `role`, `status`, `walletBalance`, `permissions`

### 12. Error Handling
- Centralized — never exposes stack traces, secrets, or DB internals
- Standardized error format: `{success: false, error: {code, message}, requestId}`
- 503 BACKEND_NOT_READY when Firebase unavailable (instead of 500)

### 13. Logging
- Structured JSON logs with: level, message, timestamp, requestId
- Sensitive fields auto-redacted (password, token, secret, privateKey, OTP, etc.)
- Request log includes: method, path, status, durationMs, authenticated, ip

## Environment Variables

See `.env.example` for the full list. Critical ones:

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` or `development` |
| `PORT` | No | Default 3000 |
| `PUBLIC_BASE_URL` | Yes | HTTPS URL of this backend |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT` | One of | JSON string of service account (preferred) |
| `FIREBASE_CLIENT_EMAIL` | Alt | Service account email |
| `FIREBASE_PRIVATE_KEY` | Alt | Service account private key |
| `FIRESTORE_DATABASE_ID` | No | Custom database ID (empty = default) |
| `PAYMENT_WEBHOOK_SECRET` | Yes (prod) | HMAC secret for webhook verification |
| `PAYMENT_GATEWAY` | No | `manual` (default), `floosak`, `stripe`, etc. |
| `VAT_RATE` | No | Default 0.15 (15%) |
| `FREE_DELIVERY_THRESHOLD` | No | Default 150 |
| `DELIVERY_FEE` | No | Default 15 |
| `RATE_LIMIT_*` | No | See `.env.example` |

## How to Run

### Development
```bash
npm install
npm run dev      # starts Vite + Express on port 3000
```

### Production
```bash
npm install
npm run build    # builds Vite SPA + bundles server.ts → dist/server.cjs
npm start        # runs NODE_ENV=production node dist/server.cjs
```

### Run Security Tests
```bash
# Terminal 1: start backend
npm run dev

# Terminal 2: run tests
npx tsx scripts/securityTest.ts
```

Expected output: `Security tests: 25/25 passed`

## Build Android APK

```bash
# 1. Build the web app and bundle the backend
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Build APK (debug or release)
cd android
./gradlew assembleDebug     # debug APK
./gradlew assembleRelease   # release APK (needs keystore.properties)
./gradlew bundleRelease     # AAB for Play Store
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Signing for Release

Create `android/keystore.properties`:
```properties
storeFile=/absolute/path/to/release.keystore
storePassword=your_store_password
keyAlias=hadramout-release
keyPassword=your_key_password
```

Generate a keystore:
```bash
keytool -genkey -v -keystore release.keystore -alias hadramout-release -keyalg RSA -keysize 2048 -validity 10000
```

## Firestore Collections

| Collection | Purpose | Rules |
|------------|---------|-------|
| `products/{id}` | Product catalog | Public read; admin/merchant write |
| `categories/{id}` | Category config | Public read; admin write |
| `payment_methods/{id}` | Payment method config | Public read; admin/finance write |
| `orders/{id}` | Customer orders | Owner read; backend-only create |
| `users/{uid}` | User accounts | Self read; self-safe-update; backend create |
| `wallet_accounts/{uid}` | Wallet balance | Self read; backend-only write |
| `wallet_transactions/{txId}` | Ledger entries | Owner read; IMMUTABLE |
| `payments/{payId}` | Payment records | Owner read; backend-only write |
| `payment_webhook_events/{eventId}` | Webhook dedup | Admin read; backend-only write |
| `coupons/{code}` | Coupon definitions | Public read; admin write |
| `audit_logs/{logId}` | Audit trail | Dev/SuperAdmin read; IMMUTABLE |
| `idempotency_keys/{key}` | Idempotency cache | Backend-only |
| `system_config/{id}` | Feature flags, remote config | Public read; dev/super_admin write |
| `complaints/{id}` | Customer complaints | Owner read; support/admin update |

## Cloud Run Deployment

```bash
# 1. Build the container image
gcloud builds submit --tag gcr.io/PROJECT_ID/hadramout-hyper

# 2. Deploy to Cloud Run
gcloud run deploy hadramout-hyper \
  --image gcr.io/PROJECT_ID/hadramout-hyper \
  --region me-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets FIREBASE_SERVICE_ACCOUNT=firebase-sa:latest,PAYMENT_WEBHOOK_SECRET=payment-webhook:latest

# 3. Get the production URL
gcloud run services describe hadramout-hyper --format 'value(status.url)'
```

## External Setup Required

Before going fully live, the following external setup is needed:

1. **Firebase Console**:
   - Enable Email/Password and Phone authentication
   - Create a service account with Firestore/Admin permissions
   - Download the service account JSON and set as `FIREBASE_SERVICE_ACCOUNT`
   - Deploy the new `firestore.rules` (`firebase deploy --only firestore:rules`)

2. **Payment Gateway**:
   - Register with a gateway (Floosak, Stripe, etc.)
   - Set `PAYMENT_WEBHOOK_SECRET` to a strong random value
   - Configure the gateway to send webhooks to `https://YOUR_DOMAIN/api/payments/webhook`
   - Implement gateway-specific signature verification in `server/services/payments.ts:verifyWebhookSignature()`

3. **Cloud Run / Hosting**:
   - Deploy backend to Cloud Run (or any Node.js host)
   - Set all environment variables via Secret Manager
   - Configure HTTPS (Cloud Run provides this automatically)

4. **Android Signing**:
   - Generate a release keystore
   - Create `android/keystore.properties`
   - Run `npm run build:apk` to produce a signed APK

5. **Seed Initial Data** (optional, for first deployment):
   - Run `npm run seed:firestore` to populate products, categories, payment methods
   - Or use the Firebase Console to manually add data
