import { api } from '../lib/api';

// Types
export interface LookupRoomType {
  id: string;
  name: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface LookupInventoryUnit {
  id: string;
  name: string;
  abbreviation: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface LookupIssueCause {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface LookupManufacturer {
  id: string;
  name: string;
  website?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  _count?: { models: number };
}

export interface LookupAssetModel {
  id: string;
  manufacturerId: string;
  name: string;
  icon?: string;
  assetTypeId?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  manufacturer?: { id: string; name: string };
  assetType?: { id: string; name: string };
}

// Room Types
export const roomTypeService = {
  getAll: () => api.get<{ items: LookupRoomType[] }>('/lookups/room-types'),
  getAllAdmin: () => api.get<{ items: LookupRoomType[] }>('/lookups/room-types/all'),
  create: (data: { name: string; icon?: string; order?: number }) =>
    api.post<{ item: LookupRoomType }>('/lookups/room-types', data),
  update: (id: string, data: Partial<{ name: string; icon?: string; order?: number }>) =>
    api.put<{ item: LookupRoomType }>(`/lookups/room-types/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/lookups/room-types/${id}`),
  toggleActive: (id: string, isActive: boolean) =>
    api.put<{ item: LookupRoomType }>(`/lookups/room-types/${id}`, { isActive }),
};

// Inventory Units
export const inventoryUnitService = {
  getAll: () => api.get<{ items: LookupInventoryUnit[] }>('/lookups/inventory-units'),
  getAllAdmin: () => api.get<{ items: LookupInventoryUnit[] }>('/lookups/inventory-units/all'),
  create: (data: { name: string; abbreviation: string; order?: number }) =>
    api.post<{ item: LookupInventoryUnit }>('/lookups/inventory-units', data),
  update: (id: string, data: Partial<{ name: string; abbreviation?: string; order?: number }>) =>
    api.put<{ item: LookupInventoryUnit }>(`/lookups/inventory-units/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/lookups/inventory-units/${id}`),
  toggleActive: (id: string, isActive: boolean) =>
    api.put<{ item: LookupInventoryUnit }>(`/lookups/inventory-units/${id}`, { isActive }),
};

// Issue Causes
export const issueCauseService = {
  getAll: () => api.get<{ items: LookupIssueCause[] }>('/lookups/issue-causes'),
  getAllAdmin: () => api.get<{ items: LookupIssueCause[] }>('/lookups/issue-causes/all'),
  create: (data: { name: string; order?: number }) =>
    api.post<{ item: LookupIssueCause }>('/lookups/issue-causes', data),
  update: (id: string, data: Partial<{ name: string; order?: number }>) =>
    api.put<{ item: LookupIssueCause }>(`/lookups/issue-causes/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/lookups/issue-causes/${id}`),
  toggleActive: (id: string, isActive: boolean) =>
    api.put<{ item: LookupIssueCause }>(`/lookups/issue-causes/${id}`, { isActive }),
};

// Manufacturers
export const manufacturerService = {
  getAll: () => api.get<{ items: LookupManufacturer[] }>('/lookups/manufacturers'),
  getAllAdmin: () => api.get<{ items: LookupManufacturer[] }>('/lookups/manufacturers/all'),
  create: (data: { name: string; website?: string; order?: number }) =>
    api.post<{ item: LookupManufacturer }>('/lookups/manufacturers', data),
  update: (id: string, data: Partial<{ name: string; website?: string; order?: number }>) =>
    api.put<{ item: LookupManufacturer }>(`/lookups/manufacturers/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/lookups/manufacturers/${id}`),
  toggleActive: (id: string, isActive: boolean) =>
    api.put<{ item: LookupManufacturer }>(`/lookups/manufacturers/${id}`, { isActive }),
};

// Asset Models
export const assetModelService = {
  getAll: (params?: { manufacturerId?: string; assetTypeId?: string }) => {
    const query = new URLSearchParams();
    if (params?.manufacturerId) query.append('manufacturerId', params.manufacturerId);
    if (params?.assetTypeId) query.append('assetTypeId', params.assetTypeId);
    const queryStr = query.toString();
    return api.get<{ items: LookupAssetModel[] }>(`/lookups/asset-models${queryStr ? `?${queryStr}` : ''}`);
  },
  getAllAdmin: () => api.get<{ items: LookupAssetModel[] }>('/lookups/asset-models/all'),
  create: (data: { manufacturerId: string; name: string; icon?: string; assetTypeId?: string; order?: number }) =>
    api.post<{ item: LookupAssetModel }>('/lookups/asset-models', data),
  update: (id: string, data: Partial<{ manufacturerId?: string; name?: string; icon?: string; assetTypeId?: string; order?: number }>) =>
    api.put<{ item: LookupAssetModel }>(`/lookups/asset-models/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/lookups/asset-models/${id}`),
  toggleActive: (id: string, isActive: boolean) =>
    api.put<{ item: LookupAssetModel }>(`/lookups/asset-models/${id}`, { isActive }),
};
