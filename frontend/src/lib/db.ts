import Dexie, { type Table } from 'dexie';

// Types for offline storage
export interface OfflineProject {
  id: string;
  name: string;
  description?: string;
  clientName: string;
  location?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    floors: number;
    members: number;
    issues: number;
  };
  syncedAt?: number;
}

export interface OfflineFloor {
  id: string;
  projectId: string;
  name: string;
  level: number;
  floorplanUrl?: string;
  floorplanType?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    rooms: number;
  };
  syncedAt?: number;
}

export interface OfflineRoom {
  id: string;
  floorId: string;
  name: string;
  type?: string;
  pinX?: number;
  pinY?: number;
  status: string;
  notes?: string;
  floorplanUrl?: string;
  floorplanType?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    assets: number;
    issues: number;
  };
  syncedAt?: number;
}

export interface OfflineAsset {
  id: string;
  roomId: string;
  assetTypeId?: string;
  name: string;
  model?: string;
  serialNumber?: string;
  macAddress?: string;
  ipAddress?: string;
  pinX?: number;
  pinY?: number;
  status: string;
  installedById?: string;
  installedAt?: string;
  createdAt: string;
  updatedAt: string;
  assetType?: {
    id: string;
    name: string;
    icon?: string;
  };
  syncedAt?: number;
}

export interface OfflineAssetType {
  id: string;
  name: string;
  icon?: string;
  syncedAt?: number;
}

export interface OfflineChecklist {
  id: string;
  assetId: string;
  type: string;
  status: string;
  assignedToId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: number;
}

export interface OfflineChecklistItem {
  id: string;
  checklistId: string;
  name: string;
  description?: string;
  isRequired: boolean;
  requiresPhoto: boolean;
  completed: boolean;
  completedById?: string;
  completedAt?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  syncedAt?: number;
}

export interface OfflineIssue {
  id: string;
  projectId: string;
  roomId?: string;
  title: string;
  description?: string;
  causedBy?: string;
  priority: string;
  status: string;
  createdById: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: number;
}

export interface OfflineUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  syncedAt?: number;
}

export interface OfflineMutation {
  id?: number;
  timestamp: number;
  entityType: 'project' | 'floor' | 'room' | 'asset' | 'checklist' | 'checklistItem' | 'issue';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  error?: string;
}

export interface OfflineImage {
  id?: number;
  timestamp: number;
  mutationId?: number;
  entityType: string;
  entityId: string;
  blob: Blob;
  filename: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

// Synax Offline Database
export class SynaxDatabase extends Dexie {
  // Tables
  projects!: Table<OfflineProject>;
  floors!: Table<OfflineFloor>;
  rooms!: Table<OfflineRoom>;
  assets!: Table<OfflineAsset>;
  assetTypes!: Table<OfflineAssetType>;
  checklists!: Table<OfflineChecklist>;
  checklistItems!: Table<OfflineChecklistItem>;
  issues!: Table<OfflineIssue>;
  users!: Table<OfflineUser>;
  mutations!: Table<OfflineMutation>;
  images!: Table<OfflineImage>;

  constructor() {
    super('synax-offline');

    this.version(1).stores({
      // Core entities
      projects: 'id, status, syncedAt',
      floors: 'id, projectId, level, syncedAt',
      rooms: 'id, floorId, status, syncedAt',
      assets: 'id, roomId, status, assetTypeId, syncedAt',
      assetTypes: 'id, syncedAt',

      // Checklists
      checklists: 'id, assetId, status, syncedAt',
      checklistItems: 'id, checklistId, completed, syncedAt',

      // Issues
      issues: 'id, projectId, roomId, status, priority, syncedAt',

      // Users
      users: 'id, syncedAt',

      // Offline queue
      mutations: '++id, timestamp, entityType, entityId, status',
      images: '++id, timestamp, mutationId, entityType, entityId, status',
    });
  }
}

// Database singleton
export const db = new SynaxDatabase();

// Helper functions
export async function clearAllData(): Promise<void> {
  await db.projects.clear();
  await db.floors.clear();
  await db.rooms.clear();
  await db.assets.clear();
  await db.assetTypes.clear();
  await db.checklists.clear();
  await db.checklistItems.clear();
  await db.issues.clear();
  await db.users.clear();
  await db.mutations.clear();
  await db.images.clear();
}

export async function getPendingMutations(): Promise<OfflineMutation[]> {
  return db.mutations.where('status').equals('pending').sortBy('timestamp');
}

export async function getFailedMutations(): Promise<OfflineMutation[]> {
  return db.mutations.where('status').equals('failed').toArray();
}

export async function getPendingImages(): Promise<OfflineImage[]> {
  return db.images.where('status').equals('pending').sortBy('timestamp');
}

export async function addMutation(
  entityType: OfflineMutation['entityType'],
  entityId: string,
  action: OfflineMutation['action'],
  data: Record<string, unknown>
): Promise<number> {
  return db.mutations.add({
    timestamp: Date.now(),
    entityType,
    entityId,
    action,
    data,
    status: 'pending',
    retryCount: 0,
  });
}

export async function updateMutationStatus(
  id: number,
  status: OfflineMutation['status'],
  error?: string
): Promise<void> {
  await db.mutations.update(id, { status, error });
}

export async function removeMutation(id: number): Promise<void> {
  await db.mutations.delete(id);
}

// Check if data needs refresh (older than 5 minutes)
export function needsRefresh(syncedAt?: number): boolean {
  if (!syncedAt) return true;
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return syncedAt < fiveMinutesAgo;
}

// Get database stats
export async function getDatabaseStats(): Promise<{
  projects: number;
  floors: number;
  rooms: number;
  assets: number;
  pendingMutations: number;
  pendingImages: number;
}> {
  const [projects, floors, rooms, assets, pendingMutations, pendingImages] = await Promise.all([
    db.projects.count(),
    db.floors.count(),
    db.rooms.count(),
    db.assets.count(),
    db.mutations.where('status').equals('pending').count(),
    db.images.where('status').equals('pending').count(),
  ]);

  return { projects, floors, rooms, assets, pendingMutations, pendingImages };
}
