/**
 * IndexedDB utility for offline data persistence
 * Provides structured storage for transactions, bills, and app state
 */

interface DBConfig {
  name: string;
  version: number;
  stores: StoreConfig[];
}

interface StoreConfig {
  name: string;
  keyPath: string | string[];
  autoIncrement?: boolean;
  indices?: IndexConfig[];
}

interface IndexConfig {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
}

const DB_CONFIG: DBConfig = {
  name: 'AstralMoneyDB',
  version: 1,
  stores: [
    {
      name: 'transactions',
      keyPath: 'id',
      indices: [
        { name: 'date', keyPath: 'date' },
        { name: 'category', keyPath: 'category' },
        { name: 'type', keyPath: 'type' },
        { name: 'amount', keyPath: 'amount' }
      ]
    },
    {
      name: 'recurring-bills',
      keyPath: 'id',
      indices: [
        { name: 'name', keyPath: 'name' },
        { name: 'frequency', keyPath: 'frequency' },
        { name: 'amount', keyPath: 'amount' },
        { name: 'nextDue', keyPath: 'nextDue' }
      ]
    },
    {
      name: 'app-state',
      keyPath: 'key',
    },
    {
      name: 'sync-queue',
      keyPath: 'id',
      autoIncrement: true,
      indices: [
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'type', keyPath: 'type' },
        { name: 'status', keyPath: 'status' }
      ]
    },
    {
      name: 'cache',
      keyPath: 'key',
      indices: [
        { name: 'expires', keyPath: 'expires' }
      ]
    }
  ]
};

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the database connection
   */
  private async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      this.dbPromise = this.openDatabase();
      this.db = await this.dbPromise;
      // IndexedDB initialized successfully
    } catch (error) {
      // Handle IndexedDB initialization error
    }
  }

  /**
   * Open the database with proper schema setup
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };
    });
  }

  /**
   * Create object stores and indices
   */
  private createStores(db: IDBDatabase): void {
    DB_CONFIG.stores.forEach((storeConfig) => {
      if (db.objectStoreNames.contains(storeConfig.name)) {
        db.deleteObjectStore(storeConfig.name);
      }

      const store = db.createObjectStore(storeConfig.name, {
        keyPath: storeConfig.keyPath,
        autoIncrement: storeConfig.autoIncrement || false
      });

      // Create indices
      if (storeConfig.indices) {
        storeConfig.indices.forEach((indexConfig) => {
          store.createIndex(indexConfig.name, indexConfig.keyPath, {
            unique: indexConfig.unique || false
          });
        });
      }
    });
  }

  /**
   * Ensure database is ready
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db && this.dbPromise) {
      this.db = await this.dbPromise;
    }
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return this.db;
  }

  /**
   * Add or update a record in a store
   */
  async put(storeName: string, data: any): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get a record by key
   */
  async get<T = any>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get all records from a store
   */
  async getAll<T = any>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Query records by index
   */
  async getByIndex<T = any>(
    storeName: string, 
    indexName: string, 
    query: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(query);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  /**
   * Delete a record by key
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all records from a store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Count records in a store
   */
  async count(storeName: string, query?: IDBValidKey | IDBKeyRange): Promise<number> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count(query);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Bulk operations for better performance
   */
  async bulkPut(storeName: string, data: any[]): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      let completed = 0;
      const total = data.length;
      
      if (total === 0) {
        resolve();
        return;
      }
      
      data.forEach((item) => {
        const request = store.put(item);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }
}

// Singleton instance
const dbManager = new IndexedDBManager();

/**
 * High-level API for common operations
 */
export class OfflineStorage {
  /**
   * Store transaction data
   */
  static async saveTransaction(transaction: any): Promise<void> {
    const transactionWithTimestamp = {
      ...transaction,
      lastModified: new Date().toISOString(),
      synced: false
    };
    
    await dbManager.put('transactions', transactionWithTimestamp);
    await this.addToSyncQueue('transaction', 'create', transaction);
  }

  /**
   * Get all transactions
   */
  static async getTransactions(): Promise<any[]> {
    return dbManager.getAll('transactions');
  }

  /**
   * Get transactions by date range
   */
  static async getTransactionsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    const allTransactions = await this.getTransactions();
    return allTransactions.filter(t => 
      t.date >= startDate && t.date <= endDate
    );
  }

  /**
   * Store recurring bill data
   */
  static async saveRecurringBill(bill: any): Promise<void> {
    const billWithTimestamp = {
      ...bill,
      lastModified: new Date().toISOString(),
      synced: false
    };
    
    await dbManager.put('recurring-bills', billWithTimestamp);
    await this.addToSyncQueue('recurring-bill', 'create', bill);
  }

  /**
   * Get all recurring bills
   */
  static async getRecurringBills(): Promise<any[]> {
    return dbManager.getAll('recurring-bills');
  }

  /**
   * Store app state
   */
  static async saveAppState(key: string, data: any): Promise<void> {
    await dbManager.put('app-state', {
      key,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get app state
   */
  static async getAppState(key: string): Promise<any> {
    const result = await dbManager.get('app-state', key);
    return result?.data;
  }

  /**
   * Cache API response with expiration
   */
  static async cacheResponse(key: string, data: any, ttl: number = 3600000): Promise<void> {
    await dbManager.put('cache', {
      key,
      data,
      expires: Date.now() + ttl,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get cached response
   */
  static async getCachedResponse(key: string): Promise<any> {
    const result = await dbManager.get('cache', key);
    
    if (!result) return null;
    
    if (Date.now() > result.expires) {
      await dbManager.delete('cache', key);
      return null;
    }
    
    return result.data;
  }

  /**
   * Add operation to sync queue
   */
  private static async addToSyncQueue(
    type: string, 
    operation: string, 
    data: any
  ): Promise<void> {
    await dbManager.put('sync-queue', {
      type,
      operation,
      data,
      status: 'pending',
      timestamp: Date.now(),
      retryCount: 0
    });
  }

  /**
   * Get pending sync operations
   */
  static async getPendingSyncOperations(): Promise<any[]> {
    return dbManager.getByIndex('sync-queue', 'status', 'pending');
  }

  /**
   * Mark sync operation as completed
   */
  static async markSyncCompleted(id: number): Promise<void> {
    const operation = await dbManager.get('sync-queue', id);
    if (operation) {
      operation.status = 'completed';
      operation.completedAt = Date.now();
      await dbManager.put('sync-queue', operation);
    }
  }

  /**
   * Clean up expired cache entries
   */
  static async cleanupExpiredCache(): Promise<void> {
    const allCache = await dbManager.getAll('cache');
    const expired = allCache.filter(item => Date.now() > item.expires);
    
    for (const item of expired) {
      await dbManager.delete('cache', item.key);
    }
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<any> {
    const stats = {
      transactions: await dbManager.count('transactions'),
      recurringBills: await dbManager.count('recurring-bills'),
      appState: await dbManager.count('app-state'),
      syncQueue: await dbManager.count('sync-queue'),
      cache: await dbManager.count('cache')
    };
    
    return stats;
  }

  /**
   * Clear all offline data
   */
  static async clearAllData(): Promise<void> {
    await Promise.all([
      dbManager.clear('transactions'),
      dbManager.clear('recurring-bills'),
      dbManager.clear('app-state'),
      dbManager.clear('sync-queue'),
      dbManager.clear('cache')
    ]);
  }
}

export default OfflineStorage;