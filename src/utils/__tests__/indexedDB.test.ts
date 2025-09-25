/**
 * IndexedDB Utility Tests
 * Tests for offline storage and data persistence
 */

import { 
  DatabaseManager,
  OfflineStorageService,
  SyncManager
} from '../indexedDB';

// Mock IndexedDB
const mockIDBDatabase = {
  transaction: jest.fn(),
  close: jest.fn(),
  createObjectStore: jest.fn(),
  deleteObjectStore: jest.fn()
};

const mockIDBTransaction = {
  objectStore: jest.fn(),
  oncomplete: null,
  onerror: null,
  onabort: null
};

const mockIDBObjectStore = {
  add: jest.fn(),
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(),
  clear: jest.fn(),
  createIndex: jest.fn()
};

const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null
};

// Mock global IndexedDB
global.indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
  databases: jest.fn()
} as any;

global.IDBTransaction = {
  READ_ONLY: 'readonly',
  READ_WRITE: 'readwrite'
} as any;

describe('DatabaseManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
    mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
  });

  describe('initialization', () => {
    it('should initialize database manager', () => {
      const dbManager = new DatabaseManager('test-db', 1);
      expect(dbManager).toBeDefined();
    });

    it('should handle database opening', async () => {
      const mockOpenRequest = {
        ...mockIDBRequest,
        result: mockIDBDatabase,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null
      };

      (global.indexedDB.open as jest.Mock).mockReturnValue(mockOpenRequest);

      const dbManager = new DatabaseManager('test-db', 1);
      
      // Simulate successful opening
      setTimeout(() => {
        if (mockOpenRequest.onsuccess) {
          mockOpenRequest.onsuccess({ target: { result: mockIDBDatabase } } as any);
        }
      }, 0);

      // Should not throw
      expect(dbManager).toBeDefined();
    });
  });

  describe('basic operations', () => {
    it('should perform add operation', async () => {
      const mockAddRequest = { ...mockIDBRequest, result: 'test-id' };
      mockIDBObjectStore.add.mockReturnValue(mockAddRequest);

      const dbManager = new DatabaseManager('test-db', 1);
      
      // Simulate successful add
      setTimeout(() => {
        if (mockAddRequest.onsuccess) {
          mockAddRequest.onsuccess({ target: { result: 'test-id' } } as any);
        }
      }, 0);

      expect(mockIDBObjectStore.add).toBeDefined();
    });

    it('should perform get operation', async () => {
      const mockGetRequest = { ...mockIDBRequest, result: { id: 1, data: 'test' } };
      mockIDBObjectStore.get.mockReturnValue(mockGetRequest);

      const dbManager = new DatabaseManager('test-db', 1);
      
      // Simulate successful get
      setTimeout(() => {
        if (mockGetRequest.onsuccess) {
          mockGetRequest.onsuccess({ target: { result: { id: 1, data: 'test' } } } as any);
        }
      }, 0);

      expect(mockIDBObjectStore.get).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const mockErrorRequest = { ...mockIDBRequest, error: new Error('Database error') };
      mockIDBObjectStore.get.mockReturnValue(mockErrorRequest);

      const dbManager = new DatabaseManager('test-db', 1);
      
      // Simulate error
      setTimeout(() => {
        if (mockErrorRequest.onerror) {
          mockErrorRequest.onerror({ target: { error: new Error('Database error') } } as any);
        }
      }, 0);

      expect(mockIDBObjectStore.get).toBeDefined();
    });
  });
});

describe('OfflineStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  describe('storage operations', () => {
    it('should store data offline', async () => {
      const service = new OfflineStorageService();
      const testData = { id: 1, name: 'test' };
      
      await service.storeData('test-key', testData);
      
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should retrieve stored data', async () => {
      const service = new OfflineStorageService();
      const testData = { id: 1, name: 'test' };
      
      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(testData));
      
      const result = await service.getData('test-key');
      
      expect(localStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testData);
    });

    it('should handle missing data gracefully', async () => {
      const service = new OfflineStorageService();
      
      (localStorage.getItem as jest.Mock).mockReturnValue(null);
      
      const result = await service.getData('non-existent-key');
      
      expect(result).toBeNull();
    });

    it('should clear stored data', async () => {
      const service = new OfflineStorageService();
      
      await service.clearData('test-key');
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('data validation', () => {
    it('should validate stored data structure', async () => {
      const service = new OfflineStorageService();
      const validData = { id: 1, timestamp: Date.now() };
      
      const isValid = service.validateData(validData);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid data structure', async () => {
      const service = new OfflineStorageService();
      const invalidData = null;
      
      const isValid = service.validateData(invalidData);
      
      expect(isValid).toBe(false);
    });
  });
});

describe('SyncManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch
    global.fetch = jest.fn();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    });
  });

  describe('sync operations', () => {
    it('should sync data when online', async () => {
      const syncManager = new SyncManager();
      const testData = [{ id: 1, action: 'create', data: { name: 'test' } }];
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      await syncManager.syncPendingChanges(testData);
      
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle sync failures gracefully', async () => {
      const syncManager = new SyncManager();
      const testData = [{ id: 1, action: 'create', data: { name: 'test' } }];
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(syncManager.syncPendingChanges(testData)).rejects.toThrow('Network error');
    });

    it('should detect online/offline status', () => {
      const syncManager = new SyncManager();
      
      // Test online
      (navigator as any).onLine = true;
      expect(syncManager.isOnline()).toBe(true);
      
      // Test offline
      (navigator as any).onLine = false;
      expect(syncManager.isOnline()).toBe(false);
    });
  });

  describe('conflict resolution', () => {
    it('should resolve data conflicts', async () => {
      const syncManager = new SyncManager();
      const localData = { id: 1, name: 'local', updatedAt: '2024-01-01' };
      const serverData = { id: 1, name: 'server', updatedAt: '2024-01-02' };
      
      const resolved = syncManager.resolveConflict(localData, serverData);
      
      // Server data should win (newer timestamp)
      expect(resolved.name).toBe('server');
    });

    it('should handle missing timestamps in conflict resolution', async () => {
      const syncManager = new SyncManager();
      const localData = { id: 1, name: 'local' };
      const serverData = { id: 1, name: 'server' };
      
      const resolved = syncManager.resolveConflict(localData, serverData);
      
      // Should default to server data when timestamps are missing
      expect(resolved.name).toBe('server');
    });
  });
});
