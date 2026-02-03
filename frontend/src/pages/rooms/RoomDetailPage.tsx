import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Box,
  Wifi,
  Camera,
  Server,
  Router,
  Battery,
  Network,
  Upload,
  Map,
  Image as ImageIcon,
  Lock,
  Unlock,
  AlertTriangle,
  Hash,
  Globe,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Modal,
  ModalSection,
  ModalActions,
  Input,
  Select,
  Pagination,
  usePagination,
} from '@/components/ui';
import { RoomPlanCanvas } from '@/components/room-plan';
import { DownloadFloorplanModal } from '@/components/floor-plan';
import { assetService, type Asset, type AssetType, type CreateAssetData, type UpdateAssetData, type AssetStatus } from '@/services/asset.service';
import { roomService } from '@/services/room.service';
import { uploadService } from '@/services/upload.service';
import { useAuthStore } from '@/stores/auth.store';
import { assetModelService } from '@/services/lookup.service';

const assetStatusOptions = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'INSTALLED', label: 'Installed' },
  { value: 'CONFIGURED', label: 'Configured' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'FAULTY', label: 'Faulty' },
];

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

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canManage = user?.role === 'ADMIN' || user?.role === 'PM' || user?.role === 'TECHNICIAN';

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState<Asset | null>(null);
  const [isUploadingFloorplan, setIsUploadingFloorplan] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const floorplanInputRef = useRef<HTMLInputElement>(null);

  // Fetch room with assets
  const { data: room, isLoading: roomLoading, refetch: refetchRoom } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomService.getById(id!),
    enabled: !!id,
  });

  // Assets come from room query
  const assets = room?.assets || [];

  // Pagination for assets
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedAssets,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(assets, 25);

  // Calculate placed and available assets
  const placedAssets = assets.filter(a => a.pinX !== null && a.pinY !== null);
  const availableAssets = assets.filter(a => a.pinX === null || a.pinY === null);

  // Fetch asset types
  const { data: assetTypes = [] } = useQuery({
    queryKey: ['asset-types'],
    queryFn: () => assetService.getTypes(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAssetData) => assetService.create(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      setIsCreateModalOpen(false);
      toast.success('Asset created successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create asset');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ assetId, data }: { assetId: string; data: UpdateAssetData }) =>
      assetService.update(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      setEditingAsset(null);
      toast.success('Asset updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update asset');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (assetId: string) => assetService.delete(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      setDeleteConfirmAsset(null);
      toast.success('Asset deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete asset');
    },
  });

  // Update asset position mutation
  const updatePositionMutation = useMutation({
    mutationFn: ({ assetId, pinX, pinY }: { assetId: string; pinX: number | null; pinY: number | null }) =>
      assetService.updatePosition(assetId, pinX, pinY),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update asset position');
    },
  });

  // Handle floorplan upload
  const handleFloorplanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setIsUploadingFloorplan(true);
    try {
      await uploadService.uploadRoomFloorplan(id, file);
      toast.success('Floor plan uploaded successfully');
      refetchRoom();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload floor plan');
    } finally {
      setIsUploadingFloorplan(false);
      if (floorplanInputRef.current) {
        floorplanInputRef.current.value = '';
      }
    }
  };

  // Handle placing asset on floor plan
  const handlePlaceAsset = (assetId: string, x: number, y: number) => {
    updatePositionMutation.mutate({ assetId, pinX: x, pinY: y });
    toast.success('Asset placed on floor plan');
  };

  // Handle moving asset pin
  const handleMoveAsset = (assetId: string, x: number, y: number) => {
    updatePositionMutation.mutate({ assetId, pinX: x, pinY: y });
  };

  // Handle removing asset from floor plan
  const handleRemoveAssetPin = (assetId: string) => {
    updatePositionMutation.mutate({ assetId, pinX: null, pinY: null });
    toast.success('Asset removed from floor plan');
  };

  // Handle asset click on canvas
  const handleAssetClick = (asset: Asset) => {
    setSelectedAssetId(asset.id);
    navigate(`/assets/${asset.id}`);
  };

  const isLoading = roomLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Calculate stats
  const stats = {
    total: assets.length,
    installed: assets.filter(a => ['INSTALLED', 'CONFIGURED', 'VERIFIED'].includes(a.status)).length,
    configured: assets.filter(a => ['CONFIGURED', 'VERIFIED'].includes(a.status)).length,
    faulty: assets.filter(a => a.status === 'FAULTY').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => room?.floor ? navigate(`/floors/${room.floor.id}`) : navigate(-1)}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-2"
          >
            <ArrowLeft size={18} />
            <span className="text-body-sm">
              {room?.floor ? `Back to ${room.floor.name}` : 'Back'}
            </span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Box size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-h1">{room?.name || 'Room'}</h1>
              <p className="text-body text-text-secondary">
                {room?.floor?.project?.name} / {room?.floor?.name}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <input
                ref={floorplanInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFloorplanUpload}
                className="hidden"
                id="room-floorplan-upload"
              />
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Upload size={16} />}
                onClick={() => floorplanInputRef.current?.click()}
                isLoading={isUploadingFloorplan}
              >
                {room?.floorplanUrl ? 'Change Floor Plan' : 'Upload Floor Plan'}
              </Button>
            </>
          )}
          {canManage && (
            <Button leftIcon={<Plus size={18} />} onClick={() => setIsCreateModalOpen(true)}>
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* Floor Plan Section */}
      {room?.floorplanUrl && room.floorplanType === 'IMAGE' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="flex items-center gap-2">
              <Map size={20} />
              Room Floor Plan
              {placedAssets.length > 0 && (
                <Badge variant="primary" size="sm">
                  {placedAssets.length} assets placed
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {availableAssets.length > 0 && canManage && isEditMode && (
                <span className="text-caption text-text-secondary">
                  {availableAssets.length} assets to place
                </span>
              )}
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Download size={16} />}
                onClick={() => setIsDownloadModalOpen(true)}
              >
                Download
              </Button>
              {canManage && (
                <Button
                  size="sm"
                  variant={isEditMode ? 'primary' : 'secondary'}
                  leftIcon={isEditMode ? <Unlock size={16} /> : <Lock size={16} />}
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? 'Editing' : 'Edit'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFloorPlan(!showFloorPlan)}
              >
                {showFloorPlan ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          {showFloorPlan && (
            <CardContent className="p-0">
              <div className="h-[500px]">
                <RoomPlanCanvas
                  imageUrl={room.floorplanUrl}
                  assets={assets as any}
                  availableAssets={isEditMode ? availableAssets as any : []}
                  onAssetClick={handleAssetClick as any}
                  onAssetMove={handleMoveAsset}
                  onPlaceAsset={handlePlaceAsset}
                  onRemoveAssetPin={handleRemoveAssetPin}
                  isEditable={isEditMode}
                  selectedAssetId={selectedAssetId}
                  onMaximize={() => setIsFullScreenOpen(true)}
                />
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* No Floor Plan Message */}
      {!room?.floorplanUrl && canManage && (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="text-center">
              <ImageIcon size={48} className="mx-auto text-text-tertiary mb-4" />
              <h3 className="text-h3 mb-2">No Floor Plan Yet</h3>
              <p className="text-body-sm text-text-secondary mb-4">
                Upload a floor plan image to place assets visually on the room layout.
              </p>
              <Button
                variant="secondary"
                leftIcon={<Upload size={16} />}
                onClick={() => floorplanInputRef.current?.click()}
                isLoading={isUploadingFloorplan}
              >
                Upload Floor Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Assets List */}
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
              <Box size={32} className="mx-auto mb-2 opacity-50" />
              <p>No assets in this room</p>
              {canManage && (
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  leftIcon={<Plus size={16} />}
                >
                  Add First Asset
                </Button>
              )}
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-secondary">
                    <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Asset</th>
                    <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Type</th>
                    <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Serial / MAC</th>
                    <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Status</th>
                    <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">On Plan</th>
                    <th className="text-right text-caption font-medium text-text-secondary px-4 py-3">Actions</th>
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
                            {asset.assetType?.icon ? assetTypeIcons[asset.assetType.icon] || <Box size={18} /> : <Box size={18} />}
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
                      <td className="px-4 py-3">
                        {asset.pinX !== null && asset.pinY !== null ? (
                          <Badge variant="success" size="sm">
                            <Map size={12} className="mr-1" />
                            Placed
                          </Badge>
                        ) : (
                          <span className="text-body-sm text-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAsset(asset);
                            }}
                            className="p-2 rounded hover:bg-surface-hover text-text-secondary"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          {(user?.role === 'ADMIN' || user?.role === 'PM') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmAsset(asset);
                              }}
                              className="p-2 rounded hover:bg-surface-hover text-error"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
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

      {/* Create Modal */}
      <AssetFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data as CreateAssetData)}
        isLoading={createMutation.isPending}
        title="Add New Asset"
        assetTypes={assetTypes}
      />

      {/* Edit Modal */}
      {editingAsset && (
        <AssetFormModal
          isOpen={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          onSubmit={(data) => updateMutation.mutate({ assetId: editingAsset.id, data })}
          isLoading={updateMutation.isPending}
          title="Edit Asset"
          assetTypes={assetTypes}
          initialData={editingAsset}
          showStatus
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmAsset && (
        <Modal
          isOpen={!!deleteConfirmAsset}
          onClose={() => setDeleteConfirmAsset(null)}
          title="Delete Asset"
          icon={<AlertTriangle size={18} />}
          size="sm"
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setDeleteConfirmAsset(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(deleteConfirmAsset.id)}
                isLoading={deleteMutation.isPending}
              >
                Delete Asset
              </Button>
            </ModalActions>
          }
        >
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-error" />
            </div>
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete <strong className="text-text-primary">{deleteConfirmAsset.name}</strong>?
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              This will also delete all associated checklists and data. This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}

      {/* Full Screen Floor Plan Modal */}
      {room?.floorplanUrl && room.floorplanType === 'IMAGE' && (
        <Modal
          isOpen={isFullScreenOpen}
          onClose={() => setIsFullScreenOpen(false)}
          title={`${room.name} - Floor Plan`}
          icon={<Map size={18} />}
          size="full"
        >
          {/* Edit mode toggle in fullscreen */}
          {canManage && (
            <div className="flex items-center justify-end gap-2 mb-2 -mt-2">
              {availableAssets.length > 0 && isEditMode && (
                <span className="text-caption text-text-secondary">
                  {availableAssets.length} assets to place
                </span>
              )}
              {isEditMode && (
                <Badge variant="info" size="sm">
                  Click to place asset | Drag to move
                </Badge>
              )}
              <Button
                size="sm"
                variant={isEditMode ? 'primary' : 'secondary'}
                leftIcon={isEditMode ? <Unlock size={16} /> : <Lock size={16} />}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? 'Editing' : 'Edit'}
              </Button>
            </div>
          )}
          <div className="h-[calc(95vh-120px)] -mx-6 -mb-6">
            <RoomPlanCanvas
              imageUrl={room.floorplanUrl}
              assets={assets as any}
              availableAssets={isEditMode ? availableAssets as any : []}
              onAssetClick={(asset) => {
                setSelectedAssetId(asset.id);
                setIsFullScreenOpen(false);
                navigate(`/assets/${asset.id}`);
              }}
              onAssetMove={handleMoveAsset}
              onPlaceAsset={handlePlaceAsset}
              onRemoveAssetPin={handleRemoveAssetPin}
              isEditable={isEditMode}
              selectedAssetId={selectedAssetId}
              showMaximize={false}
              showLegend={false}
            />
          </div>
        </Modal>
      )}

      {/* Download Floorplan Modal */}
      {room?.floorplanUrl && room.floorplanType === 'IMAGE' && (
        <DownloadFloorplanModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          imageUrl={room.floorplanUrl}
          fileName={`${room.floor?.project?.name || 'project'}-${room.floor?.name || 'floor'}-${room.name}-floorplan`}
          projectName={room.floor?.project?.name}
          floorName={room.floor?.name}
          roomName={room.name}
          pins={assets
            .filter((asset) => asset.pinX !== null && asset.pinY !== null)
            .map((asset) => ({
              id: asset.id,
              name: asset.name,
              x: asset.pinX!,
              y: asset.pinY!,
              status: asset.status,
            }))}
          pinType="asset"
        />
      )}
    </div>
  );
}

// Asset Form Modal
interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAssetData | UpdateAssetData) => void;
  isLoading: boolean;
  title: string;
  assetTypes: AssetType[];
  initialData?: Asset;
  showStatus?: boolean;
}

function AssetFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  title,
  assetTypes,
  initialData,
  showStatus,
}: AssetFormModalProps) {
  const [formData, setFormData] = useState<CreateAssetData & { status?: AssetStatus }>({
    name: '',
    assetTypeId: '',
    model: '',
    serialNumber: '',
    macAddress: '',
    ipAddress: '',
    notes: '',
  });

  // Fetch all asset models
  const { data: assetModelsData } = useQuery({
    queryKey: ['lookups', 'asset-models'],
    queryFn: () => assetModelService.getAll(),
  });

  // Filter models based on selected asset type
  const filteredModels = assetModelsData?.items?.filter((m) => {
    // If no type selected, show all models
    if (!formData.assetTypeId) return true;
    // If model has no type, show it for all types
    if (!m.assetTypeId) return true;
    // Otherwise filter by type
    return m.assetTypeId === formData.assetTypeId;
  }) || [];

  const assetModelOptions = [
    { value: '', label: 'Select model (optional)' },
    ...filteredModels.map((m) => ({
      value: `${m.manufacturer?.name} ${m.name}`,
      label: `${m.manufacturer?.name} - ${m.name}`
    })),
  ];

  // Handle type change - clear model if not compatible
  const handleTypeChange = (newTypeId: string) => {
    const currentModel = formData.model;
    const currentModelData = assetModelsData?.items?.find(
      (m) => `${m.manufacturer?.name} ${m.name}` === currentModel
    );

    // If current model exists and has a different type, clear it
    const shouldClearModel = currentModelData?.assetTypeId &&
      currentModelData.assetTypeId !== newTypeId;

    setFormData({
      ...formData,
      assetTypeId: newTypeId,
      model: shouldClearModel ? '' : formData.model
    });
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        assetTypeId: initialData.assetTypeId || '',
        model: initialData.model || '',
        serialNumber: initialData.serialNumber || '',
        macAddress: initialData.macAddress || '',
        ipAddress: initialData.ipAddress || '',
        notes: initialData.notes || '',
        status: initialData.status,
      });
    } else {
      setFormData({
        name: '',
        assetTypeId: '',
        model: '',
        serialNumber: '',
        macAddress: '',
        ipAddress: '',
        notes: '',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateAssetData & { status?: AssetStatus } = {
      name: formData.name,
      assetTypeId: formData.assetTypeId || undefined,
      model: formData.model || undefined,
      serialNumber: formData.serialNumber || undefined,
      macAddress: formData.macAddress || undefined,
      ipAddress: formData.ipAddress || undefined,
      notes: formData.notes || undefined,
    };
    if (showStatus && formData.status) {
      data.status = formData.status;
    }
    onSubmit(data);
  };

  const assetTypeOptions = [
    { value: '', label: 'Select type...' },
    ...assetTypes.map(t => ({ value: t.id, label: t.name })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<Box size={18} />}
      size="lg"
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="asset-form" isLoading={isLoading}>
            {initialData ? 'Save Changes' : 'Create Asset'}
          </Button>
        </ModalActions>
      }
    >
      <form id="asset-form" onSubmit={handleSubmit} className="space-y-5">
        <ModalSection title="Basic Information" icon={<Box size={14} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Asset Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Core Switch 01"
                required
                leftIcon={<Box size={16} />}
              />
              <Select
                label="Asset Type"
                value={formData.assetTypeId || ''}
                onChange={(e) => handleTypeChange(e.target.value)}
                options={assetTypeOptions}
              />
            </div>
            <Select
              label="Model"
              value={formData.model || ''}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              options={assetModelOptions}
            />
          </div>
        </ModalSection>

        <ModalSection title="Identifiers" icon={<Hash size={14} />}>
          <div className="space-y-4">
            <Input
              label="Serial Number"
              value={formData.serialNumber || ''}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              placeholder="FCW2345L0AB"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="MAC Address"
                value={formData.macAddress || ''}
                onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                placeholder="00:1A:2B:3C:4D:5E"
              />
              <Input
                label="IP Address"
                value={formData.ipAddress || ''}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                placeholder="192.168.1.1"
                leftIcon={<Globe size={16} />}
              />
            </div>
          </div>
        </ModalSection>

        {showStatus && (
          <ModalSection title="Status" icon={<AlertTriangle size={14} />}>
            <Select
              label="Asset Status"
              value={formData.status || 'PLANNED'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
              options={assetStatusOptions}
            />
          </ModalSection>
        )}

        <ModalSection title="Notes" icon={<Pencil size={14} />}>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this asset..."
            rows={3}
            className="w-full bg-surface border border-surface-border rounded-md px-3 py-2 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </ModalSection>
      </form>
    </Modal>
  );
}
