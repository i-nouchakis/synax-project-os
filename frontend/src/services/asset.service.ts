import { api } from '@/lib/api';

export type AssetStatus = 'PLANNED' | 'IN_STOCK' | 'INSTALLED' | 'CONFIGURED' | 'VERIFIED' | 'FAULTY';

export interface AssetType {
  id: string;
  name: string;
  icon?: string;
  checklistTemplate?: {
    items: Array<{
      name: string;
      requiresPhoto: boolean;
    }>;
  };
  _count?: {
    assets: number;
  };
}

export interface Asset {
  id: string;
  name: string;
  labelCode?: string;
  model?: string;
  serialNumber?: string;
  macAddress?: string;
  ipAddress?: string;
  status: AssetStatus;
  notes?: string;
  projectId?: string | null;
  roomId?: string | null;
  floorId?: string | null;
  assetTypeId?: string;
  installedById?: string;
  installedAt?: string;
  pinX?: number | null;
  pinY?: number | null;
  createdAt: string;
  updatedAt: string;
  assetType?: AssetType;
  room?: {
    id: string;
    name: string;
    floorplanUrl?: string | null;
    floor?: {
      id: string;
      name: string;
      floorplanUrl?: string | null;
      building?: {
        id: string;
        name: string;
        project?: {
          id: string;
          name: string;
        };
      };
    };
  };
  floor?: {
    id: string;
    name: string;
    floorplanUrl?: string | null;
    building?: {
      id: string;
      name: string;
      project?: {
        id: string;
        name: string;
      };
    };
  };
  installedBy?: {
    id: string;
    name: string;
    email?: string;
  };
  _count?: {
    checklists: number;
  };
}

export interface CreateAssetData {
  name: string;
  labelCode?: string;
  assetTypeId?: string;
  model?: string;
  serialNumber?: string;
  macAddress?: string;
  ipAddress?: string;
  notes?: string;
  pinX?: number;
  pinY?: number;
  status?: AssetStatus;
}

export interface BulkEquipmentSerial {
  serialNumber?: string;
  macAddress?: string;
}

export interface CreateBulkEquipmentData {
  namePrefix: string;
  quantity: number;
  startNumber?: number;
  assetTypeId?: string;
  model?: string;
  notes?: string;
  serials?: BulkEquipmentSerial[];
  status?: AssetStatus;
}

interface BulkAssetsResponse {
  assets: Asset[];
  count: number;
}

export interface UpdateAssetData extends Partial<CreateAssetData> {
  status?: AssetStatus;
}

interface AssetsResponse {
  assets: Asset[];
}

interface AssetResponse {
  asset: Asset;
}

interface AssetTypesResponse {
  assetTypes: AssetType[];
}

export const assetService = {
  // Search assets
  async search(params?: { search?: string; status?: string; assetTypeId?: string }): Promise<Asset[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.assetTypeId) searchParams.set('assetTypeId', params.assetTypeId);

    const query = searchParams.toString();
    const response = await api.get<AssetsResponse>(`/assets${query ? `?${query}` : ''}`);
    return response.assets;
  },

  // Get asset types
  async getTypes(): Promise<AssetType[]> {
    const response = await api.get<AssetTypesResponse>('/assets/types');
    return response.assetTypes;
  },

  // Create asset type
  async createType(data: { name: string; icon?: string }): Promise<AssetType> {
    const response = await api.post<{ assetType: AssetType }>('/assets/types', data);
    return response.assetType;
  },

  // Get asset by ID
  async getById(id: string): Promise<Asset> {
    const response = await api.get<AssetResponse>(`/assets/${id}`);
    return response.asset;
  },

  // Get assets in room
  async getByRoom(roomId: string): Promise<Asset[]> {
    const response = await api.get<AssetsResponse>(`/assets/rooms/${roomId}`);
    return response.assets;
  },

  // Create asset in room
  async create(roomId: string, data: CreateAssetData): Promise<Asset> {
    const response = await api.post<AssetResponse>(`/assets/rooms/${roomId}`, data);
    return response.asset;
  },

  // Update asset
  async update(id: string, data: UpdateAssetData): Promise<Asset> {
    const response = await api.put<AssetResponse>(`/assets/${id}`, data);
    return response.asset;
  },

  // Delete asset
  async delete(id: string): Promise<void> {
    await api.delete(`/assets/${id}`);
  },

  // Update asset position on room floor plan
  async updatePosition(id: string, pinX: number | null, pinY: number | null): Promise<Asset> {
    const response = await api.put<AssetResponse>(`/assets/${id}/position`, { pinX, pinY });
    return response.asset;
  },

  // Search by QR code value (serial number or MAC address)
  async searchByCode(code: string): Promise<Asset | null> {
    try {
      const response = await api.get<AssetResponse>(`/assets/lookup/${encodeURIComponent(code)}`);
      return response.asset;
    } catch (err: unknown) {
      // Return null if not found (404)
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  // Search by label code (for QR scan)
  async getByLabelCode(labelCode: string): Promise<Asset | null> {
    try {
      const response = await api.get<AssetResponse>(`/assets/by-label/${encodeURIComponent(labelCode)}`);
      return response.asset;
    } catch (err: unknown) {
      // Return null if not found (404)
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  // Get assets directly in floor (not in rooms)
  async getByFloor(floorId: string): Promise<Asset[]> {
    const response = await api.get<AssetsResponse>(`/assets/floors/${floorId}`);
    return response.assets;
  },

  // Create asset directly in floor
  async createInFloor(floorId: string, data: CreateAssetData): Promise<Asset> {
    const response = await api.post<AssetResponse>(`/assets/floors/${floorId}`, data);
    return response.asset;
  },

  // === Project Equipment Methods ===

  // Get all equipment for a project (optionally filtered by status)
  async getByProject(projectId: string, status?: AssetStatus): Promise<Asset[]> {
    const params = status ? `?status=${status}` : '';
    const response = await api.get<AssetsResponse>(`/assets/projects/${projectId}${params}`);
    return response.assets;
  },

  // Get available (IN_STOCK) unassigned equipment for a project
  async getAvailableByProject(projectId: string): Promise<Asset[]> {
    const response = await api.get<AssetsResponse>(`/assets/projects/${projectId}/available`);
    return response.assets;
  },

  // Create new equipment in project inventory
  async createInProject(projectId: string, data: CreateAssetData): Promise<Asset> {
    const response = await api.post<AssetResponse>(`/assets/projects/${projectId}`, data);
    return response.asset;
  },

  // Create multiple equipment in project inventory (bulk)
  async createBulkInProject(projectId: string, data: CreateBulkEquipmentData): Promise<Asset[]> {
    const response = await api.post<BulkAssetsResponse>(`/assets/projects/${projectId}/bulk`, data);
    return response.assets;
  },

  // Assign equipment to a room with position
  async assignToRoom(assetId: string, roomId: string, pinX?: number, pinY?: number): Promise<Asset> {
    const response = await api.put<AssetResponse>(`/assets/${assetId}/assign`, {
      roomId,
      pinX,
      pinY,
    });
    return response.asset;
  },

  // Assign equipment to a floor with position
  async assignToFloor(assetId: string, floorId: string, pinX?: number, pinY?: number): Promise<Asset> {
    const response = await api.put<AssetResponse>(`/assets/${assetId}/assign`, {
      floorId,
      pinX,
      pinY,
    });
    return response.asset;
  },
};
