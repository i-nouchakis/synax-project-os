import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ListChecks,
  CheckCircle2,
  Clock,
  Circle,
  Building2,
  Wifi,
  Network,
  Camera,
  Router,
  Server,
  Battery,
  Box,
  ChevronRight,
  Cable,
  Settings,
  FileText,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Select, Badge, Pagination, usePagination, SortableHeader } from '@/components/ui';
import { useSortable } from '@/hooks/useSortable';
import { useSearchStore } from '@/stores/search.store';
import { api } from '@/lib/api';

type ChecklistStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
type ChecklistType = 'CABLING' | 'EQUIPMENT' | 'CONFIG' | 'DOCUMENTATION';

interface ChecklistWithAsset {
  id: string;
  assetId: string;
  type: ChecklistType;
  status: ChecklistStatus;
  completedAt: string | null;
  createdAt: string;
  asset: {
    id: string;
    name: string;
    assetType?: {
      id: string;
      name: string;
      icon: string;
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
  items: Array<{
    id: string;
    name: string;
    completed: boolean;
  }>;
  assignedTo?: {
    id: string;
    name: string;
  };
}

const statusBadgeVariants: Record<ChecklistStatus, 'default' | 'primary' | 'success'> = {
  NOT_STARTED: 'default',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
};

const statusLabels: Record<ChecklistStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const typeLabels: Record<ChecklistType, string> = {
  CABLING: 'Cabling',
  EQUIPMENT: 'Equipment',
  CONFIG: 'Configuration',
  DOCUMENTATION: 'Documentation',
};

const typeIcons: Record<ChecklistType, React.ReactNode> = {
  CABLING: <Cable size={18} className="text-amber-500" />,
  EQUIPMENT: <Package size={18} className="text-blue-500" />,
  CONFIG: <Settings size={18} className="text-purple-500" />,
  DOCUMENTATION: <FileText size={18} className="text-emerald-500" />,
};

const assetTypeIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi size={16} />,
  network: <Network size={16} />,
  camera: <Camera size={16} />,
  router: <Router size={16} />,
  server: <Server size={16} />,
  battery: <Battery size={16} />,
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'CABLING', label: 'Cabling' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'CONFIG', label: 'Configuration' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
];

export function ChecklistsPage() {
  const navigate = useNavigate();
  const { query: search } = useSearchStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Fetch all checklists
  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['all-checklists'],
    queryFn: async () => {
      const response = await api.get<{ checklists: ChecklistWithAsset[] }>('/checklists');
      return response.checklists;
    },
  });

  // Filter checklists
  const filteredChecklists = checklists.filter((checklist) => {
    // Status filter
    if (statusFilter && checklist.status !== statusFilter) return false;

    // Type filter
    if (typeFilter && checklist.type !== typeFilter) return false;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesAsset = checklist.asset?.name?.toLowerCase().includes(searchLower);
      const matchesProject = checklist.asset?.room?.floor?.project?.name?.toLowerCase().includes(searchLower);
      const matchesRoom = checklist.asset?.room?.name?.toLowerCase().includes(searchLower);
      if (!matchesAsset && !matchesProject && !matchesRoom) return false;
    }

    return true;
  });

  // Sorting
  const { sortedItems: sortedChecklists, requestSort, getSortDirection } = useSortable(filteredChecklists);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedChecklists,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(sortedChecklists, 25);

  // Stats
  const stats = {
    total: checklists.length,
    notStarted: checklists.filter((c) => c.status === 'NOT_STARTED').length,
    inProgress: checklists.filter((c) => c.status === 'IN_PROGRESS').length,
    completed: checklists.filter((c) => c.status === 'COMPLETED').length,
  };

  // Calculate progress
  const getProgress = (checklist: ChecklistWithAsset) => {
    if (!checklist.items || checklist.items.length === 0) return 0;
    const completed = checklist.items.filter((item) => item.completed).length;
    return Math.round((completed / checklist.items.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1">Checklists</h1>
        <p className="text-body text-text-secondary">
          Track installation checklists across all assets
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ListChecks size={18} className="text-text-secondary" />
              <span className="text-h2 text-text-primary">{stats.total}</span>
            </div>
            <p className="text-caption text-text-secondary">Total Checklists</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Circle size={18} className="text-text-tertiary" />
              <span className="text-h2 text-text-tertiary">{stats.notStarted}</span>
            </div>
            <p className="text-caption text-text-secondary">Not Started</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock size={18} className="text-primary" />
              <span className="text-h2 text-primary">{stats.inProgress}</span>
            </div>
            <p className="text-caption text-text-secondary">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle2 size={18} className="text-success" />
              <span className="text-h2 text-success">{stats.completed}</span>
            </div>
            <p className="text-caption text-text-secondary">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={typeOptions}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusOptions}
        />
      </div>

      {/* Checklists Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks size={20} />
            Checklists ({filteredChecklists.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredChecklists.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <ListChecks size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-h3 text-text-primary mb-2">No checklists found</h3>
              <p className="text-body">
                {search || statusFilter || typeFilter
                  ? 'Try adjusting your filters'
                  : 'Generate checklists from asset detail pages'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-secondary">
                      <SortableHeader label="Type" sortKey="type" direction={getSortDirection('type')} onSort={requestSort} align="left" />
                      <SortableHeader label="Asset" sortKey="asset.name" direction={getSortDirection('asset.name')} onSort={requestSort} align="left" />
                      <SortableHeader label="Location" sortKey="asset.room.floor.project.name" direction={getSortDirection('asset.room.floor.project.name')} onSort={requestSort} align="left" />
                      <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Progress</th>
                      <SortableHeader label="Status" sortKey="status" direction={getSortDirection('status')} onSort={requestSort} align="left" />
                      <SortableHeader label="Assigned" sortKey="assignedTo.name" direction={getSortDirection('assignedTo.name')} onSort={requestSort} align="left" />
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedChecklists.map((checklist) => (
                      <tr
                        key={checklist.id}
                        className="border-b border-surface-border hover:bg-surface-hover transition-colors cursor-pointer"
                        onClick={() => navigate(`/assets/${checklist.assetId}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center">
                              {typeIcons[checklist.type]}
                            </div>
                            <span className="text-body-sm font-medium">{typeLabels[checklist.type]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-surface-secondary flex items-center justify-center text-text-secondary">
                              {checklist.asset?.assetType?.icon
                                ? assetTypeIcons[checklist.asset.assetType.icon] || <Box size={14} />
                                : <Box size={14} />}
                            </div>
                            <div>
                              <p className="text-body-sm font-medium text-text-primary">
                                {checklist.asset?.name || 'Unknown Asset'}
                              </p>
                              <p className="text-caption text-text-tertiary">
                                {checklist.asset?.assetType?.name || 'Unknown type'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-body-sm">
                            <div className="flex items-center gap-1 text-text-primary">
                              <Building2 size={12} />
                              <span>{checklist.asset?.room?.floor?.project?.name || '-'}</span>
                            </div>
                            <p className="text-caption text-text-tertiary">
                              {checklist.asset?.room?.floor?.name} / {checklist.asset?.room?.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-surface rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  checklist.status === 'COMPLETED' ? 'bg-success' : 'bg-primary'
                                }`}
                                style={{ width: `${getProgress(checklist)}%` }}
                              />
                            </div>
                            <span className="text-caption text-text-secondary min-w-[3rem]">
                              {getProgress(checklist)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariants[checklist.status]} size="sm">
                            {statusLabels[checklist.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-body-sm text-text-secondary">
                          {checklist.assignedTo?.name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight size={16} className="text-text-tertiary" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
