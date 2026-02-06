import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  FolderKanban,
  MapPin,
  Users,
  Layers,
  AlertTriangle,
  Calendar,
  Building2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Modal,
  ModalSection,
  ModalActions,
  Input,
  DateInput,
  Textarea,
  Select,
} from '@/components/ui';
import { projectService, type Project, type CreateProjectData, type UpdateProjectData, type ProjectStatus } from '@/services/project.service';
import { clientService, type Client } from '@/services/client.service';
import { useAuthStore } from '@/stores/auth.store';
import { useSearchStore } from '@/stores/search.store';

const statusOptions = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const statusBadgeVariants: Record<ProjectStatus, 'info' | 'primary' | 'warning' | 'success' | 'default'> = {
  PLANNING: 'info',
  IN_PROGRESS: 'primary',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  ARCHIVED: 'default',
};

export function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canManage = user?.role === 'ADMIN' || user?.role === 'PM';

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);
  const { query: searchQuery } = useSearchStore();

  // Fetch projects
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.clientName.toLowerCase().includes(query) ||
      project.location?.toLowerCase().includes(query) ||
      project.status.toLowerCase().includes(query)
    );
  });

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: projectService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateModalOpen(false);
      toast.success('Project created successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create project');
    },
  });

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      projectService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingProject(null);
      toast.success('Project updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update project');
    },
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: projectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteConfirmProject(null);
      toast.success('Project deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete project');
    },
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-error">Failed to load projects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1">Projects</h1>
            <p className="text-body text-text-secondary mt-1">
              Manage your ICT installation projects
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={18} />}>
              New Project
            </Button>
          )}
        </div>

      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban size={48} className="mx-auto text-text-tertiary mb-4" />
            <h3 className="text-h3 text-text-primary mb-2">No projects yet</h3>
            <p className="text-body text-text-secondary mb-4">
              Create your first project to get started
            </p>
            {canManage && (
              <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={18} />}>
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search size={48} className="mx-auto text-text-tertiary mb-4" />
            <h3 className="text-h3 text-text-primary mb-2">No results found</h3>
            <p className="text-body text-text-secondary">
              No projects match "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-body font-semibold text-text-primary truncate">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-text-secondary">
                      <Building2 size={14} />
                      <span className="text-body-sm truncate">{project.clientName}</span>
                    </div>
                  </div>
                  <Badge variant={statusBadgeVariants[project.status]} size="sm">
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Location */}
                {project.location && (
                  <div className="flex items-center gap-1.5 text-text-tertiary mb-3">
                    <MapPin size={14} />
                    <span className="text-caption truncate">{project.location}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-caption text-text-secondary mb-3">
                  <div className="flex items-center gap-1">
                    <Layers size={14} />
                    <span>{project._count?.buildings || 0} buildings</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{project._count?.members || 0} members</span>
                  </div>
                  {(project._count?.issues || 0) > 0 && (
                    <div className="flex items-center gap-1 text-warning">
                      <AlertTriangle size={14} />
                      <span>{project._count?.issues} issues</span>
                    </div>
                  )}
                </div>

                {/* Dates */}
                {project.startDate && (
                  <div className="flex items-center gap-1.5 text-caption text-text-tertiary">
                    <Calendar size={14} />
                    <span>
                      {new Date(project.startDate).toLocaleDateString()}
                      {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString()}`}
                    </span>
                  </div>
                )}

                {/* Actions */}
                {canManage && (
                  <div className="flex items-center gap-1 mt-4 pt-3 border-t border-surface-border">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                      }}
                      className="p-2 rounded hover:bg-surface-hover text-text-secondary"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmProject(project);
                        }}
                        className="p-2 rounded hover:bg-surface-hover text-error"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data as CreateProjectData)}
        isLoading={createMutation.isPending}
        title="Create New Project"
      />

      {/* Edit Project Modal */}
      {editingProject && (
        <ProjectFormModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editingProject.id, data })}
          isLoading={updateMutation.isPending}
          title="Edit Project"
          initialData={editingProject}
          showStatus
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProject && (
        <Modal
          isOpen={!!deleteConfirmProject}
          onClose={() => setDeleteConfirmProject(null)}
          title="Delete Project"
          icon={<AlertTriangle size={18} />}
          size="sm"
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setDeleteConfirmProject(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(deleteConfirmProject.id)}
                isLoading={deleteMutation.isPending}
              >
                Delete Project
              </Button>
            </ModalActions>
          }
        >
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-error" />
            </div>
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete <strong className="text-text-primary">{deleteConfirmProject.name}</strong>?
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              This will also delete all floors, rooms, assets, and related data. This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Project Form Modal Component
interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectData | UpdateProjectData) => void;
  isLoading: boolean;
  title: string;
  initialData?: Project;
  showStatus?: boolean;
}

function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  title,
  initialData,
  showStatus,
}: ProjectFormModalProps) {
  const [formData, setFormData] = useState<CreateProjectData & { status?: ProjectStatus }>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    clientName: initialData?.clientName || '',
    clientId: initialData?.clientId || '',
    location: initialData?.location || '',
    startDate: initialData?.startDate ? initialData.startDate.split('T')[0] : '',
    endDate: initialData?.endDate ? initialData.endDate.split('T')[0] : '',
    status: initialData?.status,
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll(),
    enabled: isOpen,
  });

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    if (clientId) {
      const selectedClient = clients.find((c: Client) => c.id === clientId);
      setFormData({
        ...formData,
        clientId,
        clientName: selectedClient?.name || '',
      });
    } else {
      setFormData({ ...formData, clientId: '', clientName: '' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateProjectData & { status?: ProjectStatus } = {
      name: formData.name,
      clientName: formData.clientName,
      clientId: formData.clientId || undefined,
      description: formData.description || undefined,
      location: formData.location || undefined,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    };
    if (showStatus && formData.status) {
      data.status = formData.status;
    }
    onSubmit(data);
  };

  // Build client options
  const clientOptions = [
    { value: '', label: 'Select a client...' },
    ...clients.map((c: Client) => ({ value: c.id, label: c.name })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<FolderKanban size={18} />}
      size="lg"
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" isLoading={isLoading}>
            {initialData ? 'Save Changes' : 'Create Project'}
          </Button>
        </ModalActions>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-5">
        <ModalSection title="Project Information" icon={<FolderKanban size={14} />}>
          <div className="space-y-4">
            <Input
              label="Project Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Hotel Astoria - ICT Infrastructure"
              required
              leftIcon={<FolderKanban size={16} />}
            />
            <Select
              label="Client"
              value={formData.clientId || ''}
              onChange={handleClientChange}
              options={clientOptions}
              required
            />
            {!formData.clientId && (
              <Input
                label="Client Name (manual)"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Type client name if not in list"
                required={!formData.clientId}
                leftIcon={<Building2 size={16} />}
              />
            )}
            <Input
              label="Location"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Athens, Greece"
              leftIcon={<MapPin size={16} />}
            />
            <Textarea
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project description..."
              minRows={2}
              maxRows={6}
            />
          </div>
        </ModalSection>

        <ModalSection title="Schedule" icon={<Calendar size={14} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateInput
              label="Start Date"
              value={formData.startDate || ''}
              onChange={(value) => setFormData({ ...formData, startDate: value })}
            />
            <DateInput
              label="End Date"
              value={formData.endDate || ''}
              onChange={(value) => setFormData({ ...formData, endDate: value })}
            />
          </div>
        </ModalSection>

        {showStatus && (
          <ModalSection title="Status" icon={<AlertTriangle size={14} />}>
            <Select
              label="Project Status"
              value={formData.status || 'PLANNING'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              options={statusOptions}
            />
          </ModalSection>
        )}
      </form>
    </Modal>
  );
}
