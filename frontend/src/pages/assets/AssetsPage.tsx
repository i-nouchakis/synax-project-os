import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Wifi,
  Camera,
  Server,
  Router,
  Battery,
  Network,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Layers,
  DoorOpen,
  Search,
} from 'lucide-react';
import { Card, CardContent, Select, Badge, Input } from '@/components/ui';
import { assetService, type Asset, type AssetStatus } from '@/services/asset.service';
import { useSearchStore } from '@/stores/search.store';
import { cn } from '@/lib/utils';

const statusBadgeVariants: Record<AssetStatus, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  PLANNED: 'default',
  IN_STOCK: 'default',
  INSTALLED: 'primary',
  CONFIGURED: 'primary',
  VERIFIED: 'success',
  FAULTY: 'error',
};

const statusLabels: Record<AssetStatus, string> = {
  PLANNED: 'Planned',
  IN_STOCK: 'In Stock',
  INSTALLED: 'Installed',
  CONFIGURED: 'Configured',
  VERIFIED: 'Verified',
  FAULTY: 'Faulty',
};

const assetTypeIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi size={18} />,
  network: <Network size={18} />,
  camera: <Camera size={18} />,
  router: <Router size={18} />,
  server: <Server size={18} />,
  battery: <Battery size={18} />,
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'INSTALLED', label: 'Installed' },
  { value: 'CONFIGURED', label: 'Configured' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'FAULTY', label: 'Faulty' },
];

interface ProjectGroup {
  projectId: string;
  projectName: string;
  clientName: string;
  assets: Asset[];
}

export function AssetsPage() {
  const navigate = useNavigate();
  const { query: search } = useSearchStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [projectSearches, setProjectSearches] = useState<Record<string, string>>({});

  // Fetch assets
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['all-assets', search, statusFilter, typeFilter],
    queryFn: () =>
      assetService.search({
        search: search || undefined,
        status: statusFilter || undefined,
        assetTypeId: typeFilter || undefined,
      }),
  });

  // Fetch asset types for filter
  const { data: assetTypes = [] } = useQuery({
    queryKey: ['asset-types'],
    queryFn: () => assetService.getTypes(),
  });

  const typeOptions = [
    { value: '', label: 'All Types' },
    ...assetTypes.map((t) => ({ value: t.id, label: t.name })),
  ];

  // Filter assets to only show those assigned to a floor or room (not just project level)
  const assignedAssets = useMemo(() => {
    return assets.filter((asset: Asset) => asset.room || asset.floor);
  }, [assets]);

  // Group assets by project
  const projectGroups = useMemo(() => {
    const groups: Map<string, ProjectGroup> = new Map();

    assignedAssets.forEach((asset: Asset) => {
      const projectId = asset.room?.floor?.building?.project?.id || asset.floor?.building?.project?.id || 'unassigned';
      const projectName = asset.room?.floor?.building?.project?.name || asset.floor?.building?.project?.name || 'Unassigned';
      const clientName = '';

      if (!groups.has(projectId)) {
        groups.set(projectId, {
          projectId,
          projectName,
          clientName,
          assets: [],
        });
      }
      groups.get(projectId)!.assets.push(asset);
    });

    // Sort assets within each group by location then name
    groups.forEach((group) => {
      group.assets.sort((a, b) => {
        const floorA = a.room?.floor?.name || a.floor?.name || '';
        const floorB = b.room?.floor?.name || b.floor?.name || '';
        const floorCompare = floorA.localeCompare(floorB);
        if (floorCompare !== 0) return floorCompare;

        const roomA = a.room?.name || '';
        const roomB = b.room?.name || '';
        const roomCompare = roomA.localeCompare(roomB);
        if (roomCompare !== 0) return roomCompare;

        return a.name.localeCompare(b.name);
      });
    });

    // Convert to array and sort by project name
    return Array.from(groups.values()).sort((a, b) =>
      a.projectName.localeCompare(b.projectName)
    );
  }, [assets]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      if (prev.has(projectId)) {
        return new Set();
      }
      return new Set([projectId]);
    });
  };

  const expandAll = () => {
    setExpandedProjects(new Set(projectGroups.map((g) => g.projectId)));
  };

  const collapseAll = () => {
    setExpandedProjects(new Set());
  };

  // Stats (based on assigned assets only)
  const stats = {
    total: assignedAssets.length,
    installed: assignedAssets.filter((a) => ['INSTALLED', 'CONFIGURED', 'VERIFIED'].includes(a.status)).length,
    configured: assignedAssets.filter((a) => ['CONFIGURED', 'VERIFIED'].includes(a.status)).length,
    faulty: assignedAssets.filter((a) => a.status === 'FAULTY').length,
  };

  // Filter assets within a project based on search
  const getFilteredProjectAssets = (projectId: string, projectAssets: Asset[]) => {
    const searchTerm = projectSearches[projectId]?.toLowerCase() || '';
    if (!searchTerm) return projectAssets;

    return projectAssets.filter((asset) =>
      asset.name.toLowerCase().includes(searchTerm) ||
      asset.assetType?.name?.toLowerCase().includes(searchTerm) ||
      asset.model?.toLowerCase().includes(searchTerm) ||
      asset.serialNumber?.toLowerCase().includes(searchTerm) ||
      asset.macAddress?.toLowerCase().includes(searchTerm) ||
      asset.room?.name?.toLowerCase().includes(searchTerm) ||
      asset.room?.floor?.name?.toLowerCase().includes(searchTerm) ||
      asset.floor?.name?.toLowerCase().includes(searchTerm)
    );
  };

  if (assetsLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Assets</h1>
          <p className="text-body text-text-secondary">
            {assignedAssets.length} assets across {projectGroups.length} projects
          </p>
        </div>
        {projectGroups.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-body-sm text-text-secondary hover:text-primary transition-colors"
            >
              Expand All
            </button>
            <span className="text-text-tertiary">|</span>
            <button
              onClick={collapseAll}
              className="text-body-sm text-text-secondary hover:text-primary transition-colors"
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-h2 text-text-primary">{stats.total}</p>
            <p className="text-caption text-text-secondary">Total Assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-h2 text-primary">{stats.installed}</p>
            <p className="text-caption text-text-secondary">Installed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-h2 text-success">{stats.configured}</p>
            <p className="text-caption text-text-secondary">Configured</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-h2 text-error">{stats.faulty}</p>
            <p className="text-caption text-text-secondary">Faulty</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
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

      {/* Assets by Project */}
      {projectGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Box size={48} className="mx-auto text-text-tertiary mb-4" />
            <h3 className="text-h3 text-text-primary mb-2">No assets found</h3>
            <p className="text-body text-text-secondary">
              {search || statusFilter || typeFilter
                ? 'Try adjusting your filters'
                : 'Add assets to rooms to see them here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projectGroups.map((group) => {
            const isExpanded = expandedProjects.has(group.projectId);
            const filteredAssets = getFilteredProjectAssets(group.projectId, group.assets);
            const installedCount = filteredAssets.filter((a) =>
              ['INSTALLED', 'CONFIGURED', 'VERIFIED'].includes(a.status)
            ).length;

            return (
              <Card key={group.projectId} className="overflow-hidden">
                {/* Project Header */}
                <div className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors">
                  <button
                    onClick={() => toggleProject(group.projectId)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderKanban size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-body font-semibold text-text-primary">{group.projectName}</h3>
                      {group.clientName && (
                        <p className="text-body-sm text-text-secondary">{group.clientName}</p>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-4">
                    {/* Project Search - only visible when expanded */}
                    {isExpanded && (
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={projectSearches[group.projectId] || ''}
                          onChange={(e) => setProjectSearches((prev) => ({
                            ...prev,
                            [group.projectId]: e.target.value,
                          }))}
                          placeholder="Search assets..."
                          className="w-48 h-8 text-sm pl-8"
                          leftIcon={<Search size={14} />}
                        />
                      </div>
                    )}
                    <div className="text-right min-w-[80px]">
                      <p className="text-body-sm text-text-primary">{filteredAssets.length} assets</p>
                      <p className="text-caption text-text-tertiary">{installedCount} installed</p>
                    </div>
                    <button onClick={() => toggleProject(group.projectId)}>
                      {isExpanded ? (
                        <ChevronDown size={20} className="text-text-tertiary" />
                      ) : (
                        <ChevronRight size={20} className="text-text-tertiary" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Assets Grid */}
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="border-t border-surface-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                      {filteredAssets.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => navigate(`/assets/${asset.id}`)}
                          className="flex items-start gap-3 p-3 rounded-lg border border-surface-border hover:border-primary/50 hover:bg-surface-hover cursor-pointer transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-surface-secondary">
                            {asset.assetType?.icon
                              ? assetTypeIcons[asset.assetType.icon] || <Box size={20} className="text-text-secondary" />
                              : <Box size={20} className="text-text-secondary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-body font-medium text-text-primary truncate">
                              {asset.name}
                            </h4>
                            <p className="text-caption text-text-secondary truncate">
                              {asset.assetType?.name || 'No type'}
                              {asset.model && ` · ${asset.model}`}
                            </p>
                            <div className="flex items-center gap-2 text-caption text-text-tertiary mt-1">
                              {asset.room ? (
                                <>
                                  <Layers size={12} />
                                  <span className="truncate">{asset.room.floor?.name}</span>
                                  <span>·</span>
                                  <DoorOpen size={12} />
                                  <span className="truncate">{asset.room.name}</span>
                                </>
                              ) : asset.floor ? (
                                <>
                                  <Layers size={12} />
                                  <span className="truncate">{asset.floor.name}</span>
                                  <span className="text-text-tertiary">(Floor-level)</span>
                                </>
                              ) : (
                                <span>Unassigned</span>
                              )}
                            </div>
                            <div className="mt-2">
                              <Badge variant={statusBadgeVariants[asset.status]} size="sm">
                                {statusLabels[asset.status]}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
