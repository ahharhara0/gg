/**
 * Wallet service — append-only double-entry ledger.
 *
 * Wallet accounts live in `wallet_accounts/{userId}`.
 * Ledger entries live in `wallet_transactions/{txId}` and are IMMUTABLE
 * (rules: `allow update, delete: if false`).
 *
 * All balance mutations go through Firestore transactions so concurrent
 * debit/credit operations can never overdraw or double-credit.
 */

import { getDb, isFirebaseReady } from './firebaseAdmin.js';
import { logger } from '../utils/logger.js';
import { generateSecureId, roundCurrency } from '../utils/helpers.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { WalletAccount, WalletTransaction } from './catalogTypes.js';

const WALLET_ACCOUNTS_COLLECTION = 'wallet_accounts';
const WALLET_TRANSACTIONS_COLLECTION = 'wallet_transactions';

/** Get or lazily create a wallet account document for a user. */
export async function getOrCreateWalletAccount(userId: string): Promise<WalletAccount> {
  if (!isFirebaseReady()) {
    return { userId, balance: 0, currency: 'YER', updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
  }
  const db = getDb();
  const ref = db.collection(WALLET_ACCOUNTS_COLLECTION).doc(userId);
  const snap = await ref.get();
  if (snap.exists) {
    return snap.data() as WalletAccount;
  }
  const newAccount: WalletAccount = {
    userId,
    balance: 0,
    currency: 'YER',
    frozenBalance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await ref.set(newAccount);
  return newAccount;
}

export async function getWalletBalance(userId: string): Promise<number> {
  const account = await getOrCreateWalletAccount(userId);
  return account.balance;
}

export async function debitWalletInTransaction(
  tx: FirebaseFirestore.Transaction,
  userId: string,
  amount: number,
  reason: string,
  orderId: string,
  actorUid: string,
): Promise<WalletTransaction> {
  if (amount <= 0) throw new ApiError(400, 'INVALID_AMOUNT', 'المبلغ يجب أن يكون موجبًا');
  const db = getDb();
  const accountRef = db.collection(WALLET_ACCOUNTS_COLLECTION).doc(userId);
  const snap = await tx.get(accountRef);
  const account: WalletAccount = snap.exists ? (snap.data() as WalletAccount) : { userId, balance: 0, currency: 'YER', updatedAt: new Date().toISOString() };
  const value = roundCurrency(amount);
  if (account.balance < value) throw new ApiError(400, 'INSUFFICIENT_BALANCE', 'رصيد المحفظة غير كافٍ لإتمام العملية');
  const before = account.balance;
  const after = roundCurrency(before - value);
  const txId = generateSecureId('tx');
  const ledger: WalletTransaction = { id:txId,userId,type:'DEBIT',amount:value,balanceBefore:before,balanceAfter:after,reason,orderId,timestamp:new Date().toISOString(),hashProof:`sha_${Buffer.from(`${userId}|DEBIT|${value}|${after}|${txId}`).toString('base64url').slice(0,24)}`,immutable:true,actorUid };
  tx.set(accountRef,{userId,balance:after,currency:account.currency??'YER',updatedAt:new Date().toISOString(),...(snap.exists?{}:{createdAt:new Date().toISOString()})},{merge:true});
  tx.create(db.collection(WALLET_TRANSACTIONS_COLLECTION).doc(txId),ledger);
  return ledger;
}

export async function recordWalletDebit(
  userId: string,
  amount: number,
  reason: string,
  orderId?: string,
  actorUid?: string,
): Promise<WalletTransaction> {
  return runWalletTxn(userId, 'DEBIT', amount, reason, orderId, actorUid);
}

export async function recordWalletCredit(
  userId: string,
  amount: number,
  reason: string,
  orderId?: string,
  paymentReference?: string,
  actorUid?: string,
): Promise<WalletTransaction> {
  return runWalletTxn(userId, 'CREDIT', amount, reason, orderId, actorUid, paymentReference);
}

async function runWalletTxn(
  userId: string,
  type: 'CREDIT' | 'DEBIT',
  rawAmount: number,
  reason: string,
  orderId?: string,
  actorUid?: string,
  paymentReference?: string,
): Promise<WalletTransaction> {
  if (!isFirebaseReady()) {
    throw new ApiError(503, 'BACKEND_NOT_READY', 'قاعدة البيانات غير متاحة');
  }
  if (rawAmount <= 0) {
    throw new ApiError(400, 'INVALID_AMOUNT', 'المبلغ يجب أن يكون موجبًا');
  }
  const amount = roundCurrency(rawAmount);
  const db = getDb();
  const accountRef = db.collection(WALLET_ACCOUNTS_COLLECTION).doc(userId);
  const txId = generateSecureId('tx');

  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(accountRef);
    const account: WalletAccount = snap.exists
      ? (snap.data() as WalletAccount)
      : { userId, balance: 0, currency: 'YER', updatedAt: new Date().toISOString() };

    const balanceBefore = account.balance;
    let balanceAfter: number;

    if (type === 'DEBIT') {
      if (balanceBefore < amount) {
        throw new ApiError(400, 'INSUFFICIENT_BALANCE', 'رصيد المحفظة غير كافٍ لإتمام العملية');
      }
      balanceAfter = roundCurrency(balanceBefore - amount);
    } else {
      balanceAfter = roundCurrency(balanceBefore + amount);
    }

    // Update account balance.
    tx.set(accountRef, {
      userId,
      balance: balanceAfter,
      currency: account.currency ?? 'YER',
      updatedAt: new Date().toISOString(),
      ...(snap.exists ? {} : { createdAt: new Date().toISOString() }),
    }, { merge: true });

    // Append ledger entry — immutable.
    const ledger: WalletTransaction = {
      id: txId,
      userId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      reason,
      orderId,
      paymentReference,
      timestamp: new Date().toISOString(),
      hashProof: `sha_${Buffer.from(`${userId}|${type}|${amount}|${balanceAfter}|${Date.now()}`).toString('base64url').slice(0, 24)}`,
      immutable: true,
      actorUid,
    };
    tx.set(db.collection(WALLET_TRANSACTIONS_COLLECTION).doc(txId), ledger);

    return ledger;
  });
}

export async function listWalletTransactions(userId: string, limit = 100): Promise<WalletTransaction[]> {
  if (!isFirebaseReady()) return [];
  const db = getDb();
  const snap = await db
    .collection(WALLET_TRANSACTIONS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(Math.min(limit, 500))
    .get();
  const out: WalletTransaction[] = [];
  snap.forEach((d) => out.push(d.data() as WalletTransaction));
  return out;
}

/** Synchronize walletBalance field on users/{uid} document so client UI sees consistent value. */
export async function syncWalletBalanceToUserDoc(userId: string, newBalance: number): Promise<void> {
  if (!isFirebaseReady()) return;
  const db = getDb();
  // NOTE: This must use Firebase Admin (server) credentials — Firestore rules
  // prevent clients from writing this field.
  await db.collection('users').doc(userId).set({ walletBalance: newBalance, updatedAt: new Date().toISOString() }, { merge: true });
}
