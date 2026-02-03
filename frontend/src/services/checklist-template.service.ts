import { api } from '@/lib/api';

export type ChecklistTemplateType = 'GENERAL' | 'CABLING' | 'EQUIPMENT' | 'CONFIG' | 'DOCUMENTATION';

export interface ChecklistTemplateItem {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  requiresPhoto: boolean;
  isRequired: boolean;
  order: number;
  createdAt: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  type: ChecklistTemplateType;
  assetTypeId?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: ChecklistTemplateItem[];
  assetType?: {
    id: string;
    name: string;
  };
  _count?: {
    checklists: number;
  };
}

interface TemplatesResponse {
  templates: ChecklistTemplate[];
}

interface TemplateResponse {
  template: ChecklistTemplate;
}


export interface CreateTemplateData {
  name: string;
  description?: string;
  type: ChecklistTemplateType;
  assetTypeId?: string;
  isDefault?: boolean;
  items?: Array<{
    name: string;
    description?: string;
    requiresPhoto?: boolean;
    isRequired?: boolean;
    order?: number;
  }>;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  type?: ChecklistTemplateType;
  assetTypeId?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CreateTemplateItemData {
  name: string;
  description?: string;
  requiresPhoto?: boolean;
  isRequired?: boolean;
  order?: number;
}

export interface UpdateTemplateItemData {
  name?: string;
  description?: string;
  requiresPhoto?: boolean;
  isRequired?: boolean;
  order?: number;
}

export const checklistTemplateService = {
  // Get all templates
  async getAll(params?: { type?: ChecklistTemplateType; assetTypeId?: string; activeOnly?: boolean }): Promise<ChecklistTemplate[]> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.assetTypeId) searchParams.set('assetTypeId', params.assetTypeId);
    if (params?.activeOnly) searchParams.set('activeOnly', 'true');

    const query = searchParams.toString();
    const url = query ? `/checklist-templates?${query}` : '/checklist-templates';
    const response = await api.get<TemplatesResponse>(url);
    return response.templates;
  },

  // Get template by ID
  async getById(id: string): Promise<ChecklistTemplate> {
    const response = await api.get<TemplateResponse>(`/checklist-templates/${id}`);
    return response.template;
  },

  // Create template
  async create(data: CreateTemplateData): Promise<ChecklistTemplate> {
    const response = await api.post<TemplateResponse>('/checklist-templates', data);
    return response.template;
  },

  // Update template
  async update(id: string, data: UpdateTemplateData): Promise<ChecklistTemplate> {
    const response = await api.put<TemplateResponse>(`/checklist-templates/${id}`, data);
    return response.template;
  },

  // Delete template
  async delete(id: string): Promise<{ message: string; deactivated?: boolean }> {
    return api.delete(`/checklist-templates/${id}`);
  },

  // Add item to template
  async addItem(templateId: string, data: CreateTemplateItemData): Promise<{ item: ChecklistTemplateItem; syncedChecklists: number }> {
    return api.post<{ item: ChecklistTemplateItem; syncedChecklists: number }>(
      `/checklist-templates/${templateId}/items`,
      data
    );
  },

  // Update template item
  async updateItem(itemId: string, data: UpdateTemplateItemData): Promise<{ item: ChecklistTemplateItem; syncedItems: number }> {
    return api.put<{ item: ChecklistTemplateItem; syncedItems: number }>(
      `/checklist-templates/items/${itemId}`,
      data
    );
  },

  // Delete template item
  async deleteItem(itemId: string): Promise<{ message: string; archivedItems: number }> {
    return api.delete(`/checklist-templates/items/${itemId}`);
  },

  // Reorder template items
  async reorderItems(items: Array<{ id: string; order: number }>): Promise<{ message: string; count: number }> {
    return api.post('/checklist-templates/items/reorder', { items });
  },
};

// Helper to get template type label
export const templateTypeLabels: Record<ChecklistTemplateType, string> = {
  GENERAL: 'General',
  CABLING: 'Cabling',
  EQUIPMENT: 'Equipment',
  CONFIG: 'Configuration',
  DOCUMENTATION: 'Documentation',
};

// Helper to get template type color
export const templateTypeColors: Record<ChecklistTemplateType, string> = {
  GENERAL: 'default',
  CABLING: 'warning',
  EQUIPMENT: 'primary',
  CONFIG: 'secondary',
  DOCUMENTATION: 'success',
};
