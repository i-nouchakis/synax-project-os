import { api } from '@/lib/api';
import type { Asset } from './asset.service';

export type RoomStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export interface Room {
  id: string;
  name: string;
  type?: string;
  roomTypeIcon?: string | null;
  pinX?: number;
  pinY?: number;
  status: RoomStatus;
  notes?: string;
  floorId: string;
  floorplanUrl?: string | null;
  floorplanType?: string | null;
  createdAt: string;
  updatedAt: string;
  floor?: {
    id: string;
    name: string;
    level: number;
    building?: {
      id: string;
      name: string;
      project?: {
        id: string;
        name: string;
        clientName?: string;
      };
    };
  };
  assets?: Asset[];
  _count?: {
    assets: number;
    issues: number;
  };
}

export interface UpdateRoomData {
  name?: string;
  type?: string;
  pinX?: number | null;
  pinY?: number | null;
  notes?: string;
  status?: RoomStatus;
}

interface RoomResponse {
  room: Room;
}

interface RoomsResponse {
  rooms: Room[];
}

export const roomService = {
  // Get all rooms
  async getAll(): Promise<Room[]> {
    const response = await api.get<RoomsResponse>('/rooms');
    return response.rooms;
  },

  // Get room by ID with assets
  async getById(id: string): Promise<Room> {
    const response = await api.get<RoomResponse>(`/rooms/${id}`);
    return response.room;
  },

  // Update room
  async update(id: string, data: UpdateRoomData): Promise<Room> {
    const response = await api.put<RoomResponse>(`/rooms/${id}`, data);
    return response.room;
  },

  // Delete room
  async delete(id: string): Promise<void> {
    await api.delete(`/rooms/${id}`);
  },
};
