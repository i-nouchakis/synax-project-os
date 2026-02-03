import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Users,
  Layers,
  AlertTriangle,
  Plus,
  UserPlus,
  UserMinus,
  Pencil,
  Box,
  ListChecks,
  Package,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  BarChart3,
  Upload,
  Image,
  X,
  Trash2,
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
  Select,
  Input,
} from '@/components/ui';
import { projectService, type ProjectStatus, type UpdateProjectData } from '@/services/project.service';
import { userService } from '@/services/user.service';
import { floorService, type CreateFloorData, type UpdateFloorData, type Floor } from '@/services/floor.service';
import { reportService } from '@/services/report.service';
import { uploadService } from '@/services/upload.service';
import { useAuthStore } from '@/stores/auth.store';

const statusBadgeVariants: Record<ProjectStatus, 'info' | 'primary' | 'warning' | 'success' | 'default'> = {
  PLANNING: 'info',
  IN_PROGRESS: 'primary',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  ARCHIVED: 'default',
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'PM';

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddFloorModalOpen, setIsAddFloorModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<Floor | null>(null);

  // Fetch project
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getById(id!),
    enabled: !!id,
  });

  // Fetch project stats
  const { data: projectStats } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: () => reportService.getSummary(id!),
    enabled: !!id,
  });

  // Create floor mutation with optional floor plan upload
  const createFloorMutation = useMutation({
    mutationFn: async (data: CreateFloorData & { floorplanFile?: File }) => {
      const { floorplanFile, ...floorData } = data;
      // First create the floor
      const newFloor = await floorService.create(floorData);

      // If a floor plan file was provided, upload it
      if (floorplanFile && newFloor.id) {
        try {
          await uploadService.uploadFloorPlan(newFloor.id, floorplanFile);
        } catch (uploadErr) {
          // Floor was created but upload failed - notify but don't fail the whole operation
          toast.error('Floor created but floor plan upload failed. You can upload it later.');
        }
      }

      return newFloor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setIsAddFloorModalOpen(false);
      toast.success('Floor created successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create floor');
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      projectService.addMember(id!, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setIsAddMemberModalOpen(false);
      toast.success('Member added successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add member');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => projectService.removeMember(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Member removed');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to remove member');
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: (data: UpdateProjectData) => projectService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditProjectModalOpen(false);
      toast.success('Project updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update project');
    },
  });

  // Update floor mutation
  const updateFloorMutation = useMutation({
    mutationFn: ({ floorId, data }: { floorId: string; data: UpdateFloorData }) =>
      floorService.update(floorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setEditingFloor(null);
      toast.success('Floor updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update floor');
    },
  });

  // Delete floor mutation
  const deleteFloorMutation = useMutation({
    mutationFn: (floorId: string) => floorService.delete(floorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setDeletingFloor(null);
      toast.success('Floor deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete floor');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-error mb-4">Project not found</p>
        <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-2"
          >
            <ArrowLeft size={18} />
            <span className="text-body-sm">Back to Projects</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-h1">{project.name}</h1>
            <Badge variant={statusBadgeVariants[project.status]} size="lg">
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          {project.description && (
            <p className="text-body text-text-secondary mt-2">{project.description}</p>
          )}
        </div>
        {canManage && (
          <Button
            variant="secondary"
            leftIcon={<Pencil size={18} />}
            onClick={() => setIsEditProjectModalOpen(true)}
          >
            Edit Project
          </Button>
        )}
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-caption text-text-secondary">Client</p>
                <p className="text-body font-medium text-text-primary">{project.clientName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {project.location && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <MapPin size={20} className="text-info" />
                </div>
                <div>
                  <p className="text-caption text-text-secondary">Location</p>
                  <p className="text-body font-medium text-text-primary">{project.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {project.startDate && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Calendar size={20} className="text-warning" />
                </div>
                <div>
                  <p className="text-caption text-text-secondary">Timeline</p>
                  <p className="text-body font-medium text-text-primary">
                    {new Date(project.startDate).toLocaleDateString()}
                    {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-error/10">
                <AlertTriangle size={20} className="text-error" />
              </div>
              <div>
                <p className="text-caption text-text-secondary">Open Issues</p>
                <p className="text-body font-medium text-text-primary">{projectStats?.stats?.issues?.open || project._count?.issues || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Metrics */}
      {projectStats && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              Project Metrics
            </CardTitle>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<FileText size={16} />}
              onClick={() => navigate(`/reports?project=${id}`)}
            >
              View Reports
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Rooms */}
              <div className="p-4 rounded-lg bg-surface-secondary text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Layers size={16} className="text-blue-500" />
                  <span className="text-caption text-text-secondary">Rooms</span>
                </div>
                <p className="text-h3 text-text-primary">{projectStats.stats.rooms.total}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <CheckCircle2 size={12} className="text-success" />
                  <span className="text-caption text-success">{projectStats.stats.rooms.completed} completed</span>
                </div>
              </div>

              {/* Assets */}
              <div className="p-4 rounded-lg bg-surface-secondary text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Box size={16} className="text-purple-500" />
                  <span className="text-caption text-text-secondary">Assets</span>
                </div>
                <p className="text-h3 text-text-primary">{projectStats.stats.assets.total}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <CheckCircle2 size={12} className="text-success" />
                  <span className="text-caption text-success">{projectStats.stats.assets.verified} verified</span>
                </div>
              </div>

              {/* Checklists */}
              <div className="p-4 rounded-lg bg-surface-secondary text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ListChecks size={16} className="text-emerald-500" />
                  <span className="text-caption text-text-secondary">Checklists</span>
                </div>
                <p className="text-h3 text-text-primary">{projectStats.stats.checklists.completionRate}%</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-caption text-text-secondary">
                    {projectStats.stats.checklists.completedItems}/{projectStats.stats.checklists.totalItems} items
                  </span>
                </div>
              </div>

              {/* Issues */}
              <div className="p-4 rounded-lg bg-surface-secondary text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span className="text-caption text-text-secondary">Issues</span>
                </div>
                <p className="text-h3 text-text-primary">{projectStats.stats.issues.total}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <Clock size={12} className="text-warning" />
                  <span className="text-caption text-warning">{projectStats.stats.issues.open} open</span>
                </div>
              </div>

              {/* Inventory */}
              <div className="p-4 rounded-lg bg-surface-secondary text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Package size={16} className="text-cyan-500" />
                  <span className="text-caption text-text-secondary">Inventory</span>
                </div>
                <p className="text-h3 text-text-primary">{projectStats.stats.inventory.totalItems}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-caption text-text-secondary">
                    {projectStats.stats.inventory.totalInStock} in stock
                  </span>
                </div>
              </div>

              {/* Overall Progress */}
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-primary" />
                  <span className="text-caption text-text-secondary">Progress</span>
                </div>
                <p className="text-h3 text-primary">{projectStats.progress.checklists}%</p>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${projectStats.progress.checklists}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floors */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layers size={20} />
              Floors ({project.floors?.length || 0})
            </CardTitle>
            {canManage && (
              <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsAddFloorModalOpen(true)}>
                Add Floor
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!project.floors || project.floors.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <Layers size={32} className="mx-auto mb-2 opacity-50" />
                <p>No floors added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {project.floors.map((floor) => (
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
                        <p className="text-caption text-text-secondary">
                          {floor._count.rooms} rooms
                        </p>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFloor(floor as Floor);
                          }}
                          className="p-2 rounded hover:bg-surface text-text-secondary hover:text-primary"
                          title="Edit floor"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingFloor(floor as Floor);
                          }}
                          className="p-2 rounded hover:bg-surface text-text-secondary hover:text-error"
                          title="Delete floor"
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

        {/* Team Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Team ({project.members?.length || 0})
            </CardTitle>
            {canManage && (
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<UserPlus size={16} />}
                onClick={() => setIsAddMemberModalOpen(true)}
              >
                Add
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!project.members || project.members.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p>No team members</p>
              </div>
            ) : (
              <div className="space-y-2">
                {project.members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-body-sm font-medium">
                        {(member.user?.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-body-sm font-medium text-text-primary">{member.user?.name || 'Unknown'}</p>
                        <p className="text-caption text-text-secondary">{member.role}</p>
                      </div>
                    </div>
                    {canManage && member.userId !== currentUser?.id && (
                      <button
                        onClick={() => removeMemberMutation.mutate(member.userId)}
                        className="p-1.5 rounded hover:bg-surface-hover text-text-tertiary hover:text-error"
                        title="Remove member"
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Floor Modal */}
      <AddFloorModal
        isOpen={isAddFloorModalOpen}
        onClose={() => setIsAddFloorModalOpen(false)}
        onSubmit={(data) => createFloorMutation.mutate({ ...data, projectId: id! })}
        isLoading={createFloorMutation.isPending}
        existingLevels={project.floors?.map(f => f.level) || []}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSubmit={({ userId, role }) => addMemberMutation.mutate({ userId, role })}
        isLoading={addMemberMutation.isPending}
        existingMemberIds={project.members?.map(m => m.userId) || []}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        onSubmit={(data) => updateProjectMutation.mutate(data)}
        isLoading={updateProjectMutation.isPending}
        project={project}
      />

      {/* Edit Floor Modal */}
      {editingFloor && (
        <EditFloorModal
          isOpen={!!editingFloor}
          onClose={() => setEditingFloor(null)}
          onSubmit={(data) => updateFloorMutation.mutate({ floorId: editingFloor.id, data })}
          isLoading={updateFloorMutation.isPending}
          floor={editingFloor}
        />
      )}

      {/* Delete Floor Confirmation Modal */}
      {deletingFloor && (
        <Modal
          isOpen={!!deletingFloor}
          onClose={() => setDeletingFloor(null)}
          title="Delete Floor"
          icon={<AlertTriangle size={18} />}
          size="sm"
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setDeletingFloor(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteFloorMutation.mutate(deletingFloor.id)}
                isLoading={deleteFloorMutation.isPending}
              >
                Delete Floor
              </Button>
            </ModalActions>
          }
        >
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-error" />
            </div>
            <p className="text-body text-text-primary mb-2">
              Are you sure you want to delete <strong>{deletingFloor.name}</strong>?
            </p>
            <p className="text-body-sm text-text-secondary">
              This will also delete all {deletingFloor._count?.rooms || 0} rooms and their assets.
              This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Add Member Modal
interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { userId: string; role: string }) => void;
  isLoading: boolean;
  existingMemberIds: string[];
}

function AddMemberModal({ isOpen, onClose, onSubmit, isLoading, existingMemberIds }: AddMemberModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('TECHNICIAN');

  // Fetch available users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
    enabled: isOpen,
  });

  const availableUsers = users.filter(u => !existingMemberIds.includes(u.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
      onSubmit({ userId: selectedUserId, role: selectedRole });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Team Member"
      icon={<UserPlus size={18} />}
      size="md"
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-member-form" isLoading={isLoading} disabled={!selectedUserId}>
            Add Member
          </Button>
        </ModalActions>
      }
    >
      <form id="add-member-form" onSubmit={handleSubmit} className="space-y-5">
        <ModalSection title="Select User" icon={<Users size={14} />}>
          <Select
            label="User"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            options={availableUsers.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))}
            placeholder="Choose a user..."
          />
          {availableUsers.length === 0 && (
            <p className="text-xs text-text-tertiary mt-2">
              All users are already members of this project.
            </p>
          )}
        </ModalSection>

        <ModalSection title="Project Role" icon={<UserPlus size={14} />}>
          <Select
            label="Role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={[
              { value: 'PM', label: 'Project Manager' },
              { value: 'TECHNICIAN', label: 'Technician' },
              { value: 'VIEWER', label: 'Viewer' },
            ]}
          />
        </ModalSection>
      </form>
    </Modal>
  );
}

// Add Floor Modal
interface AddFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; level: number; floorplanFile?: File }) => void;
  isLoading: boolean;
  existingLevels: number[];
}

function AddFloorModal({ isOpen, onClose, onSubmit, isLoading, existingLevels }: AddFloorModalProps) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState(0);
  const [floorplanFile, setFloorplanFile] = useState<File | null>(null);
  const [floorplanPreview, setFloorplanPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-suggest next level
  const suggestedLevel = existingLevels.length > 0
    ? Math.max(...existingLevels) + 1
    : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFloorplanFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFloorplanPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setFloorplanPreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setFloorplanFile(null);
    setFloorplanPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, level, floorplanFile: floorplanFile || undefined });
    setName('');
    setLevel(suggestedLevel);
    setFloorplanFile(null);
    setFloorplanPreview(null);
  };

  const handleClose = () => {
    setName('');
    setLevel(suggestedLevel);
    setFloorplanFile(null);
    setFloorplanPreview(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Floor"
      icon={<Layers size={18} />}
      size="md"
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-floor-form" isLoading={isLoading}>
            Add Floor
          </Button>
        </ModalActions>
      }
    >
      <form id="add-floor-form" onSubmit={handleSubmit} className="space-y-5">
        <ModalSection title="Floor Details" icon={<Layers size={14} />}>
          <div className="space-y-4">
            <Input
              label="Floor Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ground Floor, 1st Floor, Basement..."
              required
              leftIcon={<Layers size={16} />}
            />
            <Input
              type="number"
              label="Level Number"
              value={level.toString()}
              onChange={(e) => setLevel(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
            <p className="text-xs text-text-tertiary">
              Use negative numbers for basement levels (e.g., -1, -2)
            </p>
          </div>
        </ModalSection>

        <ModalSection title="Floor Plan (Optional)" icon={<Image size={14} />}>
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.dwg"
              onChange={handleFileChange}
              className="hidden"
              id="floorplan-upload"
            />

            {!floorplanFile ? (
              <label
                htmlFor="floorplan-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-surface-border rounded-lg cursor-pointer hover:bg-surface-hover transition-colors"
              >
                <Upload size={24} className="text-text-tertiary mb-2" />
                <span className="text-body-sm text-text-secondary">Click to upload floor plan</span>
                <span className="text-caption text-text-tertiary mt-1">PNG, JPG, PDF or DWG</span>
              </label>
            ) : (
              <div className="relative border border-surface-border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  {floorplanPreview ? (
                    <img
                      src={floorplanPreview}
                      alt="Floor plan preview"
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-surface-secondary rounded flex items-center justify-center">
                      <FileText size={24} className="text-text-tertiary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm text-text-primary truncate">{floorplanFile.name}</p>
                    <p className="text-caption text-text-tertiary">
                      {(floorplanFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded hover:bg-surface-hover text-text-secondary"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </ModalSection>
      </form>
    </Modal>
  );
}

// Edit Project Modal
interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateProjectData) => void;
  isLoading: boolean;
  project: {
    name: string;
    description?: string;
    clientName: string;
    location?: string;
    status: ProjectStatus;
    startDate?: string;
    endDate?: string;
  };
}

function EditProjectModal({ isOpen, onClose, onSubmit, isLoading, project }: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    clientName: project.clientName,
    location: project.location || '',
    status: project.status,
    startDate: project.startDate ? project.startDate.split('T')[0] : '',
    endDate: project.endDate ? project.endDate.split('T')[0] : '',
  });

  // Update form when project changes
  if (isOpen && formData.name !== project.name) {
    setFormData({
      name: project.name,
      description: project.description || '',
      clientName: project.clientName,
      location: project.location || '',
      status: project.status,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      description: formData.description || undefined,
      clientName: formData.clientName,
      location: formData.location || undefined,
      status: formData.status,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    });
  };

  const statusOptions = [
    { value: 'PLANNING', label: 'Planning' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'ON_HOLD', label: 'On Hold' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Project"
      icon={<Pencil size={18} />}
      size="md"
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-project-form" isLoading={isLoading}>
            Save Changes
          </Button>
        </ModalActions>
      }
    >
      <form id="edit-project-form" onSubmit={handleSubmit} className="space-y-5">
        <ModalSection title="Project Details" icon={<Building2 size={14} />}>
          <div className="space-y-4">
            <Input
              label="Project Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Client Name"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              required
              leftIcon={<Building2 size={16} />}
            />
            <Input
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              leftIcon={<MapPin size={16} />}
            />
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </ModalSection>

        <ModalSection title="Status & Timeline" icon={<Calendar size={14} />}>
          <div className="space-y-4">
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              options={statusOptions}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Start Date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                max={formData.endDate || undefined}
              />
              <Input
                type="date"
                label="End Date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate || undefined}
              />
            </div>
          </div>
        </ModalSection>
      </form>
    </Modal>
  );
}

// Edit Floor Modal
interface EditFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateFloorData) => void;
  isLoading: boolean;
  floor: Floor;
}

function EditFloorModal({ isOpen, onClose, onSubmit, isLoading, floor }: EditFloorModalProps) {
  const [formData, setFormData] = useState({
    name: floor.name,
    level: floor.level,
  });

  // Update form when floor changes
  if (isOpen && formData.name !== floor.name) {
    setFormData({
      name: floor.name,
      level: floor.level,
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      level: formData.level,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Floor"
      icon={<Pencil size={18} />}
      size="md"
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-floor-form" isLoading={isLoading}>
            Save Changes
          </Button>
        </ModalActions>
      }
    >
      <form id="edit-floor-form" onSubmit={handleSubmit} className="space-y-5">
        <ModalSection title="Floor Details" icon={<Layers size={14} />}>
          <div className="space-y-4">
            <Input
              label="Floor Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ground Floor, 1st Floor, Basement..."
              required
              leftIcon={<Layers size={16} />}
            />
            <Input
              type="number"
              label="Level Number"
              value={formData.level.toString()}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-text-tertiary">
              Use negative numbers for basement levels (e.g., -1, -2)
            </p>
          </div>
        </ModalSection>
      </form>
    </Modal>
  );
}
