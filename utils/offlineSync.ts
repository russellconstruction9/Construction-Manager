import { Project, Task, User, InventoryItem } from '../types';

export interface SyncQueueItem {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'project' | 'task' | 'team_member' | 'inventory' | 'photo';
  data: any;
  timestamp: number;
  retryCount: number;
  lastRetry?: number;
}

export interface SyncStats {
  pending: number;
  completed: number;
  failed: number;
  lastSync?: number;
}

// Extend ServiceWorkerRegistration to include sync property
interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

class OfflineSyncService {
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.initDB();
    this.setupNetworkListeners();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('offline-sync', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        
        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('entity', 'entity');
          store.createIndex('type', 'type');
        }
        
        // Create offline data store
        if (!db.objectStoreNames.contains('offlineData')) {
          const offlineStore = db.createObjectStore('offlineData', { keyPath: 'key' });
        }
      };
    });
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async queueAction(
    type: SyncQueueItem['type'],
    entity: SyncQueueItem['entity'],
    data: any
  ): Promise<string> {
    if (!this.db) await this.initDB();
    
    const id = `${entity}_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const item: SyncQueueItem = {
      id,
      type,
      entity,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    await store.add(item);

    // If online, try to sync immediately
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return id;
  }

  async processSyncQueue(): Promise<void> {
    if (!this.db || this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    
    try {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();
      
      request.onsuccess = async () => {
        const items: SyncQueueItem[] = request.result;
        const pendingItems = items.filter(item => 
          item.retryCount < this.maxRetries &&
          (!item.lastRetry || Date.now() - item.lastRetry > this.retryDelay * Math.pow(2, item.retryCount))
        );

        for (const item of pendingItems) {
          try {
            await this.syncItem(item);
            await this.removeFromQueue(item.id);
          } catch (error) {
            console.error('Failed to sync item:', item, error);
            await this.updateRetryCount(item);
          }
        }
        
        this.syncInProgress = false;
        
        // Register for background sync if supported
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          const registration = await navigator.serviceWorker.ready as ExtendedServiceWorkerRegistration;
          if (registration.sync) {
            await registration.sync.register(`background-sync-${Date.now()}`);
          }
        }
      };
    } catch (error) {
      console.error('Error processing sync queue:', error);
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    const { type, entity, data } = item;
    
    let url = '';
    let method = '';
    let body: any = null;

    switch (entity) {
      case 'project':
        url = type === 'CREATE' ? '/api/projects' : `/api/projects/${data.id}`;
        method = type === 'CREATE' ? 'POST' : type === 'UPDATE' ? 'PUT' : 'DELETE';
        body = type !== 'DELETE' ? JSON.stringify(data) : null;
        break;
      
      case 'task':
        url = type === 'CREATE' ? '/api/tasks' : `/api/tasks/${data.id}`;
        method = type === 'CREATE' ? 'POST' : type === 'UPDATE' ? 'PUT' : 'DELETE';
        body = type !== 'DELETE' ? JSON.stringify(data) : null;
        break;
      
      case 'team_member':
        url = type === 'CREATE' ? '/api/team' : `/api/team/${data.id}`;
        method = type === 'CREATE' ? 'POST' : type === 'UPDATE' ? 'PUT' : 'DELETE';
        body = type !== 'DELETE' ? JSON.stringify(data) : null;
        break;
      
      case 'inventory':
        url = type === 'CREATE' ? '/api/inventory' : `/api/inventory/${data.id}`;
        method = type === 'CREATE' ? 'POST' : type === 'UPDATE' ? 'PUT' : 'DELETE';
        body = type !== 'DELETE' ? JSON.stringify(data) : null;
        break;
      
      case 'photo':
        url = type === 'CREATE' ? '/api/photos' : `/api/photos/${data.id}`;
        method = type === 'CREATE' ? 'POST' : type === 'UPDATE' ? 'PUT' : 'DELETE';
        // For photos, we need to handle FormData
        if (type !== 'DELETE' && data.formData) {
          body = data.formData;
        } else if (type !== 'DELETE') {
          body = JSON.stringify(data);
        }
        break;
    }

    const headers: Record<string, string> = {};
    if (body && typeof body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update local storage if the sync was successful
    await this.updateLocalData(item);
  }

  private async updateLocalData(item: SyncQueueItem): Promise<void> {
    const { type, entity, data } = item;
    
    // Update the local data based on the synced item
    const localData = JSON.parse(localStorage.getItem(`${entity}s`) || '[]');
    
    switch (type) {
      case 'CREATE':
        // The server response should include the ID
        localData.push(data);
        break;
      
      case 'UPDATE':
        const updateIndex = localData.findIndex((item: any) => item.id === data.id);
        if (updateIndex !== -1) {
          localData[updateIndex] = data;
        }
        break;
      
      case 'DELETE':
        const deleteIndex = localData.findIndex((item: any) => item.id === data.id);
        if (deleteIndex !== -1) {
          localData.splice(deleteIndex, 1);
        }
        break;
    }
    
    localStorage.setItem(`${entity}s`, JSON.stringify(localData));
  }

  private async removeFromQueue(id: string): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    await store.delete(id);
  }

  private async updateRetryCount(item: SyncQueueItem): Promise<void> {
    if (!this.db) return;
    
    const updatedItem = {
      ...item,
      retryCount: item.retryCount + 1,
      lastRetry: Date.now()
    };
    
    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    await store.put(updatedItem);
  }

  async getSyncStats(): Promise<SyncStats> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const items: SyncQueueItem[] = request.result;
        const pending = items.filter(item => item.retryCount < this.maxRetries).length;
        const failed = items.filter(item => item.retryCount >= this.maxRetries).length;
        
        resolve({
          pending,
          completed: 0, // We remove completed items, so this is always 0
          failed,
          lastSync: items.length > 0 ? Math.max(...items.map(item => item.timestamp)) : undefined
        });
      };
    });
  }

  async clearFailedItems(): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();
    
    request.onsuccess = async () => {
      const items: SyncQueueItem[] = request.result;
      const failedItems = items.filter(item => item.retryCount >= this.maxRetries);
      
      for (const item of failedItems) {
        await store.delete(item.id);
      }
    };
  }

  async storeOfflineData(key: string, data: any): Promise<void> {
    if (!this.db) await this.initDB();
    
    const transaction = this.db!.transaction(['offlineData'], 'readwrite');
    const store = transaction.objectStore('offlineData');
    await store.put({ key, data, timestamp: Date.now() });
  }

  async getOfflineData(key: string): Promise<any> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const request = store.get(key);
      
      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };
      
      request.onerror = () => {
        resolve(null);
      };
    });
  }

  isOffline(): boolean {
    return !this.isOnline;
  }

  // Force sync (useful for manual sync triggers)
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    }
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService();