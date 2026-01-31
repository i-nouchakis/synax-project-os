import { api } from '@/lib/api';

export type InventoryAction = 'RECEIVED' | 'CONSUMED' | 'RETURNED' | 'ADJUSTED';

export interface InventoryLog {
  id: string;
  action: InventoryAction;
  quantity: number;
  serialNumbers: string[];
  notes?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface InventoryItem {
  id: string;
  projectId: string;
  itemType: string;
  description: string;
  unit: string;
  quantityReceived: number;
  quantityUsed: number;
  currentStock: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  logs?: InventoryLog[];
  _count?: {
    logs: number;
  };
}

export interface InventoryStats {
  totalItems: number;
  totalReceived: number;
  totalUsed: number;
  totalInStock: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export interface CreateInventoryItemData {
  projectId: string;
  itemType: string;
  description: string;
  unit?: string;
}

export interface UpdateInventoryItemData {
  itemType?: string;
  description?: string;
  unit?: string;
}

export interface AddLogData {
  action: InventoryAction;
  quantity: number;
  serialNumbers?: string[];
  notes?: string;
}

interface ItemsResponse {
  items: InventoryItem[];
}

interface ItemResponse {
  item: InventoryItem;
}

interface LogResponse {
  log: InventoryLog;
  currentStock: number;
}

interface LogsResponse {
  logs: InventoryLog[];
}

interface StatsResponse {
  stats: InventoryStats;
}

export const inventoryService = {
  // Get all inventory items
  async getAll(filters?: { projectId?: string; lowStock?: boolean }): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.lowStock) params.append('lowStock', 'true');

    const queryString = params.toString();
    const url = queryString ? `/inventory?${queryString}` : '/inventory';
    const response = await api.get<ItemsResponse>(url);
    return response.items;
  },

  // Get inventory item by ID
  async getById(id: string): Promise<InventoryItem> {
    const response = await api.get<ItemResponse>(`/inventory/${id}`);
    return response.item;
  },

  // Create inventory item
  async create(data: CreateInventoryItemData): Promise<InventoryItem> {
    const response = await api.post<ItemResponse>('/inventory', data);
    return response.item;
  },

  // Update inventory item
  async update(id: string, data: UpdateInventoryItemData): Promise<InventoryItem> {
    const response = await api.put<ItemResponse>(`/inventory/${id}`, data);
    return response.item;
  },

  // Delete inventory item
  async delete(id: string): Promise<void> {
    await api.delete(`/inventory/${id}`);
  },

  // Add stock movement log
  async addLog(itemId: string, data: AddLogData): Promise<{ log: InventoryLog; currentStock: number }> {
    const response = await api.post<LogResponse>(`/inventory/${itemId}/logs`, data);
    return response;
  },

  // Get logs for an item
  async getLogs(itemId: string): Promise<InventoryLog[]> {
    const response = await api.get<LogsResponse>(`/inventory/${itemId}/logs`);
    return response.logs;
  },

  // Get inventory statistics
  async getStats(): Promise<InventoryStats> {
    const response = await api.get<StatsResponse>('/inventory/stats/summary');
    return response.stats;
  },
};

// Helper labels
export const actionLabels: Record<InventoryAction, string> = {
  RECEIVED: 'Received',
  CONSUMED: 'Consumed',
  RETURNED: 'Returned',
  ADJUSTED: 'Adjusted',
};

export const actionColors: Record<InventoryAction, string> = {
  RECEIVED: 'success',
  CONSUMED: 'error',
  RETURNED: 'primary',
  ADJUSTED: 'warning',
};

// Common item types
export const commonItemTypes = [
  'Cable - Cat6',
  'Cable - Cat6A',
  'Cable - Fiber',
  'Patch Cord',
  'RJ45 Connector',
  'Patch Panel',
  'Wall Outlet',
  'Cable Tray',
  'Conduit',
  'Cable Ties',
  'Labels',
  'Screws & Anchors',
  'Access Point',
  'Switch',
  'Router',
  'UPS',
  'Rack',
  'Other',
];
