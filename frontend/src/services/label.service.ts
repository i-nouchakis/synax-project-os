import { api } from '@/lib/api';

export type LabelType = 'CABLE' | 'RACK' | 'ASSET' | 'ROOM';
export type LabelStatus = 'AVAILABLE' | 'PRINTED' | 'ASSIGNED';

export interface Label {
  id: string;
  projectId: string;
  code: string;
  type: LabelType;
  status: LabelStatus;
  assetId?: string | null;
  createdAt: string;
  printedAt?: string | null;
  assignedAt?: string | null;
  asset?: {
    id: string;
    name: string;
    status: string;
  } | null;
}

export interface CreateLabelData {
  code: string;
  type?: LabelType;
}

export interface CreateBatchData {
  type?: LabelType;
  prefix: string;
  startNumber: number;
  count: number;
  padding?: number;
}

export interface BatchResponse {
  labels: Label[];
  created: number;
  skipped: number;
  skippedCodes: string[];
}

export const LABEL_TYPE_LABELS: Record<LabelType, string> = {
  CABLE: 'Cable',
  RACK: 'Rack',
  ASSET: 'Asset',
  ROOM: 'Room',
};

export const LABEL_TYPE_PREFIXES: Record<LabelType, string> = {
  CABLE: 'CBL',
  RACK: 'RCK',
  ASSET: 'AST',
  ROOM: 'RM',
};

export const LABEL_STATUS_LABELS: Record<LabelStatus, string> = {
  AVAILABLE: 'Available',
  PRINTED: 'Printed',
  ASSIGNED: 'Assigned',
};

export const LABEL_STATUS_COLORS: Record<LabelStatus, string> = {
  AVAILABLE: 'bg-surface-hover text-text-secondary',
  PRINTED: 'bg-info/10 text-info',
  ASSIGNED: 'bg-success/10 text-success',
};

export const labelService = {
  // Get all labels for a project
  async getByProject(projectId: string): Promise<Label[]> {
    const response = await api.get<{ labels: Label[] }>(`/labels/project/${projectId}`);
    return response.labels;
  },

  // Get available labels for a project (not assigned)
  async getAvailable(projectId: string): Promise<Label[]> {
    const response = await api.get<{ labels: Label[] }>(`/labels/project/${projectId}/available`);
    return response.labels;
  },

  // Create a single label
  async create(projectId: string, data: CreateLabelData): Promise<Label> {
    const response = await api.post<{ label: Label }>(`/labels/project/${projectId}`, data);
    return response.label;
  },

  // Create a batch of labels
  async createBatch(projectId: string, data: CreateBatchData): Promise<BatchResponse> {
    const response = await api.post<BatchResponse>(`/labels/project/${projectId}/batch`, data);
    return response;
  },

  // Assign label to asset
  async assign(labelId: string, assetId: string): Promise<Label> {
    const response = await api.put<{ label: Label }>(`/labels/${labelId}/assign/${assetId}`);
    return response.label;
  },

  // Unassign label from asset
  async unassign(labelId: string): Promise<Label> {
    const response = await api.put<{ label: Label }>(`/labels/${labelId}/unassign`);
    return response.label;
  },

  // Mark single label as printed
  async markPrinted(labelId: string): Promise<Label> {
    const response = await api.put<{ label: Label }>(`/labels/${labelId}/mark-printed`);
    return response.label;
  },

  // Mark multiple labels as printed
  async markPrintedBatch(ids: string[]): Promise<Label[]> {
    const response = await api.put<{ labels: Label[] }>(`/labels/mark-printed-batch`, { ids });
    return response.labels;
  },

  // Delete a label (only if not assigned)
  async delete(labelId: string): Promise<void> {
    await api.delete(`/labels/${labelId}`);
  },

  // Delete multiple labels (only if not assigned)
  async deleteBatch(ids: string[]): Promise<number> {
    const response = await api.delete<{ deleted: number }>(`/labels/batch`, { ids });
    return response.deleted;
  },
};

export default labelService;
