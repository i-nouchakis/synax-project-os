import { api } from '@/lib/api';

export type ShapeType = 'RECTANGLE' | 'CIRCLE' | 'LINE' | 'ARROW' | 'TEXT' | 'FREEHAND' | 'POLYGON';
export type CableType = 'ETHERNET' | 'FIBER' | 'POWER' | 'COAXIAL' | 'HDMI' | 'USB' | 'PHONE' | 'OTHER';
export type RoutingMode = 'STRAIGHT' | 'ORTHOGONAL' | 'AUTO' | 'CUSTOM';

export interface ShapeData {
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  text?: string;
  rotation?: number;
}

export interface ShapeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  dash?: number[];
}

export interface DrawingShape {
  id: string;
  floorId?: string | null;
  roomId?: string | null;
  type: ShapeType;
  layer: string;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  data: ShapeData;
  style: ShapeStyle;
  createdAt: string;
  updatedAt: string;
}

export interface Cable {
  id: string;
  floorId?: string | null;
  roomId?: string | null;
  sourceAssetId?: string | null;
  targetAssetId?: string | null;
  cableType: CableType;
  routingMode: RoutingMode;
  routingPoints?: { x: number; y: number }[] | null;
  label?: string | null;
  color?: string | null;
  bundleId?: string | null;
  sourceAsset?: { id: string; name: string; pinX: number | null; pinY: number | null } | null;
  targetAsset?: { id: string; name: string; pinX: number | null; pinY: number | null } | null;
  bundle?: { id: string; name: string; color: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShapeData {
  floorId?: string | null;
  roomId?: string | null;
  type: ShapeType;
  layer?: string;
  zIndex?: number;
  data: ShapeData;
  style?: ShapeStyle;
}

export interface CreateCableData {
  floorId?: string | null;
  roomId?: string | null;
  sourceAssetId?: string | null;
  targetAssetId?: string | null;
  cableType?: CableType;
  routingMode?: RoutingMode;
  routingPoints?: { x: number; y: number }[] | null;
  label?: string | null;
  color?: string | null;
}

export const drawingService = {
  // Shapes
  async getShapes(params: { floorId?: string; roomId?: string }): Promise<DrawingShape[]> {
    const query = new URLSearchParams();
    if (params.floorId) query.set('floorId', params.floorId);
    if (params.roomId) query.set('roomId', params.roomId);
    const response = await api.get<{ shapes: DrawingShape[] }>(`/shapes?${query}`);
    return response.shapes;
  },

  async createShape(data: CreateShapeData): Promise<DrawingShape> {
    const response = await api.post<{ shape: DrawingShape }>('/shapes', data);
    return response.shape;
  },

  async updateShape(id: string, data: Partial<DrawingShape>): Promise<DrawingShape> {
    const response = await api.put<{ shape: DrawingShape }>(`/shapes/${id}`, data);
    return response.shape;
  },

  async deleteShape(id: string): Promise<void> {
    await api.delete(`/shapes/${id}`);
  },

  async deleteShapes(ids: string[]): Promise<void> {
    await api.post('/shapes/batch-delete', { ids });
  },

  // Cables
  async getCables(params: { floorId?: string; roomId?: string }): Promise<Cable[]> {
    const query = new URLSearchParams();
    if (params.floorId) query.set('floorId', params.floorId);
    if (params.roomId) query.set('roomId', params.roomId);
    const response = await api.get<{ cables: Cable[] }>(`/cables?${query}`);
    return response.cables;
  },

  async createCable(data: CreateCableData): Promise<Cable> {
    const response = await api.post<{ cable: Cable }>('/cables', data);
    return response.cable;
  },

  async updateCable(id: string, data: Partial<CreateCableData>): Promise<Cable> {
    const response = await api.put<{ cable: Cable }>(`/cables/${id}`, data);
    return response.cable;
  },

  async deleteCable(id: string): Promise<void> {
    await api.delete(`/cables/${id}`);
  },
};

// Cable type colors
export const CABLE_TYPE_COLORS: Record<CableType, string> = {
  ETHERNET: '#3b82f6',
  FIBER: '#f59e0b',
  POWER: '#ef4444',
  COAXIAL: '#8b5cf6',
  HDMI: '#06b6d4',
  USB: '#10b981',
  PHONE: '#6b7280',
  OTHER: '#9ca3af',
};
