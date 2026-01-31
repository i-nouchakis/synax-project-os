import { api } from '@/lib/api';

// Summary Report Types
export interface ProjectSummaryReport {
  project: {
    id: string;
    name: string;
    clientName?: string;
    location?: string;
    status: string;
    createdAt: string;
    team: {
      id: string;
      name: string;
      email: string;
      role: string;
    }[];
  };
  floors: {
    id: string;
    name: string;
    level: number;
    roomCount: number;
  }[];
  stats: {
    rooms: {
      total: number;
      notStarted: number;
      pending?: number; // Legacy alias
      inProgress: number;
      completed: number;
      blocked: number;
    };
    assets: {
      total: number;
      planned: number;
      inStock: number;
      pending?: number; // Legacy alias
      installed: number;
      configured: number;
      verified: number;
      faulty: number;
      tested?: number; // Legacy alias
      documented?: number; // Legacy alias
    };
    checklists: {
      total: number;
      totalItems: number;
      completedItems: number;
      completionRate: number;
      byType: {
        cabling: number;
        equipment: number;
        config: number;
        documentation: number;
      };
    };
    issues: {
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      closed: number;
      byPriority: {
        critical: number;
        high: number;
        medium: number;
        low: number;
      };
    };
    inventory: {
      totalItems: number;
      totalReceived: number;
      totalUsed: number;
      totalInStock: number;
    };
  };
  progress: {
    rooms: number;
    assets: number;
    checklists: number;
    issues: number;
  };
  generatedAt: string;
}

// Internal Report Types
export interface InternalReport {
  project: {
    id: string;
    name: string;
    clientName?: string;
    location?: string;
    status: string;
  };
  floors: {
    id: string;
    name: string;
    level: number;
    rooms: {
      id: string;
      name: string;
      type?: string;
      status: string;
      assets: {
        id: string;
        name: string;
        type?: string;
        model?: string;
        serialNumber?: string;
        status: string;
        checklists: {
          type: string;
          status: string;
          assignedTo?: string;
          itemsTotal: number;
          itemsCompleted: number;
        }[];
      }[];
    }[];
  }[];
  issues: {
    id: string;
    title: string;
    description?: string;
    priority: string;
    status: string;
    causedBy?: string;
    location?: string;
    createdBy?: string;
    createdAt: string;
    resolvedAt?: string;
    comments: {
      user?: string;
      comment: string;
      createdAt: string;
    }[];
  }[];
  inventory: {
    id: string;
    itemType: string;
    description: string;
    unit: string;
    received: number;
    used: number;
    inStock: number;
    recentLogs: {
      action: string;
      quantity: number;
      user?: string;
      notes?: string;
      createdAt: string;
    }[];
  }[];
  technicianStats: {
    id: string;
    name: string;
    checklistItemsCompleted: number;
    assetsInstalled: number;
  }[];
  recentActivity: {
    itemName: string;
    assetName: string;
    location: string;
    completedBy?: string;
    completedAt?: string;
  }[];
  generatedAt: string;
}

// Client Report Types
export interface ClientReport {
  project: {
    id: string;
    name: string;
    clientName?: string;
    location?: string;
    status: string;
    startDate?: string;
    endDate?: string;
  };
  summary: {
    totalFloors: number;
    totalRooms: number;
    completedRooms: number;
    roomCompletionRate: number;
    totalAssets: number;
    completedAssets: number;
    assetCompletionRate: number;
    openIssues: number;
    signatureCount: number;
  };
  floorProgress: {
    id: string;
    name: string;
    level: number;
    totalRooms: number;
    completedRooms: number;
    completionRate: number;
    rooms: {
      id: string;
      name: string;
      type?: string;
      status: string;
      assetCount: number;
    }[];
  }[];
  assetsByType: {
    type: string;
    total: number;
    completed: number;
    completionRate: number;
  }[];
  signatures: {
    id: string;
    type: string;
    location?: string;
    signedByName: string;
    signedAt: string;
  }[];
  generatedAt: string;
}

// Asset Report Types
export interface AssetReport {
  project: {
    id: string;
    name: string;
    clientName?: string;
  };
  summary: {
    total: number;
    byStatus: {
      pending: number;
      installed: number;
      configured: number;
      tested: number;
      documented: number;
    };
  };
  assetsByType: Record<string, {
    id: string;
    name: string;
    type?: string;
    model?: string;
    serialNumber?: string;
    macAddress?: string;
    ipAddress?: string;
    status: string;
    floor: string;
    room: string;
    installedBy?: string;
    installedAt?: string;
  }[]>;
  assets: {
    id: string;
    name: string;
    type?: string;
    model?: string;
    serialNumber?: string;
    macAddress?: string;
    ipAddress?: string;
    status: string;
    floor: string;
    room: string;
    installedBy?: string;
    installedAt?: string;
  }[];
  generatedAt: string;
}

// Generated Report (PDF history)
export interface GeneratedReport {
  id: string;
  projectId: string;
  type: 'SUMMARY' | 'CLIENT' | 'INTERNAL' | 'ASSETS';
  title: string;
  fileUrl: string;
  fileSize: number;
  generatedById: string;
  generatedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

// PDF Export Response
export interface ExportResponse {
  url: string;
  filename: string;
  size: number;
  reportId: string;
}

export const reportService = {
  // Get project summary report
  async getSummary(projectId: string): Promise<ProjectSummaryReport> {
    return api.get<ProjectSummaryReport>(`/reports/project/${projectId}/summary`);
  },

  // Get internal (technical) report
  async getInternal(projectId: string): Promise<InternalReport> {
    return api.get<InternalReport>(`/reports/project/${projectId}/internal`);
  },

  // Get client (external) report
  async getClient(projectId: string): Promise<ClientReport> {
    return api.get<ClientReport>(`/reports/project/${projectId}/client`);
  },

  // Get asset inventory report
  async getAssets(projectId: string): Promise<AssetReport> {
    return api.get<AssetReport>(`/reports/project/${projectId}/assets`);
  },

  // Export report to PDF
  async exportPDF(projectId: string, type: 'summary' | 'client' | 'internal'): Promise<ExportResponse> {
    return api.post<ExportResponse>(`/reports/project/${projectId}/export/${type}`);
  },

  // Get generated report history
  async getHistory(projectId: string): Promise<GeneratedReport[]> {
    return api.get<GeneratedReport[]>(`/reports/project/${projectId}/history`);
  },

  // Delete a generated report
  async deleteReport(reportId: string): Promise<void> {
    return api.delete(`/reports/generated/${reportId}`);
  },
};

// Helper: Format percentage for display
export const formatPercent = (value: number): string => `${value}%`;

// Helper: Get status color class
export const getProgressColor = (percent: number): string => {
  if (percent >= 80) return 'text-success';
  if (percent >= 50) return 'text-warning';
  return 'text-error';
};

// Helper: Get progress bar color class
export const getProgressBarColor = (percent: number): string => {
  if (percent >= 80) return 'bg-success';
  if (percent >= 50) return 'bg-warning';
  return 'bg-error';
};
