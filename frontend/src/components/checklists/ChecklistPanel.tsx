import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  Camera,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  Loader2,
  ListChecks,
  Cable,
  Package,
  Settings,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Badge, Modal, ModalSection, ModalActions } from '@/components/ui';
import {
  checklistService,
  type Checklist,
  type ChecklistItem,
  type ChecklistType,
  checklistTypeLabels,
} from '@/services/checklist.service';
import { uploadService } from '@/services/upload.service';

interface ChecklistPanelProps {
  assetId: string;
  assetName?: string;
}

const statusColors = {
  NOT_STARTED: 'default' as const,
  IN_PROGRESS: 'primary' as const,
  COMPLETED: 'success' as const,
};

const typeIcons: Record<ChecklistType, React.ReactNode> = {
  CABLING: <Cable size={18} className="text-amber-500" />,
  EQUIPMENT: <Package size={18} className="text-blue-500" />,
  CONFIG: <Settings size={18} className="text-purple-500" />,
  DOCUMENTATION: <FileText size={18} className="text-emerald-500" />,
};

export function ChecklistPanel({ assetId, assetName: _assetName }: ChecklistPanelProps) {
  const queryClient = useQueryClient();
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [viewingPhotos, setViewingPhotos] = useState<ChecklistItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch checklists
  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists', assetId],
    queryFn: () => checklistService.getByAsset(assetId),
  });

  // Generate all checklists mutation
  const generateMutation = useMutation({
    mutationFn: () => checklistService.generateAll(assetId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['checklists', assetId] });
      toast.success(`Generated ${data.created} checklists`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to generate checklists');
    },
  });

  // Toggle item mutation
  const toggleMutation = useMutation({
    mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
      checklistService.toggleItem(itemId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', assetId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update item');
    },
  });

  // Add photo mutation
  const addPhotoMutation = useMutation({
    mutationFn: ({ itemId, photoUrl }: { itemId: string; photoUrl: string }) =>
      checklistService.addPhoto(itemId, photoUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', assetId] });
      toast.success('Photo added');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add photo');
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => checklistService.deletePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', assetId] });
      toast.success('Photo deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete photo');
    },
  });

  // Handle photo upload
  const handlePhotoUpload = async (itemId: string, file: File) => {
    setUploadingItemId(itemId);
    try {
      const result = await uploadService.uploadChecklistPhoto(file);
      await addPhotoMutation.mutateAsync({ itemId, photoUrl: result.url });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingItemId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Calculate progress
  const getProgress = (checklist: Checklist) => {
    if (checklist.items.length === 0) return 0;
    const completed = checklist.items.filter((item) => item.completed).length;
    return Math.round((completed / checklist.items.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-h3 flex items-center gap-2">
          <ListChecks size={20} />
          Checklists
        </h3>
        {checklists.length === 0 && (
          <Button
            size="sm"
            onClick={() => generateMutation.mutate()}
            isLoading={generateMutation.isPending}
            leftIcon={<Plus size={16} />}
          >
            Generate Checklists
          </Button>
        )}
      </div>

      {/* No checklists */}
      {checklists.length === 0 && !generateMutation.isPending && (
        <div className="text-center py-8 text-text-secondary">
          <ListChecks size={32} className="mx-auto mb-2 opacity-50" />
          <p>No checklists yet</p>
          <p className="text-caption">Click "Generate Checklists" to create them</p>
        </div>
      )}

      {/* Checklists */}
      <div className="space-y-2">
        {checklists.map((checklist) => (
          <div
            key={checklist.id}
            className="border border-surface-border rounded-lg overflow-hidden"
          >
            {/* Checklist Header */}
            <button
              onClick={() =>
                setExpandedChecklist(expandedChecklist === checklist.id ? null : checklist.id)
              }
              className="w-full flex items-center justify-between p-3 bg-surface-secondary hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedChecklist === checklist.id ? (
                  <ChevronDown size={18} className="text-text-secondary" />
                ) : (
                  <ChevronRight size={18} className="text-text-secondary" />
                )}
                <div className="w-7 h-7 rounded-md bg-surface flex items-center justify-center">
                  {typeIcons[checklist.type]}
                </div>
                <span className="font-medium text-text-primary">
                  {checklistTypeLabels[checklist.type]}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${getProgress(checklist)}%` }}
                    />
                  </div>
                  <span className="text-caption text-text-secondary min-w-[3rem]">
                    {getProgress(checklist)}%
                  </span>
                </div>
                <Badge variant={statusColors[checklist.status]} size="sm">
                  {checklist.status.replace('_', ' ')}
                </Badge>
              </div>
            </button>

            {/* Checklist Items */}
            {expandedChecklist === checklist.id && (
              <div className="border-t border-surface-border">
                {checklist.items.length === 0 ? (
                  <p className="p-4 text-center text-text-secondary text-body-sm">
                    No items in this checklist
                  </p>
                ) : (
                  <ul className="divide-y divide-surface-border">
                    {checklist.items.map((item) => (
                      <li key={item.id} className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() =>
                              toggleMutation.mutate({
                                itemId: item.id,
                                completed: !item.completed,
                              })
                            }
                            disabled={toggleMutation.isPending}
                            className="mt-0.5 text-text-secondary hover:text-primary transition-colors"
                          >
                            {item.completed ? (
                              <CheckCircle2 size={20} className="text-success" />
                            ) : (
                              <Circle size={20} />
                            )}
                          </button>

                          {/* Item content */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-body ${
                                item.completed
                                  ? 'text-text-tertiary line-through'
                                  : 'text-text-primary'
                              }`}
                            >
                              {item.name}
                              {item.isRequired && (
                                <span className="text-error ml-1">*</span>
                              )}
                            </p>

                            {/* Photos */}
                            {item.photos.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.photos.slice(0, 3).map((photo) => (
                                  <img
                                    key={photo.id}
                                    src={photo.photoUrl}
                                    alt={photo.caption || 'Checklist photo'}
                                    className="w-12 h-12 rounded object-cover cursor-pointer hover:opacity-80"
                                    onClick={() => setViewingPhotos(item)}
                                  />
                                ))}
                                {item.photos.length > 3 && (
                                  <button
                                    onClick={() => setViewingPhotos(item)}
                                    className="w-12 h-12 rounded bg-surface-secondary flex items-center justify-center text-caption text-text-secondary hover:bg-surface-hover"
                                  >
                                    +{item.photos.length - 3}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {item.requiresPhoto && (
                              <span className="text-caption text-warning mr-2">
                                <Camera size={14} />
                              </span>
                            )}
                            <input
                              ref={uploadingItemId === item.id ? fileInputRef : null}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(item.id, file);
                              }}
                            />
                            <button
                              onClick={() => {
                                setUploadingItemId(item.id);
                                // Trigger file input
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) handlePhotoUpload(item.id, file);
                                };
                                input.click();
                              }}
                              disabled={uploadingItemId === item.id}
                              className="p-1.5 rounded hover:bg-surface-hover text-text-secondary"
                              title="Add photo"
                            >
                              {uploadingItemId === item.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Camera size={16} />
                              )}
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Photos Modal */}
      {viewingPhotos && (
        <Modal
          isOpen={!!viewingPhotos}
          onClose={() => setViewingPhotos(null)}
          title={`Photos - ${viewingPhotos.name}`}
          icon={<Camera size={18} />}
          size="lg"
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setViewingPhotos(null)}>
                Close
              </Button>
            </ModalActions>
          }
        >
          <ModalSection title={`${viewingPhotos.photos.length} Photos`} icon={<Camera size={14} />}>
            {viewingPhotos.photos.length === 0 ? (
              <p className="text-center text-text-secondary py-8">No photos</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {viewingPhotos.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.photoUrl}
                      alt={photo.caption || 'Checklist photo'}
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <button
                      onClick={() => {
                        if (confirm('Delete this photo?')) {
                          deletePhotoMutation.mutate(photo.id);
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded bg-error/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                    {photo.caption && (
                      <p className="mt-1 text-caption text-text-secondary">{photo.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ModalSection>
        </Modal>
      )}
    </div>
  );
}
