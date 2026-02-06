import { api } from '@/lib/api';

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalFloors: number;
  totalRooms: number;
  totalAssets: number;
  openIssues: number;
  resolvedIssues: number;
  totalIssues: number;
  completedChecklists: number;
  totalChecklists: number;
  checklistCompletionRate: number;
}

export interface ActivityItem {
  id: string;
  type: 'checklist' | 'issue' | 'asset' | 'project';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  priority?: string;
}

export interface ProjectStatusItem {
  id: string;
  name: string;
  status: string;
  roomsTotal: number;
  roomsCompleted: number;
  roomsInProgress: number;
  roomsBlocked: number;
  assetsTotal: number;
  assetsVerified: number;
  issuesOpen: number;
  issuesTotal: number;
  overallProgress: number;
}

export interface DashboardCharts {
  projectStatusBreakdown: ProjectStatusItem[];
  issuesByPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  issuesByStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  assetsByStatus: {
    planned: number;
    inStock: number;
    installed: number;
    configured: number;
    verified: number;
    faulty: number;
  };
  roomsByStatus: {
    notStarted: number;
    inProgress: number;
    completed: number;
    blocked: number;
  };
  floorsByProgress: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    hasBlocked: number;
  };
  checklistProgress: {
    totalItems: number;
    completedItems: number;
    completionRate: number;
    byType: {
      cabling: { total: number; completed: number };
      equipment: { total: number; completed: number };
      config: { total: number; completed: number };
      documentation: { total: number; completed: number };
    };
  };
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<{ stats: DashboardStats }>('/dashboard/stats');
    return response.stats;
  },

  async getActivity(): Promise<ActivityItem[]> {
    const response = await api.get<{ activities: ActivityItem[] }>('/dashboard/activity');
    return response.activities;
  },

  async getCharts(): Promise<DashboardCharts> {
    return api.get<DashboardCharts>('/dashboard/charts');
  },
};
