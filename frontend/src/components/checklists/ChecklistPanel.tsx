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
  ClipboardList,
  Star,
  PenLine,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Badge, Modal, ModalSection, ModalActions, Input } from '@/components/ui';
import {
  checklistService,
  type Checklist,
  type ChecklistItem,
  type ChecklistType,
  type CustomChecklistItem,
  checklistTypeLabels,
} from '@/services/checklist.service';
import { uploadService } from '@/services/upload.service';
import {
  checklistTemplateService,
  templateTypeLabels,
  type ChecklistTemplateType,
} from '@/services/checklist-template.service';

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

type CreateMode = 'default' | 'template' | 'custom';

export function ChecklistPanel({ assetId, assetName: _assetName }: ChecklistPanelProps) {
  const queryClient = useQueryClient();
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [viewingPhotos, setViewingPhotos] = useState<ChecklistItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create checklist modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ChecklistType | null>(null);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [createMode, setCreateMode] = useState<CreateMode>('default');

  // Custom items state
  const [showCustomItemsModal, setShowCustomItemsModal] = useState(false);
  const [customItems, setCustomItems] = useState<CustomChecklistItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemRequiresPhoto, setNewItemRequiresPhoto] = useState(false);
  const [newItemIsRequired, setNewItemIsRequired] = useState(true);

  // Fetch checklists
  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists', assetId],
    queryFn: () => checklistService.getByAsset(assetId),
  });

  // Fetch templates for the selected type
  const { data: templates = [] } = useQuery({
    queryKey: ['checklist-templates', selectedType],
    queryFn: () => checklistTemplateService.getAll({
      type: selectedType as ChecklistTemplateType || undefined,
      activeOnly: true,
    }),
    enabled: showCreateModal && !!selectedType,
  });

  // Also fetch GENERAL templates
  const { data: generalTemplates = [] } = useQuery({
    queryKey: ['checklist-templates', 'GENERAL'],
    queryFn: () => checklistTemplateService.getAll({
      type: 'GENERAL',
      activeOnly: true,
    }),
    enabled: showCreateModal && !!selectedType,
  });

  // Combine and sort templates (type-specific first, then general)
  const availableTemplates = [...templates.filter(t => t.type === selectedType), ...generalTemplates];

  // Find the default template for the selected type
  const defaultTemplate = availableTemplates.find(t => t.isDefault && t.type === selectedType)
    || availableTemplates.find(t => t.isDefault);

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

  // Create single checklist mutation
  const createChecklistMutation = useMutation({
    mutationFn: (options: {
      type: ChecklistType;
      useDefault?: boolean;
      templateIds?: string[];
      customItems?: CustomChecklistItem[];
    }) => checklistService.create(assetId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', assetId] });
      toast.success('Checklist created');
      closeCreateModal();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create checklist');
    },
  });

  // Helpers for create modal
  const openCreateModal = () => {
    setShowCreateModal(true);
    setSelectedType(null);
    setSelectedTemplateIds([]);
    setCreateMode('default');
    setCustomItems([]);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setSelectedType(null);
    setSelectedTemplateIds([]);
    setCreateMode('default');
    setCustomItems([]);
    setShowCustomItemsModal(false);
  };

  const handleCreateChecklist = () => {
    if (!selectedType) return;

    if (createMode === 'default') {
      createChecklistMutation.mutate({
        type: selectedType,
        useDefault: true,
      });
    } else if (createMode === 'template') {
      createChecklistMutation.mutate({
        type: selectedType,
        templateIds: selectedTemplateIds.length > 0 ? selectedTemplateIds : undefined,
      });
    } else if (createMode === 'custom') {
      if (customItems.length === 0) {
        toast.error('Please add at least one item');
        return;
      }
      createChecklistMutation.mutate({
        type: selectedType,
        customItems,
      });
    }
  };

  // Toggle template selection
  const toggleTemplateSelection = (templateId: string) => {
    setSelectedTemplateIds(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  // Calculate total items from selected templates
  const getTotalSelectedItems = () => {
    return availableTemplates
      .filter(t => selectedTemplateIds.includes(t.id))
      .reduce((sum, t) => sum + t.items.length, 0);
  };

  // Custom items handlers
  const handleAddCustomItem = () => {
    if (!newItemName.trim()) {
      toast.error('Please enter an item name');
      return;
    }
    setCustomItems(prev => [...prev, {
      name: newItemName.trim(),
      requiresPhoto: newItemRequiresPhoto,
      isRequired: newItemIsRequired,
    }]);
    setNewItemName('');
    setNewItemRequiresPhoto(false);
    setNewItemIsRequired(true);
  };

  const handleRemoveCustomItem = (index: number) => {
    setCustomItems(prev => prev.filter((_, i) => i !== index));
  };

  // Get existing checklist types
  const existingTypes = checklists.map(c => c.type);
  const availableTypes: ChecklistType[] = ['CABLING', 'EQUIPMENT', 'CONFIG', 'DOCUMENTATION']
    .filter(t => !existingTypes.includes(t as ChecklistType)) as ChecklistType[];

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

  // Check if can create with current mode
  const canCreate = () => {
    if (!selectedType) return false;
    if (createMode === 'default') return !!defaultTemplate;
    if (createMode === 'template') return selectedTemplateIds.length > 0;
    if (createMode === 'custom') return customItems.length > 0;
    return false;
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
        {availableTypes.length > 0 && (
          <Button
            size="sm"
            onClick={openCreateModal}
            leftIcon={<Plus size={16} />}
          >
            Add Checklist
          </Button>
        )}
      </div>

      {/* No checklists */}
      {checklists.length === 0 && !generateMutation.isPending && (
        <div className="text-center py-8 text-text-secondary">
          <ListChecks size={32} className="mx-auto mb-2 opacity-50" />
          <p>No checklists yet</p>
          <p className="text-caption">Click "Add Checklist" to create one</p>
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

      {/* Create Checklist Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title="Create Checklist"
        icon={<ClipboardList size={18} />}
        size="lg"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateChecklist}
              isLoading={createChecklistMutation.isPending}
              disabled={!canCreate()}
            >
              Create Checklist
            </Button>
          </ModalActions>
        }
      >
        <div className="space-y-6">
          {/* Step 1: Select Type */}
          <ModalSection title="Step 1: Select Checklist Type" icon={<ListChecks size={14} />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setSelectedTemplateIds([]);
                    setCustomItems([]);
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    selectedType === type
                      ? 'border-primary bg-primary/10'
                      : 'border-surface-border hover:border-primary/50 hover:bg-surface-hover'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                    {typeIcons[type]}
                  </div>
                  <span className="text-body-sm font-medium text-text-primary text-center">
                    {checklistTypeLabels[type]}
                  </span>
                </button>
              ))}
            </div>
            {availableTypes.length === 0 && (
              <p className="text-center text-text-secondary py-4">
                All checklist types have been created for this asset
              </p>
            )}
          </ModalSection>

          {/* Step 2: Choose Mode */}
          {selectedType && (
            <ModalSection title="Step 2: Choose Creation Mode" icon={<Settings size={14} />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Default Option */}
                <button
                  onClick={() => {
                    setCreateMode('default');
                    setSelectedTemplateIds([]);
                    setCustomItems([]);
                  }}
                  disabled={!defaultTemplate}
                  className={`flex flex-col p-4 rounded-lg border-2 transition-all text-left ${
                    createMode === 'default'
                      ? 'border-primary bg-primary/10'
                      : 'border-surface-border hover:border-primary/50 hover:bg-surface-hover'
                  } ${!defaultTemplate ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Star size={20} className="text-warning fill-warning" />
                    </div>
                    <p className="text-body font-semibold text-text-primary">Default</p>
                  </div>
                  {defaultTemplate ? (
                    <p className="text-caption text-text-tertiary mt-2">
                      Uses "{defaultTemplate.name}" with {defaultTemplate.items.length} pre-defined items
                    </p>
                  ) : (
                    <p className="text-caption text-text-tertiary mt-2">
                      No default template available for this type
                    </p>
                  )}
                </button>

                {/* Select Templates Option */}
                <button
                  onClick={() => {
                    setCreateMode('template');
                    setCustomItems([]);
                  }}
                  className={`flex flex-col p-4 rounded-lg border-2 transition-all text-left ${
                    createMode === 'template'
                      ? 'border-primary bg-primary/10'
                      : 'border-surface-border hover:border-primary/50 hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ClipboardList size={20} className="text-primary" />
                    </div>
                    <p className="text-body font-semibold text-text-primary">Select Templates</p>
                  </div>
                  <p className="text-caption text-text-tertiary mt-2">
                    Choose one or more templates and merge their items together
                  </p>
                </button>

                {/* Custom Items Option */}
                <button
                  onClick={() => {
                    setCreateMode('custom');
                    setSelectedTemplateIds([]);
                    setShowCustomItemsModal(true);
                  }}
                  className={`flex flex-col p-4 rounded-lg border-2 transition-all text-left ${
                    createMode === 'custom'
                      ? 'border-primary bg-primary/10'
                      : 'border-surface-border hover:border-primary/50 hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <PenLine size={20} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-body font-semibold text-text-primary">Custom Items</p>
                      {customItems.length > 0 && (
                        <Badge variant="success" size="sm">{customItems.length} items</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-caption text-text-tertiary mt-2">
                    Create your own custom checklist items from scratch
                  </p>
                </button>
              </div>
            </ModalSection>
          )}

          {/* Step 3: Select Templates (only if template mode) */}
          {selectedType && createMode === 'template' && (
            <ModalSection
              title={
                <div className="flex items-center justify-between w-full">
                  <span>Step 3: Select Templates</span>
                  {selectedTemplateIds.length > 0 && (
                    <Badge variant="primary" size="sm">
                      {selectedTemplateIds.length} selected • {getTotalSelectedItems()} items
                    </Badge>
                  )}
                </div>
              }
              icon={<ClipboardList size={14} />}
            >
              {availableTemplates.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <ClipboardList size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="text-body font-medium">No templates available</p>
                  <p className="text-caption mt-1">Create templates in Settings → Checklist Templates</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableTemplates.map((template) => {
                    const isSelected = selectedTemplateIds.includes(template.id);
                    return (
                      <button
                        key={template.id}
                        onClick={() => toggleTemplateSelection(template.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-surface-border hover:border-primary/50 hover:bg-surface-hover'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'border-surface-border'
                        }`}>
                          {isSelected && <Check size={16} className="text-white" />}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-body font-medium text-text-primary">
                              {template.name}
                            </p>
                            {template.isDefault && (
                              <Star size={14} className="text-warning fill-warning flex-shrink-0" />
                            )}
                            <Badge variant="default" size="sm">
                              {templateTypeLabels[template.type]}
                            </Badge>
                            <Badge variant="primary" size="sm">
                              {template.items.length} items
                            </Badge>
                          </div>
                          {template.description && (
                            <p className="text-caption text-text-tertiary mt-1 truncate">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ModalSection>
          )}

          {/* Step 3: Custom Items Summary (only if custom mode and items exist) */}
          {selectedType && createMode === 'custom' && customItems.length > 0 && (
            <ModalSection
              title={`Step 3: Custom Items (${customItems.length})`}
              icon={<PenLine size={14} />}
            >
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {customItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg border border-surface-border"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-caption font-semibold text-emerald-500">{index + 1}</span>
                      </div>
                      <span className="text-body text-text-primary truncate">{item.name}</span>
                      {item.isRequired && (
                        <Badge variant="error" size="sm">Required</Badge>
                      )}
                      {item.requiresPhoto && (
                        <Badge variant="warning" size="sm">
                          <Camera size={10} className="mr-1" />
                          Photo
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveCustomItem(index)}
                      className="p-2 hover:bg-surface-hover rounded-lg text-text-secondary hover:text-error transition-colors ml-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCustomItemsModal(true)}
                leftIcon={<Plus size={14} />}
                className="w-full mt-3"
              >
                Add More Items
              </Button>
            </ModalSection>
          )}
        </div>
      </Modal>

      {/* Custom Items Modal (nested) */}
      <Modal
        isOpen={showCustomItemsModal}
        onClose={() => setShowCustomItemsModal(false)}
        title="Add Custom Items"
        icon={<PenLine size={18} />}
        size="lg"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowCustomItemsModal(false)}>
              Done ({customItems.length} items)
            </Button>
          </ModalActions>
        }
      >
        <div className="space-y-6">
          {/* Add new item form */}
          <ModalSection title="Add New Item" icon={<Plus size={14} />}>
            <div className="space-y-4">
              <Input
                label="Item Name"
                placeholder="Enter checklist item description..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomItem();
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-surface-hover transition-colors">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    newItemIsRequired ? 'bg-primary border-primary' : 'border-surface-border'
                  }`}>
                    {newItemIsRequired && <Check size={14} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={newItemIsRequired}
                    onChange={(e) => setNewItemIsRequired(e.target.checked)}
                    className="sr-only"
                  />
                  <span className="text-body text-text-primary">Required Item</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-surface-hover transition-colors">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    newItemRequiresPhoto ? 'bg-warning border-warning' : 'border-surface-border'
                  }`}>
                    {newItemRequiresPhoto && <Check size={14} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={newItemRequiresPhoto}
                    onChange={(e) => setNewItemRequiresPhoto(e.target.checked)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2">
                    <Camera size={16} className="text-warning" />
                    <span className="text-body text-text-primary">Requires Photo</span>
                  </div>
                </label>
              </div>
              <Button
                onClick={handleAddCustomItem}
                disabled={!newItemName.trim()}
                leftIcon={<Plus size={16} />}
                className="w-full"
              >
                Add Item
              </Button>
            </div>
          </ModalSection>

          {/* Current items list */}
          <ModalSection title={`Items List (${customItems.length})`} icon={<ListChecks size={14} />}>
            {customItems.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <ListChecks size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-body font-medium">No items yet</p>
                <p className="text-caption mt-1">Add your first checklist item using the form above</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {customItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg border border-surface-border"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-caption font-semibold text-emerald-500">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body text-text-primary truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.isRequired && (
                            <Badge variant="error" size="sm">Required</Badge>
                          )}
                          {item.requiresPhoto && (
                            <Badge variant="warning" size="sm">
                              <Camera size={10} className="mr-1" />
                              Photo Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCustomItem(index)}
                      className="p-2 hover:bg-surface-hover rounded-lg text-text-secondary hover:text-error transition-colors ml-3"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ModalSection>
        </div>
      </Modal>
    </div>
  );
}
