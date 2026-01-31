import { api } from '@/lib/api';

export interface TimeEntry {
  id: string;
  projectId: string;
  userId: string;
  roomId?: string;
  assetId?: string;
  type: TimeEntryType;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  hours: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
  user?: { id: string; name: string; email?: string };
  room?: { id: string; name: string };
  asset?: { id: string; name: string };
}

export type TimeEntryType =
  | 'INSTALLATION'
  | 'CONFIGURATION'
  | 'TESTING'
  | 'TROUBLESHOOTING'
  | 'TRAVEL'
  | 'MEETING'
  | 'OTHER';

export interface CreateTimeEntryData {
  projectId: string;
  roomId?: string;
  assetId?: string;
  type: TimeEntryType;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  hours: number;
  notes?: string;
}

export interface UpdateTimeEntryData extends Partial<CreateTimeEntryData> {}

export interface TimeEntrySummary {
  totalHours: number;
  totalEntries: number;
  byUser: Array<{
    userId: string;
    userName: string;
    totalHours: number;
  }>;
  byType: Array<{
    type: TimeEntryType;
    hours: number;
  }>;
}

export interface TimeEntryFilters {
  projectId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

class TimeEntryService {
  async getAll(filters?: TimeEntryFilters): Promise<TimeEntry[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString();
    const response = await api.get<{ timeEntries: TimeEntry[] }>(
      `/time-entries${query ? `?${query}` : ''}`
    );
    return response.timeEntries;
  }

  async getMyEntries(filters?: Omit<TimeEntryFilters, 'userId'>): Promise<TimeEntry[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const query = params.toString();
    const response = await api.get<{ timeEntries: TimeEntry[] }>(
      `/time-entries/my${query ? `?${query}` : ''}`
    );
    return response.timeEntries;
  }

  async getById(id: string): Promise<TimeEntry> {
    const response = await api.get<{ timeEntry: TimeEntry }>(`/time-entries/${id}`);
    return response.timeEntry;
  }

  async getProjectSummary(projectId: string): Promise<{ summary: TimeEntrySummary; recentEntries: TimeEntry[] }> {
    return api.get(`/time-entries/project/${projectId}/summary`);
  }

  async create(data: CreateTimeEntryData): Promise<TimeEntry> {
    const response = await api.post<{ timeEntry: TimeEntry }>('/time-entries', data);
    return response.timeEntry;
  }

  async update(id: string, data: UpdateTimeEntryData): Promise<TimeEntry> {
    const response = await api.put<{ timeEntry: TimeEntry }>(`/time-entries/${id}`, data);
    return response.timeEntry;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/time-entries/${id}`);
  }

  async startTimer(data: {
    projectId: string;
    type?: TimeEntryType;
    description?: string;
    roomId?: string;
    assetId?: string;
  }): Promise<TimeEntry> {
    const response = await api.post<{ timeEntry: TimeEntry }>('/time-entries/start', data);
    return response.timeEntry;
  }

  async stopTimer(id: string): Promise<TimeEntry> {
    const response = await api.post<{ timeEntry: TimeEntry }>(`/time-entries/${id}/stop`, {});
    return response.timeEntry;
  }
}

export const timeEntryService = new TimeEntryService();

// Type labels for display
export const TIME_ENTRY_TYPE_LABELS: Record<TimeEntryType, string> = {
  INSTALLATION: 'Installation',
  CONFIGURATION: 'Configuration',
  TESTING: 'Testing',
  TROUBLESHOOTING: 'Troubleshooting',
  TRAVEL: 'Travel',
  MEETING: 'Meeting',
  OTHER: 'Other',
};

export const TIME_ENTRY_TYPE_COLORS: Record<TimeEntryType, string> = {
  INSTALLATION: 'bg-blue-100 text-blue-700',
  CONFIGURATION: 'bg-purple-100 text-purple-700',
  TESTING: 'bg-green-100 text-green-700',
  TROUBLESHOOTING: 'bg-orange-100 text-orange-700',
  TRAVEL: 'bg-gray-100 text-gray-700',
  MEETING: 'bg-pink-100 text-pink-700',
  OTHER: 'bg-slate-100 text-slate-700',
};
