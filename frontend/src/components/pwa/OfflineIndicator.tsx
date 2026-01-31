import { useOfflineStore } from '@/stores/offline.store';
import { Wifi, WifiOff, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';

export function OfflineIndicator() {
  const {
    isOnline,
    isSyncing,
    syncProgress,
    pendingMutations,
    syncError,
    syncNow,
  } = useOfflineStore();

  // Don't show anything if online with no pending changes
  if (isOnline && pendingMutations === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Offline badge */}
      {!isOnline && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-warning/20 text-warning rounded-md text-body-sm">
          <WifiOff size={14} />
          <span>Offline</span>
        </div>
      )}

      {/* Syncing indicator */}
      {isSyncing && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 text-primary rounded-md text-body-sm">
          <RefreshCw size={14} className="animate-spin" />
          <span>Syncing {Math.round(syncProgress)}%</span>
        </div>
      )}

      {/* Pending changes badge */}
      {!isSyncing && pendingMutations > 0 && (
        <button
          onClick={() => syncNow()}
          disabled={!isOnline}
          className="flex items-center gap-1.5 px-2 py-1 bg-surface-secondary text-text-secondary hover:bg-surface-hover rounded-md text-body-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isOnline ? 'Click to sync now' : 'Waiting for connection'}
        >
          <CloudOff size={14} />
          <span>{pendingMutations} pending</span>
        </button>
      )}

      {/* Sync error */}
      {syncError && !isSyncing && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-error/20 text-error rounded-md text-body-sm">
          <AlertCircle size={14} />
          <span>Sync failed</span>
        </div>
      )}
    </div>
  );
}

// Compact version for mobile
export function OfflineIndicatorCompact() {
  const { isOnline, isSyncing, pendingMutations } = useOfflineStore();

  if (isOnline && pendingMutations === 0 && !isSyncing) {
    return (
      <div className="text-success" title="Online">
        <Wifi size={16} />
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="text-warning" title="Offline">
        <WifiOff size={16} />
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="text-primary" title="Syncing...">
        <RefreshCw size={16} className="animate-spin" />
      </div>
    );
  }

  if (pendingMutations > 0) {
    return (
      <div className="text-warning" title={`${pendingMutations} pending changes`}>
        <CloudOff size={16} />
      </div>
    );
  }

  return (
    <div className="text-success">
      <Check size={16} />
    </div>
  );
}
