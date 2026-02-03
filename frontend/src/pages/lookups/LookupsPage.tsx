import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  DoorOpen,
  Ruler,
  AlertTriangle,
  Building2,
  Box,
  Globe,
  Tag,
  ListFilter,
  // Icons for Room Types picker
  Server,
  Router,
  Database,
  Network,
  Briefcase,
  Users,
  Home,
  Building,
  MoveHorizontal,
  Archive,
  Wrench,
  Bed,
  UtensilsCrossed,
  Wine,
  Waves,
  Dumbbell,
  Sparkles,
  Car,
  Circle,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  Cable,
  Plug,
  Lightbulb,
  Fan,
  Thermometer,
  Lock,
  Key,
  Camera,
  Shield,
  type LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Modal, ModalSection, ModalActions } from '../../components/ui/modal';
import {
  roomTypeService,
  inventoryUnitService,
  issueCauseService,
  manufacturerService,
  assetModelService,
} from '../../services/lookup.service';
import { assetService } from '../../services/asset.service';
import type {
  LookupRoomType,
  LookupInventoryUnit,
  LookupIssueCause,
  LookupManufacturer,
  LookupAssetModel,
} from '../../services/lookup.service';

type TabType = 'room-types' | 'inventory-units' | 'issue-causes' | 'manufacturers' | 'asset-models';

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'room-types', label: 'Room Types', icon: <DoorOpen size={18} /> },
  { id: 'inventory-units', label: 'Inventory Units', icon: <Ruler size={18} /> },
  { id: 'issue-causes', label: 'Issue Causes', icon: <AlertTriangle size={18} /> },
  { id: 'manufacturers', label: 'Manufacturers', icon: <Building2 size={18} /> },
  { id: 'asset-models', label: 'Asset Models', icon: <Box size={18} /> },
];

// Available icons for Room Types
const ROOM_TYPE_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  // IT & Network
  { name: 'server', icon: Server, label: 'Server' },
  { name: 'router', icon: Router, label: 'Router' },
  { name: 'database', icon: Database, label: 'Database' },
  { name: 'network', icon: Network, label: 'Network' },
  { name: 'monitor', icon: Monitor, label: 'Monitor' },
  { name: 'cpu', icon: Cpu, label: 'CPU' },
  { name: 'hard-drive', icon: HardDrive, label: 'Hard Drive' },
  { name: 'wifi', icon: Wifi, label: 'WiFi' },
  { name: 'cable', icon: Cable, label: 'Cable' },
  // Rooms & Spaces
  { name: 'door-open', icon: DoorOpen, label: 'Door' },
  { name: 'briefcase', icon: Briefcase, label: 'Office' },
  { name: 'users', icon: Users, label: 'Meeting' },
  { name: 'home', icon: Home, label: 'Home/Suite' },
  { name: 'building', icon: Building, label: 'Building' },
  { name: 'building-2', icon: Building2, label: 'Building 2' },
  { name: 'move-horizontal', icon: MoveHorizontal, label: 'Hallway' },
  { name: 'archive', icon: Archive, label: 'Storage' },
  // Hospitality
  { name: 'bed', icon: Bed, label: 'Bedroom' },
  { name: 'utensils', icon: UtensilsCrossed, label: 'Restaurant' },
  { name: 'wine', icon: Wine, label: 'Bar' },
  { name: 'waves', icon: Waves, label: 'Pool' },
  { name: 'dumbbell', icon: Dumbbell, label: 'Gym' },
  { name: 'sparkles', icon: Sparkles, label: 'Spa' },
  // Utilities
  { name: 'wrench', icon: Wrench, label: 'Utility' },
  { name: 'plug', icon: Plug, label: 'Electrical' },
  { name: 'lightbulb', icon: Lightbulb, label: 'Lighting' },
  { name: 'fan', icon: Fan, label: 'HVAC' },
  { name: 'thermometer', icon: Thermometer, label: 'Climate' },
  // Security
  { name: 'lock', icon: Lock, label: 'Security' },
  { name: 'key', icon: Key, label: 'Access' },
  { name: 'camera', icon: Camera, label: 'CCTV' },
  { name: 'shield', icon: Shield, label: 'Shield' },
  // Other
  { name: 'car', icon: Car, label: 'Parking' },
  { name: 'box', icon: Box, label: 'Box' },
  { name: 'circle', icon: Circle, label: 'Other' },
];

// Get icon component by name
function getIconByName(name: string): LucideIcon | null {
  const found = ROOM_TYPE_ICONS.find(i => i.name === name);
  return found?.icon || null;
}

export function LookupsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('room-types');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ListFilter size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-h2 text-text-primary">Dropdown Management</h1>
          <p className="text-body-sm text-text-secondary">
            Manage predefined values for dropdown fields
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-surface-border pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-body transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-text-inverse'
                : 'bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <Card className="p-6">
        {activeTab === 'room-types' && <RoomTypesTab />}
        {activeTab === 'inventory-units' && <InventoryUnitsTab />}
        {activeTab === 'issue-causes' && <IssueCausesTab />}
        {activeTab === 'manufacturers' && <ManufacturersTab />}
        {activeTab === 'asset-models' && <AssetModelsTab />}
      </Card>
    </div>
  );
}

// ============================================
// Room Types Tab
// ============================================
function RoomTypesTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupRoomType | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['lookups', 'room-types'],
    queryFn: () => roomTypeService.getAllAdmin(),
  });

  const createMutation = useMutation({
    mutationFn: roomTypeService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'room-types'] });
      toast.success('Room type created');
      closeModal();
    },
    onError: (error: Error) => {
      if (error.message.includes('Unique constraint') || error.message.includes('unique')) {
        toast.error('This name already exists');
      } else {
        toast.error('Error creating entry');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => roomTypeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'room-types'] });
      toast.success('Room type updated');
      closeModal();
    },
    onError: () => toast.error('Error updating entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: roomTypeService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'room-types'] });
      toast.success('Room type deleted');
    },
    onError: () => toast.error('Error deleting entry'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: '', icon: '' });
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', icon: '' });
    setIsModalOpen(true);
  };

  const openEdit = (item: LookupRoomType) => {
    setEditingItem(item);
    setFormData({ name: item.name, icon: item.icon || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-h4 text-text-primary">Room Types</h2>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-2" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="text-body text-text-secondary py-8 text-center">Loading...</div>
      ) : items.length === 0 ? (
        <EmptyState message="No room types. Add the first one!" />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <LookupItemWithIcon
              key={item.id}
              name={item.name}
              iconName={item.icon}
              onEdit={() => openEdit(item)}
              onDelete={() => {
                setItemToDelete(item.id);
                setDeleteModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Room Type' : 'New Room Type'}
        icon={<DoorOpen size={18} />}
        size="lg"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? 'Save' : 'Create'}
            </Button>
          </ModalActions>
        }
      >
        <ModalSection title="Basic Info">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Server Room, Office, Storage"
          />
        </ModalSection>
        <ModalSection title="Select Icon">
          <IconPicker
            selectedIcon={formData.icon}
            onSelect={(iconName) => setFormData({ ...formData, icon: iconName })}
          />
        </ModalSection>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          if (itemToDelete) {
            deleteMutation.mutate(itemToDelete);
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }
        }}
        title="Delete Room Type"
        message="Are you sure you want to delete this room type?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// ============================================
// Inventory Units Tab
// ============================================
function InventoryUnitsTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupInventoryUnit | null>(null);
  const [formData, setFormData] = useState({ name: '', abbreviation: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['lookups', 'inventory-units'],
    queryFn: () => inventoryUnitService.getAllAdmin(),
  });

  const createMutation = useMutation({
    mutationFn: inventoryUnitService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'inventory-units'] });
      toast.success('Inventory unit created');
      closeModal();
    },
    onError: (error: Error) => {
      if (error.message.includes('Unique constraint') || error.message.includes('unique') || error.message.includes('already exists')) {
        toast.error('This entry already exists');
      } else {
        toast.error('Error creating entry');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => inventoryUnitService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'inventory-units'] });
      toast.success('Inventory unit updated');
      closeModal();
    },
    onError: () => toast.error('Error updating entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryUnitService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'inventory-units'] });
      toast.success('Inventory unit deleted');
    },
    onError: () => toast.error('Error deleting entry'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: '', abbreviation: '' });
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', abbreviation: '' });
    setIsModalOpen(true);
  };

  const openEdit = (item: LookupInventoryUnit) => {
    setEditingItem(item);
    setFormData({ name: item.name, abbreviation: item.abbreviation });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.abbreviation.trim()) {
      toast.error('All fields are required');
      return;
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-h4 text-text-primary">Inventory Units</h2>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-2" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="text-body text-text-secondary py-8 text-center">Loading...</div>
      ) : items.length === 0 ? (
        <EmptyState message="No inventory units. Add the first one!" />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <LookupItem
              key={item.id}
              name={item.name}
              subtitle={`Abbreviation: ${item.abbreviation}`}
              onEdit={() => openEdit(item)}
              onDelete={() => {
                setItemToDelete(item.id);
                setDeleteModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Inventory Unit' : 'New Inventory Unit'}
        icon={<Ruler size={18} />}
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? 'Save' : 'Create'}
            </Button>
          </ModalActions>
        }
      >
        <ModalSection>
          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Pieces, Meters, Boxes"
            />
            <Input
              label="Abbreviation"
              value={formData.abbreviation}
              onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
              placeholder="e.g. pcs, m, box"
            />
          </div>
        </ModalSection>
      </Modal>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          if (itemToDelete) {
            deleteMutation.mutate(itemToDelete);
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }
        }}
        title="Delete Inventory Unit"
        message="Are you sure you want to delete this unit?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// ============================================
// Issue Causes Tab
// ============================================
function IssueCausesTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupIssueCause | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['lookups', 'issue-causes'],
    queryFn: () => issueCauseService.getAllAdmin(),
  });

  const createMutation = useMutation({
    mutationFn: issueCauseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'issue-causes'] });
      toast.success('Issue cause added');
      closeModal();
    },
    onError: (error: Error) => {
      if (error.message.includes('Unique constraint') || error.message.includes('unique') || error.message.includes('already exists')) {
        toast.error('This entry already exists');
      } else {
        toast.error('Error creating entry');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => issueCauseService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'issue-causes'] });
      toast.success('Issue cause updated');
      closeModal();
    },
    onError: () => toast.error('Error updating entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: issueCauseService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'issue-causes'] });
      toast.success('Issue cause deleted');
    },
    onError: () => toast.error('Error deleting entry'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: '' });
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ name: '' });
    setIsModalOpen(true);
  };

  const openEdit = (item: LookupIssueCause) => {
    setEditingItem(item);
    setFormData({ name: item.name });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-h4 text-text-primary">Issue Causes</h2>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-2" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="text-body text-text-secondary py-8 text-center">Loading...</div>
      ) : items.length === 0 ? (
        <EmptyState message="No issue causes. Add the first one!" />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <LookupItem
              key={item.id}
              name={item.name}
              onEdit={() => openEdit(item)}
              onDelete={() => {
                setItemToDelete(item.id);
                setDeleteModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Issue Cause' : 'New Issue Cause'}
        icon={<AlertTriangle size={18} />}
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? 'Save' : 'Create'}
            </Button>
          </ModalActions>
        }
      >
        <ModalSection>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Electrical Issue, HVAC, Plumbing"
          />
        </ModalSection>
      </Modal>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          if (itemToDelete) {
            deleteMutation.mutate(itemToDelete);
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }
        }}
        title="Delete Issue Cause"
        message="Are you sure you want to delete this issue cause?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// ============================================
// Manufacturers Tab
// ============================================
function ManufacturersTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupManufacturer | null>(null);
  const [formData, setFormData] = useState({ name: '', website: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['lookups', 'manufacturers'],
    queryFn: () => manufacturerService.getAllAdmin(),
  });

  const createMutation = useMutation({
    mutationFn: manufacturerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'manufacturers'] });
      toast.success('Manufacturer added');
      closeModal();
    },
    onError: (error: Error) => {
      if (error.message.includes('Unique constraint') || error.message.includes('unique') || error.message.includes('already exists')) {
        toast.error('This entry already exists');
      } else {
        toast.error('Error creating entry');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => manufacturerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'manufacturers'] });
      toast.success('Manufacturer updated');
      closeModal();
    },
    onError: () => toast.error('Error updating entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: manufacturerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'manufacturers'] });
      toast.success('Manufacturer deleted');
    },
    onError: () => toast.error('Error deleting entry'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: '', website: '' });
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', website: '' });
    setIsModalOpen(true);
  };

  const openEdit = (item: LookupManufacturer) => {
    setEditingItem(item);
    setFormData({ name: item.name, website: item.website || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    const submitData: any = { name: formData.name };
    if (formData.website) submitData.website = formData.website;

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-h4 text-text-primary">Manufacturers</h2>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} className="mr-2" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="text-body text-text-secondary py-8 text-center">Loading...</div>
      ) : items.length === 0 ? (
        <EmptyState message="No manufacturers. Add the first one!" />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <LookupItem
              key={item.id}
              name={item.name}
              subtitle={item._count?.models ? `${item._count.models} models` : undefined}
              badge={item.website ? <Globe size={14} className="text-primary" /> : undefined}
              onEdit={() => openEdit(item)}
              onDelete={() => {
                setItemToDelete(item.id);
                setDeleteModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Manufacturer' : 'New Manufacturer'}
        icon={<Building2 size={18} />}
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? 'Save' : 'Create'}
            </Button>
          </ModalActions>
        }
      >
        <ModalSection>
          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Cisco, Ubiquiti, Dahua"
            />
            <Input
              label="Website (optional)"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.example.com"
            />
          </div>
        </ModalSection>
      </Modal>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          if (itemToDelete) {
            deleteMutation.mutate(itemToDelete);
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }
        }}
        title="Delete Manufacturer"
        message="All models from this manufacturer will also be deleted. Are you sure?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// ============================================
// Asset Models Tab
// ============================================
function AssetModelsTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupAssetModel | null>(null);
  const [formData, setFormData] = useState({ manufacturerId: '', name: '', icon: '', assetTypeId: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['lookups', 'asset-models'],
    queryFn: () => assetModelService.getAllAdmin(),
  });

  const { data: manufacturersData } = useQuery({
    queryKey: ['lookups', 'manufacturers'],
    queryFn: () => manufacturerService.getAll(),
  });

  const { data: assetTypes = [] } = useQuery({
    queryKey: ['asset-types'],
    queryFn: () => assetService.getTypes(),
  });

  const createMutation = useMutation({
    mutationFn: assetModelService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'asset-models'] });
      toast.success('Asset model added');
      closeModal();
    },
    onError: (error: Error) => {
      if (error.message.includes('Unique constraint') || error.message.includes('unique') || error.message.includes('already exists')) {
        toast.error('This entry already exists');
      } else {
        toast.error('Error creating entry');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assetModelService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'asset-models'] });
      toast.success('Asset model updated');
      closeModal();
    },
    onError: () => toast.error('Error updating entry'),
  });

  const deleteMutation = useMutation({
    mutationFn: assetModelService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'asset-models'] });
      toast.success('Asset model deleted');
    },
    onError: () => toast.error('Error deleting entry'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ manufacturerId: '', name: '', icon: '', assetTypeId: '' });
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ manufacturerId: '', name: '', icon: '', assetTypeId: '' });
    setIsModalOpen(true);
  };

  const openEdit = (item: LookupAssetModel) => {
    setEditingItem(item);
    setFormData({
      manufacturerId: item.manufacturerId,
      name: item.name,
      icon: item.icon || '',
      assetTypeId: item.assetTypeId || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.manufacturerId || !formData.name.trim()) {
      toast.error('Manufacturer and name are required');
      return;
    }
    const submitData = {
      manufacturerId: formData.manufacturerId,
      name: formData.name,
      icon: formData.icon || undefined,
      assetTypeId: formData.assetTypeId || undefined,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const items = data?.items || [];
  const manufacturers = manufacturersData?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-h4 text-text-primary">Asset Models</h2>
        <Button onClick={openCreate} size="sm" disabled={manufacturers.length === 0}>
          <Plus size={16} className="mr-2" />
          Add
        </Button>
      </div>

      {manufacturers.length === 0 && (
        <div className="text-body text-warning bg-warning-bg px-4 py-3 rounded-lg border border-warning/20">
          Add manufacturers first before you can create models.
        </div>
      )}

      {isLoading ? (
        <div className="text-body text-text-secondary py-8 text-center">Loading...</div>
      ) : items.length === 0 ? (
        <EmptyState message="No asset models. Add the first one!" />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <LookupItemWithIcon
              key={item.id}
              name={`${item.manufacturer?.name} - ${item.name}`}
              subtitle={item.assetType?.name}
              iconName={item.icon}
              onEdit={() => openEdit(item)}
              onDelete={() => {
                setItemToDelete(item.id);
                setDeleteModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Asset Model' : 'New Asset Model'}
        icon={<Box size={18} />}
        size="lg"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? 'Save' : 'Create'}
            </Button>
          </ModalActions>
        }
      >
        <ModalSection title="Basic Info">
          <div className="space-y-4">
            <div>
              <label className="block text-caption font-medium text-text-secondary mb-1.5">
                Manufacturer *
              </label>
              <select
                value={formData.manufacturerId}
                onChange={(e) => setFormData({ ...formData, manufacturerId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-surface-border rounded-md text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="">Select manufacturer</option>
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <Input
              label="Model Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Catalyst 9300, UniFi 6 Pro"
            />
            <div>
              <label className="block text-caption font-medium text-text-secondary mb-1.5">
                Asset Type (optional)
              </label>
              <select
                value={formData.assetTypeId}
                onChange={(e) => setFormData({ ...formData, assetTypeId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-surface-border rounded-md text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="">No specific type</option>
                {assetTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <p className="text-caption text-text-tertiary mt-1">
                Link this model to an asset type for filtering
              </p>
            </div>
          </div>
        </ModalSection>
        <ModalSection title="Select Icon">
          <IconPicker
            selectedIcon={formData.icon}
            onSelect={(iconName) => setFormData({ ...formData, icon: iconName })}
          />
        </ModalSection>
      </Modal>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          if (itemToDelete) {
            deleteMutation.mutate(itemToDelete);
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }
        }}
        title="Delete Asset Model"
        message="Are you sure you want to delete this model?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-3 bg-surface-hover rounded-full mb-4">
        <Tag size={24} className="text-text-tertiary" />
      </div>
      <p className="text-body text-text-secondary">{message}</p>
    </div>
  );
}

// ============================================
// Reusable Lookup Item Component
// ============================================
interface LookupItemProps {
  name: string;
  subtitle?: string;
  badge?: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

function LookupItem({ name, subtitle, badge, onEdit, onDelete }: LookupItemProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg border transition-all bg-surface border-surface-border hover:bg-surface-hover">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded bg-primary/10">
          <Tag size={14} className="text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-body font-medium text-text-primary">
              {name}
            </span>
            {badge}
          </div>
          {subtitle && (
            <span className="text-body-sm text-text-tertiary">{subtitle}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-2 rounded-md hover:bg-surface-hover transition-colors"
          title="Edit"
        >
          <Pencil size={16} className="text-text-secondary hover:text-primary" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-md hover:bg-error-bg transition-colors"
          title="Delete"
        >
          <Trash2 size={16} className="text-text-secondary hover:text-error" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Lookup Item with Icon Component (for Room Types & Asset Models)
// ============================================
interface LookupItemWithIconProps {
  name: string;
  subtitle?: string;
  iconName?: string;
  onEdit: () => void;
  onDelete: () => void;
}

function LookupItemWithIcon({ name, subtitle, iconName, onEdit, onDelete }: LookupItemWithIconProps) {
  const IconComponent = iconName ? getIconByName(iconName) : null;

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg border transition-all bg-surface border-surface-border hover:bg-surface-hover">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          {IconComponent ? (
            <IconComponent size={18} className="text-primary" />
          ) : (
            <Tag size={18} className="text-primary" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-body font-medium text-text-primary">
              {name}
            </span>
          </div>
          {subtitle && (
            <span className="text-body-sm text-text-tertiary">{subtitle}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-2 rounded-md hover:bg-surface-hover transition-colors"
          title="Edit"
        >
          <Pencil size={16} className="text-text-secondary hover:text-primary" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-md hover:bg-error-bg transition-colors"
          title="Delete"
        >
          <Trash2 size={16} className="text-text-secondary hover:text-error" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Icon Picker Component
// ============================================
interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
}

function IconPicker({ selectedIcon, onSelect }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
      {ROOM_TYPE_ICONS.map(({ name, icon: Icon, label }) => (
        <button
          key={name}
          type="button"
          onClick={() => onSelect(name)}
          className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
            selectedIcon === name
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-surface-border bg-surface hover:bg-surface-hover hover:border-primary/50 text-text-secondary'
          }`}
          title={label}
        >
          <Icon size={20} />
          <span className="text-tiny truncate w-full text-center">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================
// Delete Confirmation Modal
// ============================================
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message, isLoading }: DeleteConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<Trash2 size={18} className="text-error" />}
      size="sm"
      footer={
        <ModalActions>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </ModalActions>
      }
    >
      <div className="py-4">
        <p className="text-body text-text-secondary">{message}</p>
      </div>
    </Modal>
  );
}
