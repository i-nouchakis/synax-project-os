import { api } from '@/lib/api';
import type { Asset } from './asset.service';

export type RoomStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface Room {
  id: string;
  name: string;
  type?: string;
  pinX?: number;
  pinY?: number;
  status: RoomStatus;
  notes?: string;
  floorId: string;
  floorplanUrl?: string | null;
  floorplanType?: string | null;
  createdAt: string;
  _count?: {
    assets: number;
    issues: number;
  };
}

export interface Floor {
  id: string;
  name: string;
  level: number;
  floorplanUrl?: string;
  floorplanType?: string;
  pinX?: number | null;
  pinY?: number | null;
  buildingId: string;
  createdAt: string;
  building?: {
    id: string;
    name: string;
    project?: {
      id: string;
      name: string;
      clientName?: string;
    };
  };
  rooms?: Room[];
  assets?: Asset[];
  _count?: {
    rooms: number;
  };
}

export interface CreateFloorData {
  buildingId: string;
  name: string;
  level?: number;
  pinX?: number;
  pinY?: number;
}

export interface UpdateFloorData {
  name?: string;
  level?: number;
  floorplanUrl?: string;
  floorplanType?: string;
}

export interface CreateRoomData {
  name: string;
  type?: string;
  pinX?: number;
  pinY?: number;
  notes?: string;
}

export interface UpdateRoomData extends Partial<CreateRoomData> {
  status?: RoomStatus;
}

interface FloorsResponse {
  floors: Floor[];
}

interface FloorResponse {
  floor: Floor;
}

interface RoomsResponse {
  rooms: Room[];
}

interface RoomResponse {
  room: Room;
}

export const floorService = {
  // Get all floors
  async getAll(): Promise<Floor[]> {
    const response = await api.get<FloorsResponse>('/floors');
    return response.floors;
  },

  // Get floor by ID with rooms
  async getById(id: string): Promise<Floor> {
    const response = await api.get<FloorResponse>(`/floors/${id}`);
    return response.floor;
  },

  // Create floor
  async create(data: CreateFloorData): Promise<Floor> {
    const response = await api.post<FloorResponse>('/floors', data);
    return response.floor;
  },

  // Update floor
  async update(id: string, data: UpdateFloorData): Promise<Floor> {
    const response = await api.put<FloorResponse>(`/floors/${id}`, data);
    return response.floor;
  },

  // Delete floor
  async delete(id: string): Promise<void> {
    await api.delete(`/floors/${id}`);
  },

  // Get rooms in floor
  async getRooms(floorId: string): Promise<Room[]> {
    const response = await api.get<RoomsResponse>(`/floors/${floorId}/rooms`);
    return response.rooms;
  },

  // Create room
  async createRoom(floorId: string, data: CreateRoomData): Promise<Room> {
    const response = await api.post<RoomResponse>(`/floors/${floorId}/rooms`, data);
    return response.room;
  },

  // Update room
  async updateRoom(floorId: string, roomId: string, data: UpdateRoomData): Promise<Room> {
    const response = await api.put<RoomResponse>(`/floors/${floorId}/rooms/${roomId}`, data);
    return response.room;
  },

  // Delete room
  async deleteRoom(floorId: string, roomId: string): Promise<void> {
    await api.delete(`/floors/${floorId}/rooms/${roomId}`);
  },

  // Update floor position on masterplan
  async updatePosition(id: string, pinX: number | null, pinY: number | null): Promise<Floor> {
    const response = await api.put<FloorResponse>(`/floors/${id}/position`, { pinX, pinY });
    return response.floor;
  },
};
