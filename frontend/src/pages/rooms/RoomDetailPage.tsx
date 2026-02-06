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
  Wand2,
  Pencil as PencilIcon,
  PenLine,
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
  SortableHeader,
} from '@/components/ui';
import { useSortable } from '@/hooks/useSortable';
import { RoomPlanCanvas } from '@/components/room-plan';
import { DownloadFloorplanModal } from '@/components/floor-plan';
import { DrawingToolbar } from '@/components/canvas/DrawingToolbar';
import { PropertiesPanel } from '@/components/canvas/PropertiesPanel';
import { MeasurePanel } from '@/components/canvas/MeasurePanel';
import { ImportInventoryModal } from '@/components/inventory';
import { drawingService } from '@/services/drawing.service';
import { useDrawingStore, encodeRoutingData } from '@/stores/drawing.store';
import { assetService, type Asset, type AssetType, type CreateAssetData, type UpdateAssetData, type AssetStatus } from '@/services/asset.service';
import { roomService } from '@/services/room.service';
import { uploadService } from '@/services/upload.service';
import { useAuthStore } from '@/stores/auth.store';
import { assetModelService } from '@/services/lookup.service';
import { labelService, type Label } from '@/services/label.service';
import { signatureService, type SignatureType, type CreateSignatureData } from '@/services/signature.service';
import { SignatureModal, SignatureDisplay } from '@/components/signatures';

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState<Asset | null>(null);
  const [isUploadingFloorplan, setIsUploadingFloorplan] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [pendingAssetPinPosition, setPendingAssetPinPosition] = useState<{ x: number; y: number } | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  const floorplanInputRef = useRef<HTMLInputElement>(null);

  // Fetch room with assets
  const { data: room, isLoading: roomLoading, refetch: refetchRoom } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomService.getById(id!),
    enabled: !!id,
  });

  // Assets come from room query
  const assets = room?.assets || [];

  // Sorting for assets
  const { sortedItems: sortedAssets, requestSort, getSortDirection } = useSortable(assets);

  // Pagination for assets
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedAssets,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(sortedAssets, 25);

  // Calculate placed and available assets
  const placedAssets = assets.filter(a => a.pinX !== null && a.pinY !== null);
  const availableAssets = assets.filter(a => a.pinX === null || a.pinY === null);

  // Get project ID from room (path: floor -> building -> project)
  const projectId = room?.floor?.building?.project?.id;

  // Fetch available assets from project inventory (IN_STOCK, unassigned)
  const { data: projectInventory = [] } = useQuery({
    queryKey: ['project-equipment-available', projectId],
    queryFn: () => assetService.getAvailableByProject(projectId!),
    enabled: !!projectId,
  });

  // Fetch asset types
  const { data: assetTypes = [] } = useQuery({
    queryKey: ['asset-types'],
    queryFn: () => assetService.getTypes(),
  });

  // Fetch available labels for the project
  const { data: availableLabels = [] } = useQuery({
    queryKey: ['labels-available', projectId],
    queryFn: () => labelService.getAvailable(projectId!),
    enabled: !!projectId,
  });

  // Fetch all labels for the project (to show assigned label in edit modal)
  const { data: allLabels = [] } = useQuery({
    queryKey: ['labels-all', projectId],
    queryFn: () => labelService.getByProject(projectId!),
    enabled: !!projectId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAssetData) => assetService.create(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      setIsCreateModalOpen(false);
      setPendingAssetPinPosition(null);
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

  // Label assignment mutation
  const assignLabelMutation = useMutation({
    mutationFn: ({ labelId, assetId }: { labelId: string; assetId: string }) =>
      labelService.assign(labelId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels-available', projectId] });
      queryClient.invalidateQueries({ queryKey: ['labels-all', projectId] });
      queryClient.invalidateQueries({ queryKey: ['room', id] });
    },
  });

  // Label unassignment mutation
  const unassignLabelMutation = useMutation({
    mutationFn: (labelId: string) => labelService.unassign(labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels-available', projectId] });
      queryClient.invalidateQueries({ queryKey: ['labels-all', projectId] });
      queryClient.invalidateQueries({ queryKey: ['room', id] });
    },
  });

  // Fetch room signatures
  const { data: roomSignatures = [] } = useQuery({
    queryKey: ['signatures', 'room', id],
    queryFn: () => signatureService.getByRoom(id!),
    enabled: !!id,
  });

  // Create signature mutation
  const createSignatureMutation = useMutation({
    mutationFn: (data: CreateSignatureData) => signatureService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatures', 'room', id] });
      setIsSignatureModalOpen(false);
      toast.success('Signature saved successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save signature');
    },
  });

  // Delete signature mutation
  const deleteSignatureMutation = useMutation({
    mutationFn: (sigId: string) => signatureService.delete(sigId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatures', 'room', id] });
      toast.success('Signature deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete signature');
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

  // Assign asset from inventory to room mutation
  const assignAssetToRoomMutation = useMutation({
    mutationFn: ({ assetId, pinX, pinY }: { assetId: string; pinX: number; pinY: number }) =>
      assetService.assignToRoom(assetId, id!, pinX, pinY),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      queryClient.invalidateQueries({ queryKey: ['project-equipment-available', projectId] });
      toast.success('Asset imported to room');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to import asset');
    },
  });

  // Import multiple assets from inventory
  const [isImporting, setIsImporting] = useState(false);
  const handleImportAssets = async (assetIds: string[]) => {
    if (!id) return;
    setIsImporting(true);
    try {
      // Import all assets in parallel (without pin coordinates)
      await Promise.all(
        assetIds.map((assetId) => assetService.assignToRoom(assetId, id))
      );
      queryClient.invalidateQueries({ queryKey: ['room', id] });
      queryClient.invalidateQueries({ queryKey: ['project-equipment-available', projectId] });
      toast.success(`${assetIds.length} asset${assetIds.length > 1 ? 's' : ''} imported successfully`);
      setIsImportModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import assets');
    } finally {
      setIsImporting(false);
    }
  };

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

  // Drawing mode - load/save/delete
  const drawingStore = useDrawingStore();
  const [isSavingDrawing, setIsSavingDrawing] = useState(false);

  // Load shapes and cables when room loads (always visible, like pins)
  useEffect(() => {
    if (id) {
      Promise.all([
        drawingService.getShapes({ roomId: id }),
        drawingService.getCables({ roomId: id }),
      ]).then(([shapes, cables]) => {
        drawingStore.loadFromServer(shapes, cables);
      }).catch(() => {
        toast.error('Failed to load drawings');
      });
    }
    return () => {
      drawingStore.resetStore();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // When leaving drawing mode, clear selection but keep shapes
  useEffect(() => {
    if (!isDrawingMode) {
      drawingStore.clearSelection();
      drawingStore.setActiveTool('select');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawingMode]);

  // Save drawings and cables to backend
  const handleSaveDrawings = async () => {
    if (!id) return;
    setIsSavingDrawing(true);
    try {
      const { shapes, cables, deletedServerIds, deletedCableServerIds } = useDrawingStore.getState();

      // Delete removed shapes
      if (deletedServerIds.length > 0) {
        await drawingService.deleteShapes(deletedServerIds);
      }

      // Delete removed cables
      if (deletedCableServerIds.length > 0) {
        await Promise.all(deletedCableServerIds.map((cId) => drawingService.deleteCable(cId)));
      }

      // Separate new vs existing shapes
      const newShapes = shapes.filter((s) => !s.serverId);
      const existingShapes = shapes.filter((s) => s.serverId);

      // Update existing shapes
      await Promise.all(
        existingShapes.map((s) =>
          drawingService.updateShape(s.serverId!, {
            type: s.type,
            layer: s.layer,
            zIndex: s.zIndex,
            locked: s.locked,
            visible: s.visible,
            data: s.data,
            style: s.style,
          })
        )
      );

      // Create new shapes
      if (newShapes.length > 0) {
        const created = await Promise.all(
          newShapes.map((s) =>
            drawingService.createShape({
              roomId: id,
              type: s.type,
              layer: s.layer,
              zIndex: s.zIndex,
              data: s.data,
              style: s.style,
            })
          )
        );
        // Update local shapes with server IDs
        const storeState = useDrawingStore.getState();
        const updatedShapes = storeState.shapes.map((s) => {
          const idx = newShapes.findIndex((n) => n.id === s.id);
          if (idx !== -1 && created[idx]) {
            return { ...s, serverId: created[idx].id };
          }
          return s;
        });
        useDrawingStore.setState({ shapes: updatedShapes });
      }

      // Save cables - new vs existing
      const newCables = cables.filter((c) => !c.serverId);
      const existingCables = cables.filter((c) => c.serverId);

      // Update existing cables
      await Promise.all(
        existingCables.map((c) =>
          drawingService.updateCable(c.serverId!, {
            cableType: c.cableType,
            routingMode: c.routingMode,
            routingPoints: encodeRoutingData(c) as { x: number; y: number }[] | null,
            label: c.label,
            color: c.color,
            sourceAssetId: c.sourceAssetId,
            targetAssetId: c.targetAssetId,
          })
        )
      );

      // Create new cables
      if (newCables.length > 0) {
        const createdCables = await Promise.all(
          newCables.map((c) =>
            drawingService.createCable({
              roomId: id,
              sourceAssetId: c.sourceAssetId,
              targetAssetId: c.targetAssetId,
              cableType: c.cableType,
              routingMode: c.routingMode,
              routingPoints: encodeRoutingData(c) as { x: number; y: number }[] | null,
              label: c.label,
              color: c.color,
            })
          )
        );
        // Update local cables with server IDs
        const storeState = useDrawingStore.getState();
        const updatedCables = storeState.cables.map((c) => {
          const idx = newCables.findIndex((n) => n.id === c.id);
          if (idx !== -1 && createdCables[idx]) {
            return { ...c, serverId: createdCables[idx].id };
          }
          return c;
        });
        useDrawingStore.setState({ cables: updatedCables });
      }

      useDrawingStore.setState({ deletedServerIds: [], deletedCableServerIds: [], isDirty: false });
      toast.success('Drawings saved');
    } catch {
      toast.error('Failed to save drawings');
    } finally {
      setIsSavingDrawing(false);
    }
  };

  // Delete selected shapes and/or cables
  const handleDeleteSelected = () => {
    const store = useDrawingStore.getState();
    if (store.selectedIds.length === 0 && store.selectedCableIds.length === 0) return;
    store.pushHistory();
    if (store.selectedIds.length > 0) {
      store.removeShapes(store.selectedIds);
      store.setSelectedIds([]);
    }
    if (store.selectedCableIds.length > 0) {
      store.removeCables(store.selectedCableIds);
      store.setSelectedCableIds([]);
    }
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
      {/* Hidden file input for floor plan upload */}
      <input
        ref={floorplanInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFloorplanUpload}
        className="hidden"
      />

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
                {room?.floor?.building?.project?.name} / {room?.floor?.name}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button
              variant="secondary"
              leftIcon={<PenLine size={18} />}
              onClick={() => setIsSignatureModalOpen(true)}
            >
              Sign Off
            </Button>
          )}
          {canManage && (
            <Button leftIcon={<Plus size={18} />} onClick={() => setIsImportModalOpen(true)}>
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
              {canManage && isEditMode && (
                <>
                  {availableAssets.length > 0 && (
                    <span className="text-caption text-text-secondary">
                      {availableAssets.length} assets to place
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
                  onClick={() => floorplanInputRef.current?.click()}
                  isLoading={isUploadingFloorplan}
                >
                  Change
                </Button>
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
                <>
                  <Button
                    size="sm"
                    variant={isEditMode ? 'primary' : 'secondary'}
                    leftIcon={isEditMode ? <Unlock size={16} /> : <Lock size={16} />}
                    onClick={() => { setIsEditMode(!isEditMode); if (isDrawingMode) setIsDrawingMode(false); }}
                  >
                    {isEditMode ? 'Editing' : 'Edit Pins'}
                  </Button>
                  <Button
                    size="sm"
                    variant={isDrawingMode ? 'primary' : 'secondary'}
                    leftIcon={<PencilIcon size={16} />}
                    onClick={() => { setIsDrawingMode(!isDrawingMode); if (isEditMode) setIsEditMode(false); }}
                  >
                    {isDrawingMode ? 'Drawing' : 'Draw'}
                  </Button>
                </>
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
              <div>
                {isDrawingMode && !isFullScreenOpen && (
                  <div className="mb-2 flex gap-2">
                    <div className="flex-1 space-y-2">
                      <DrawingToolbar
                        onSave={handleSaveDrawings}
                        onDelete={handleDeleteSelected}
                        isSaving={isSavingDrawing}
                        exportFileName={`${room.name}-drawing`}
                      />
                      <PropertiesPanel />
                      <MeasurePanel />
                    </div>
                  </div>
                )}
                <div className="h-[500px]">
                  <RoomPlanCanvas
                    imageUrl={room.floorplanUrl}
                    assets={assets as any}
                    availableAssets={isEditMode ? availableAssets as any : []}
                    inventoryAssets={isEditMode ? projectInventory as any : []}
                    onAssetClick={handleAssetClick as any}
                    onAssetMove={handleMoveAsset}
                    onPlaceAsset={handlePlaceAsset}
                    onImportAsset={(assetId, x, y) => {
                      assignAssetToRoomMutation.mutate({
                        assetId,
                        pinX: Math.round(x),
                        pinY: Math.round(y),
                      });
                    }}
                    onRemoveAssetPin={handleRemoveAssetPin}
                    isEditable={isEditMode}
                    selectedAssetId={selectedAssetId}
                    onMaximize={() => setIsFullScreenOpen(true)}
                    drawingMode={isDrawingMode && !isFullScreenOpen}
                  />
                </div>
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

      {/* Signatures Section */}
      {roomSignatures.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PenLine size={20} />
              Signatures ({roomSignatures.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {roomSignatures.map((sig) => (
                <div
                  key={sig.id}
                  className="relative p-4 rounded-lg bg-surface-secondary border border-surface-border group"
                >
                  <Badge variant="primary" size="sm" className="mb-3">
                    {sig.type === 'ROOM_HANDOVER' ? 'Room Handover' :
                     sig.type === 'STAGE_COMPLETION' ? 'Stage Completion' : 'Final Acceptance'}
                  </Badge>
                  <SignatureDisplay
                    signatureData={sig.signatureData}
                    signerName={sig.signedByName}
                    signedAt={sig.signedAt}
                  />
                  {(user?.role === 'ADMIN' || user?.role === 'PM') && (
                    <button
                      onClick={() => deleteSignatureMutation.mutate(sig.id)}
                      className="absolute top-2 right-2 p-1.5 rounded hover:bg-surface-hover text-text-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete signature"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  onClick={() => setIsImportModalOpen(true)}
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
                    <SortableHeader label="Asset" sortKey="name" direction={getSortDirection('name')} onSort={requestSort} align="left" />
                    <SortableHeader label="Type" sortKey="assetType.name" direction={getSortDirection('assetType.name')} onSort={requestSort} align="left" />
                    <SortableHeader label="Serial / MAC" sortKey="serialNumber" direction={getSortDirection('serialNumber')} onSort={requestSort} align="left" />
                    <SortableHeader label="Status" sortKey="status" direction={getSortDirection('status')} onSort={requestSort} align="left" />
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
        onClose={() => {
          setIsCreateModalOpen(false);
          setPendingAssetPinPosition(null);
        }}
        onSubmit={async (data, labelId) => {
          const assetData: CreateAssetData = {
            ...data as CreateAssetData,
            pinX: pendingAssetPinPosition?.x,
            pinY: pendingAssetPinPosition?.y,
          };
          const asset = await assetService.create(id!, assetData);
          if (labelId) {
            await assignLabelMutation.mutateAsync({ labelId, assetId: asset.id });
          }
          queryClient.invalidateQueries({ queryKey: ['room', id] });
          setIsCreateModalOpen(false);
          setPendingAssetPinPosition(null);
          toast.success('Asset created');
        }}
        isLoading={createMutation.isPending}
        title="Add New Asset"
        assetTypes={assetTypes}
        projectName={room?.floor?.building?.project?.name}
        roomName={room?.name}
        nested
        availableLabels={availableLabels}
        allLabels={allLabels}
      />

      {/* Edit Modal */}
      {editingAsset && (
        <AssetFormModal
          isOpen={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          onSubmit={async (data, labelId) => {
            // Find the current label assigned to this asset
            const currentLabel = allLabels.find((l) => l.assetId === editingAsset.id);

            // Update asset data
            await assetService.update(editingAsset.id, data);

            // Handle label changes
            if (labelId && labelId !== currentLabel?.id) {
              // Assign new label (backend auto-unassigns old one if exists)
              await assignLabelMutation.mutateAsync({ labelId, assetId: editingAsset.id });
            } else if (!labelId && currentLabel) {
              // Unassign current label
              await unassignLabelMutation.mutateAsync(currentLabel.id);
            }

            queryClient.invalidateQueries({ queryKey: ['room', id] });
            setEditingAsset(null);
            toast.success('Asset updated');
          }}
          isLoading={updateMutation.isPending}
          title="Edit Asset"
          assetTypes={assetTypes}
          initialData={editingAsset}
          showStatus
          projectName={room?.floor?.building?.project?.name}
          roomName={room?.name}
          nested
          availableLabels={availableLabels}
          allLabels={allLabels}
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
          nested
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
          {/* Edit mode + Drawing mode toggle in fullscreen */}
          {canManage && (
            <div className="flex items-center justify-end gap-2 mb-2 -mt-2">
              {isEditMode && !isDrawingMode && (
                <>
                  {availableAssets.length > 0 && (
                    <span className="text-caption text-text-secondary">
                      {availableAssets.length} assets to place
                    </span>
                  )}
                  <Badge variant="info" size="sm">
                    Click to add | Drag to move
                  </Badge>
                </>
              )}
              {!isDrawingMode && (
                <Button
                  size="sm"
                  variant={isEditMode ? 'primary' : 'secondary'}
                  leftIcon={isEditMode ? <Unlock size={16} /> : <Lock size={16} />}
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? 'Editing' : 'Edit Pins'}
                </Button>
              )}
              {!isEditMode && (
                <Button
                  size="sm"
                  variant={isDrawingMode ? 'primary' : 'secondary'}
                  leftIcon={<Wand2 size={16} />}
                  onClick={() => {
                    setIsDrawingMode(!isDrawingMode);
                    if (isDrawingMode) setIsEditMode(false);
                  }}
                >
                  {isDrawingMode ? 'Exit Draw' : 'Draw'}
                </Button>
              )}
            </div>
          )}
          {/* Drawing toolbar in fullscreen */}
          {isDrawingMode && (
            <div className="mb-2 flex gap-2">
              <div className="flex-1 flex flex-col gap-2">
                <DrawingToolbar
                  onSave={handleSaveDrawings}
                  onDelete={handleDeleteSelected}
                  isSaving={isSavingDrawing}
                />
                <PropertiesPanel />
                <MeasurePanel />
              </div>
            </div>
          )}
          <div className="h-[calc(95vh-120px)] -mx-6 -mb-6">
            <RoomPlanCanvas
              imageUrl={room.floorplanUrl}
              assets={assets as any}
              availableAssets={isEditMode ? availableAssets as any : []}
              inventoryAssets={isEditMode ? projectInventory as any : []}
              onAssetClick={(asset) => {
                setSelectedAssetId(asset.id);
                setIsFullScreenOpen(false);
                navigate(`/assets/${asset.id}`);
              }}
              onAssetMove={handleMoveAsset}
              onPlaceAsset={handlePlaceAsset}
              onImportAsset={(assetId, x, y) => {
                assignAssetToRoomMutation.mutate({
                  assetId,
                  pinX: Math.round(x),
                  pinY: Math.round(y),
                });
              }}
              onRemoveAssetPin={handleRemoveAssetPin}
              isEditable={isEditMode}
              selectedAssetId={selectedAssetId}
              showMaximize={false}
              showLegend={false}
              drawingMode={isDrawingMode}
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
          fileName={`${room.floor?.building?.project?.name || 'project'}-${room.floor?.name || 'floor'}-${room.name}-floorplan`}
          projectName={room.floor?.building?.project?.name}
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
          shapes={drawingStore.shapes.filter((s) => s.visible).map((s) => ({
            type: s.type,
            data: s.data,
            style: s.style,
          }))}
          cables={drawingStore.cables.map((c) => ({
            sourceX: c.sourceX,
            sourceY: c.sourceY,
            targetX: c.targetX,
            targetY: c.targetY,
            color: c.color,
            label: c.label,
            routingPoints: c.routingPoints,
            tension: c.tension,
          }))}
        />
      )}

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSign={({ signatureData, signerName }) => {
          if (!projectId) return;
          createSignatureMutation.mutate({
            projectId,
            roomId: id,
            type: 'ROOM_HANDOVER' as SignatureType,
            signatureData,
            signedByName: signerName,
          });
        }}
        title="Room Handover Signature"
        description={`Sign off on ${room?.name || 'this room'} to confirm handover completion.`}
      />

      {/* Import from Inventory Modal */}
      <ImportInventoryModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        assets={projectInventory}
        onImport={handleImportAssets}
        isLoading={isImporting}
        title="Import Assets from Inventory"
        targetName={`${room?.floor?.building?.project?.name} / ${room?.floor?.name} / ${room?.name}`}
        nested
      />
    </div>
  );
}

// Asset Form Modal
interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAssetData | UpdateAssetData, labelId?: string) => void;
  isLoading: boolean;
  title: string;
  assetTypes: AssetType[];
  initialData?: Asset;
  showStatus?: boolean;
  projectName?: string;
  roomName?: string;
  nested?: boolean;
  availableLabels?: Label[];
  allLabels?: Label[];
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
  projectName: _projectName,
  roomName: _roomName,
  nested,
  availableLabels = [],
  allLabels = [],
}: AssetFormModalProps) {
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

  // State for selected label
  const [selectedLabelId, setSelectedLabelId] = useState<string>('');

  // Asset type abbreviations for label code generation


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
        labelCode: initialData.labelCode || '',
        assetTypeId: initialData.assetTypeId || '',
        model: initialData.model || '',
        serialNumber: initialData.serialNumber || '',
        macAddress: initialData.macAddress || '',
        ipAddress: initialData.ipAddress || '',
        notes: initialData.notes || '',
        status: initialData.status,
      });
      // Find the label assigned to this asset
      const currentLabel = allLabels.find((l) => l.assetId === initialData.id);
      setSelectedLabelId(currentLabel?.id || '');
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
      setSelectedLabelId('');
    }
  }, [initialData, allLabels]);

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
    onSubmit(data, selectedLabelId || undefined);
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
      nested={nested}
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
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Label"
                value={selectedLabelId}
                onChange={(e) => setSelectedLabelId(e.target.value)}
                options={[
                  { value: '', label: 'No label' },
                  // Show the current label first if it exists
                  ...allLabels
                    .filter((l) => initialData && l.assetId === initialData.id)
                    .map((l) => ({ value: l.id, label: `${l.code} (Current)` })),
                  // Then show available labels
                  ...availableLabels
                    .filter((l) => !initialData || l.assetId !== initialData.id)
                    .map((l) => ({ value: l.id, label: l.code })),
                ]}
              />
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
