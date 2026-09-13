/**
 * Firebase Admin SDK singleton.
 * Verified server-side — clients can NEVER forge identity.
 */

import admin, { ServiceAccount } from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let app: admin.app.App | null = null;
let firestoreInstance: Firestore | null = null;
let initialized = false;

function buildServiceAccount(): ServiceAccount | undefined {
  // 1) Full JSON service account blob (preferred for prod).
  if (config.firebase.serviceAccountJson) {
    try {
      const parsed = JSON.parse(config.firebase.serviceAccountJson);
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: String(parsed.private_key).replace(/\\n/g, '\n'),
      };
    } catch (err) {
      logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON', err);
      throw err;
    }
  }

  // 2) Individual env vars.
  if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
    return {
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    };
  }

  // 3) Application Default Credentials (Cloud Run / GCE) — return undefined
  //    so initializeApp() falls back to ADC.
  return undefined;
}

export function hasServiceAccount(): boolean {
  return !!(
    config.firebase.serviceAccountJson ||
    (config.firebase.clientEmail && config.firebase.privateKey)
  );
}

export function initializeFirebaseAdmin(): void {
  if (initialized) return;

  const serviceAccount = buildServiceAccount();

  try {
    app = admin.initializeApp(
      serviceAccount
        ? { credential: admin.credential.cert(serviceAccount) }
        : // No explicit creds — initialize with project ID for token verification and client alignment
          { projectId: config.firebase.projectId },
      'hadramout-hyper-backend',
    );

    if (serviceAccount) {
      firestoreInstance = config.firebase.firestoreDatabaseId
        ? getFirestore(app, config.firebase.firestoreDatabaseId)
        : getFirestore(app);

      firestoreInstance.settings({ ignoreUndefinedProperties: true });
      initialized = true;
      logger.info('Firebase Admin SDK initialized with Service Account', {
        projectId: config.firebase.projectId,
        databaseId: config.firebase.firestoreDatabaseId || '(default)',
      });
    } else {
      // In development / AI Studio preview without Service Account key,
      // the backend operates safely in client-aligned mode.
      initialized = false;
      logger.info('Firebase backend running in client-aligned mode (service account not configured, using resilient catalog)');
    }
  } catch (err) {
    logger.error('Firebase Admin initialization failed — backend will run in resilient mode', err);
    initialized = false;
  }
}

export function getAdminApp(): admin.app.App {
  if (!app) initializeFirebaseAdmin();
  return app as admin.app.App;
}

export function getDb(): Firestore {
  if (!firestoreInstance) {
    if (!app) initializeFirebaseAdmin();
    firestoreInstance = config.firebase.firestoreDatabaseId
      ? getFirestore(app!, config.firebase.firestoreDatabaseId)
      : getFirestore(app!);
    firestoreInstance.settings({ ignoreUndefinedProperties: true });
  }
  return firestoreInstance as Firestore;
}

export function isFirebaseReady(): boolean {
  return initialized && hasServiceAccount();
}

export const adminAuth = () => admin.auth(getAdminApp());
