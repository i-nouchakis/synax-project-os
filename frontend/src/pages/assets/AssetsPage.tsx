import { useState } from 'react';
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
  Building2,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Select, Badge, Pagination, usePagination } from '@/components/ui';
import { assetService, type AssetStatus } from '@/services/asset.service';
import { useSearchStore } from '@/stores/search.store';

const statusBadgeVariants: Record<AssetStatus, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  PLANNED: 'default',
  IN_STOCK: 'default',
  INSTALLED: 'primary',
  CONFIGURED: 'primary',
  VERIFIED: 'success',
  FAULTY: 'error',
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

export function AssetsPage() {
  const navigate = useNavigate();
  const { query: search } = useSearchStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

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

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedAssets,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(assets, 25);

  // Stats
  const stats = {
    total: assets.length,
    installed: assets.filter((a) => ['INSTALLED', 'CONFIGURED', 'VERIFIED'].includes(a.status)).length,
    configured: assets.filter((a) => ['CONFIGURED', 'VERIFIED'].includes(a.status)).length,
    faulty: assets.filter((a) => a.status === 'FAULTY').length,
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
      <div>
        <h1 className="text-h1">Assets</h1>
        <p className="text-body text-text-secondary">
          All assets across projects
        </p>
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

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box size={20} />
            Assets ({assets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {assets.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <Box size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-h3 text-text-primary mb-2">No assets found</h3>
              <p className="text-body">
                {search || statusFilter || typeFilter
                  ? 'Try adjusting your filters'
                  : 'Add assets to rooms to see them here'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-secondary">
                      <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Asset</th>
                      <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Type</th>
                      <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Location</th>
                      <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Serial / MAC</th>
                      <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssets.map((asset) => (
                      <tr
                        key={asset.id}
                        className="border-b border-surface-border hover:bg-surface-hover transition-colors cursor-pointer"
                        onClick={() => navigate(`/assets/${asset.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-surface-secondary flex items-center justify-center text-text-secondary">
                              {asset.assetType?.icon
                                ? assetTypeIcons[asset.assetType.icon] || <Box size={18} />
                                : <Box size={18} />}
                            </div>
                            <div>
                              <p className="text-body font-medium text-text-primary">{asset.name}</p>
                              {asset.model && (
                                <p className="text-caption text-text-tertiary">{asset.model}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-body-sm text-text-secondary">
                          {asset.assetType?.name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-body-sm">
                            <div className="flex items-center gap-1 text-text-primary">
                              <Building2 size={12} />
                              <span>{asset.room?.floor?.building?.project?.name || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-text-tertiary text-caption">
                              <MapPin size={12} />
                              <span>
                                {asset.room?.floor?.name} / {asset.room?.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-body-sm">
                            {asset.serialNumber && (
                              <p className="text-text-primary font-mono">{asset.serialNumber}</p>
                            )}
                            {asset.macAddress && (
                              <p className="text-text-tertiary font-mono text-caption">{asset.macAddress}</p>
                            )}
                            {!asset.serialNumber && !asset.macAddress && (
                              <span className="text-text-tertiary">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariants[asset.status]} size="sm">
                            {asset.status.replace('_', ' ')}
                          </Badge>
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
