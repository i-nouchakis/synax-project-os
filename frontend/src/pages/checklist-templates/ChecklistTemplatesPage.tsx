import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Check,
  Camera,
  AlertCircle,
  Copy,
  Star,
  StarOff,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Modal,
  ModalSection,
  ModalActions,
} from '@/components/ui';
import {
  checklistTemplateService,
  templateTypeLabels,
  type ChecklistTemplate,
  type ChecklistTemplateItem,
  type ChecklistTemplateType,
  type CreateTemplateData,
} from '@/services/checklist-template.service';
import { assetService } from '@/services/asset.service';

export function ChecklistTemplatesPage() {
  const queryClient = useQueryClient();
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistTemplateItem | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'template' | 'item'; id: string } | null>(null);
  const [filterType, setFilterType] = useState<ChecklistTemplateType | 'all'>('all');

  // Template form state
  const [templateForm, setTemplateForm] = useState<{
    name: string;
    description: string;
    type: ChecklistTemplateType;
    assetTypeId: string;
    isDefault: boolean;
  }>({
    name: '',
    description: '',
    type: 'GENERAL',
    assetTypeId: '',
    isDefault: false,
  });

  // Item form state
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    requiresPhoto: false,
    isRequired: true,
  });

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['checklist-templates', filterType],
    queryFn: () => checklistTemplateService.getAll(
      filterType === 'all' ? undefined : { type: filterType }
    ),
  });

  // Fetch asset types
  const { data: assetTypes = [] } = useQuery({
    queryKey: ['asset-types'],
    queryFn: () => assetService.getTypes(),
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: CreateTemplateData) => checklistTemplateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Template created');
      closeTemplateModal();
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => checklistTemplateService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Template updated');
      closeTemplateModal();
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => checklistTemplateService.delete(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      if (result.deactivated) {
        toast.success('Template deactivated (in use)');
      } else {
        toast.success('Template deleted');
      }
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: any }) =>
      checklistTemplateService.addItem(templateId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success(`Item added (synced to ${result.syncedChecklists} checklists)`);
      closeItemModal();
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: any }) =>
      checklistTemplateService.updateItem(itemId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success(`Item updated (synced to ${result.syncedItems} items)`);
      closeItemModal();
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => checklistTemplateService.deleteItem(itemId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success(`Item deleted (archived ${result.archivedItems} items)`);
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });

  // Toggle expand/collapse
  const toggleExpand = (templateId: string) => {
    setExpandedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  // Modal handlers
  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      description: '',
      type: 'GENERAL',
      assetTypeId: '',
      isDefault: false,
    });
    setIsCreateModalOpen(true);
  };

  const openEditTemplate = (template: ChecklistTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      type: template.type,
      assetTypeId: template.assetTypeId || '',
      isDefault: template.isDefault,
    });
    setIsCreateModalOpen(true);
  };

  const closeTemplateModal = () => {
    setIsCreateModalOpen(false);
    setEditingTemplate(null);
  };

  const openAddItem = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      requiresPhoto: false,
      isRequired: true,
    });
    setIsItemModalOpen(true);
  };

  const openEditItem = (item: ChecklistTemplateItem) => {
    setSelectedTemplateId(item.templateId);
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      requiresPhoto: item.requiresPhoto,
      isRequired: item.isRequired,
    });
    setIsItemModalOpen(true);
  };

  const closeItemModal = () => {
    setIsItemModalOpen(false);
    setEditingItem(null);
    setSelectedTemplateId(null);
  };

  // Form submit handlers
  const handleTemplateSubmit = () => {
    if (!templateForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    const data: any = {
      name: templateForm.name,
      description: templateForm.description || undefined,
      type: templateForm.type,
      assetTypeId: templateForm.assetTypeId || undefined,
      isDefault: templateForm.isDefault,
    };

    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const handleItemSubmit = () => {
    if (!itemForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    const data = {
      name: itemForm.name,
      description: itemForm.description || undefined,
      requiresPhoto: itemForm.requiresPhoto,
      isRequired: itemForm.isRequired,
    };

    if (editingItem) {
      updateItemMutation.mutate({ itemId: editingItem.id, data });
    } else if (selectedTemplateId) {
      addItemMutation.mutate({ templateId: selectedTemplateId, data });
    }
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'template') {
      deleteTemplateMutation.mutate(itemToDelete.id);
    } else {
      deleteItemMutation.mutate(itemToDelete.id);
    }
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // Duplicate template
  const handleDuplicate = async (template: ChecklistTemplate) => {
    const data: CreateTemplateData = {
      name: `${template.name} (Copy)`,
      description: template.description,
      type: template.type,
      assetTypeId: template.assetTypeId || undefined,
      isDefault: false,
      items: template.items.map((item) => ({
        name: item.name,
        description: item.description,
        requiresPhoto: item.requiresPhoto,
        isRequired: item.isRequired,
        order: item.order,
      })),
    };
    createTemplateMutation.mutate(data);
  };

  // Get type badge color
  const getTypeBadgeVariant = (type: ChecklistTemplateType): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'GENERAL': return 'default';
      case 'CABLING': return 'warning';
      case 'EQUIPMENT': return 'primary';
      case 'CONFIG': return 'success';
      case 'DOCUMENTATION': return 'success';
      default: return 'default';
    }
  };

  const templateTypes: ChecklistTemplateType[] = ['GENERAL', 'CABLING', 'EQUIPMENT', 'CONFIG', 'DOCUMENTATION'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ClipboardList size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-h2 text-text-primary">Checklist Templates</h1>
            <p className="text-body-sm text-text-secondary">
              Manage reusable checklist templates with auto-sync
            </p>
          </div>
        </div>
        <Button onClick={openCreateTemplate} leftIcon={<Plus size={18} />}>
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg text-body-sm transition-colors ${
            filterType === 'all'
              ? 'bg-primary text-text-inverse'
              : 'bg-surface text-text-secondary hover:bg-surface-hover'
          }`}
        >
          All
        </button>
        {templateTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-body-sm transition-colors ${
              filterType === type
                ? 'bg-primary text-text-inverse'
                : 'bg-surface text-text-secondary hover:bg-surface-hover'
            }`}
          >
            {templateTypeLabels[type]}
          </button>
        ))}
      </div>

      {/* Templates List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-text-secondary">Loading templates...</div>
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ClipboardList size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
              <p className="text-body text-text-secondary mb-4">
                {filterType === 'all' ? 'No templates yet' : `No ${templateTypeLabels[filterType]} templates`}
              </p>
              <Button onClick={openCreateTemplate} leftIcon={<Plus size={16} />}>
                Create First Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card key={template.id} className={!template.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-0">
                {/* Template Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => toggleExpand(template.id)}
                >
                  <button className="p-1 hover:bg-surface-secondary rounded">
                    {expandedTemplates.has(template.id) ? (
                      <ChevronDown size={18} className="text-text-secondary" />
                    ) : (
                      <ChevronRight size={18} className="text-text-secondary" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-body font-medium text-text-primary truncate">
                        {template.name}
                      </span>
                      <Badge variant={getTypeBadgeVariant(template.type)} size="sm">
                        {templateTypeLabels[template.type]}
                      </Badge>
                      {template.isDefault && (
                        <Star size={14} className="text-warning fill-warning" />
                      )}
                      {!template.isActive && (
                        <Badge variant="error" size="sm">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {template.description && (
                        <span className="text-caption text-text-tertiary truncate">
                          {template.description}
                        </span>
                      )}
                      <span className="text-caption text-text-tertiary">
                        {template.items.length} items
                      </span>
                      {template._count?.checklists && template._count.checklists > 0 && (
                        <span className="text-caption text-text-tertiary">
                          Used in {template._count.checklists} checklists
                        </span>
                      )}
                      {template.assetType && (
                        <span className="text-caption text-primary">
                          {template.assetType.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="p-2 rounded-md hover:bg-surface-secondary transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={16} className="text-text-secondary hover:text-primary" />
                    </button>
                    <button
                      onClick={() => openEditTemplate(template)}
                      className="p-2 rounded-md hover:bg-surface-secondary transition-colors"
                      title="Edit"
                    >
                      <Pencil size={16} className="text-text-secondary hover:text-primary" />
                    </button>
                    <button
                      onClick={() => {
                        setItemToDelete({ type: 'template', id: template.id });
                        setDeleteModalOpen(true);
                      }}
                      className="p-2 rounded-md hover:bg-error-bg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-text-secondary hover:text-error" />
                    </button>
                  </div>
                </div>

                {/* Template Items */}
                {expandedTemplates.has(template.id) && (
                  <div className="border-t border-surface-border">
                    <div className="px-4 py-2 bg-surface-secondary/50">
                      <div className="flex items-center justify-between">
                        <span className="text-caption font-medium text-text-secondary uppercase tracking-wide">
                          Checklist Items
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<Plus size={14} />}
                          onClick={() => openAddItem(template.id)}
                        >
                          Add Item
                        </Button>
                      </div>
                    </div>
                    {template.items.length === 0 ? (
                      <div className="px-4 py-6 text-center text-text-tertiary">
                        No items in this template
                      </div>
                    ) : (
                      <div className="divide-y divide-surface-border">
                        {template.items.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover/50"
                          >
                            <GripVertical size={16} className="text-text-tertiary cursor-grab" />
                            <span className="text-caption text-text-tertiary w-6">
                              {index + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-body text-text-primary">
                                  {item.name}
                                </span>
                                {item.isRequired && (
                                  <span title="Required">
                                    <AlertCircle size={14} className="text-error" />
                                  </span>
                                )}
                                {item.requiresPhoto && (
                                  <span title="Photo required">
                                    <Camera size={14} className="text-primary" />
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <span className="text-caption text-text-tertiary">
                                  {item.description}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditItem(item)}
                                className="p-1.5 rounded hover:bg-surface-secondary transition-colors"
                                title="Edit item"
                              >
                                <Pencil size={14} className="text-text-tertiary hover:text-primary" />
                              </button>
                              <button
                                onClick={() => {
                                  setItemToDelete({ type: 'item', id: item.id });
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1.5 rounded hover:bg-error-bg transition-colors"
                                title="Delete item"
                              >
                                <Trash2 size={14} className="text-text-tertiary hover:text-error" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Template Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeTemplateModal}
        title={editingTemplate ? 'Edit Template' : 'New Template'}
        icon={<ClipboardList size={18} />}
        size="md"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={closeTemplateModal}>
              Cancel
            </Button>
            <Button
              onClick={handleTemplateSubmit}
              isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending}
            >
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </ModalActions>
        }
      >
        <div className="space-y-5">
          <ModalSection title="Basic Info">
            <div className="space-y-4">
              <Input
                label="Template Name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="e.g., Network Equipment Setup"
                required
              />
              <Input
                label="Description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Brief description of this template"
              />
            </div>
          </ModalSection>

          <ModalSection title="Template Type">
            <div>
              <select
                value={templateForm.type}
                onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as ChecklistTemplateType })}
                className="w-full px-3 py-2 bg-background border border-surface-border rounded-md text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                {templateTypes.map((type) => (
                  <option key={type} value={type}>
                    {templateTypeLabels[type]}
                  </option>
                ))}
              </select>
              <p className="text-caption text-text-tertiary mt-1.5">
                {templateForm.type === 'GENERAL'
                  ? 'General templates can be used for any checklist type'
                  : `This template will be available for ${templateTypeLabels[templateForm.type]} checklists`}
              </p>
            </div>
          </ModalSection>

          <ModalSection title="Asset Type (Optional)">
            <div>
              <select
                value={templateForm.assetTypeId}
                onChange={(e) => setTemplateForm({ ...templateForm, assetTypeId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-surface-border rounded-md text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="">All asset types</option>
                {assetTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="text-caption text-text-tertiary mt-1.5">
                Link to a specific asset type or leave empty for all
              </p>
            </div>
          </ModalSection>

          <ModalSection title="Options">
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg cursor-pointer hover:bg-surface-hover transition-colors">
                <input
                  type="checkbox"
                  checked={templateForm.isDefault}
                  onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                  className="w-4 h-4 text-primary bg-background border-surface-border rounded focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {templateForm.isDefault ? (
                      <Star size={16} className="text-warning fill-warning" />
                    ) : (
                      <StarOff size={16} className="text-text-tertiary" />
                    )}
                    <span className="text-body font-medium text-text-primary">
                      Set as Default
                    </span>
                  </div>
                  <p className="text-caption text-text-tertiary mt-0.5">
                    This template will be used automatically for new checklists of this type
                  </p>
                </div>
              </label>
            </div>
          </ModalSection>
        </div>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={closeItemModal}
        title={editingItem ? 'Edit Item' : 'Add Item'}
        icon={<Check size={18} />}
        size="md"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={closeItemModal}>
              Cancel
            </Button>
            <Button
              onClick={handleItemSubmit}
              isLoading={addItemMutation.isPending || updateItemMutation.isPending}
            >
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </ModalActions>
        }
      >
        <div className="space-y-5">
          <ModalSection title="Item Details">
            <div className="space-y-4">
              <Input
                label="Item Name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="e.g., Verify cable connections"
                required
              />
              <Input
                label="Description"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Additional instructions or notes"
              />
            </div>
          </ModalSection>

          <ModalSection title="Options">
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg cursor-pointer hover:bg-surface-hover transition-colors">
                <input
                  type="checkbox"
                  checked={itemForm.isRequired}
                  onChange={(e) => setItemForm({ ...itemForm, isRequired: e.target.checked })}
                  className="w-4 h-4 text-primary bg-background border-surface-border rounded focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className={itemForm.isRequired ? 'text-error' : 'text-text-tertiary'} />
                    <span className="text-body font-medium text-text-primary">
                      Required
                    </span>
                  </div>
                  <p className="text-caption text-text-tertiary mt-0.5">
                    This item must be completed before the checklist can be finished
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg cursor-pointer hover:bg-surface-hover transition-colors">
                <input
                  type="checkbox"
                  checked={itemForm.requiresPhoto}
                  onChange={(e) => setItemForm({ ...itemForm, requiresPhoto: e.target.checked })}
                  className="w-4 h-4 text-primary bg-background border-surface-border rounded focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Camera size={16} className={itemForm.requiresPhoto ? 'text-primary' : 'text-text-tertiary'} />
                    <span className="text-body font-medium text-text-primary">
                      Photo Required
                    </span>
                  </div>
                  <p className="text-caption text-text-tertiary mt-0.5">
                    A photo must be attached when completing this item
                  </p>
                </div>
              </label>
            </div>
          </ModalSection>

          {editingItem && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-body-sm text-warning">
                Changes will sync to uncompleted checklist items linked to this template.
                Completed items will not be affected.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={itemToDelete?.type === 'template' ? 'Delete Template' : 'Delete Item'}
        icon={<Trash2 size={18} className="text-error" />}
        size="sm"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteTemplateMutation.isPending || deleteItemMutation.isPending}
            >
              Delete
            </Button>
          </ModalActions>
        }
      >
        <div className="py-4">
          {itemToDelete?.type === 'template' ? (
            <p className="text-body text-text-secondary">
              Are you sure you want to delete this template? If it's in use, it will be
              deactivated instead of deleted.
            </p>
          ) : (
            <p className="text-body text-text-secondary">
              Are you sure you want to delete this item? Items in linked checklists will
              be archived (soft delete) and won't appear in the checklist anymore.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default ChecklistTemplatesPage;
