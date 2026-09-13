/**
 * Hadramout Hyper - Local-First Offline Database Engine
 * Implements high-performance IndexedDB persistent storage for seamless offline/online
 * synchronization with Google Firestore and native Capacitor mobile runtime.
 */

import { Product, CategoryConfig, Branch, Order, CartItem } from '../types';

const DB_NAME = 'HadramoutHyperLocalDB';
const DB_VERSION = 1;

export interface SavedDeliveryAddress {
  id: string;
  label: string;
  city: string;
  district: string;
  address: string;
  buildingNumber: string;
  apartmentNumber: string;
  deliveryNotes: string;
  lat: number;
  lng: number;
  branchId: string;
  isDefault?: boolean;
  updatedAt: number;
}

class OfflineDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create Object Stores if they don't exist
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('branches')) {
          db.createObjectStore('branches', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('orders')) {
          db.createObjectStore('orders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cart')) {
          db.createObjectStore('cart', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('savedAddresses')) {
          db.createObjectStore('savedAddresses', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('appState')) {
          db.createObjectStore('appState', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to open local IndexedDB:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // Generic helper for transaction
  private async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.initDB();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // --- PRODUCTS ---
  async saveProductsOffline(products: Product[]): Promise<void> {
    try {
      const store = await this.getStore('products', 'readwrite');
      for (const p of products) {
        store.put(p);
      }
    } catch (e) {
      console.warn('OfflineDB saveProducts failed:', e);
    }
  }

  async getProductsOffline(): Promise<Product[]> {
    try {
      const store = await this.getStore('products', 'readonly');
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as Product[]) || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  // --- CATEGORIES ---
  async saveCategoriesOffline(categories: CategoryConfig[]): Promise<void> {
    try {
      const store = await this.getStore('categories', 'readwrite');
      for (const c of categories) {
        store.put(c);
      }
    } catch (e) {
      console.warn('OfflineDB saveCategories failed:', e);
    }
  }

  async getCategoriesOffline(): Promise<CategoryConfig[]> {
    try {
      const store = await this.getStore('categories', 'readonly');
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as CategoryConfig[]) || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  // --- ORDERS ---
  async saveOrderOffline(order: Order): Promise<void> {
    try {
      const store = await this.getStore('orders', 'readwrite');
      store.put(order);
    } catch (e) {
      console.warn('OfflineDB saveOrder failed:', e);
    }
  }

  async getOrdersOffline(): Promise<Order[]> {
    try {
      const store = await this.getStore('orders', 'readonly');
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as Order[]) || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  // --- DELIVERY ADDRESSES ---
  async saveDeliveryAddressOffline(address: SavedDeliveryAddress): Promise<void> {
    try {
      const store = await this.getStore('savedAddresses', 'readwrite');
      store.put(address);
    } catch (e) {
      console.warn('OfflineDB saveAddress failed:', e);
    }
  }

  async getSavedAddressesOffline(): Promise<SavedDeliveryAddress[]> {
    try {
      const store = await this.getStore('savedAddresses', 'readonly');
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as SavedDeliveryAddress[]) || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }

  // --- CART CACHING ---
  async saveCartOffline(items: CartItem[]): Promise<void> {
    try {
      const store = await this.getStore('appState', 'readwrite');
      store.put({ key: 'cached_cart', items, updatedAt: Date.now() });
    } catch (e) {
      console.warn('OfflineDB saveCart failed:', e);
    }
  }

  async getCartOffline(): Promise<CartItem[]> {
    try {
      const store = await this.getStore('appState', 'readonly');
      return new Promise((resolve) => {
        const req = store.get('cached_cart');
        req.onsuccess = () => resolve(req.result?.items || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  }
}

export const offlineDB = new OfflineDatabase();
