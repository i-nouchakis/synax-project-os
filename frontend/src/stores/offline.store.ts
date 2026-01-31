import { create } from 'zustand';
import { db, getPendingMutations, getPendingImages, getDatabaseStats } from '@/lib/db';

interface OfflineState {
  // Connection status
  isOnline: boolean;
  lastOnlineAt: number | null;

  // Sync status
  isSyncing: boolean;
  syncProgress: number;
  lastSyncAt: number | null;
  syncError: string | null;

  // Pending changes
  pendingMutations: number;
  pendingImages: number;

  // Database stats
  cachedProjects: number;
  cachedFloors: number;
  cachedRooms: number;
  cachedAssets: number;

  // Actions
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
  setSyncError: (error: string | null) => void;
  updatePendingCounts: () => Promise<void>;
  updateDatabaseStats: () => Promise<void>;
  syncNow: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  // Initial state
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastOnlineAt: null,
  isSyncing: false,
  syncProgress: 0,
  lastSyncAt: null,
  syncError: null,
  pendingMutations: 0,
  pendingImages: 0,
  cachedProjects: 0,
  cachedFloors: 0,
  cachedRooms: 0,
  cachedAssets: 0,

  setOnline: (online) => {
    set({
      isOnline: online,
      lastOnlineAt: online ? Date.now() : get().lastOnlineAt,
    });

    // Auto-sync when coming back online
    if (online && get().pendingMutations > 0) {
      get().syncNow();
    }
  },

  setSyncing: (syncing) => set({ isSyncing: syncing }),

  setSyncProgress: (progress) => set({ syncProgress: progress }),

  setSyncError: (error) => set({ syncError: error }),

  updatePendingCounts: async () => {
    try {
      const mutations = await getPendingMutations();
      const images = await getPendingImages();
      set({
        pendingMutations: mutations.length,
        pendingImages: images.length,
      });
    } catch (error) {
      console.error('Failed to update pending counts:', error);
    }
  },

  updateDatabaseStats: async () => {
    try {
      const stats = await getDatabaseStats();
      set({
        cachedProjects: stats.projects,
        cachedFloors: stats.floors,
        cachedRooms: stats.rooms,
        cachedAssets: stats.assets,
        pendingMutations: stats.pendingMutations,
        pendingImages: stats.pendingImages,
      });
    } catch (error) {
      console.error('Failed to update database stats:', error);
    }
  },

  syncNow: async () => {
    const state = get();
    if (!state.isOnline || state.isSyncing) return;

    set({ isSyncing: true, syncProgress: 0, syncError: null });

    try {
      const mutations = await getPendingMutations();
      const total = mutations.length;

      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];

        try {
          // Update mutation status to syncing
          await db.mutations.update(mutation.id!, { status: 'syncing' });

          // Perform the actual sync based on mutation type
          await syncMutation(mutation);

          // Remove successful mutation
          await db.mutations.delete(mutation.id!);

          set({ syncProgress: ((i + 1) / total) * 100 });
        } catch (error) {
          // Mark as failed and increment retry count
          await db.mutations.update(mutation.id!, {
            status: 'failed',
            retryCount: (mutation.retryCount || 0) + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Sync pending images
      const images = await getPendingImages();
      for (const image of images) {
        try {
          await db.images.update(image.id!, { status: 'syncing' });
          await syncImage(image);
          await db.images.delete(image.id!);
        } catch (error) {
          await db.images.update(image.id!, {
            status: 'failed',
          });
        }
      }

      set({
        isSyncing: false,
        syncProgress: 100,
        lastSyncAt: Date.now(),
      });

      // Update counts
      await get().updatePendingCounts();
    } catch (error) {
      set({
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Sync failed',
      });
    }
  },
}));

// Sync a single mutation to the server
async function syncMutation(mutation: {
  entityType: string;
  entityId: string;
  action: string;
  data: Record<string, unknown>;
}): Promise<void> {
  const token = localStorage.getItem('synax_token');
  const baseUrl = '/api';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let url = '';
  let method = '';
  let body: string | undefined;

  const { entityType, entityId, action, data } = mutation;

  switch (entityType) {
    case 'checklistItem':
      if (action === 'update') {
        url = `${baseUrl}/checklists/items/${entityId}`;
        method = 'PUT';
        body = JSON.stringify(data);
      }
      break;

    case 'asset':
      if (action === 'update') {
        url = `${baseUrl}/assets/${entityId}`;
        method = 'PUT';
        body = JSON.stringify(data);
      } else if (action === 'create') {
        url = `${baseUrl}/assets/rooms/${data.roomId}`;
        method = 'POST';
        body = JSON.stringify(data);
      }
      break;

    case 'issue':
      if (action === 'create') {
        url = `${baseUrl}/issues`;
        method = 'POST';
        body = JSON.stringify(data);
      } else if (action === 'update') {
        url = `${baseUrl}/issues/${entityId}`;
        method = 'PUT';
        body = JSON.stringify(data);
      }
      break;

    case 'room':
      if (action === 'update') {
        url = `${baseUrl}/rooms/${entityId}`;
        method = 'PUT';
        body = JSON.stringify(data);
      }
      break;

    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }

  if (!url) {
    throw new Error(`No sync handler for ${entityType}/${action}`);
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
}

// Sync a pending image upload
async function syncImage(image: {
  entityType: string;
  entityId: string;
  blob: Blob;
  filename: string;
}): Promise<void> {
  const token = localStorage.getItem('synax_token');
  const baseUrl = '/api';

  const formData = new FormData();
  formData.append('file', image.blob, image.filename);

  let url = '';

  switch (image.entityType) {
    case 'checklistItem':
      url = `${baseUrl}/checklists/items/${image.entityId}/photos`;
      break;
    case 'issue':
      url = `${baseUrl}/issues/${image.entityId}/photos`;
      break;
    default:
      throw new Error(`Unknown image entity type: ${image.entityType}`);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Image upload failed: ${response.status}`);
  }
}

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnline(false);
  });

  // Initial stats update
  useOfflineStore.getState().updateDatabaseStats();
}
