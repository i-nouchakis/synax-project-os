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
import { FloorPlanCanvas, RoomFloorplanCropModal, DownloadFloorplanModal } from '@/components/floor-plan';
import { floorService, type Room, type CreateRoomData, type UpdateRoomData, type RoomStatus } from '@/services/floor.service';
import { uploadService } from '@/services/upload.service';
import { useAuthStore } from '@/stores/auth.store';

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

  // Fetch floor
  const { data: floor, isLoading, error } = useQuery({
    queryKey: ['floor', id],
    queryFn: () => floorService.getById(id!),
    enabled: !!id,
  });

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

  const roomStats = {
    total: floor?.rooms?.length || 0,
    completed: floor?.rooms?.filter(r => r.status === 'COMPLETED').length || 0,
    inProgress: floor?.rooms?.filter(r => r.status === 'IN_PROGRESS').length || 0,
    blocked: floor?.rooms?.filter(r => r.status === 'BLOCKED').length || 0,
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
            onClick={() => navigate(`/projects/${floor.project?.id}`)}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-2"
          >
            <ArrowLeft size={18} />
            <span className="text-body-sm">Back to {floor.project?.name}</span>
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
          fileName={`${floor.project?.name || 'project'}-${floor.name}-floorplan`}
          projectName={floor.project?.name}
          floorName={floor.name}
          pins={(floor.rooms || [])
            .filter((room) => room.pinX !== null && room.pinY !== null)
            .map((room) => ({
              id: room.id,
              name: room.name,
              x: room.pinX!,
              y: room.pinY!,
              status: room.status,
            }))}
          pinType="room"
        />
      )}
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
  const [formData, setFormData] = useState<CreateRoomData & { status?: RoomStatus }>({
    name: initialData?.name || '',
    type: initialData?.type || '',
    notes: initialData?.notes || '',
    status: initialData?.status,
  });

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
            <Input
              label="Room Type"
              value={formData.type || ''}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="Server Room, Office, Storage..."
            />
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
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this room..."
            rows={3}
            className="w-full bg-surface border border-surface-border rounded-md px-3 py-2 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </ModalSection>
      </form>
    </Modal>
  );
}
