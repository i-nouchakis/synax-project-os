import { api } from '@/lib/api';

export type ChecklistType = 'CABLING' | 'EQUIPMENT' | 'CONFIG' | 'DOCUMENTATION';
export type ChecklistStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ChecklistPhoto {
  id: string;
  photoUrl: string;
  caption?: string;
  uploadedAt: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
  requiresPhoto: boolean;
  completed: boolean;
  completedById?: string;
  completedAt?: string;
  order: number;
  photos: ChecklistPhoto[];
}

export interface Checklist {
  id: string;
  assetId: string;
  type: ChecklistType;
  status: ChecklistStatus;
  assignedToId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  items: ChecklistItem[];
  assignedTo?: {
    id: string;
    name: string;
    email?: string;
  };
  asset?: {
    id: string;
    name: string;
    assetType?: {
      id: string;
      name: string;
    };
    room?: {
      id: string;
      name: string;
      floor?: {
        id: string;
        name: string;
        project?: {
          id: string;
          name: string;
        };
      };
    };
  };
}

interface ChecklistsResponse {
  checklists: Checklist[];
}

interface ChecklistResponse {
  checklist: Checklist;
}

interface ChecklistItemResponse {
  item: ChecklistItem;
}

interface PhotoResponse {
  photo: ChecklistPhoto;
}

export const checklistService = {
  // Get all checklists for an asset
  async getByAsset(assetId: string): Promise<Checklist[]> {
    const response = await api.get<ChecklistsResponse>(`/checklists/asset/${assetId}`);
    return response.checklists;
  },

  // Get checklist by ID
  async getById(id: string): Promise<Checklist> {
    const response = await api.get<ChecklistResponse>(`/checklists/${id}`);
    return response.checklist;
  },

  // Create checklist for asset
  async create(assetId: string, type: ChecklistType, assignedToId?: string): Promise<Checklist> {
    const response = await api.post<ChecklistResponse>(`/checklists/asset/${assetId}`, {
      type,
      assignedToId,
    });
    return response.checklist;
  },

  // Generate all checklists for asset
  async generateAll(assetId: string): Promise<{ checklists: Checklist[]; created: number }> {
    const response = await api.post<{ checklists: Checklist[]; created: number }>(
      `/checklists/asset/${assetId}/generate-all`
    );
    return response;
  },

  // Update checklist (assign user, change status)
  async update(id: string, data: { assignedToId?: string; status?: ChecklistStatus }): Promise<Checklist> {
    const response = await api.put<ChecklistResponse>(`/checklists/${id}`, data);
    return response.checklist;
  },

  // Toggle checklist item completion
  async toggleItem(itemId: string, completed: boolean): Promise<ChecklistItem> {
    const response = await api.put<ChecklistItemResponse>(`/checklists/items/${itemId}`, {
      completed,
    });
    return response.item;
  },

  // Add photo to checklist item
  async addPhoto(itemId: string, photoUrl: string, caption?: string): Promise<ChecklistPhoto> {
    const response = await api.post<PhotoResponse>(`/checklists/items/${itemId}/photos`, {
      photoUrl,
      caption,
    });
    return response.photo;
  },

  // Delete photo
  async deletePhoto(photoId: string): Promise<void> {
    await api.delete(`/checklists/photos/${photoId}`);
  },

  // Delete checklist
  async delete(id: string): Promise<void> {
    await api.delete(`/checklists/${id}`);
  },
};

// Helper to get checklist type label
export const checklistTypeLabels: Record<ChecklistType, string> = {
  CABLING: 'Cabling',
  EQUIPMENT: 'Equipment',
  CONFIG: 'Configuration',
  DOCUMENTATION: 'Documentation',
};

// Helper to get status colors
export const checklistStatusColors: Record<ChecklistStatus, string> = {
  NOT_STARTED: 'default',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
};
