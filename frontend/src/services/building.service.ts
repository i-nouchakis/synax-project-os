import { api } from '../lib/api';

export interface Building {
  id: string;
  name: string;
  description?: string;
  floorplanUrl?: string;
  floorplanType?: string;
  pinX?: number;
  pinY?: number;
  projectId: string;
  project?: {
    id: string;
    name: string;
  };
  floors?: BuildingFloor[];
  _count?: {
    floors: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BuildingFloor {
  id: string;
  name: string;
  level: number;
  floorplanUrl?: string;
  floorplanType?: string;
  pinX?: number;
  pinY?: number;
  buildingId: string;
  _count?: {
    rooms: number;
  };
}

export interface CreateBuildingData {
  name: string;
  description?: string;
}

export interface UpdateBuildingData {
  name?: string;
  description?: string;
}

export const buildingService = {
  // Get all buildings (optionally filtered by project)
  async getAll(projectId?: string): Promise<Building[]> {
    const params = projectId ? `?projectId=${projectId}` : '';
    const response = await api.get<{ buildings: Building[] }>(`/buildings${params}`);
    return response.buildings;
  },

  // Get buildings by project
  async getByProject(projectId: string): Promise<Building[]> {
    const response = await api.get<{ buildings: Building[] }>(`/buildings/project/${projectId}`);
    return response.buildings;
  },

  // Get building by ID
  async getById(id: string): Promise<Building> {
    const response = await api.get<{ building: Building }>(`/buildings/${id}`);
    return response.building;
  },

  // Create building
  async create(projectId: string, data: CreateBuildingData): Promise<Building> {
    const response = await api.post<{ building: Building }>(`/buildings/project/${projectId}`, data);
    return response.building;
  },

  // Update building
  async update(id: string, data: UpdateBuildingData): Promise<Building> {
    const response = await api.put<{ building: Building }>(`/buildings/${id}`, data);
    return response.building;
  },

  // Delete building
  async delete(id: string): Promise<void> {
    await api.delete(`/buildings/${id}`);
  },

  // Update building position on masterplan
  async updatePosition(id: string, pinX: number | null, pinY: number | null): Promise<Building> {
    const response = await api.put<{ building: Building }>(`/buildings/${id}/position`, { pinX, pinY });
    return response.building;
  },
};
