import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Search,
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
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Badge,
  Button,
  Modal,
  ModalSection,
  ModalActions,
  Pagination,
  usePagination,
} from '@/components/ui';
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

const actionOptions = [
  { value: 'RECEIVED', label: 'Received', icon: ArrowDownToLine },
  { value: 'CONSUMED', label: 'Consumed', icon: ArrowUpFromLine },
  { value: 'RETURNED', label: 'Returned', icon: RotateCcw },
  { value: 'ADJUSTED', label: 'Adjusted', icon: Settings2 },
];

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [addLogItem, setAddLogItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

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

  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedItems,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(filteredItems || items, 25);

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
            Track materials and stock levels
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus size={18} />}
        >
          Add Item
        </Button>
      </div>

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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
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
      </div>

      {/* Items List */}
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
                    <th className="text-left px-4 py-3 text-caption font-medium text-text-secondary">Item</th>
                    <th className="text-left px-4 py-3 text-caption font-medium text-text-secondary">Project</th>
                    <th className="text-left px-4 py-3 text-caption font-medium text-text-secondary">Received</th>
                    <th className="text-left px-4 py-3 text-caption font-medium text-text-secondary">Used</th>
                    <th className="text-left px-4 py-3 text-caption font-medium text-text-secondary">Stock</th>
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

      {/* Create Modal */}
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
              <Input
                label="Description"
                name="description"
                required
                placeholder="e.g., Blue Cat6 UTP 305m box"
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
                <Input
                  label="Description"
                  name="description"
                  required
                  defaultValue={editingItem.description}
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
                <div>
                  <label className="block text-body-sm font-medium text-text-secondary mb-1.5">
                    Serial Numbers (optional)
                  </label>
                  <textarea
                    name="serialNumbers"
                    rows={3}
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none text-body-sm"
                    placeholder="One per line..."
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-text-secondary mb-1.5">
                    Notes (optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none text-body-sm"
                    placeholder="Additional notes..."
                  />
                </div>
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
    </div>
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
