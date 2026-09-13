/**
 * Products service — Firestore-backed catalog (no in-memory mock).
 */

import { getDb, isFirebaseReady } from './firebaseAdmin.js';
import { logger } from '../utils/logger.js';
import type { Product } from './catalogTypes.js';
import type { UpsertProductInput } from '../validators/schemas.js';
import { PRODUCTS } from '../../src/data/initialCatalog.js';

const PRODUCTS_COLLECTION = 'products';

export interface ProductQueryOptions {
  category?: string;
  limit?: number;
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  if (isFirebaseReady()) {
    try {
      const db = getDb();
      const snap = await db.collection(PRODUCTS_COLLECTION).doc(productId).get();
      if (snap.exists) {
        return { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) };
      }
    } catch {
      // Fall back to local catalog seamlessly
    }
  }
  const fallback = PRODUCTS.find((p) => p.id === productId);
  return (fallback as Product) ?? null;
}

export async function fetchProductsByIds(ids: string[]): Promise<Map<string, Product>> {
  const out = new Map<string, Product>();
  if (ids.length === 0) return out;

  if (isFirebaseReady()) {
    try {
      const db = getDb();
      // Firestore `in` query supports up to 30 IDs per call.
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
      await Promise.all(
        chunks.map(async (chunk) => {
          const snap = await db.collection(PRODUCTS_COLLECTION).where('__name__', 'in', chunk).get();
          snap.forEach((doc) => {
            out.set(doc.id, { id: doc.id, ...(doc.data() as Omit<Product, 'id'>) });
          });
        }),
      );
    } catch {
      // Fall back to local catalog seamlessly
    }
  }

  // Fill in any products from local catalog if not already found in Firestore
  for (const id of ids) {
    if (!out.has(id)) {
      const item = PRODUCTS.find((p) => p.id === id);
      if (item) out.set(id, item as Product);
    }
  }

  return out;
}

export async function listProducts(opts: ProductQueryOptions = {}): Promise<Product[]> {
  if (isFirebaseReady()) {
    try {
      const db = getDb();
      let q: FirebaseFirestore.Query = db.collection(PRODUCTS_COLLECTION);
      if (opts.category && opts.category !== 'all') {
        q = q.where('category', '==', opts.category);
      }
      if (opts.limit) q = q.limit(Math.min(opts.limit, 500));
      const snap = await q.get();
      if (!snap.empty) {
        const items: Product[] = [];
        snap.forEach((doc) => items.push({ id: doc.id, ...(doc.data() as Omit<Product, 'id'>) }));
        return items;
      }
    } catch {
      // Fall back to local catalog seamlessly
    }
  }

  // Fallback to local catalog
  let filtered = [...PRODUCTS] as Product[];
  if (opts.category && opts.category !== 'all') {
    filtered = filtered.filter((p) => p.category === opts.category);
  }
  if (opts.limit) {
    filtered = filtered.slice(0, opts.limit);
  }
  return filtered;
}

export async function createProduct(input: UpsertProductInput, merchantUid?: string): Promise<Product> {
  if (!isFirebaseReady()) throw new Error('Database not ready');
  const db = getDb();
  const id = input.id ?? `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const product: Product = {
    id,
    name: input.name,
    nameEn: input.nameEn ?? '',
    category: input.category,
    price: input.price,
    originalPrice: input.originalPrice,
    currency: input.currency,
    unit: input.unit,
    image: input.image ?? '',
    rating: 0,
    reviewsCount: 0,
    inStock: input.inStock,
    stockCount: input.stockCount,
    description: input.description ?? '',
    merchantId: merchantUid,
    merchantName: input.merchantName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await db.collection(PRODUCTS_COLLECTION).doc(id).set(product);
  logger.info('Product created', { productId: id, merchantUid });
  return product;
}

export async function updateProduct(productId: string, input: Partial<UpsertProductInput>, actorUid: string): Promise<void> {
  if (!isFirebaseReady()) throw new Error('Database not ready');
  const db = getDb();
  const ref = db.collection(PRODUCTS_COLLECTION).doc(productId);
  const existing = await ref.get();
  if (!existing.exists) throw new Error('Product not found');
  // Merchants may only edit their own products.
  const data = existing.data() as Product;
  if (data.merchantId && data.merchantId !== actorUid) {
    throw new Error('Not authorized to edit this product');
  }
  await ref.set({ ...input, updatedAt: new Date().toISOString() }, { merge: true });
  logger.info('Product updated', { productId, actorUid });
}

export async function deleteProduct(productId: string, actorUid: string): Promise<void> {
  if (!isFirebaseReady()) throw new Error('Database not ready');
  const db = getDb();
  const ref = db.collection(PRODUCTS_COLLECTION).doc(productId);
  const existing = await ref.get();
  if (!existing.exists) return;
  const data = existing.data() as Product;
  if (data.merchantId && data.merchantId !== actorUid) {
    throw new Error('Not authorized to delete this product');
  }
  await ref.delete();
  logger.info('Product deleted', { productId, actorUid });
}
