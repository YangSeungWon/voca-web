'use client';

import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';

export default function SyncStatus() {
  const { 
    isOnline, 
    isSyncing, 
    pendingChanges, 
    lastSyncTime, 
    forceSync,
    clearOfflineData 
  } = useOfflineSync();
  
  const [showDetails, setShowDetails] = useState(false);

  const formatLastSync = (time: number | null) => {
    if (!time) return 'Never';
    
    const now = Date.now();
    const diff = now - time;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (isSyncing) return 'text-blue-500';
    if (pendingChanges > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <CloudOff size={16} />;
    if (isSyncing) return <RefreshCw size={16} className="animate-spin" />;
    return <Cloud size={16} />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${getStatusColor()}`}
        title="Sync Status"
      >
        {getStatusIcon()}
        <span className="text-sm">
          {!isOnline ? 'Offline' : 
           isSyncing ? 'Syncing...' : 
           pendingChanges > 0 ? `${pendingChanges} pending` : 
           'Synced'}
        </span>
      </button>

      {showDetails && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
            <h3 className="font-semibold text-sm mb-3 text-gray-800 dark:text-gray-200">
              Sync Status
            </h3>
            
            <div className="space-y-3">
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Connection
                </span>
                <div className={`flex items-center gap-1 ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                  {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                  <span className="text-sm font-medium">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Sync Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Sync Status
                </span>
                <span className={`text-sm font-medium ${isSyncing ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {isSyncing ? 'Syncing...' : 'Idle'}
                </span>
              </div>

              {/* Pending Changes */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Pending Changes
                </span>
                <span className={`text-sm font-medium ${pendingChanges > 0 ? 'text-yellow-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {pendingChanges}
                </span>
              </div>

              {/* Last Sync */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Last Sync
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formatLastSync(lastSyncTime)}
                </span>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <button
                  onClick={async () => {
                    await forceSync();
                    setShowDetails(false);
                  }}
                  disabled={!isOnline || isSyncing}
                  className="w-full px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
                
                <button
                  onClick={async () => {
                    if (confirm('This will clear all offline data. Are you sure?')) {
                      await clearOfflineData();
                      setShowDetails(false);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Clear Offline Data
                </button>
              </div>

              {/* Info */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isOnline 
                    ? 'Your data is being synced automatically every 30 seconds.'
                    : 'Your changes will be synced when you reconnect to the internet.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}