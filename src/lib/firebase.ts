import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppUser } from '../types';

// NOTE: The previous `import { APP_USERS } from '../data/initialCatalog'` has been
// REMOVED. Mock users are no longer a fallback for phone lookups — all phone
// checks now go through the secure backend `/api/auth/check-phone` endpoint.

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Firebase Google Sign-In error:', err);
    throw err;
  }
}

export async function signInEmailPassword(email: string, pass: string): Promise<FirebaseUser> {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (err) {
    console.error('Firebase Email Sign-In error:', err);
    throw err;
  }
}

export async function registerEmailPassword(email: string, pass: string, name?: string, phone?: string): Promise<FirebaseUser> {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    // Initialize user profile in Firestore
    await syncOrCreateFirestoreUserProfile(res.user, { name, phone });
    return res.user;
  } catch (err) {
    console.error('Firebase Email Registration error:', err);
    throw err;
  }
}

export async function sendResetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

export async function logOutFirebase(): Promise<void> {
  return fbSignOut(auth);
}

/**
 * Sync or create user profile in Firestore collection 'users/{uid}'
 * Enforces server-side stored role (default 'customer')
 */
export async function syncOrCreateFirestoreUserProfile(
  fbUser: FirebaseUser, 
  extra?: { name?: string; phone?: string }
): Promise<AppUser> {
  const userDocRef = doc(db, 'users', fbUser.uid);
  try {
    const snapshot = await getDoc(userDocRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as AppUser;
      return {
        ...data,
        id: fbUser.uid,
        email: fbUser.email || data.email,
        name: data.name || fbUser.displayName || 'عميل حضرموت',
        role: data.role || 'customer',
      };
    } else {
      // First time user registration -> strictly create as 'customer'
      const newUser: AppUser = {
        id: fbUser.uid,
        name: extra?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'عميل حضرموت',
        email: fbUser.email || '',
        phone: extra?.phone || fbUser.phoneNumber || '',
        role: 'customer', // strictly customer
        status: 'active',
        walletBalance: 0,
        loyaltyPoints: 50, // Welcome gift
        ordersCount: 0,
        createdAt: new Date().toISOString(),
      };
      // The client never creates authoritative user documents. Ask the secure backend
      // to create the profile using the verified Firebase ID token.
      const token = await fbUser.getIdToken();
      const response = await fetch('/api/auth/register-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newUser, firebaseIdToken: token })
      });
      if (!response.ok) throw new Error('Backend user registration failed');
      const data = await response.json();
      return data.user as AppUser;
    }
  } catch (err) {
    console.warn('Firestore user profile sync notice:', (err as Error).message);
    return {
      id: fbUser.uid,
      name: extra?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'عميل حضرموت',
      email: fbUser.email || '',
      phone: extra?.phone || fbUser.phoneNumber || '',
      role: 'customer',
      walletBalance: 0,
      loyaltyPoints: 50,
      ordersCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  }
}

// Validate Connection as mandated by Firebase integration guidelines
export async function validateFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'status'));
    console.log('Firebase Firestore connection verified successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
      return;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted:', error.message);
    } else {
      console.log('Firebase Firestore connection tested:', (error as Error).message);
    }
  }
}

/**
 * Normalizes phone numbers for zero-trust comparisons
 */
export function normalizePhoneDigits(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('00')) cleaned = cleaned.slice(2);
  if (cleaned.startsWith('967') && cleaned.length >= 12) cleaned = cleaned.slice(3);
  if (cleaned.startsWith('966') && cleaned.length >= 12) cleaned = cleaned.slice(3);
  if (cleaned.startsWith('0') && cleaned.length === 10) cleaned = cleaned.slice(1);
  return cleaned;
}

/**
 * Checks whether a phone number already exists in Database (Backend API & Firestore)
 */
export async function checkUserPhoneInDb(phone: string): Promise<{
  exists: boolean;
  user?: AppUser;
  maskedPhone: string;
  normalizedPhone: string;
}> {
  const normalized = normalizePhoneDigits(phone);
  const last4 = normalized.slice(-4) || '0000';
  const maskedPhone = `******${last4}`;

  // 1. Check Server API endpoint (authoritative).
  try {
    const res = await fetch('/api/auth/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.exists && data.user) {
        return {
          exists: true,
          user: data.user,
          maskedPhone: data.maskedPhone || maskedPhone,
          normalizedPhone: normalized,
        };
      }
    }
  } catch (err) {
    console.warn('Server check-phone endpoint notice:', err);
  }

  // 2. Check Firestore users collection directly (server-side rules enforce
  //    that callers can only read their own user doc; admin/operations can read all).
  //    This is the only fallback — NO local mock users.
  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('phone', '==', phone));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const uData = snap.docs[0].data() as AppUser;
      return {
        exists: true,
        user: { ...uData, id: snap.docs[0].id },
        maskedPhone,
        normalizedPhone: normalized,
      };
    }
  } catch (err) {
    console.warn('Firestore users phone lookup notice:', err);
  }

  // 3. No more local APP_USERS fallback — production users MUST exist in Firestore.
  return {
    exists: false,
    maskedPhone,
    normalizedPhone: normalized,
  };
}

/**
 * Setup invisible or standard RecaptchaVerifier for Phone Auth
 */
export function initRecaptchaVerifier(containerId: string): RecaptchaVerifier | null {
  try {
    if (typeof window === 'undefined') return null;
    const win = window as any;
    if (win.recaptchaVerifier) {
      try {
        win.recaptchaVerifier.clear();
      } catch {}
      win.recaptchaVerifier = null;
    }
    const container = document.getElementById(containerId);
    if (!container) return null;

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired, please retry');
      },
    });
    win.recaptchaVerifier = verifier;
    return verifier;
  } catch (err) {
    console.warn('RecaptchaVerifier init error (will use fallback):', err);
    return null;
  }
}

/**
 * Sends OTP to phone via Firebase Phone Authentication
 */
export async function sendFirebasePhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

/**
 * Fetch user document from Firestore users/{uid}
 */
export async function getFirestoreUserByUid(uid: string): Promise<AppUser | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AppUser;
    }
  } catch (err) {
    console.warn('Firestore user fetch by uid notice:', err);
  }
  return null;
}

/**
 * Save / Update user document in Firestore users/{uid}
 * Routes through the secure backend `/api/auth/profile` endpoint.
 *
 * NOTE: The backend enforces that `role`, `status`, `walletBalance` CANNOT be
 * changed from this endpoint — clients cannot escalate privileges.
 */
export async function saveUserProfileToFirestore(user: AppUser): Promise<void> {
  try {
    const token = await auth.currentUser?.getIdToken(false);
    await fetch('/api/auth/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name: user.name,
        address: user.address,
        preferredBranchId: user.preferredBranchId,
        deliveryLat: user.deliveryLat,
        deliveryLng: user.deliveryLng,
      }),
    });
  } catch (err) {
    console.warn('saveUserProfileToFirestore notice:', err);
  }
}
