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
  Trash2,
  Lock,
  Unlock,
  Map,
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
  Select,
  Input,
  DateInput,
} from '@/components/ui';
import { projectService, type ProjectStatus, type UpdateProjectData } from '@/services/project.service';
import { userService } from '@/services/user.service';
import { buildingService, type CreateBuildingData, type UpdateBuildingData, type Building } from '@/services/building.service';
import { reportService } from '@/services/report.service';
import { uploadService } from '@/services/upload.service';
import { useAuthStore } from '@/stores/auth.store';
import { FloorPlanCanvas, DownloadFloorplanModal } from '@/components/floor-plan';

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
  const [isAddBuildingModalOpen, setIsAddBuildingModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null);

  // Masterplan state
  const [showMasterplan, setShowMasterplan] = useState(true);
  const [isMasterplanEditMode, setIsMasterplanEditMode] = useState(false);
  const [isUploadingMasterplan, setIsUploadingMasterplan] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [isMasterplanFullScreenOpen, setIsMasterplanFullScreenOpen] = useState(false);
  const [isDownloadMasterplanModalOpen, setIsDownloadMasterplanModalOpen] = useState(false);
  const [pendingBuildingPinPosition, setPendingBuildingPinPosition] = useState<{ x: number; y: number } | null>(null);
  const masterplanInputRef = useRef<HTMLInputElement>(null);

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

  // Create building mutation
  const createBuildingMutation = useMutation({
    mutationFn: async (data: CreateBuildingData & { pinX?: number; pinY?: number }) => {
      const { pinX, pinY, ...buildingData } = data;
      // First create the building
      const newBuilding = await buildingService.create(id!, buildingData);

      // If pin position was provided, update it
      if (pinX !== undefined && pinY !== undefined && newBuilding.id) {
        await buildingService.updatePosition(newBuilding.id, pinX, pinY);
      }

      return newBuilding;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setIsAddBuildingModalOpen(false);
      setPendingBuildingPinPosition(null);
      toast.success('Building created successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create building');
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

  // Update building mutation
  const updateBuildingMutation = useMutation({
    mutationFn: ({ buildingId, data }: { buildingId: string; data: UpdateBuildingData }) =>
      buildingService.update(buildingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setEditingBuilding(null);
      toast.success('Building updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update building');
    },
  });

  // Delete building mutation
  const deleteBuildingMutation = useMutation({
    mutationFn: (buildingId: string) => buildingService.delete(buildingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setDeletingBuilding(null);
      toast.success('Building deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete building');
    },
  });

  // Update building position mutation (for masterplan pins)
  const updateBuildingPositionMutation = useMutation({
    mutationFn: ({ buildingId, pinX, pinY }: { buildingId: string; pinX: number | null; pinY: number | null }) =>
      buildingService.updatePosition(buildingId, pinX, pinY),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update building position');
    },
  });

  // Handle masterplan upload
  const handleMasterplanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setIsUploadingMasterplan(true);
    try {
      await uploadService.uploadMasterplan(id, file);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Masterplan uploaded successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload masterplan');
    } finally {
      setIsUploadingMasterplan(false);
      if (masterplanInputRef.current) {
        masterplanInputRef.current.value = '';
      }
    }
  };

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

      {/* Masterplan Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Map size={20} />
            Master Plan
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Hidden file input for masterplan upload */}
            <input
              ref={masterplanInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleMasterplanUpload}
              className="hidden"
            />
            {project.masterplanUrl && project.masterplanType !== 'PDF' && canManage && isMasterplanEditMode && (
              <>
                {(project.buildings || []).filter(b => b.pinX === null || b.pinY === null).length > 0 && (
                  <span className="text-caption text-text-secondary">
                    {(project.buildings || []).filter(b => b.pinX === null || b.pinY === null).length} buildings to place
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
                onClick={() => masterplanInputRef.current?.click()}
                isLoading={isUploadingMasterplan}
              >
                {project.masterplanUrl ? 'Change' : 'Upload'}
              </Button>
            )}
            {project.masterplanUrl && project.masterplanType !== 'PDF' && (
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Download size={16} />}
                onClick={() => setIsDownloadMasterplanModalOpen(true)}
              >
                Download
              </Button>
            )}
            {project.masterplanUrl && project.masterplanType !== 'PDF' && canManage && (
              <Button
                size="sm"
                variant={isMasterplanEditMode ? 'primary' : 'secondary'}
                leftIcon={isMasterplanEditMode ? <Unlock size={16} /> : <Lock size={16} />}
                onClick={() => setIsMasterplanEditMode(!isMasterplanEditMode)}
              >
                {isMasterplanEditMode ? 'Editing' : 'Edit Pins'}
              </Button>
            )}
            {project.masterplanUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMasterplan(!showMasterplan)}
              >
                {showMasterplan ? 'Hide' : 'Show'}
              </Button>
            )}
          </div>
        </CardHeader>
        {project.masterplanUrl ? (
          showMasterplan && (
            <CardContent>
              {project.masterplanType === 'PDF' ? (
                <div className="text-center py-8 bg-surface-secondary rounded-lg">
                  <p className="text-text-secondary mb-4">PDF masterplan uploaded</p>
                  <a
                    href={project.masterplanUrl}
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
                    imageUrl={project.masterplanUrl}
                    pins={(project.buildings || [])
                      .filter((building) => building.pinX !== null && building.pinY !== null)
                      .map((building) => ({
                        id: building.id,
                        x: building.pinX!,
                        y: building.pinY!,
                        name: building.name,
                        status: 'IN_PROGRESS' as const, // Use blue for building pins
                      }))}
                    availableItems={isMasterplanEditMode ? (project.buildings || [])
                      .filter((building) => building.pinX === null || building.pinY === null)
                      .map((building) => ({
                        id: building.id,
                        name: building.name,
                      })) : []}
                    selectedPinId={selectedBuildingId}
                    isEditable={isMasterplanEditMode}
                    showLegend={false}
                    onPinClick={(pin) => {
                      setSelectedBuildingId(pin.id);
                      navigate(`/buildings/${pin.id}`);
                    }}
                    onPinMove={(pinId, x, y) => {
                      updateBuildingPositionMutation.mutate({
                        buildingId: pinId,
                        pinX: Math.round(x),
                        pinY: Math.round(y),
                      });
                    }}
                    onPlaceItem={(buildingId, x, y) => {
                      updateBuildingPositionMutation.mutate({
                        buildingId,
                        pinX: Math.round(x),
                        pinY: Math.round(y),
                      });
                      toast.success('Building placed on masterplan');
                    }}
                    onAddPin={(x, y) => {
                      setPendingBuildingPinPosition({ x: Math.round(x), y: Math.round(y) });
                      setIsAddBuildingModalOpen(true);
                    }}
                    onMaximize={() => setIsMasterplanFullScreenOpen(true)}
                  />
                </div>
              )}
            </CardContent>
          )
        ) : (
          <CardContent className="py-12 text-center">
            <Image size={48} className="mx-auto text-text-tertiary mb-4" />
            <h3 className="text-h3 text-text-primary mb-2">No Master Plan</h3>
            <p className="text-body text-text-secondary mb-4">
              Upload a master plan to visualize floor locations
            </p>
            {canManage && (
              <Button
                variant="secondary"
                leftIcon={<Upload size={18} />}
                onClick={() => masterplanInputRef.current?.click()}
                isLoading={isUploadingMasterplan}
              >
                Upload Master Plan
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buildings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 size={20} />
              Buildings ({project.buildings?.length || 0})
            </CardTitle>
            {canManage && (
              <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsAddBuildingModalOpen(true)}>
                Add Building
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!project.buildings || project.buildings.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <Building2 size={32} className="mx-auto mb-2 opacity-50" />
                <p>No buildings added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {project.buildings.map((building) => (
                  <div
                    key={building.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary hover:bg-surface-hover transition-colors cursor-pointer group"
                    onClick={() => navigate(`/buildings/${building.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-body font-medium text-text-primary">{building.name}</p>
                        <p className="text-caption text-text-secondary">
                          {building._count.floors} floors
                        </p>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBuilding(building as unknown as Building);
                          }}
                          className="p-2 rounded hover:bg-surface text-text-secondary hover:text-primary"
                          title="Edit building"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingBuilding(building as unknown as Building);
                          }}
                          className="p-2 rounded hover:bg-surface text-text-secondary hover:text-error"
                          title="Delete building"
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

      {/* Add Building Modal */}
      <AddBuildingModal
        isOpen={isAddBuildingModalOpen}
        onClose={() => {
          setIsAddBuildingModalOpen(false);
          setPendingBuildingPinPosition(null);
        }}
        onSubmit={(data) => createBuildingMutation.mutate(data)}
        isLoading={createBuildingMutation.isPending}
        pendingPinPosition={pendingBuildingPinPosition}
        nested
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

      {/* Edit Building Modal */}
      {editingBuilding && (
        <EditBuildingModal
          isOpen={!!editingBuilding}
          onClose={() => setEditingBuilding(null)}
          onSubmit={(data) => updateBuildingMutation.mutate({ buildingId: editingBuilding.id, data })}
          isLoading={updateBuildingMutation.isPending}
          building={editingBuilding}
        />
      )}

      {/* Delete Building Confirmation Modal */}
      {deletingBuilding && (
        <Modal
          isOpen={!!deletingBuilding}
          onClose={() => setDeletingBuilding(null)}
          title="Delete Building"
          icon={<AlertTriangle size={18} />}
          size="sm"
          nested
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setDeletingBuilding(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteBuildingMutation.mutate(deletingBuilding.id)}
                isLoading={deleteBuildingMutation.isPending}
              >
                Delete Building
              </Button>
            </ModalActions>
          }
        >
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-error" />
            </div>
            <p className="text-body text-text-primary mb-2">
              Are you sure you want to delete <strong>{deletingBuilding.name}</strong>?
            </p>
            <p className="text-body-sm text-text-secondary">
              This will also delete all floors, rooms and their assets.
              This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}

      {/* Full Screen Masterplan Modal */}
      {project.masterplanUrl && project.masterplanType !== 'PDF' && (
        <Modal
          isOpen={isMasterplanFullScreenOpen}
          onClose={() => setIsMasterplanFullScreenOpen(false)}
          title={`${project.name} - Master Plan`}
          icon={<Map size={18} />}
          size="full"
        >
          {/* Edit mode toggle in fullscreen */}
          {canManage && (
            <div className="flex items-center justify-end gap-2 mb-2 -mt-2">
              {isMasterplanEditMode && (
                <>
                  {(project.buildings || []).filter(b => b.pinX === null || b.pinY === null).length > 0 && (
                    <span className="text-caption text-text-secondary">
                      {(project.buildings || []).filter(b => b.pinX === null || b.pinY === null).length} buildings to place
                    </span>
                  )}
                  <Badge variant="info" size="sm">
                    Click to add | Drag to move
                  </Badge>
                </>
              )}
              <Button
                size="sm"
                variant={isMasterplanEditMode ? 'primary' : 'secondary'}
                leftIcon={isMasterplanEditMode ? <Unlock size={16} /> : <Lock size={16} />}
                onClick={() => setIsMasterplanEditMode(!isMasterplanEditMode)}
              >
                {isMasterplanEditMode ? 'Editing' : 'Edit Pins'}
              </Button>
            </div>
          )}
          <div className="h-[calc(95vh-120px)] -mx-6 -mb-6">
            <FloorPlanCanvas
              imageUrl={project.masterplanUrl}
              pins={(project.buildings || [])
                .filter((building) => building.pinX !== null && building.pinY !== null)
                .map((building) => ({
                  id: building.id,
                  x: building.pinX!,
                  y: building.pinY!,
                  name: building.name,
                  status: 'IN_PROGRESS' as const,
                }))}
              availableItems={isMasterplanEditMode ? (project.buildings || [])
                .filter((building) => building.pinX === null || building.pinY === null)
                .map((building) => ({
                  id: building.id,
                  name: building.name,
                })) : []}
              selectedPinId={selectedBuildingId}
              isEditable={isMasterplanEditMode}
              showMaximize={false}
              showLegend={false}
              onPinClick={(pin) => {
                setSelectedBuildingId(pin.id);
                navigate(`/buildings/${pin.id}`);
              }}
              onPinMove={(pinId, x, y) => {
                updateBuildingPositionMutation.mutate({
                  buildingId: pinId,
                  pinX: Math.round(x),
                  pinY: Math.round(y),
                });
              }}
              onPlaceItem={(buildingId, x, y) => {
                updateBuildingPositionMutation.mutate({
                  buildingId,
                  pinX: Math.round(x),
                  pinY: Math.round(y),
                });
                toast.success('Building placed on masterplan');
              }}
              onAddPin={(x, y) => {
                setPendingBuildingPinPosition({ x: Math.round(x), y: Math.round(y) });
                setIsAddBuildingModalOpen(true);
              }}
            />
          </div>
        </Modal>
      )}

      {/* Download Masterplan Modal */}
      {project.masterplanUrl && project.masterplanType !== 'PDF' && (
        <DownloadFloorplanModal
          isOpen={isDownloadMasterplanModalOpen}
          onClose={() => setIsDownloadMasterplanModalOpen(false)}
          imageUrl={project.masterplanUrl}
          fileName={`${project.name}-masterplan`}
          projectName={project.name}
          floorName="Master Plan"
          pins={(project.buildings || [])
            .filter((building) => building.pinX !== null && building.pinY !== null)
            .map((building) => ({
              id: building.id,
              name: building.name,
              x: building.pinX!,
              y: building.pinY!,
              status: 'IN_PROGRESS' as const,
            }))}
          pinType="building"
        />
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

// Add Building Modal
interface AddBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; pinX?: number; pinY?: number }) => void;
  isLoading: boolean;
  pendingPinPosition?: { x: number; y: number } | null;
  nested?: boolean;
}

function AddBuildingModal({ isOpen, onClose, onSubmit, isLoading, pendingPinPosition, nested }: AddBuildingModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
      pinX: pendingPinPosition?.x,
      pinY: pendingPinPosition?.y,
    });
    setName('');
    setDescription('');
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Building"
      icon={<Building2 size={18} />}
      size="md"
      nested={nested}
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-building-form" isLoading={isLoading}>
            Add Building
          </Button>
        </ModalActions>
      }
    >
      <form id="add-building-form" onSubmit={handleSubmit} className="space-y-5">
        <ModalSection title="Building Details" icon={<Building2 size={14} />}>
          <div className="space-y-4">
            <Input
              label="Building Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Building, Building A, Wing B..."
              required
              leftIcon={<Building2 size={16} />}
            />
            <Input
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this building..."
            />
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
              <DateInput
                label="Start Date"
                value={formData.startDate}
                onChange={(value) => setFormData({ ...formData, startDate: value })}
              />
              <DateInput
                label="End Date"
                value={formData.endDate}
                onChange={(value) => setFormData({ ...formData, endDate: value })}
              />
            </div>
          </div>
        </ModalSection>
      </form>
    </Modal>
  );
}

// Edit Building Modal
interface EditBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateBuildingData) => void;
  isLoading: boolean;
  building: Building;
}

function EditBuildingModal({ isOpen, onClose, onSubmit, isLoading, building }: EditBuildingModalProps) {
  const [formData, setFormData] = useState({
    name: building.name,
    description: building.description || '',
  });

  // Update form when building changes
  if (isOpen && formData.name !== building.name) {
    setFormData({
      name: building.name,
      description: building.description || '',
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      description: formData.description || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Building"
      icon={<Pencil size={18} />}
      size="md"
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-building-form" isLoading={isLoading}>
            Save Changes
          </Button>
        </ModalActions>
      }
    >
      <form id="edit-building-form" onSubmit={handleSubmit} className="space-y-5">
        <ModalSection title="Building Details" icon={<Building2 size={14} />}>
          <div className="space-y-4">
            <Input
              label="Building Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Main Building, Building A, Wing B..."
              required
              leftIcon={<Building2 size={16} />}
            />
            <Input
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this building..."
            />
          </div>
        </ModalSection>
      </form>
    </Modal>
  );
}
