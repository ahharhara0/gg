/**
 * Backward-compatible entry point.
 *
 * This file delegates to `server/index.ts` which contains the production-ready
 * backend with Firebase Admin SDK verification, RBAC, idempotency, rate limiting,
 * audit logging, and hardened security.
 *
 * `npm run dev` runs this file via tsx.
 * `npm run build` bundles this file (and its imports) into dist/server.cjs via esbuild.
 * `npm start` runs the bundled CJS file in production.
 */

import './server/index.js';
