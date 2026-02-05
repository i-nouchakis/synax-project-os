import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Layers,
  Plus,
  Edit,
  Trash2,
  Upload,
  Image,
  Lock,
  Unlock,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalSection, ModalActions } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { FloorPlanCanvas } from '@/components/floor-plan';
import { DownloadFloorplanModal } from '@/components/floor-plan/DownloadFloorplanModal';
import { buildingService, type BuildingFloor } from '@/services/building.service';
import { floorService, type CreateFloorData, type UpdateFloorData } from '@/services/floor.service';
import { uploadService } from '@/services/upload.service';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

export default function BuildingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canManage = user?.role === 'ADMIN' || user?.role === 'PM';

  // State
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState<BuildingFloor | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<BuildingFloor | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isEditingPins, setIsEditingPins] = useState(false);
  const [showFloorplan, setShowFloorplan] = useState(true);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [floorForm, setFloorForm] = useState({ name: '', level: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [pendingPinPosition, setPendingPinPosition] = useState<{ x: number; y: number } | null>(null);

  // Fetch building
  const { data: building, isLoading } = useQuery({
    queryKey: ['building', id],
    queryFn: () => buildingService.getById(id!),
    enabled: !!id,
  });

  // Create floor mutation
  const createFloorMutation = useMutation({
    mutationFn: (data: CreateFloorData) => floorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building', id] });
      setShowFloorModal(false);
      setFloorForm({ name: '', level: 0 });
      setPendingPinPosition(null);
      toast.success('Floor created');
    },
    onError: () => toast.error('Failed to create floor'),
  });

  // Update floor mutation
  const updateFloorMutation = useMutation({
    mutationFn: ({ floorId, data }: { floorId: string; data: UpdateFloorData }) =>
      floorService.update(floorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building', id] });
      setEditingFloor(null);
      toast.success('Floor updated');
    },
    onError: () => toast.error('Failed to update floor'),
  });

  // Delete floor mutation
  const deleteFloorMutation = useMutation({
    mutationFn: (floorId: string) => floorService.delete(floorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building', id] });
      setDeletingFloor(null);
      toast.success('Floor deleted');
    },
    onError: () => toast.error('Failed to delete floor'),
  });

  // Update floor position mutation
  const updateFloorPositionMutation = useMutation({
    mutationFn: ({ floorId, pinX, pinY }: { floorId: string; pinX: number | null; pinY: number | null }) =>
      floorService.updatePosition(floorId, pinX, pinY),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building', id] });
    },
    onError: () => toast.error('Failed to update floor position'),
  });

  // Handle floorplan upload
  const handleFloorplanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setIsUploading(true);
    try {
      await uploadService.uploadBuildingFloorplan(id, file);
      queryClient.invalidateQueries({ queryKey: ['building', id] });
      toast.success('Floorplan uploaded');
    } catch {
      toast.error('Failed to upload floorplan');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddFloor = () => {
    if (!id) return;
    createFloorMutation.mutate({
      buildingId: id,
      name: floorForm.name,
      level: floorForm.level,
      pinX: pendingPinPosition?.x,
      pinY: pendingPinPosition?.y,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!building) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Building not found</p>
        <Button variant="secondary" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            to={`/projects/${building.project?.id}`}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-2"
          >
            <ArrowLeft size={18} />
            <span className="text-body-sm">Back to {building.project?.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Building2 size={24} className="text-primary" />
            <h1 className="text-h1">{building.name}</h1>
          </div>
          {building.description && (
            <p className="text-body text-text-secondary mt-2">{building.description}</p>
          )}
        </div>
      </div>

      {/* Floorplan Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Image size={20} />
            Building Floor Plan
          </CardTitle>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFloorplanUpload}
              className="hidden"
            />
            {building.floorplanUrl && building.floorplanType !== 'PDF' && canManage && isEditingPins && (
              <Badge variant="info" size="sm">Click to add | Drag to move</Badge>
            )}
            {canManage && (
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Upload size={16} />}
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
              >
                {building.floorplanUrl ? 'Change' : 'Upload'}
              </Button>
            )}
            {building.floorplanUrl && building.floorplanType !== 'PDF' && (
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Download size={16} />}
                onClick={() => setShowDownloadModal(true)}
              >
                Download
              </Button>
            )}
            {building.floorplanUrl && building.floorplanType !== 'PDF' && canManage && (
              <Button
                size="sm"
                variant={isEditingPins ? 'primary' : 'secondary'}
                leftIcon={isEditingPins ? <Unlock size={16} /> : <Lock size={16} />}
                onClick={() => setIsEditingPins(!isEditingPins)}
              >
                {isEditingPins ? 'Editing' : 'Edit Pins'}
              </Button>
            )}
            {building.floorplanUrl && (
              <Button variant="ghost" size="sm" onClick={() => setShowFloorplan(!showFloorplan)}>
                {showFloorplan ? 'Hide' : 'Show'}
              </Button>
            )}
          </div>
        </CardHeader>
        {building.floorplanUrl ? (
          showFloorplan && (
            <CardContent>
              {building.floorplanType === 'PDF' ? (
                <div className="text-center py-8 bg-surface-secondary rounded-lg">
                  <p className="text-text-secondary mb-4">PDF floorplan uploaded</p>
                  <a href={building.floorplanUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Open PDF in new tab
                  </a>
                </div>
              ) : (
                <div className="h-[500px]">
                  <FloorPlanCanvas
                    imageUrl={building.floorplanUrl}
                    pins={(building.floors || [])
                      .filter(f => f.pinX !== null && f.pinY !== null)
                      .map(f => ({
                        id: f.id,
                        x: f.pinX!,
                        y: f.pinY!,
                        name: f.name,
                        status: 'IN_PROGRESS' as const,
                      }))}
                    availableItems={isEditingPins ? (building.floors || [])
                      .filter(f => f.pinX === null || f.pinY === null)
                      .map(f => ({ id: f.id, name: f.name, level: f.level })) : []}
                    selectedPinId={selectedFloorId}
                    isEditable={isEditingPins}
                    showLegend={false}
                    onMaximize={() => setIsFullScreenOpen(true)}
                    onPinClick={(pin) => {
                      setSelectedFloorId(pin.id);
                      navigate(`/floors/${pin.id}`);
                    }}
                    onPinMove={(pinId, x, y) => {
                      updateFloorPositionMutation.mutate({
                        floorId: pinId,
                        pinX: Math.round(x),
                        pinY: Math.round(y),
                      });
                    }}
                    onPlaceItem={(floorId, x, y) => {
                      updateFloorPositionMutation.mutate({
                        floorId,
                        pinX: Math.round(x),
                        pinY: Math.round(y),
                      });
                      toast.success('Floor placed on floorplan');
                    }}
                    onAddPin={(x, y) => {
                      setPendingPinPosition({ x: Math.round(x), y: Math.round(y) });
                      setShowFloorModal(true);
                    }}
                  />
                </div>
              )}
            </CardContent>
          )
        ) : (
          <CardContent className="py-12 text-center">
            <Image size={48} className="mx-auto text-text-tertiary mb-4" />
            <h3 className="text-h3 text-text-primary mb-2">No Floor Plan</h3>
            <p className="text-body text-text-secondary mb-4">
              Upload a floor plan to visualize floor locations
            </p>
            {canManage && (
              <Button variant="secondary" leftIcon={<Upload size={18} />} onClick={() => fileInputRef.current?.click()} isLoading={isUploading}>
                Upload Floor Plan
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Floors List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers size={20} />
            Floors ({building.floors?.length || 0})
          </CardTitle>
          {canManage && (
            <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowFloorModal(true)}>
              Add Floor
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!building.floors || building.floors.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <Layers size={32} className="mx-auto mb-2 opacity-50" />
              <p>No floors added yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {building.floors.map((floor) => (
                <div
                  key={floor.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary hover:bg-surface-hover transition-colors cursor-pointer group"
                  onClick={() => navigate(`/floors/${floor.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-body font-bold text-primary">{floor.level}</span>
                    </div>
                    <div>
                      <p className="text-body font-medium text-text-primary">{floor.name}</p>
                      <p className="text-caption text-text-secondary">{floor._count?.rooms || 0} rooms</p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingFloor(floor); }}
                        className="p-2 rounded hover:bg-surface text-text-secondary hover:text-primary"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingFloor(floor); }}
                        className="p-2 rounded hover:bg-surface text-text-secondary hover:text-error"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Floor Modal */}
      <Modal
        isOpen={showFloorModal}
        onClose={() => { setShowFloorModal(false); setPendingPinPosition(null); setFloorForm({ name: '', level: 0 }); }}
        title="Add Floor"
        icon={<Layers size={18} />}
        size="md"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={() => { setShowFloorModal(false); setPendingPinPosition(null); }}>Cancel</Button>
            <Button onClick={handleAddFloor} isLoading={createFloorMutation.isPending} disabled={!floorForm.name}>Add Floor</Button>
          </ModalActions>
        }
      >
        <ModalSection title="Floor Details" icon={<Layers size={14} />}>
          <div className="space-y-4">
            <Input
              label="Floor Name"
              value={floorForm.name}
              onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
              placeholder="Ground Floor, 1st Floor..."
              required
            />
            <Input
              type="number"
              label="Level"
              value={floorForm.level.toString()}
              onChange={(e) => setFloorForm({ ...floorForm, level: parseInt(e.target.value) || 0 })}
            />
          </div>
        </ModalSection>
      </Modal>

      {/* Edit Floor Modal */}
      {editingFloor && (
        <Modal
          isOpen={!!editingFloor}
          onClose={() => setEditingFloor(null)}
          title="Edit Floor"
          icon={<Edit size={18} />}
          size="md"
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setEditingFloor(null)}>Cancel</Button>
              <Button
                onClick={() => updateFloorMutation.mutate({ floorId: editingFloor.id, data: { name: editingFloor.name, level: editingFloor.level } })}
                isLoading={updateFloorMutation.isPending}
              >
                Save
              </Button>
            </ModalActions>
          }
        >
          <ModalSection title="Floor Details" icon={<Layers size={14} />}>
            <div className="space-y-4">
              <Input
                label="Floor Name"
                value={editingFloor.name}
                onChange={(e) => setEditingFloor({ ...editingFloor, name: e.target.value })}
                required
              />
              <Input
                type="number"
                label="Level"
                value={editingFloor.level.toString()}
                onChange={(e) => setEditingFloor({ ...editingFloor, level: parseInt(e.target.value) || 0 })}
              />
            </div>
          </ModalSection>
        </Modal>
      )}

      {/* Delete Floor Confirmation */}
      {deletingFloor && (
        <Modal
          isOpen={!!deletingFloor}
          onClose={() => setDeletingFloor(null)}
          title="Delete Floor"
          icon={<AlertTriangle size={18} />}
          size="sm"
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setDeletingFloor(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => deleteFloorMutation.mutate(deletingFloor.id)} isLoading={deleteFloorMutation.isPending}>
                Delete
              </Button>
            </ModalActions>
          }
        >
          <div className="text-center py-4">
            <Trash2 size={48} className="mx-auto text-error mb-4" />
            <p className="text-body">Delete <strong>{deletingFloor.name}</strong>?</p>
            <p className="text-body-sm text-text-secondary mt-2">This will also delete all rooms and assets.</p>
          </div>
        </Modal>
      )}

      {/* Download Modal */}
      {building.floorplanUrl && building.floorplanType !== 'PDF' && (
        <DownloadFloorplanModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          imageUrl={building.floorplanUrl}
          fileName={`${building.name}-floorplan`}
          projectName={building.project?.name || 'Project'}
          floorName={building.name}
          pins={(building.floors || [])
            .filter(f => f.pinX !== null && f.pinY !== null)
            .map(f => ({ id: f.id, name: f.name, x: f.pinX!, y: f.pinY!, status: 'IN_PROGRESS' as const }))}
          pinType="floor"
        />
      )}

      {/* Full Screen Floor Plan Modal */}
      {building.floorplanUrl && building.floorplanType !== 'PDF' && (
        <Modal
          isOpen={isFullScreenOpen}
          onClose={() => setIsFullScreenOpen(false)}
          title={`${building.name} - Floor Plan`}
          icon={<Building2 size={18} />}
          size="full"
        >
          {/* Edit mode toggle in fullscreen */}
          {canManage && (
            <div className="flex items-center justify-end gap-2 mb-2 -mt-2">
              {isEditingPins && (
                <>
                  {(building.floors || []).filter(f => f.pinX === null || f.pinY === null).length > 0 && (
                    <span className="text-caption text-text-secondary">
                      {(building.floors || []).filter(f => f.pinX === null || f.pinY === null).length} floors to place
                    </span>
                  )}
                  <Badge variant="info" size="sm">
                    Click to add | Drag to move
                  </Badge>
                </>
              )}
              <Button
                size="sm"
                variant={isEditingPins ? 'primary' : 'secondary'}
                leftIcon={isEditingPins ? <Unlock size={16} /> : <Lock size={16} />}
                onClick={() => setIsEditingPins(!isEditingPins)}
              >
                {isEditingPins ? 'Editing' : 'Edit Pins'}
              </Button>
            </div>
          )}
          <div className="h-[calc(95vh-120px)] -mx-6 -mb-6">
            <FloorPlanCanvas
              imageUrl={building.floorplanUrl}
              pins={(building.floors || [])
                .filter(f => f.pinX !== null && f.pinY !== null)
                .map(f => ({
                  id: f.id,
                  x: f.pinX!,
                  y: f.pinY!,
                  name: f.name,
                  status: 'IN_PROGRESS' as const,
                }))}
              availableItems={isEditingPins ? (building.floors || [])
                .filter(f => f.pinX === null || f.pinY === null)
                .map(f => ({ id: f.id, name: f.name, level: f.level })) : []}
              selectedPinId={selectedFloorId}
              isEditable={isEditingPins}
              showMaximize={false}
              showLegend={false}
              onPinClick={(pin) => {
                setSelectedFloorId(pin.id);
                navigate(`/floors/${pin.id}`);
              }}
              onPinMove={(pinId, x, y) => {
                updateFloorPositionMutation.mutate({
                  floorId: pinId,
                  pinX: Math.round(x),
                  pinY: Math.round(y),
                });
              }}
              onPlaceItem={(floorId, x, y) => {
                updateFloorPositionMutation.mutate({
                  floorId,
                  pinX: Math.round(x),
                  pinY: Math.round(y),
                });
                toast.success('Floor placed on floorplan');
              }}
              onAddPin={(x, y) => {
                setPendingPinPosition({ x: Math.round(x), y: Math.round(y) });
                setShowFloorModal(true);
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
