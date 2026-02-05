import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Box,
  AlertTriangle,
  MapPin,
  Image,
  Upload,
  Layers,
  Lock,
  Unlock,
  Crop,
  Download,
  Wifi,
  Camera,
  Server,
  Router,
  Battery,
  Network,
  Hash,
  Globe,
  Wand2,
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
  Textarea,
  Select,
  Pagination,
  usePagination,
} from '@/components/ui';
import { FloorPlanCanvas, RoomFloorplanCropModal, DownloadFloorplanModal } from '@/components/floor-plan';
import { ImportInventoryModal } from '@/components/inventory';
import { floorService, type Room, type CreateRoomData, type UpdateRoomData, type RoomStatus } from '@/services/floor.service';
import { assetService, type Asset, type AssetType, type CreateAssetData, type UpdateAssetData, type AssetStatus } from '@/services/asset.service';
import { uploadService } from '@/services/upload.service';
import { useAuthStore } from '@/stores/auth.store';
import { assetModelService, roomTypeService, manufacturerService } from '@/services/lookup.service';

const roomStatusOptions = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'BLOCKED', label: 'Blocked' },
];

const statusBadgeVariants: Record<RoomStatus, 'default' | 'primary' | 'success' | 'error'> = {
  NOT_STARTED: 'default',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  BLOCKED: 'error',
};

const assetStatusOptions = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'INSTALLED', label: 'Installed' },
  { value: 'CONFIGURED', label: 'Configured' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'FAULTY', label: 'Faulty' },
];

const assetStatusBadgeVariants: Record<AssetStatus, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
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

export function FloorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canManage = user?.role === 'ADMIN' || user?.role === 'PM';

  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<Room | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [pendingPinPosition, setPendingPinPosition] = useState<{ x: number; y: number } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [cropModalRoom, setCropModalRoom] = useState<Room | null>(null);
  const [isCropSaving, setIsCropSaving] = useState(false);
  const [confirmCropRoom, setConfirmCropRoom] = useState<Room | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Asset state
  const [isCreateAssetModalOpen, setIsCreateAssetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState<Asset | null>(null);

  // Fetch floor
  const { data: floor, isLoading, error } = useQuery({
    queryKey: ['floor', id],
    queryFn: () => floorService.getById(id!),
    enabled: !!id,
  });

  // Fetch asset types
  const { data: assetTypes = [] } = useQuery({
    queryKey: ['asset-types'],
    queryFn: () => assetService.getTypes(),
  });

  // Floor-level assets come from floor.assets
  const floorAssets = floor?.assets || [];

  // Separate floor assets: with pin vs without pin
  const floorAssetsWithPin = floorAssets.filter(a => a.pinX !== null && a.pinY !== null);
  const floorAssetsWithoutPin = floorAssets.filter(a => a.pinX === null || a.pinY === null);

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: (data: CreateRoomData) => floorService.createRoom(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor', id] });
      setIsCreateRoomModalOpen(false);
      setPendingPinPosition(null);
      toast.success('Room created successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create room');
    },
  });

  // Update room mutation
  const updateRoomMutation = useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: UpdateRoomData }) =>
      floorService.updateRoom(id!, roomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor', id] });
      setEditingRoom(null);
      toast.success('Room updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update room');
    },
  });

  // Delete room mutation
  const deleteRoomMutation = useMutation({
    mutationFn: (roomId: string) => floorService.deleteRoom(id!, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor', id] });
      setDeleteConfirmRoom(null);
      toast.success('Room deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete room');
    },
  });

  // Create floor-level asset mutation
  const createAssetMutation = useMutation({
    mutationFn: (data: CreateAssetData) => assetService.createInFloor(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor', id] });
      setIsCreateAssetModalOpen(false);
      toast.success('Asset created successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create asset');
    },
  });

  // Update asset mutation
  const updateAssetMutation = useMutation({
    mutationFn: ({ assetId, data }: { assetId: string; data: UpdateAssetData }) =>
      assetService.update(assetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor', id] });
      setEditingAsset(null);
      toast.success('Asset updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update asset');
    },
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: (assetId: string) => assetService.delete(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor', id] });
      setDeleteConfirmAsset(null);
      toast.success('Asset deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete asset');
    },
  });

  // Get projectId from floor
  const projectId = floor?.building?.project?.id;

  // Fetch available assets from project inventory (IN_STOCK, unassigned)
  const { data: projectInventory = [] } = useQuery({
    queryKey: ['project-equipment-available', projectId],
    queryFn: () => assetService.getAvailableByProject(projectId!),
    enabled: !!projectId,
  });

  // Assign asset to floor mutation
  const assignAssetToFloorMutation = useMutation({
    mutationFn: ({ assetId, pinX, pinY }: { assetId: string; pinX: number; pinY: number }) =>
      assetService.assignToFloor(assetId, id!, pinX, pinY),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor', id] });
      queryClient.invalidateQueries({ queryKey: ['project-equipment-available', projectId] });
      toast.success('Asset placed on floor plan');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to place asset');
    },
  });

  // Update asset position mutation
  const updateAssetPositionMutation = useMutation({
    mutationFn: ({ assetId, pinX, pinY }: { assetId: string; pinX: number | null; pinY: number | null }) =>
      assetService.updatePosition(assetId, pinX, pinY),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floor', id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update asset position');
    },
  });

  // Import multiple assets from inventory mutation
  const [isImporting, setIsImporting] = useState(false);
  const handleImportAssets = async (assetIds: string[]) => {
    if (!id) return;
    setIsImporting(true);
    try {
      // Import all assets in parallel (without pin coordinates)
      await Promise.all(
        assetIds.map((assetId) => assetService.assignToFloor(assetId, id))
      );
      queryClient.invalidateQueries({ queryKey: ['floor', id] });
      queryClient.invalidateQueries({ queryKey: ['project-equipment-available', projectId] });
      toast.success(`${assetIds.length} asset${assetIds.length > 1 ? 's' : ''} imported successfully`);
      setIsImportModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import assets');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle floor plan upload
  const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setIsUploading(true);
    try {
      await uploadService.uploadFloorPlan(id, file);
      queryClient.invalidateQueries({ queryKey: ['floor', id] });
      toast.success('Floor plan uploaded successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload floor plan');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle room floorplan crop save
  const handleCropSave = async (croppedBlob: Blob) => {
    if (!cropModalRoom) return;

    setIsCropSaving(true);
    try {
      const file = new File([croppedBlob], `room-${cropModalRoom.id}-floorplan.png`, { type: 'image/png' });
      await uploadService.uploadRoomFloorplan(cropModalRoom.id, file);
      queryClient.invalidateQueries({ queryKey: ['floor', id] });
      toast.success('Η κάτοψη του δωματίου αποθηκεύτηκε!');
      setCropModalRoom(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Αποτυχία αποθήκευσης κάτοψης');
    } finally {
      setIsCropSaving(false);
    }
  };

  // Pagination for rooms - must be called before any conditional returns
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedRooms,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(floor?.rooms || [], 25);

  // Pagination for floor assets
  const {
    currentPage: assetCurrentPage,
    pageSize: assetPageSize,
    totalPages: assetTotalPages,
    totalItems: assetTotalItems,
    paginatedItems: paginatedAssets,
    handlePageChange: handleAssetPageChange,
    handlePageSizeChange: handleAssetPageSizeChange,
  } = usePagination(floorAssets, 25);

  const roomStats = {
    total: floor?.rooms?.length || 0,
    completed: floor?.rooms?.filter(r => r.status === 'COMPLETED').length || 0,
    inProgress: floor?.rooms?.filter(r => r.status === 'IN_PROGRESS').length || 0,
    blocked: floor?.rooms?.filter(r => r.status === 'BLOCKED').length || 0,
  };

  const assetStats = {
    total: floorAssets.length,
    installed: floorAssets.filter(a => ['INSTALLED', 'CONFIGURED', 'VERIFIED'].includes(a.status)).length,
    configured: floorAssets.filter(a => ['CONFIGURED', 'VERIFIED'].includes(a.status)).length,
    faulty: floorAssets.filter(a => a.status === 'FAULTY').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !floor) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-error mb-4">Floor not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate(`/buildings/${floor.building?.id}`)}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-2"
          >
            <ArrowLeft size={18} />
            <span className="text-body-sm">Back to {floor.building?.name}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-h3 font-bold text-primary">{floor.level}</span>
            </div>
            <div>
              <h1 className="text-h1">{floor.name}</h1>
              <p className="text-body text-text-secondary">Level {floor.level}</p>
            </div>
          </div>
        </div>
        {canManage && (
          <Button leftIcon={<Plus size={18} />} onClick={() => setIsCreateRoomModalOpen(true)}>
            Add Room
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-h2 text-text-primary">{roomStats.total}</p>
            <p className="text-caption text-text-secondary">Total Rooms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-h2 text-success">{roomStats.completed}</p>
            <p className="text-caption text-text-secondary">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-h2 text-primary">{roomStats.inProgress}</p>
            <p className="text-caption text-text-secondary">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-h2 text-error">{roomStats.blocked}</p>
            <p className="text-caption text-text-secondary">Blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Hidden file input for floor plan upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFloorPlanUpload}
        className="hidden"
      />

      {/* Floor Plan Viewer */}
      {floor.floorplanUrl ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers size={20} />
              Floor Plan
            </CardTitle>
            <div className="flex items-center gap-2">
              {canManage && isEditMode && (
                <>
                  {(floor.rooms || []).filter(r => r.pinX === null || r.pinY === null).length > 0 && (
                    <span className="text-caption text-text-secondary">
                      {(floor.rooms || []).filter(r => r.pinX === null || r.pinY === null).length} rooms to place
                    </span>
                  )}
                  <Badge variant="info" size="sm">
                    Click to add | Drag to move
                  </Badge>
                </>
              )}
              {canManage && (
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Upload size={16} />}
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploading}
                >
                  Change
                </Button>
              )}
              {floor.floorplanType !== 'PDF' && (
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Download size={16} />}
                  onClick={() => setIsDownloadModalOpen(true)}
                >
                  Download
                </Button>
              )}
              {canManage && (
                <Button
                  size="sm"
                  variant={isEditMode ? 'primary' : 'secondary'}
                  leftIcon={isEditMode ? <Unlock size={16} /> : <Lock size={16} />}
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? 'Editing' : 'Edit Pins'}
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
          <CardContent>
            {floor.floorplanType === 'PDF' ? (
              <div className="text-center py-8 bg-surface-secondary rounded-lg">
                <p className="text-text-secondary mb-4">PDF floor plan uploaded</p>
                <a
                  href={floor.floorplanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Open PDF in new tab
                </a>
              </div>
            ) : (
              <div className="h-[500px]">
                <FloorPlanCanvas
                  imageUrl={floor.floorplanUrl}
                  pins={(floor.rooms || [])
                    .filter((room) => room.pinX !== null && room.pinY !== null)
                    .map((room) => ({
                      id: room.id,
                      x: room.pinX!,
                      y: room.pinY!,
                      name: room.name,
                      status: room.status,
                    }))}
                  availableItems={isEditMode ? (floor.rooms || [])
                    .filter((room) => room.pinX === null || room.pinY === null)
                    .map((room) => ({
                      id: room.id,
                      name: room.name,
                    })) : []}
                  selectedPinId={selectedRoomId}
                  isEditable={isEditMode}
                  onPinClick={(pin) => {
                    setSelectedRoomId(pin.id);
                    const room = floor.rooms?.find((r) => r.id === pin.id);
                    if (room) {
                      setEditingRoom(room);
                    }
                  }}
                  onPinMove={(pinId, x, y) => {
                    updateRoomMutation.mutate({
                      roomId: pinId,
                      data: { pinX: Math.round(x), pinY: Math.round(y) },
                    });
                  }}
                  onPlaceItem={(roomId, x, y) => {
                    updateRoomMutation.mutate({
                      roomId,
                      data: { pinX: Math.round(x), pinY: Math.round(y) },
                    });
                    toast.success('Room placed on floor plan');
                  }}
                  onAddPin={(x, y) => {
                    setPendingPinPosition({ x: Math.round(x), y: Math.round(y) });
                    setIsCreateRoomModalOpen(true);
                  }}
                  onRemovePin={(roomId) => {
                    updateRoomMutation.mutate({
                      roomId,
                      data: { pinX: null, pinY: null },
                    });
                    toast.success('Room removed from floor plan');
                  }}
                  // Asset props
                  assets={floorAssets}
                  availableAssets={isEditMode ? projectInventory : []}
                  floorAssetsWithoutPin={isEditMode ? floorAssetsWithoutPin : []}
                  onAssetClick={(asset) => {
                    const floorAsset = floorAssets.find((a) => a.id === asset.id);
                    if (floorAsset) {
                      setEditingAsset(floorAsset);
                    }
                  }}
                  onAssetMove={(assetId, x, y) => {
                    updateAssetPositionMutation.mutate({
                      assetId,
                      pinX: Math.round(x),
                      pinY: Math.round(y),
                    });
                  }}
                  onPlaceAsset={(assetId, x, y) => {
                    assignAssetToFloorMutation.mutate({
                      assetId,
                      pinX: Math.round(x),
                      pinY: Math.round(y),
                    });
                  }}
                  onPlaceExistingAsset={(assetId, x, y) => {
                    // Place existing floor asset (already belongs to floor, just needs pin)
                    updateAssetPositionMutation.mutate({
                      assetId,
                      pinX: Math.round(x),
                      pinY: Math.round(y),
                    });
                    toast.success('Asset placed on floor plan');
                  }}
                  onRemoveAssetPin={(assetId) => {
                    updateAssetPositionMutation.mutate({
                      assetId,
                      pinX: null,
                      pinY: null,
                    });
                    toast.success('Asset removed from floor plan');
                  }}
                  onMaximize={() => setIsFullScreenOpen(true)}
                />
              </div>
            )}
          </CardContent>
          )}
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Image size={48} className="mx-auto text-text-tertiary mb-4" />
            <h3 className="text-h3 text-text-primary mb-2">No Floor Plan</h3>
            <p className="text-body text-text-secondary mb-4">
              Upload a floor plan to visualize room locations
            </p>
            {canManage && (
              <Button
                variant="secondary"
                leftIcon={<Upload size={18} />}
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
              >
                Upload Floor Plan
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Floor-Level Assets Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Box size={20} />
            Floor-Level Assets ({floorAssets.length})
          </CardTitle>
          {canManage && (
            <Button
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setIsImportModalOpen(true)}
            >
              Add Asset
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {floorAssets.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <Box size={32} className="mx-auto mb-2 opacity-50" />
              <p>No floor-level assets</p>
              <p className="text-caption text-text-tertiary mt-1">
                Assets placed directly on the floor (not in rooms)
              </p>
              {canManage && (
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => setIsImportModalOpen(true)}
                  leftIcon={<Plus size={16} />}
                >
                  Add First Asset
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Asset stats */}
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-surface-border bg-surface-secondary/50">
                <div className="text-center">
                  <p className="text-h3 text-text-primary">{assetStats.total}</p>
                  <p className="text-caption text-text-secondary">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-h3 text-primary">{assetStats.installed}</p>
                  <p className="text-caption text-text-secondary">Installed</p>
                </div>
                <div className="text-center">
                  <p className="text-h3 text-success">{assetStats.configured}</p>
                  <p className="text-caption text-text-secondary">Configured</p>
                </div>
                <div className="text-center">
                  <p className="text-h3 text-error">{assetStats.faulty}</p>
                  <p className="text-caption text-text-secondary">Faulty</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-secondary">
                      <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Asset</th>
                      <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Type</th>
                      <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Serial / MAC</th>
                      <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Status</th>
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
                          <Badge variant={assetStatusBadgeVariants[asset.status]} size="sm">
                            {asset.status.replace('_', ' ')}
                          </Badge>
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
                currentPage={assetCurrentPage}
                totalPages={assetTotalPages}
                totalItems={assetTotalItems}
                pageSize={assetPageSize}
                onPageChange={handleAssetPageChange}
                onPageSizeChange={handleAssetPageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Rooms List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin size={20} />
            Rooms ({floor.rooms?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!floor.rooms || floor.rooms.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <MapPin size={32} className="mx-auto mb-2 opacity-50" />
              <p>No rooms added yet</p>
              {canManage && (
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => setIsCreateRoomModalOpen(true)}
                  leftIcon={<Plus size={16} />}
                >
                  Add First Room
                </Button>
              )}
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-secondary">
                    <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Room</th>
                    <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Type</th>
                    <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Status</th>
                    <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Assets</th>
                    <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Issues</th>
                    {floor.floorplanUrl && floor.floorplanType !== 'PDF' && (
                      <th className="text-center text-caption font-medium text-text-secondary px-4 py-3">Κάτοψη</th>
                    )}
                    <th className="text-right text-caption font-medium text-text-secondary px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRooms.map((room) => (
                    <tr
                      key={room.id}
                      className="border-b border-surface-border hover:bg-surface-hover transition-colors cursor-pointer"
                      onClick={() => navigate(`/rooms/${room.id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-body font-medium text-text-primary">{room.name}</p>
                        {room.notes && (
                          <p className="text-caption text-text-tertiary truncate max-w-xs">{room.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-text-secondary">
                        {room.type || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadgeVariants[room.status]} size="sm">
                          {room.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-body-sm text-text-secondary">
                          <Box size={14} />
                          <span>{room._count?.assets || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(room._count?.issues || 0) > 0 ? (
                          <div className="flex items-center gap-1 text-body-sm text-warning">
                            <AlertTriangle size={14} />
                            <span>{room._count?.issues}</span>
                          </div>
                        ) : (
                          <span className="text-body-sm text-text-tertiary">-</span>
                        )}
                      </td>
                      {floor.floorplanUrl && floor.floorplanType !== 'PDF' && (
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (room.floorplanUrl) {
                                // Room already has floorplan - ask for confirmation
                                setConfirmCropRoom(room);
                              } else {
                                setCropModalRoom(room);
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-body-sm rounded-md transition-colors ${
                              room.floorplanUrl
                                ? 'bg-success/10 text-success hover:bg-success/20'
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                            }`}
                            title={room.floorplanUrl ? 'Has floorplan - Click to replace' : 'Set floorplan from floor plan'}
                          >
                            <Crop size={14} />
                            <span>{room.floorplanUrl ? 'Edit' : 'Crop'}</span>
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRoom(room);
                            }}
                            className="p-2 rounded hover:bg-surface-hover text-text-secondary"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          {canManage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmRoom(room);
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

      {/* Create Room Modal */}
      <RoomFormModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => {
          setIsCreateRoomModalOpen(false);
          setPendingPinPosition(null);
        }}
        onSubmit={(data) => {
          const roomData: CreateRoomData = {
            ...data as CreateRoomData,
            ...(pendingPinPosition && {
              pinX: pendingPinPosition.x,
              pinY: pendingPinPosition.y,
            }),
          };
          createRoomMutation.mutate(roomData);
        }}
        isLoading={createRoomMutation.isPending}
        title={pendingPinPosition ? 'Add Room at Pin Location' : 'Add New Room'}
      />

      {/* Edit Room Modal */}
      {editingRoom && (
        <RoomFormModal
          isOpen={!!editingRoom}
          onClose={() => setEditingRoom(null)}
          onSubmit={(data) => updateRoomMutation.mutate({ roomId: editingRoom.id, data })}
          isLoading={updateRoomMutation.isPending}
          title="Edit Room"
          initialData={editingRoom}
          showStatus
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmRoom && (
        <Modal
          isOpen={!!deleteConfirmRoom}
          onClose={() => setDeleteConfirmRoom(null)}
          title="Delete Room"
          icon={<AlertTriangle size={18} />}
          size="sm"
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setDeleteConfirmRoom(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteRoomMutation.mutate(deleteConfirmRoom.id)}
                isLoading={deleteRoomMutation.isPending}
              >
                Delete Room
              </Button>
            </ModalActions>
          }
        >
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-error" />
            </div>
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete <strong className="text-text-primary">{deleteConfirmRoom.name}</strong>?
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              This will also delete all assets and related data. This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}

      {/* Full Screen Floor Plan Modal */}
      {floor.floorplanUrl && floor.floorplanType !== 'PDF' && (
        <Modal
          isOpen={isFullScreenOpen}
          onClose={() => setIsFullScreenOpen(false)}
          title={`${floor.name} - Floor Plan`}
          icon={<Layers size={18} />}
          size="full"
        >
          {/* Edit mode toggle in fullscreen */}
          {canManage && (
            <div className="flex items-center justify-end gap-2 mb-2 -mt-2">
              {isEditMode && (
                <>
                  {(floor.rooms || []).filter(r => r.pinX === null || r.pinY === null).length > 0 && (
                    <span className="text-caption text-text-secondary">
                      {(floor.rooms || []).filter(r => r.pinX === null || r.pinY === null).length} rooms to place
                    </span>
                  )}
                  <Badge variant="info" size="sm">
                    Click to add | Drag to move
                  </Badge>
                </>
              )}
              <Button
                size="sm"
                variant={isEditMode ? 'primary' : 'secondary'}
                leftIcon={isEditMode ? <Unlock size={16} /> : <Lock size={16} />}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? 'Editing' : 'Edit Pins'}
              </Button>
            </div>
          )}
          <div className="h-[calc(95vh-120px)] -mx-6 -mb-6">
            <FloorPlanCanvas
              imageUrl={floor.floorplanUrl}
              pins={(floor.rooms || [])
                .filter((room) => room.pinX !== null && room.pinY !== null)
                .map((room) => ({
                  id: room.id,
                  x: room.pinX!,
                  y: room.pinY!,
                  name: room.name,
                  status: room.status,
                }))}
              availableItems={isEditMode ? (floor.rooms || [])
                .filter((room) => room.pinX === null || room.pinY === null)
                .map((room) => ({
                  id: room.id,
                  name: room.name,
                })) : []}
              selectedPinId={selectedRoomId}
              isEditable={isEditMode}
              showMaximize={false}
              showLegend={false}
              onPinClick={(pin) => {
                setSelectedRoomId(pin.id);
                const room = floor.rooms?.find((r) => r.id === pin.id);
                if (room) {
                  setEditingRoom(room);
                }
              }}
              onPinMove={(pinId, x, y) => {
                updateRoomMutation.mutate({
                  roomId: pinId,
                  data: { pinX: Math.round(x), pinY: Math.round(y) },
                });
              }}
              onPlaceItem={(roomId, x, y) => {
                updateRoomMutation.mutate({
                  roomId,
                  data: { pinX: Math.round(x), pinY: Math.round(y) },
                });
                toast.success('Room placed on floor plan');
              }}
              onAddPin={(x, y) => {
                setPendingPinPosition({ x: Math.round(x), y: Math.round(y) });
                setIsCreateRoomModalOpen(true);
              }}
              onRemovePin={(roomId) => {
                updateRoomMutation.mutate({
                  roomId,
                  data: { pinX: null, pinY: null },
                });
                toast.success('Room removed from floor plan');
              }}
              // Asset props (fullscreen)
              assets={floorAssets}
              availableAssets={isEditMode ? projectInventory : []}
              floorAssetsWithoutPin={isEditMode ? floorAssetsWithoutPin : []}
              onAssetClick={(asset) => {
                const floorAsset = floorAssets.find((a) => a.id === asset.id);
                if (floorAsset) {
                  setEditingAsset(floorAsset);
                }
              }}
              onAssetMove={(assetId, x, y) => {
                updateAssetPositionMutation.mutate({
                  assetId,
                  pinX: Math.round(x),
                  pinY: Math.round(y),
                });
              }}
              onPlaceAsset={(assetId, x, y) => {
                assignAssetToFloorMutation.mutate({
                  assetId,
                  pinX: Math.round(x),
                  pinY: Math.round(y),
                });
              }}
              onPlaceExistingAsset={(assetId, x, y) => {
                updateAssetPositionMutation.mutate({
                  assetId,
                  pinX: Math.round(x),
                  pinY: Math.round(y),
                });
                toast.success('Asset placed on floor plan');
              }}
              onRemoveAssetPin={(assetId) => {
                updateAssetPositionMutation.mutate({
                  assetId,
                  pinX: null,
                  pinY: null,
                });
                toast.success('Asset removed from floor plan');
              }}
            />
          </div>
        </Modal>
      )}

      {/* Room Floorplan Crop Modal */}
      {floor.floorplanUrl && floor.floorplanType !== 'PDF' && cropModalRoom && (
        <RoomFloorplanCropModal
          isOpen={!!cropModalRoom}
          onClose={() => setCropModalRoom(null)}
          floorplanUrl={floor.floorplanUrl}
          roomName={cropModalRoom.name}
          onSave={handleCropSave}
          isSaving={isCropSaving}
        />
      )}

      {/* Confirm Replace Floorplan Modal */}
      {confirmCropRoom && (
        <Modal
          isOpen={!!confirmCropRoom}
          onClose={() => setConfirmCropRoom(null)}
          title="Αντικατάσταση Κάτοψης"
          icon={<AlertTriangle size={18} />}
          size="sm"
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setConfirmCropRoom(null)}>
                Ακύρωση
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setCropModalRoom(confirmCropRoom);
                  setConfirmCropRoom(null);
                }}
              >
                Συνέχεια
              </Button>
            </ModalActions>
          }
        >
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-warning" />
            </div>
            <p className="text-body text-text-primary mb-2">
              Το δωμάτιο <strong>{confirmCropRoom.name}</strong> έχει ήδη κάτοψη.
            </p>
            <p className="text-body-sm text-text-secondary">
              Θέλεις να την αντικαταστήσεις με νέα;
            </p>
          </div>
        </Modal>
      )}

      {/* Download Floorplan Modal */}
      {floor.floorplanUrl && floor.floorplanType !== 'PDF' && (
        <DownloadFloorplanModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          imageUrl={floor.floorplanUrl}
          fileName={`${floor.building?.project?.name || 'project'}-${floor.name}-floorplan`}
          projectName={floor.building?.project?.name}
          floorName={floor.name}
          pins={[
            // Room pins
            ...(floor.rooms || [])
              .filter((room) => room.pinX !== null && room.pinY !== null)
              .map((room) => ({
                id: room.id,
                name: room.name,
                x: room.pinX!,
                y: room.pinY!,
                status: room.status,
              })),
            // Asset pins
            ...floorAssetsWithPin.map((asset) => ({
              id: asset.id,
              name: asset.name,
              x: asset.pinX!,
              y: asset.pinY!,
              status: asset.status,
            })),
          ]}
          pinType="room"
        />
      )}

      {/* Create Asset Modal */}
      <FloorAssetFormModal
        isOpen={isCreateAssetModalOpen}
        onClose={() => setIsCreateAssetModalOpen(false)}
        onSubmit={(data) => createAssetMutation.mutate(data as CreateAssetData)}
        isLoading={createAssetMutation.isPending}
        title="Add Floor-Level Asset"
        assetTypes={assetTypes}
        projectName={floor.building?.project?.name}
        floorName={floor.name}
      />

      {/* Edit Asset Modal */}
      {editingAsset && (
        <FloorAssetFormModal
          isOpen={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          onSubmit={(data) => updateAssetMutation.mutate({ assetId: editingAsset.id, data })}
          isLoading={updateAssetMutation.isPending}
          title="Edit Asset"
          assetTypes={assetTypes}
          initialData={editingAsset}
          showStatus
          projectName={floor.building?.project?.name}
          floorName={floor.name}
        />
      )}

      {/* Delete Asset Confirmation */}
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
                onClick={() => deleteAssetMutation.mutate(deleteConfirmAsset.id)}
                isLoading={deleteAssetMutation.isPending}
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

      {/* Import from Inventory Modal */}
      <ImportInventoryModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        assets={projectInventory}
        onImport={handleImportAssets}
        isLoading={isImporting}
        title="Import Assets from Inventory"
        targetName={`${floor?.building?.project?.name} / ${floor?.name}`}
      />
    </div>
  );
}

// Room Form Modal
interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRoomData | UpdateRoomData) => void;
  isLoading: boolean;
  title: string;
  initialData?: Room;
  showStatus?: boolean;
}

function RoomFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  title,
  initialData,
  showStatus,
}: RoomFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateRoomData & { status?: RoomStatus }>({
    name: initialData?.name || '',
    type: initialData?.type || '',
    notes: initialData?.notes || '',
    status: initialData?.status,
  });

  // State for adding new room type
  const [isAddRoomTypeOpen, setIsAddRoomTypeOpen] = useState(false);
  const [newRoomTypeName, setNewRoomTypeName] = useState('');

  // Fetch room types from lookup
  const { data: roomTypesData } = useQuery({
    queryKey: ['lookups', 'room-types'],
    queryFn: () => roomTypeService.getAll(),
  });

  // Mutation to create new room type
  const createRoomTypeMutation = useMutation({
    mutationFn: (name: string) => roomTypeService.create({ name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'room-types'] });
      setFormData({ ...formData, type: data.item.name });
      setNewRoomTypeName('');
      setIsAddRoomTypeOpen(false);
      toast.success(`Room type "${data.item.name}" created`);
    },
    onError: () => {
      toast.error('Failed to create room type');
    },
  });

  const roomTypeOptions = [
    { value: '', label: 'Select room type...' },
    ...(roomTypesData?.items || []).map((rt) => ({
      value: rt.name,
      label: rt.name,
    })),
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        type: initialData.type || '',
        notes: initialData.notes || '',
        status: initialData.status,
      });
    } else {
      setFormData({ name: '', type: '', notes: '' });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateRoomData & { status?: RoomStatus } = {
      name: formData.name,
      type: formData.type || undefined,
      notes: formData.notes || undefined,
    };
    if (showStatus && formData.status) {
      data.status = formData.status;
    }
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<MapPin size={18} />}
      size="md"
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="room-form" isLoading={isLoading}>
            {initialData ? 'Save Changes' : 'Create Room'}
          </Button>
        </ModalActions>
      }
    >
      <form id="room-form" onSubmit={handleSubmit} className="space-y-5">
        <ModalSection title="Room Information" icon={<MapPin size={14} />}>
          <div className="space-y-4">
            <Input
              label="Room Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Room 101"
              required
              leftIcon={<MapPin size={16} />}
            />
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select
                  label="Room Type"
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  options={roomTypeOptions}
                />
              </div>
              <button
                type="button"
                onClick={() => setIsAddRoomTypeOpen(true)}
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-surface-border bg-surface-secondary hover:bg-surface-hover text-text-secondary hover:text-primary transition-colors"
                title="Add new room type"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </ModalSection>

        {showStatus && (
          <ModalSection title="Status" icon={<AlertTriangle size={14} />}>
            <Select
              label="Room Status"
              value={formData.status || 'NOT_STARTED'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as RoomStatus })}
              options={roomStatusOptions}
            />
          </ModalSection>
        )}

        <ModalSection title="Additional Notes" icon={<Pencil size={14} />}>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this room..."
            minRows={2}
            maxRows={6}
          />
        </ModalSection>
      </form>

      {/* Add Room Type Mini Modal */}
      {isAddRoomTypeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsAddRoomTypeOpen(false)} />
          <div className="relative bg-surface rounded-lg shadow-xl border border-surface-border p-6 w-full max-w-sm mx-4">
            <h3 className="text-h4 text-text-primary mb-4">Add New Room Type</h3>
            <Input
              label="Room Type Name"
              value={newRoomTypeName}
              onChange={(e) => setNewRoomTypeName(e.target.value)}
              placeholder="e.g., Server Room"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAddRoomTypeOpen(false);
                  setNewRoomTypeName('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createRoomTypeMutation.mutate(newRoomTypeName)}
                isLoading={createRoomTypeMutation.isPending}
                disabled={!newRoomTypeName.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// Floor Asset Form Modal
interface FloorAssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAssetData | UpdateAssetData) => void;
  isLoading: boolean;
  title: string;
  assetTypes: AssetType[];
  initialData?: Asset;
  showStatus?: boolean;
  projectName?: string;
  floorName?: string;
}

function FloorAssetFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  title,
  assetTypes,
  initialData,
  showStatus,
  projectName,
  floorName,
}: FloorAssetFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateAssetData & { status?: AssetStatus }>({
    name: '',
    labelCode: '',
    assetTypeId: '',
    model: '',
    serialNumber: '',
    macAddress: '',
    ipAddress: '',
    notes: '',
  });

  // State for adding new asset type
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  // State for adding new asset model
  const [isAddModelOpen, setIsAddModelOpen] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelManufacturerId, setNewModelManufacturerId] = useState('');

  // Fetch manufacturers for add model modal
  const { data: manufacturersData } = useQuery({
    queryKey: ['lookups', 'manufacturers'],
    queryFn: () => manufacturerService.getAll(),
  });

  // Create asset type mutation
  const createTypeMutation = useMutation({
    mutationFn: (name: string) => assetService.createType({ name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['asset-types'] });
      setFormData({ ...formData, assetTypeId: data.id });
      setNewTypeName('');
      setIsAddTypeOpen(false);
      toast.success(`Asset type "${data.name}" created`);
    },
    onError: () => {
      toast.error('Failed to create asset type');
    },
  });

  // Create asset model mutation
  const createModelMutation = useMutation({
    mutationFn: (data: { manufacturerId: string; name: string; assetTypeId?: string }) =>
      assetModelService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'asset-models'] });
      const modelValue = `${data.item.manufacturer?.name} ${data.item.name}`;
      setFormData({ ...formData, model: modelValue });
      setNewModelName('');
      setNewModelManufacturerId('');
      setIsAddModelOpen(false);
      toast.success(`Model "${data.item.name}" created`);
    },
    onError: () => {
      toast.error('Failed to create model');
    },
  });

  // State for adding new manufacturer (inside add model modal)
  const [isAddManufacturerOpen, setIsAddManufacturerOpen] = useState(false);
  const [newManufacturerName, setNewManufacturerName] = useState('');

  // Create manufacturer mutation
  const createManufacturerMutation = useMutation({
    mutationFn: (name: string) => manufacturerService.create({ name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'manufacturers'] });
      setNewModelManufacturerId(data.item.id);
      setNewManufacturerName('');
      setIsAddManufacturerOpen(false);
      toast.success(`Manufacturer "${data.item.name}" created`);
    },
    onError: () => {
      toast.error('Failed to create manufacturer');
    },
  });

  // Asset type abbreviations for label code generation
  const assetTypeAbbreviations: Record<string, string> = {
    'Access Point': 'AP',
    'Network Switch': 'SW',
    'IP Camera': 'CAM',
    'Smart TV': 'TV',
    'VoIP Phone': 'VOIP',
    'POS Terminal': 'POS',
    'Digital Signage': 'DS',
    'Router': 'RTR',
    'Server': 'SRV',
    'UPS': 'UPS',
    'Patch Panel': 'PP',
    'Firewall': 'FW',
    'NVR': 'NVR',
    'Controller': 'CTR',
    'Sensor': 'SNS',
    'Thermostat': 'THR',
  };

  // Generate label code
  const generateLabelCode = () => {
    // Project prefix (first 3-4 chars, uppercase, no spaces)
    const projectPrefix = projectName
      ? projectName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()
      : 'SYN';

    // Floor prefix (extract numbers or use first chars)
    const floorPrefix = floorName
      ? floorName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()
      : 'FL';

    // Asset type abbreviation
    const selectedType = assetTypes.find(t => t.id === formData.assetTypeId);
    const typeAbbrev = selectedType
      ? assetTypeAbbreviations[selectedType.name] || selectedType.name.substring(0, 3).toUpperCase()
      : 'AST';

    // Unique suffix (4 chars alphanumeric)
    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

    const labelCode = `${projectPrefix}-${floorPrefix}-${typeAbbrev}-${uniqueSuffix}`;
    setFormData({ ...formData, labelCode });
  };

  // Fetch all asset models
  const { data: assetModelsData } = useQuery({
    queryKey: ['lookups', 'asset-models'],
    queryFn: () => assetModelService.getAll(),
  });

  // Filter models based on selected asset type
  const filteredModels = assetModelsData?.items?.filter((m) => {
    if (!formData.assetTypeId) return true;
    if (!m.assetTypeId) return true;
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
        labelCode: initialData.labelCode || '',
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
        labelCode: '',
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
      labelCode: formData.labelCode || undefined,
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
          <Button type="submit" form="floor-asset-form" isLoading={isLoading}>
            {initialData ? 'Save Changes' : 'Create Asset'}
          </Button>
        </ModalActions>
      }
    >
      <form id="floor-asset-form" onSubmit={handleSubmit} className="space-y-5">
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
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Asset Type"
                    value={formData.assetTypeId || ''}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    options={assetTypeOptions}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddTypeOpen(true)}
                  className="h-10 w-10 flex items-center justify-center rounded-lg border border-surface-border bg-surface-secondary hover:bg-surface-hover text-text-secondary hover:text-primary transition-colors"
                  title="Add new asset type"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select
                  label="Model"
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  options={assetModelOptions}
                />
              </div>
              <button
                type="button"
                onClick={() => setIsAddModelOpen(true)}
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-surface-border bg-surface-secondary hover:bg-surface-hover text-text-secondary hover:text-primary transition-colors"
                title="Add new model"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </ModalSection>

        <ModalSection title="Identifiers" icon={<Hash size={14} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                  Label Code
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={formData.labelCode || ''}
                    onChange={(e) => setFormData({ ...formData, labelCode: e.target.value })}
                    placeholder="SYN-FL01-AP-A7B3"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={generateLabelCode}
                    title="Auto-generate Label Code"
                    className="shrink-0 h-10 w-10 p-0 flex items-center justify-center"
                  >
                    <Wand2 size={18} />
                  </Button>
                </div>
                <p className="text-caption text-text-tertiary mt-1">
                  Unique code for QR label scanning
                </p>
              </div>
              <Input
                label="Serial Number"
                value={formData.serialNumber || ''}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="FCW2345L0AB"
              />
            </div>
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
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this asset..."
            minRows={2}
            maxRows={6}
          />
        </ModalSection>
      </form>

      {/* Add Asset Type Mini Modal */}
      {isAddTypeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsAddTypeOpen(false)} />
          <div className="relative bg-surface rounded-lg shadow-xl border border-surface-border p-6 w-full max-w-sm mx-4">
            <h3 className="text-h4 text-text-primary mb-4">Add New Asset Type</h3>
            <Input
              label="Type Name"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g., Access Point"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAddTypeOpen(false);
                  setNewTypeName('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createTypeMutation.mutate(newTypeName)}
                isLoading={createTypeMutation.isPending}
                disabled={!newTypeName.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Model Mini Modal */}
      {isAddModelOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsAddModelOpen(false)} />
          <div className="relative bg-surface rounded-lg shadow-xl border border-surface-border p-6 w-full max-w-sm mx-4">
            <h3 className="text-h4 text-text-primary mb-4">Add New Model</h3>
            <div className="space-y-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Manufacturer"
                    value={newModelManufacturerId}
                    onChange={(e) => setNewModelManufacturerId(e.target.value)}
                    options={[
                      { value: '', label: 'Select manufacturer...' },
                      ...(manufacturersData?.items || []).map((m) => ({
                        value: m.id,
                        label: m.name,
                      })),
                    ]}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddManufacturerOpen(true)}
                  className="h-10 w-10 flex items-center justify-center rounded-lg border border-surface-border bg-surface-secondary hover:bg-surface-hover text-text-secondary hover:text-primary transition-colors"
                  title="Add new manufacturer"
                >
                  <Plus size={18} />
                </button>
              </div>
              <Input
                label="Model Name"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="e.g., Catalyst 9200"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAddModelOpen(false);
                  setNewModelName('');
                  setNewModelManufacturerId('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createModelMutation.mutate({
                  manufacturerId: newModelManufacturerId,
                  name: newModelName,
                  assetTypeId: formData.assetTypeId || undefined,
                })}
                isLoading={createModelMutation.isPending}
                disabled={!newModelName.trim() || !newModelManufacturerId}
              >
                Add
              </Button>
            </div>

            {/* Add Manufacturer Mini Modal (nested) */}
            {isAddManufacturerOpen && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={() => setIsAddManufacturerOpen(false)} />
                <div className="relative bg-surface rounded-lg shadow-xl border border-surface-border p-6 w-full max-w-sm mx-4">
                  <h3 className="text-h4 text-text-primary mb-4">Add New Manufacturer</h3>
                  <Input
                    label="Manufacturer Name"
                    value={newManufacturerName}
                    onChange={(e) => setNewManufacturerName(e.target.value)}
                    placeholder="e.g., Cisco"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsAddManufacturerOpen(false);
                        setNewManufacturerName('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => createManufacturerMutation.mutate(newManufacturerName)}
                      isLoading={createManufacturerMutation.isPending}
                      disabled={!newManufacturerName.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
