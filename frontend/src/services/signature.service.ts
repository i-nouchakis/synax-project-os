import { api } from '@/lib/api';

export type SignatureType = 'ROOM_HANDOVER' | 'STAGE_COMPLETION' | 'FINAL_ACCEPTANCE';

export interface Signature {
  id: string;
  projectId: string;
  roomId?: string;
  type: SignatureType;
  signatureData: string;
  signedByName: string;
  signedById?: string;
  signedAt: string;
  project?: {
    id: string;
    name: string;
  };
  room?: {
    id: string;
    name: string;
    floor?: {
      id: string;
      name: string;
    };
  };
  signedBy?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface CreateSignatureData {
  projectId: string;
  roomId?: string;
  type: SignatureType;
  signatureData: string;
  signedByName: string;
}

interface SignaturesResponse {
  signatures: Signature[];
}

interface SignatureResponse {
  signature: Signature;
}

export const signatureService = {
  // Get all signatures with optional filters
  async getAll(params?: {
    projectId?: string;
    roomId?: string;
    type?: SignatureType;
  }): Promise<Signature[]> {
    const searchParams = new URLSearchParams();
    if (params?.projectId) searchParams.set('projectId', params.projectId);
    if (params?.roomId) searchParams.set('roomId', params.roomId);
    if (params?.type) searchParams.set('type', params.type);

    const query = searchParams.toString();
    const response = await api.get<SignaturesResponse>(
      `/signatures${query ? `?${query}` : ''}`
    );
    return response.signatures;
  },

  // Get signatures for a project
  async getByProject(projectId: string): Promise<Signature[]> {
    const response = await api.get<SignaturesResponse>(
      `/signatures/project/${projectId}`
    );
    return response.signatures;
  },

  // Get signatures for a room
  async getByRoom(roomId: string): Promise<Signature[]> {
    const response = await api.get<SignaturesResponse>(
      `/signatures/room/${roomId}`
    );
    return response.signatures;
  },

  // Get signature by ID
  async getById(id: string): Promise<Signature> {
    const response = await api.get<SignatureResponse>(`/signatures/${id}`);
    return response.signature;
  },

  // Create new signature
  async create(data: CreateSignatureData): Promise<Signature> {
    const response = await api.post<SignatureResponse>('/signatures', data);
    return response.signature;
  },

  // Delete signature
  async delete(id: string): Promise<void> {
    await api.delete(`/signatures/${id}`);
  },
};
