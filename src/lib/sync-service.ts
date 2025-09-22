import offlineDB, { type SyncQueueItem, type VocabularyItem } from './offline-db';
import { getUserId } from './auth';
import { apiFetch } from '@/lib/api-client';

interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
  isOnline: boolean;
}

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private lastSyncTime: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Initialize offline DB
    offlineDB.init();

    // Listen for network status changes
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Check initial network status
    this.isOnline = navigator.onLine;

    // Start periodic sync if online
    if (this.isOnline) {
      this.startPeriodicSync();
    }

    // Initial sync
    this.sync();
  }

  private handleOnline = () => {
    console.log('Network: Online');
    this.isOnline = true;
    this.notifyListeners();
    
    // Sync immediately when coming online
    this.sync();
    
    // Start periodic sync
    this.startPeriodicSync();
  };

  private handleOffline = () => {
    console.log('Network: Offline');
    this.isOnline = false;
    this.notifyListeners();
    
    // Stop periodic sync when offline
    this.stopPeriodicSync();
  };

  private startPeriodicSync() {
    this.stopPeriodicSync();
    
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync();
      }
    }, 30000);
  }

  private stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async sync(): Promise<void> {
    if (!this.isOnline || this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const userId = getUserId();
      const syncQueue = await offlineDB.getSyncQueue();
      
      console.log(`Syncing ${syncQueue.length} items...`);

      // Process sync queue
      for (const item of syncQueue) {
        if (item.retries >= 3) {
          // Skip items that have failed too many times
          console.error('Skipping item after 3 retries:', item);
          await offlineDB.removeSyncQueueItem(item.id);
          continue;
        }

        try {
          await this.processSyncItem(item, userId);
          await offlineDB.removeSyncQueueItem(item.id);
        } catch (error) {
          console.error('Sync item failed:', error);
          await offlineDB.incrementSyncRetries(item.id);
        }
      }

      // Pull latest data from server
      await this.pullServerData(userId);
      
      this.lastSyncTime = Date.now();
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private async processSyncItem(item: SyncQueueItem, userId: string): Promise<void> {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': userId
    };

    switch (item.entity) {
      case 'vocabulary':
        switch (item.action) {
          case 'add':
            await apiFetch('/api/vocabulary', {
              method: 'POST',
              headers,
              body: JSON.stringify(item.data)
            });
            break;
          
          case 'update':
            await apiFetch(`/api/vocabulary/${item.data.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify(item.data)
            });
            break;
          
          case 'delete':
            await apiFetch(`/api/vocabulary/${item.data.id}`, {
              method: 'DELETE',
              headers
            });
            break;
        }
        break;

    }
  }

  private async pullServerData(userId: string): Promise<void> {
    try {
      // Fetch vocabulary from server
      const response = await apiFetch('/api/vocabulary', {
        headers: {
          'x-user-id': userId
        }
      });

      if (response.ok) {
        const serverData = await response.json();
        await offlineDB.mergeServerData(serverData);
      }
    } catch (error) {
      console.error('Failed to pull server data:', error);
    }
  }

  // Public methods for components to use
  async addWord(word: Omit<VocabularyItem, 'synced' | 'updatedAt'>): Promise<void> {
    // Add to IndexedDB immediately
    await offlineDB.addVocabularyWord(word);

    // Try to sync if online
    if (this.isOnline) {
      this.sync();
    }
  }

  async updateWord(id: string, updates: Partial<VocabularyItem>): Promise<void> {
    // Update in IndexedDB immediately
    await offlineDB.updateVocabularyWord(id, updates);

    // Try to sync if online
    if (this.isOnline) {
      this.sync();
    }
  }

  async deleteWord(id: string): Promise<void> {
    // Delete from IndexedDB immediately
    await offlineDB.deleteVocabularyWord(id);

    // Try to sync if online
    if (this.isOnline) {
      this.sync();
    }
  }

  async getVocabulary(): Promise<VocabularyItem[]> {
    const userId = getUserId();
    return offlineDB.getVocabulary(userId);
  }


  // Subscribe to sync status changes
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    
    // Send initial status
    listener(this.getStatus());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  getStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingChanges: 0, // Will be calculated from sync queue
      isOnline: this.isOnline
    };
  }

  async getPendingChangesCount(): Promise<number> {
    const queue = await offlineDB.getSyncQueue();
    return queue.length;
  }

  // Manual sync trigger
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.sync();
    }
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    await offlineDB.clearAll();
    this.lastSyncTime = null;
    this.notifyListeners();
  }

  // Cleanup
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      this.stopPeriodicSync();
    }
  }
}

// Singleton instance
const syncService = new SyncService();
export default syncService;