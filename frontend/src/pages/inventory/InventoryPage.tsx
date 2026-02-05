import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Building2,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  Settings2,
  AlertTriangle,
  TrendingDown,
  History,
  Loader2,
  Cpu,
  MapPin,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Select,
  Badge,
  Button,
  Modal,
  ModalSection,
  ModalActions,
  Pagination,
  usePagination,
  SortableHeader,
} from '@/components/ui';
import { useSortable } from '@/hooks/useSortable';
import { useSearchStore } from '@/stores/search.store';
import {
  inventoryService,
  type InventoryItem,
  type InventoryAction,
  type CreateInventoryItemData,
  type UpdateInventoryItemData,
  type AddLogData,
  actionLabels,
  actionColors,
  commonItemTypes,
} from '@/services/inventory.service';
import { projectService } from '@/services/project.service';
import {
  assetService,
  type Asset,
  type AssetStatus,
  type CreateAssetData,
  type CreateBulkEquipmentData,
  type BulkEquipmentSerial,
} from '@/services/asset.service';
import { assetModelService, type LookupAssetModel } from '@/services/lookup.service';

type InventoryTab = 'materials' | 'equipment';

const actionOptions = [
  { value: 'RECEIVED', label: 'Received', icon: ArrowDownToLine },
  { value: 'CONSUMED', label: 'Consumed', icon: ArrowUpFromLine },
  { value: 'RETURNED', label: 'Returned', icon: RotateCcw },
  { value: 'ADJUSTED', label: 'Adjusted', icon: Settings2 },
];

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<InventoryTab>('materials');
  const { query: search } = useSearchStore();
  const [projectFilter, setProjectFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [addLogItem, setAddLogItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Equipment tab state
  const [equipmentStatusFilter, setEquipmentStatusFilter] = useState<string>('');
  const [isCreateEquipmentModalOpen, setIsCreateEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Asset | null>(null);

  // Fetch inventory items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory', projectFilter, lowStockFilter],
    queryFn: () =>
      inventoryService.getAll({
        projectId: projectFilter || undefined,
        lowStock: lowStockFilter || undefined,
      }),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => inventoryService.getStats(),
  });

  // Fetch projects for filter/create
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
  });

  // Fetch asset types for equipment
  const { data: assetTypes = [] } = useQuery({
    queryKey: ['asset-types'],
    queryFn: () => assetService.getTypes(),
  });

  // Fetch asset models for equipment dropdown
  const { data: assetModelsData } = useQuery({
    queryKey: ['asset-models'],
    queryFn: () => assetModelService.getAll(),
  });
  const assetModels = assetModelsData?.items || [];

  // Fetch equipment for selected project
  const { data: equipment = [], isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['project-equipment', projectFilter, equipmentStatusFilter],
    queryFn: () => {
      if (!projectFilter) return Promise.resolve([]);
      return assetService.getByProject(
        projectFilter,
        equipmentStatusFilter ? (equipmentStatusFilter as AssetStatus) : undefined
      );
    },
    enabled: activeTab === 'equipment',
  });

  // Create item mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateInventoryItemData) => inventoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      setIsCreateModalOpen(false);
      toast.success('Item created');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create item');
    },
  });

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryItemData }) =>
      inventoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setEditingItem(null);
      toast.success('Item updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update item');
    },
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success('Item deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete item');
    },
  });

  // Add log mutation
  const addLogMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: AddLogData }) =>
      inventoryService.addLog(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-item'] });
      setAddLogItem(null);
      toast.success('Stock updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update stock');
    },
  });

  // Create equipment mutation (single)
  const createEquipmentMutation = useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateAssetData }) =>
      assetService.createInProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-equipment'] });
      setIsCreateEquipmentModalOpen(false);
      toast.success('Equipment added to inventory');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add equipment');
    },
  });

  // Create equipment mutation (bulk)
  const createBulkEquipmentMutation = useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateBulkEquipmentData }) =>
      assetService.createBulkInProject(projectId, data),
    onSuccess: (assets) => {
      queryClient.invalidateQueries({ queryKey: ['project-equipment'] });
      setIsCreateEquipmentModalOpen(false);
      toast.success(`${assets.length} equipment items added to inventory`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add equipment');
    },
  });

  // Update equipment mutation
  const updateEquipmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAssetData> & { status?: AssetStatus } }) =>
      assetService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-equipment'] });
      setEditingEquipment(null);
      toast.success('Equipment updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update equipment');
    },
  });

  // Delete equipment mutation
  const deleteEquipmentMutation = useMutation({
    mutationFn: (id: string) => assetService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-equipment'] });
      toast.success('Equipment deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete equipment');
    },
  });

  // Filter items by search
  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.itemType.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.project?.name.toLowerCase().includes(searchLower)
    );
  });

  // Filter equipment by search
  const filteredEquipment = equipment.filter((asset) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      asset.name.toLowerCase().includes(searchLower) ||
      asset.labelCode?.toLowerCase().includes(searchLower) ||
      asset.serialNumber?.toLowerCase().includes(searchLower) ||
      asset.macAddress?.toLowerCase().includes(searchLower) ||
      asset.assetType?.name.toLowerCase().includes(searchLower)
    );
  });

  // Sorting for materials
  const { sortedItems: sortedItems, requestSort: requestItemSort, getSortDirection: getItemSortDirection } = useSortable(filteredItems);

  // Sorting for equipment
  const { sortedItems: sortedEquipment, requestSort: requestEqSort, getSortDirection: getEqSortDirection } = useSortable(filteredEquipment);

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(sortedItems, 25);

  const {
    currentPage: eqCurrentPage,
    pageSize: eqPageSize,
    totalPages: eqTotalPages,
    totalItems: eqTotalItems,
    paginatedItems: paginatedEquipment,
    handlePageChange: handleEqPageChange,
    handlePageSizeChange: handleEqPageSizeChange,
  } = usePagination(sortedEquipment, 25);

  // Handle create
  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      projectId: formData.get('projectId') as string,
      itemType: formData.get('itemType') as string,
      description: formData.get('description') as string,
      unit: (formData.get('unit') as string) || 'pcs',
    });
  };

  // Handle update
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingItem.id,
      data: {
        itemType: formData.get('itemType') as string,
        description: formData.get('description') as string,
        unit: formData.get('unit') as string,
      },
    });
  };

  // Handle add log
  const handleAddLog = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!addLogItem) return;
    const formData = new FormData(e.currentTarget);
    const serialNumbersRaw = formData.get('serialNumbers') as string;
    const serialNumbers = serialNumbersRaw
      ? serialNumbersRaw.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    addLogMutation.mutate({
      itemId: addLogItem.id,
      data: {
        action: formData.get('action') as InventoryAction,
        quantity: parseInt(formData.get('quantity') as string, 10),
        serialNumbers: serialNumbers.length > 0 ? serialNumbers : undefined,
        notes: (formData.get('notes') as string) || undefined,
      },
    });
  };

  // Handle update equipment
  const handleUpdateEquipment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEquipment) return;
    const formData = new FormData(e.currentTarget);
    updateEquipmentMutation.mutate({
      id: editingEquipment.id,
      data: {
        name: formData.get('name') as string,
        labelCode: (formData.get('labelCode') as string) || undefined,
        assetTypeId: (formData.get('assetTypeId') as string) || undefined,
        model: (formData.get('model') as string) || undefined,
        serialNumber: (formData.get('serialNumber') as string) || undefined,
        macAddress: (formData.get('macAddress') as string) || undefined,
        ipAddress: (formData.get('ipAddress') as string) || undefined,
        notes: (formData.get('notes') as string) || undefined,
        status: formData.get('status') as AssetStatus,
      },
    });
  };

  // Get equipment status badge
  const getEquipmentStatusBadge = (status: AssetStatus) => {
    const variants: Record<AssetStatus, 'info' | 'success' | 'warning' | 'error' | 'primary' | 'default'> = {
      PLANNED: 'info',
      IN_STOCK: 'success',
      INSTALLED: 'primary',
      CONFIGURED: 'warning',
      VERIFIED: 'success',
      FAULTY: 'error',
    };
    const labels: Record<AssetStatus, string> = {
      PLANNED: 'Planned',
      IN_STOCK: 'In Stock',
      INSTALLED: 'Installed',
      CONFIGURED: 'Configured',
      VERIFIED: 'Verified',
      FAULTY: 'Faulty',
    };
    return { variant: variants[status], label: labels[status] };
  };

  // Get equipment location
  const getEquipmentLocation = (asset: Asset) => {
    if (asset.room) {
      return `${asset.room.floor?.building?.name || ''} > ${asset.room.floor?.name || ''} > ${asset.room.name}`;
    }
    if (asset.floor) {
      return `${asset.floor.building?.name || ''} > ${asset.floor.name}`;
    }
    return 'Not assigned';
  };

  // Get stock status
  const getStockStatus = (item: InventoryItem) => {
    const threshold = Math.max(5, Math.floor(item.quantityReceived * 0.1));
    if (item.currentStock <= 0) return { label: 'Out of Stock', variant: 'error' as const };
    if (item.currentStock < threshold) return { label: 'Low Stock', variant: 'warning' as const };
    return { label: 'In Stock', variant: 'success' as const };
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Inventory</h1>
          <p className="text-body text-text-secondary">
            Track materials and equipment
          </p>
        </div>
        {activeTab === 'materials' ? (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus size={18} />}
          >
            Add Material
          </Button>
        ) : (
          <Button
            onClick={() => {
              if (!projectFilter) {
                toast.error('Please select a project first');
                return;
              }
              setIsCreateEquipmentModalOpen(true);
            }}
            leftIcon={<Plus size={18} />}
          >
            Add Equipment
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-secondary rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium transition-colors ${
            activeTab === 'materials'
              ? 'bg-surface text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Package size={16} />
          Materials
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium transition-colors ${
            activeTab === 'equipment'
              ? 'bg-surface text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Cpu size={16} />
          Equipment
        </button>
      </div>

      {/* Materials Tab Content */}
      {activeTab === 'materials' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Package size={18} className="text-text-secondary" />
                  <span className="text-h2 text-text-primary">{stats?.totalItems || 0}</span>
                </div>
                <p className="text-caption text-text-secondary">Total Items</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ArrowDownToLine size={18} className="text-success" />
                  <span className="text-h2 text-success">{stats?.totalInStock || 0}</span>
                </div>
                <p className="text-caption text-text-secondary">Total In Stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingDown size={18} className="text-warning" />
                  <span className="text-h2 text-warning">{stats?.lowStockItems || 0}</span>
                </div>
                <p className="text-caption text-text-secondary">Low Stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertTriangle size={18} className="text-error" />
                  <span className="text-h2 text-error">{stats?.outOfStockItems || 0}</span>
                </div>
                <p className="text-caption text-text-secondary">Out of Stock</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              options={[
                { value: '', label: 'All Projects' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <Button
              variant={lowStockFilter ? 'primary' : 'secondary'}
              onClick={() => setLowStockFilter(!lowStockFilter)}
              leftIcon={<TrendingDown size={18} />}
            >
              Low Stock
            </Button>
          </div>
        </>
      )}

      {/* Equipment Tab Content */}
      {activeTab === 'equipment' && (
        <>
          {/* Equipment Filters */}
          <div className="flex gap-2">
            <Select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              options={[
                { value: '', label: 'Select Project' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <Select
              value={equipmentStatusFilter}
              onChange={(e) => setEquipmentStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'PLANNED', label: 'Planned' },
                { value: 'IN_STOCK', label: 'In Stock' },
                { value: 'INSTALLED', label: 'Installed' },
                { value: 'CONFIGURED', label: 'Configured' },
                { value: 'VERIFIED', label: 'Verified' },
                { value: 'FAULTY', label: 'Faulty' },
              ]}
            />
          </div>

          {/* Equipment List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu size={20} />
                Equipment ({filteredEquipment.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!projectFilter ? (
                <div className="text-center py-12 text-text-secondary">
                  <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-h3 text-text-primary mb-2">Select a project</h3>
                  <p className="text-body">
                    Choose a project to view its equipment inventory
                  </p>
                </div>
              ) : isLoadingEquipment ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredEquipment.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <Cpu size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-h3 text-text-primary mb-2">No equipment found</h3>
                  <p className="text-body">
                    {search || equipmentStatusFilter
                      ? 'Try adjusting your filters'
                      : 'Add equipment to this project\'s inventory'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-surface-border bg-surface-secondary">
                          <SortableHeader label="Equipment" sortKey="name" direction={getEqSortDirection('name')} onSort={requestEqSort} align="left" />
                          <SortableHeader label="Type" sortKey="assetType.name" direction={getEqSortDirection('assetType.name')} onSort={requestEqSort} align="left" />
                          <SortableHeader label="Serial / MAC" sortKey="serialNumber" direction={getEqSortDirection('serialNumber')} onSort={requestEqSort} align="left" />
                          <SortableHeader label="Status" sortKey="status" direction={getEqSortDirection('status')} onSort={requestEqSort} align="left" />
                          <SortableHeader label="Location" sortKey="room.name" direction={getEqSortDirection('room.name')} onSort={requestEqSort} align="left" />
                          <th className="text-right px-4 py-3 text-caption font-medium text-text-secondary">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {paginatedEquipment.map((asset) => {
                          const statusBadge = getEquipmentStatusBadge(asset.status);
                          return (
                            <tr key={asset.id} className="hover:bg-surface-hover transition-colors">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-body font-medium text-text-primary">{asset.name}</p>
                                  {asset.labelCode && (
                                    <p className="text-caption text-text-tertiary">{asset.labelCode}</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-body-sm text-text-secondary">
                                  {asset.assetType?.name || '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-caption text-text-secondary">
                                  {asset.serialNumber && <div>S/N: {asset.serialNumber}</div>}
                                  {asset.macAddress && <div>MAC: {asset.macAddress}</div>}
                                  {!asset.serialNumber && !asset.macAddress && '-'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={statusBadge.variant} size="sm">
                                  {statusBadge.label}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 text-caption text-text-secondary">
                                  <MapPin size={12} />
                                  <span>{getEquipmentLocation(asset)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setEditingEquipment(asset)}
                                    className="p-2 rounded hover:bg-surface-hover text-text-secondary"
                                    title="Edit"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Delete this equipment?')) {
                                        deleteEquipmentMutation.mutate(asset.id);
                                      }
                                    }}
                                    className="p-2 rounded hover:bg-surface-hover text-error"
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={eqCurrentPage}
                    totalPages={eqTotalPages}
                    totalItems={eqTotalItems}
                    pageSize={eqPageSize}
                    onPageChange={handleEqPageChange}
                    onPageSizeChange={handleEqPageSizeChange}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Items List - Materials Tab */}
      {activeTab === 'materials' && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package size={20} />
            Items ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-h3 text-text-primary mb-2">No items found</h3>
              <p className="text-body">
                {search || projectFilter || lowStockFilter
                  ? 'Try adjusting your filters'
                  : 'Add your first inventory item'}
              </p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-secondary">
                    <SortableHeader label="Item" sortKey="itemType" direction={getItemSortDirection('itemType')} onSort={requestItemSort} align="left" />
                    <SortableHeader label="Project" sortKey="project.name" direction={getItemSortDirection('project.name')} onSort={requestItemSort} align="left" />
                    <SortableHeader label="Received" sortKey="quantityReceived" direction={getItemSortDirection('quantityReceived')} onSort={requestItemSort} align="left" />
                    <SortableHeader label="Used" sortKey="quantityUsed" direction={getItemSortDirection('quantityUsed')} onSort={requestItemSort} align="left" />
                    <SortableHeader label="Stock" sortKey="currentStock" direction={getItemSortDirection('currentStock')} onSort={requestItemSort} align="left" />
                    <th className="text-left px-4 py-3 text-caption font-medium text-text-secondary">Status</th>
                    <th className="text-right px-4 py-3 text-caption font-medium text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {paginatedItems.map((item) => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-body font-medium text-text-primary">{item.itemType}</p>
                            <p className="text-caption text-text-tertiary">{item.description}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-body-sm text-text-secondary">
                            <Building2 size={14} />
                            <span>{item.project?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-body text-text-primary">
                            {item.quantityReceived} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-body text-text-secondary">
                            {item.quantityUsed} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-body font-medium ${
                            stockStatus.variant === 'error' ? 'text-error' :
                            stockStatus.variant === 'warning' ? 'text-warning' :
                            'text-success'
                          }`}>
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={stockStatus.variant} size="sm">
                            {stockStatus.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setAddLogItem(item)}
                              leftIcon={<ArrowDownToLine size={14} />}
                            >
                              Stock
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedItem(item)}
                              leftIcon={<History size={14} />}
                            >
                              Logs
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingItem(item)}
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
      )}

      {/* Create Material Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Inventory Item"
        icon={<Package size={18} />}
        size="md"
        footer={
          <ModalActions>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="create-item-form" isLoading={createMutation.isPending}>
              Add Item
            </Button>
          </ModalActions>
        }
      >
        <form id="create-item-form" onSubmit={handleCreate} className="space-y-5">
          <ModalSection title="Project" icon={<Building2 size={14} />}>
            <Select
              label="Select Project"
              name="projectId"
              required
              options={[
                { value: '', label: 'Select project...' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </ModalSection>

          <ModalSection title="Item Details" icon={<Package size={14} />}>
            <div className="space-y-4">
              <Select
                label="Item Type"
                name="itemType"
                required
                options={[
                  { value: '', label: 'Select type...' },
                  ...commonItemTypes.map((t) => ({ value: t, label: t })),
                ]}
              />
              <Textarea
                label="Description"
                name="description"
                required
                placeholder="e.g., Blue Cat6 UTP 305m box"
                minRows={2}
                maxRows={5}
              />
              <Input
                label="Unit of Measurement"
                name="unit"
                placeholder="pcs, m, box, roll..."
                defaultValue="pcs"
              />
            </div>
          </ModalSection>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Edit Item"
        icon={<Package size={18} />}
        size="md"
        footer={
          <ModalActions className="justify-between">
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (confirm('Delete this item?')) {
                  deleteMutation.mutate(editingItem!.id);
                  setEditingItem(null);
                }
              }}
            >
              Delete
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </Button>
              <Button type="submit" form="edit-item-form" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </ModalActions>
        }
      >
        {editingItem && (
          <form id="edit-item-form" onSubmit={handleUpdate} className="space-y-5">
            <ModalSection title="Item Details" icon={<Package size={14} />}>
              <div className="space-y-4">
                <Select
                  label="Item Type"
                  name="itemType"
                  required
                  defaultValue={editingItem.itemType}
                  options={commonItemTypes.map((t) => ({ value: t, label: t }))}
                />
                <Textarea
                  label="Description"
                  name="description"
                  required
                  defaultValue={editingItem.description}
                  minRows={2}
                  maxRows={5}
                />
                <Input
                  label="Unit of Measurement"
                  name="unit"
                  defaultValue={editingItem.unit}
                />
              </div>
            </ModalSection>
          </form>
        )}
      </Modal>

      {/* Add Log Modal */}
      <Modal
        isOpen={!!addLogItem}
        onClose={() => setAddLogItem(null)}
        title="Update Stock"
        icon={<ArrowDownToLine size={18} />}
        size="md"
        footer={
          <ModalActions>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddLogItem(null)}
            >
              Cancel
            </Button>
            <Button type="submit" form="add-log-form" isLoading={addLogMutation.isPending}>
              Update Stock
            </Button>
          </ModalActions>
        }
      >
        {addLogItem && (
          <form id="add-log-form" onSubmit={handleAddLog} className="space-y-5">
            <ModalSection title="Current Item" icon={<Package size={14} />}>
              <div className="bg-background rounded-lg p-3">
                <p className="text-body font-medium text-text-primary">{addLogItem.itemType}</p>
                <p className="text-caption text-text-secondary">{addLogItem.description}</p>
                <p className="text-body-sm text-text-tertiary mt-2">
                  Current stock: <span className="font-medium text-success">{addLogItem.currentStock} {addLogItem.unit}</span>
                </p>
              </div>
            </ModalSection>

            <ModalSection title="Stock Movement" icon={<ArrowDownToLine size={14} />}>
              <div className="space-y-4">
                <Select
                  label="Action"
                  name="action"
                  required
                  options={actionOptions.map((a) => ({ value: a.value, label: a.label }))}
                />
                <Input
                  label="Quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  required
                  placeholder="Enter quantity..."
                />
              </div>
            </ModalSection>

            <ModalSection title="Additional Info" icon={<Settings2 size={14} />}>
              <div className="space-y-4">
                <Textarea
                  label="Serial Numbers (optional)"
                  name="serialNumbers"
                  placeholder="One per line..."
                  minRows={3}
                  maxRows={6}
                />
                <Textarea
                  label="Notes (optional)"
                  name="notes"
                  placeholder="Additional notes..."
                  minRows={2}
                  maxRows={5}
                />
              </div>
            </ModalSection>
          </form>
        )}
      </Modal>

      {/* Item Detail Modal (Logs) */}
      {selectedItem && (
        <ItemLogsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Create Equipment Modal */}
      <BulkEquipmentModal
        isOpen={isCreateEquipmentModalOpen}
        onClose={() => setIsCreateEquipmentModalOpen(false)}
        assetTypes={assetTypes}
        assetModels={assetModels}
        onCreateSingle={(data) => createEquipmentMutation.mutate({ projectId: projectFilter, data })}
        onCreateBulk={(data) => createBulkEquipmentMutation.mutate({ projectId: projectFilter, data })}
        isLoading={createEquipmentMutation.isPending || createBulkEquipmentMutation.isPending}
      />

      {/* Edit Equipment Modal */}
      <Modal
        isOpen={!!editingEquipment}
        onClose={() => setEditingEquipment(null)}
        title="Edit Equipment"
        icon={<Cpu size={18} />}
        size="md"
        footer={
          <ModalActions className="justify-between">
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (confirm('Delete this equipment?')) {
                  deleteEquipmentMutation.mutate(editingEquipment!.id);
                  setEditingEquipment(null);
                }
              }}
            >
              Delete
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingEquipment(null)}
              >
                Cancel
              </Button>
              <Button type="submit" form="edit-equipment-form" isLoading={updateEquipmentMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </ModalActions>
        }
      >
        {editingEquipment && (
          <form id="edit-equipment-form" onSubmit={handleUpdateEquipment} className="space-y-5">
            <ModalSection title="Basic Info" icon={<Cpu size={14} />}>
              <div className="space-y-4">
                <Input
                  label="Equipment Name"
                  name="name"
                  required
                  defaultValue={editingEquipment.name}
                />
                <Input
                  label="Label Code"
                  name="labelCode"
                  defaultValue={editingEquipment.labelCode || ''}
                />
                <Select
                  label="Equipment Type"
                  name="assetTypeId"
                  defaultValue={editingEquipment.assetTypeId || ''}
                  options={[
                    { value: '', label: 'Select type...' },
                    ...assetTypes.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                />
                <Select
                  label="Model"
                  name="model"
                  defaultValue={editingEquipment.model || ''}
                  options={[
                    { value: '', label: 'Select model (optional)' },
                    ...assetModels
                      .filter((m) => {
                        if (!editingEquipment.assetTypeId) return true;
                        if (!m.assetTypeId) return true;
                        return m.assetTypeId === editingEquipment.assetTypeId;
                      })
                      .map((m) => ({
                        value: `${m.manufacturer?.name} ${m.name}`,
                        label: `${m.manufacturer?.name} - ${m.name}`,
                      })),
                  ]}
                />
                <Select
                  label="Status"
                  name="status"
                  defaultValue={editingEquipment.status}
                  options={[
                    { value: 'PLANNED', label: 'Planned' },
                    { value: 'IN_STOCK', label: 'In Stock' },
                    { value: 'INSTALLED', label: 'Installed' },
                    { value: 'CONFIGURED', label: 'Configured' },
                    { value: 'VERIFIED', label: 'Verified' },
                    { value: 'FAULTY', label: 'Faulty' },
                  ]}
                />
              </div>
            </ModalSection>

            <ModalSection title="Identifiers" icon={<Settings2 size={14} />}>
              <div className="space-y-4">
                <Input
                  label="Serial Number"
                  name="serialNumber"
                  defaultValue={editingEquipment.serialNumber || ''}
                />
                <Input
                  label="MAC Address"
                  name="macAddress"
                  defaultValue={editingEquipment.macAddress || ''}
                />
                <Input
                  label="IP Address"
                  name="ipAddress"
                  defaultValue={editingEquipment.ipAddress || ''}
                />
              </div>
            </ModalSection>

            <ModalSection title="Notes" icon={<Package size={14} />}>
              <Textarea
                label="Notes (optional)"
                name="notes"
                defaultValue={editingEquipment.notes || ''}
                minRows={2}
                maxRows={5}
              />
            </ModalSection>
          </form>
        )}
      </Modal>
    </div>
  );
}

// Bulk Equipment Modal Component
interface BulkEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetTypes: { id: string; name: string }[];
  onCreateSingle: (data: CreateAssetData) => void;
  onCreateBulk: (data: CreateBulkEquipmentData) => void;
  isLoading: boolean;
  assetModels: LookupAssetModel[];
}

function BulkEquipmentModal({
  isOpen,
  onClose,
  assetTypes,
  onCreateSingle,
  onCreateBulk,
  isLoading,
  assetModels,
}: BulkEquipmentModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [namePrefix, setNamePrefix] = useState('');
  const [startNumber, setStartNumber] = useState(1);
  const [showSerials, setShowSerials] = useState(false);
  const [serials, setSerials] = useState<BulkEquipmentSerial[]>([]);
  const [selectedAssetTypeId, setSelectedAssetTypeId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'IN_STOCK' | 'PLANNED'>('IN_STOCK');

  // Filter models based on selected asset type (same pattern as Room/Floor)
  const filteredModels = assetModels.filter((m) => {
    // If no type selected, show all models
    if (!selectedAssetTypeId) return true;
    // If model has no type, show it for all types
    if (!m.assetTypeId) return true;
    // Otherwise filter by type
    return m.assetTypeId === selectedAssetTypeId;
  });

  // Handle type change - clear model if not compatible
  const handleTypeChange = (newTypeId: string) => {
    const currentModelData = assetModels.find(
      (m) => `${m.manufacturer?.name} ${m.name}` === selectedModel
    );

    // If current model exists and has a different type, clear it
    const shouldClearModel = currentModelData?.assetTypeId &&
      currentModelData.assetTypeId !== newTypeId;

    setSelectedAssetTypeId(newTypeId);
    if (shouldClearModel) {
      setSelectedModel('');
    }
  };

  // Reset form when modal opens/closes
  const resetForm = () => {
    setQuantity(1);
    setNamePrefix('');
    setStartNumber(1);
    setShowSerials(false);
    setSerials([]);
    setSelectedAssetTypeId('');
    setSelectedModel('');
    setSelectedStatus('IN_STOCK');
  };

  // Generate preview names
  const previewNames = quantity > 1
    ? Array.from({ length: Math.min(quantity, 5) }, (_, i) => {
        const num = String(startNumber + i).padStart(3, '0');
        return `${namePrefix || 'Equipment'}-${num}`;
      })
    : [];

  // Update serials array when quantity changes
  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
    if (newQty > 1 && showSerials) {
      // Resize serials array
      const newSerials = [...serials];
      while (newSerials.length < newQty) {
        newSerials.push({ serialNumber: '', macAddress: '' });
      }
      setSerials(newSerials.slice(0, newQty));
    }
  };

  // Toggle serials section
  const handleToggleSerials = () => {
    if (!showSerials) {
      // Initialize serials array
      setSerials(Array.from({ length: quantity }, () => ({ serialNumber: '', macAddress: '' })));
    }
    setShowSerials(!showSerials);
  };

  // Update serial at index
  const updateSerial = (index: number, field: 'serialNumber' | 'macAddress', value: string) => {
    const newSerials = [...serials];
    newSerials[index] = { ...newSerials[index], [field]: value };
    setSerials(newSerials);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (quantity === 1) {
      // Single equipment creation
      onCreateSingle({
        name: formData.get('name') as string,
        labelCode: (formData.get('labelCode') as string) || undefined,
        assetTypeId: (formData.get('assetTypeId') as string) || undefined,
        model: (formData.get('model') as string) || undefined,
        serialNumber: (formData.get('serialNumber') as string) || undefined,
        macAddress: (formData.get('macAddress') as string) || undefined,
        ipAddress: (formData.get('ipAddress') as string) || undefined,
        notes: (formData.get('notes') as string) || undefined,
        status: selectedStatus,
      });
    } else {
      // Bulk equipment creation
      const filteredSerials = showSerials
        ? serials.filter(s => s.serialNumber || s.macAddress)
        : undefined;

      onCreateBulk({
        namePrefix: namePrefix || 'Equipment',
        quantity,
        startNumber,
        assetTypeId: (formData.get('assetTypeId') as string) || undefined,
        model: (formData.get('model') as string) || undefined,
        notes: (formData.get('notes') as string) || undefined,
        serials: filteredSerials?.length ? filteredSerials : undefined,
        status: selectedStatus,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Add Equipment"
      icon={<Cpu size={18} />}
      size="lg"
      footer={
        <ModalActions>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" form="create-equipment-form" isLoading={isLoading}>
            {quantity === 1 ? 'Add Equipment' : `Add ${quantity} Equipment`}
          </Button>
        </ModalActions>
      }
    >
      <form id="create-equipment-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Quantity Section */}
        <ModalSection title="Quantity" icon={<Package size={14} />}>
          <div className="space-y-4">
            <Input
              label="How many?"
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 1)}
            />
            {quantity > 1 && (
              <div className="bg-surface-secondary rounded-lg p-3">
                <p className="text-caption text-text-secondary mb-2">
                  Names will be auto-generated: {namePrefix || 'Equipment'}-001, {namePrefix || 'Equipment'}-002, ...
                </p>
              </div>
            )}
          </div>
        </ModalSection>

        {/* Status Section */}
        <ModalSection title="Status" icon={<ArrowDownToLine size={14} />}>
          <Select
            label="Equipment Status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'IN_STOCK' | 'PLANNED')}
            options={[
              { value: 'IN_STOCK', label: 'In Stock (Παραλήφθηκε)' },
              { value: 'PLANNED', label: 'Planned (Προς Παραγγελία)' },
            ]}
          />
        </ModalSection>

        {/* Basic Info Section */}
        <ModalSection title="Basic Info" icon={<Cpu size={14} />}>
          <div className="space-y-4">
            {quantity === 1 ? (
              <Input
                label="Equipment Name"
                name="name"
                required
                placeholder="e.g., AP-001"
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Name Prefix"
                  value={namePrefix}
                  onChange={(e) => setNamePrefix(e.target.value)}
                  placeholder="e.g., AP"
                  required
                />
                <Input
                  label="Start Number"
                  type="number"
                  min={0}
                  value={startNumber}
                  onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            )}
            {quantity === 1 && (
              <Input
                label="Label Code"
                name="labelCode"
                placeholder="QR label code"
              />
            )}
            <Select
              label="Equipment Type"
              name="assetTypeId"
              value={selectedAssetTypeId}
              onChange={(e) => handleTypeChange(e.target.value)}
              options={[
                { value: '', label: 'Select type...' },
                ...assetTypes.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
            <Select
              label="Model"
              name="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              options={[
                { value: '', label: 'Select model (optional)' },
                ...filteredModels.map((m) => ({
                  value: `${m.manufacturer?.name} ${m.name}`,
                  label: `${m.manufacturer?.name} - ${m.name}`,
                })),
              ]}
            />
          </div>
        </ModalSection>

        {/* Identifiers Section - Only for single */}
        {quantity === 1 && (
          <ModalSection title="Identifiers" icon={<Settings2 size={14} />}>
            <div className="space-y-4">
              <Input
                label="Serial Number"
                name="serialNumber"
                placeholder="Device serial number"
              />
              <Input
                label="MAC Address"
                name="macAddress"
                placeholder="e.g., AA:BB:CC:DD:EE:FF"
              />
              <Input
                label="IP Address"
                name="ipAddress"
                placeholder="e.g., 192.168.1.100"
              />
            </div>
          </ModalSection>
        )}

        {/* Bulk Serials Section */}
        {quantity > 1 && (
          <ModalSection title="Serial Numbers (Optional)" icon={<Settings2 size={14} />}>
            <div className="space-y-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleToggleSerials}
              >
                {showSerials ? 'Hide Serial List' : 'Add Serial Numbers'}
              </Button>

              {showSerials && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {serials.map((serial, index) => (
                    <div key={index} className="flex items-center gap-2 bg-background rounded-lg p-2">
                      <span className="text-caption text-text-tertiary w-16">
                        {namePrefix || 'Eq'}-{String(startNumber + index).padStart(3, '0')}
                      </span>
                      <Input
                        placeholder="Serial"
                        value={serial.serialNumber || ''}
                        onChange={(e) => updateSerial(index, 'serialNumber', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="MAC"
                        value={serial.macAddress || ''}
                        onChange={(e) => updateSerial(index, 'macAddress', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ModalSection>
        )}

        {/* Preview Section - Only for bulk */}
        {quantity > 1 && previewNames.length > 0 && (
          <ModalSection title="Preview" icon={<Package size={14} />}>
            <div className="bg-background rounded-lg p-3">
              <p className="text-caption text-text-secondary mb-2">
                Will create {quantity} equipment:
              </p>
              <div className="flex flex-wrap gap-1">
                {previewNames.map((name, i) => (
                  <Badge key={i} variant="default" size="sm">{name}</Badge>
                ))}
                {quantity > 5 && (
                  <span className="text-caption text-text-tertiary">
                    ... and {quantity - 5} more
                  </span>
                )}
              </div>
            </div>
          </ModalSection>
        )}

        {/* Notes Section */}
        <ModalSection title="Notes" icon={<Package size={14} />}>
          <Textarea
            label="Notes (optional)"
            name="notes"
            placeholder="Additional notes..."
            minRows={2}
            maxRows={5}
          />
        </ModalSection>
      </form>
    </Modal>
  );
}

// Item Logs Modal Component
function ItemLogsModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  // Fetch full item with logs
  const { data: fullItem, isLoading } = useQuery({
    queryKey: ['inventory-item', item.id],
    queryFn: () => inventoryService.getById(item.id),
  });

  const displayItem = fullItem || item;

  const getActionIcon = (action: InventoryAction) => {
    switch (action) {
      case 'RECEIVED':
        return <ArrowDownToLine size={14} className="text-success" />;
      case 'CONSUMED':
        return <ArrowUpFromLine size={14} className="text-error" />;
      case 'RETURNED':
        return <RotateCcw size={14} className="text-primary" />;
      case 'ADJUSTED':
        return <Settings2 size={14} className="text-warning" />;
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Stock Movement History"
      icon={<History size={18} />}
      size="lg"
      footer={
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </ModalActions>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Item Info */}
          <ModalSection title="Item Summary" icon={<Package size={14} />}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body font-medium text-text-primary">{displayItem.itemType}</p>
                <p className="text-caption text-text-secondary">{displayItem.description}</p>
                <div className="flex items-center gap-1 text-caption text-text-tertiary mt-1">
                  <Building2 size={12} />
                  <span>{displayItem.project?.name}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-h3 text-text-primary">{displayItem.currentStock}</p>
                <p className="text-caption text-text-secondary">{displayItem.unit} in stock</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-surface-border">
              <div className="text-center">
                <p className="text-body font-medium text-success">{displayItem.quantityReceived}</p>
                <p className="text-caption text-text-tertiary">Received</p>
              </div>
              <div className="text-center">
                <p className="text-body font-medium text-error">{displayItem.quantityUsed}</p>
                <p className="text-caption text-text-tertiary">Used</p>
              </div>
              <div className="text-center">
                <p className="text-body font-medium text-primary">{displayItem.currentStock}</p>
                <p className="text-caption text-text-tertiary">Current</p>
              </div>
            </div>
          </ModalSection>

          {/* Logs */}
          <ModalSection title={`Movement History (${displayItem.logs?.length || 0})`} icon={<History size={14} />}>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {displayItem.logs?.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 bg-background rounded-lg p-3"
                >
                  <div className="mt-0.5">{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={actionColors[log.action] as any} size="sm">
                        {actionLabels[log.action]}
                      </Badge>
                      <span className="text-body-sm font-medium text-text-primary">
                        {log.quantity} {displayItem.unit}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-caption text-text-secondary mt-1">{log.notes}</p>
                    )}
                    {log.serialNumbers && log.serialNumbers.length > 0 && (
                      <div className="mt-1">
                        <p className="text-caption text-text-tertiary">
                          S/N: {log.serialNumbers.join(', ')}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-caption text-text-tertiary">
                      <span>{log.user?.name || 'System'}</span>
                      <span>•</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!displayItem.logs || displayItem.logs.length === 0) && (
                <p className="text-body-sm text-text-tertiary text-center py-4">
                  No movements recorded yet
                </p>
              )}
            </div>
          </ModalSection>
        </div>
      )}
    </Modal>
  );
}
