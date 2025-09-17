import { useState, useEffect } from 'react';
import syncService from '@/lib/sync-service';

interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
  isOnline: boolean;
}

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    isOnline: true
  });

  useEffect(() => {
    // Subscribe to sync status updates
    const unsubscribe = syncService.subscribe((newStatus) => {
      setStatus(newStatus);
      
      // Update pending changes count
      syncService.getPendingChangesCount().then(count => {
        setStatus(prev => ({ ...prev, pendingChanges: count }));
      });
    });

    // Get initial pending changes count
    syncService.getPendingChangesCount().then(count => {
      setStatus(prev => ({ ...prev, pendingChanges: count }));
    });

    return unsubscribe;
  }, []);

  const forceSync = async () => {
    await syncService.forceSync();
  };

  const clearOfflineData = async () => {
    await syncService.clearOfflineData();
  };

  return {
    ...status,
    forceSync,
    clearOfflineData
  };
}