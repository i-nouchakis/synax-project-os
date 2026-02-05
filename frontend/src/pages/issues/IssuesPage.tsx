import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Search,
  Plus,
  Building2,
  MapPin,
  MessageSquare,
  Camera,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Loader2,
  FileText,
  Info,
  Send,
  Play,
  CheckCheck,
  RotateCcw,
  Image,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Select,
  Badge,
  Button,
  Modal,
  ModalSection,
  ModalInfoRow,
  ModalActions,
  Pagination,
  usePagination,
} from '@/components/ui';
import {
  issueService,
  type Issue,
  type IssuePriority,
  type IssueStatus,
  type CreateIssueData,
  priorityLabels,
  statusLabels,
  priorityColors,
  statusColors,
} from '@/services/issue.service';
import { projectService } from '@/services/project.service';
import { issueCauseService } from '@/services/lookup.service';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const priorityFormOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export function IssuesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Fetch issues
  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues', statusFilter, priorityFilter],
    queryFn: () =>
      issueService.getAll({
        status: statusFilter as IssueStatus || undefined,
        priority: priorityFilter as IssuePriority || undefined,
      }),
  });

  // Fetch projects for create modal
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
  });

  // Fetch issue causes for create modal
  const { data: issueCausesData } = useQuery({
    queryKey: ['lookups', 'issue-causes'],
    queryFn: () => issueCauseService.getAll(),
  });
  const issueCauseOptions = [
    { value: '', label: 'Select cause (optional)' },
    ...(issueCausesData?.items?.map((c) => ({ value: c.name, label: c.name })) || []),
  ];

  // Create issue mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateIssueData) => issueService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      setIsCreateModalOpen(false);
      toast.success('Issue created');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create issue');
    },
  });

  // Update issue mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: IssueStatus } }) =>
      issueService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issue updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update issue');
    },
  });

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      issue.title.toLowerCase().includes(searchLower) ||
      issue.description?.toLowerCase().includes(searchLower) ||
      issue.project?.name.toLowerCase().includes(searchLower) ||
      issue.room?.name?.toLowerCase().includes(searchLower) ||
      issue.causedBy?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedIssues,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(filteredIssues || issues, 25);

  // Stats
  const stats = {
    total: issues.length,
    open: issues.filter((i) => i.status === 'OPEN').length,
    inProgress: issues.filter((i) => i.status === 'IN_PROGRESS').length,
    resolved: issues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length,
    critical: issues.filter((i) => i.priority === 'CRITICAL' && i.status !== 'CLOSED').length,
  };

  // Handle create
  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      projectId: formData.get('projectId') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      causedBy: formData.get('causedBy') as string || undefined,
      priority: formData.get('priority') as IssuePriority || 'MEDIUM',
    });
  };

  // Handle status change
  const handleStatusChange = (issue: Issue, newStatus: IssueStatus) => {
    updateMutation.mutate({ id: issue.id, data: { status: newStatus } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Issues</h1>
          <p className="text-body text-text-secondary">
            Track and manage project issues
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus size={18} />}
        >
          Report Issue
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle size={18} className="text-text-secondary" />
              <span className="text-h2 text-text-primary">{stats.total}</span>
            </div>
            <p className="text-caption text-text-secondary">Total Issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle size={18} className="text-error" />
              <span className="text-h2 text-error">{stats.open}</span>
            </div>
            <p className="text-caption text-text-secondary">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock size={18} className="text-primary" />
              <span className="text-h2 text-primary">{stats.inProgress}</span>
            </div>
            <p className="text-caption text-text-secondary">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle2 size={18} className="text-success" />
              <span className="text-h2 text-success">{stats.resolved}</span>
            </div>
            <p className="text-caption text-text-secondary">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle size={18} className="text-error" />
              <span className="text-h2 text-error">{stats.critical}</span>
            </div>
            <p className="text-caption text-text-secondary">Critical</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={priorityOptions}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Issues List */}
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={20} />
              Issues ({filteredIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredIssues.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-h3 text-text-primary mb-2">No issues found</h3>
                <p className="text-body">
                  {search || statusFilter || priorityFilter
                    ? 'Try adjusting your filters'
                    : 'No issues reported yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {paginatedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 hover:bg-surface-hover transition-colors cursor-pointer"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={priorityColors[issue.priority] as any}
                            size="sm"
                          >
                            {priorityLabels[issue.priority]}
                          </Badge>
                          <Badge
                            variant={statusColors[issue.status] as any}
                            size="sm"
                          >
                            {statusLabels[issue.status]}
                          </Badge>
                        </div>
                        <h3 className="text-body font-medium text-text-primary mb-1">
                          {issue.title}
                        </h3>
                        {issue.description && (
                          <p className="text-body-sm text-text-secondary line-clamp-2 mb-2">
                            {issue.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-caption text-text-tertiary">
                          <div className="flex items-center gap-1">
                            <Building2 size={12} />
                            <span>{issue.project?.name}</span>
                          </div>
                          {issue.room && (
                            <div className="flex items-center gap-1">
                              <MapPin size={12} />
                              <span>{issue.room.floor?.name} / {issue.room.name}</span>
                            </div>
                          )}
                          {issue.causedBy && (
                            <div className="flex items-center gap-1">
                              <User size={12} />
                              <span>Caused by: {issue.causedBy}</span>
                            </div>
                          )}
                          {(issue._count?.comments || 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare size={12} />
                              <span>{issue._count?.comments} comments</span>
                            </div>
                          )}
                          {(issue.photos?.length || 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Camera size={12} />
                              <span>{issue.photos?.length} photos</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-caption text-text-tertiary">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                        {issue.status === 'OPEN' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(issue, 'IN_PROGRESS');
                            }}
                          >
                            Start
                          </Button>
                        )}
                        {issue.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(issue, 'RESOLVED');
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </>

      {/* Create Modal */}
      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={projects}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
        issueCauseOptions={issueCauseOptions}
      />

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
}

/* ========================================
   Create Issue Modal
   ======================================== */

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: { id: string; name: string }[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  issueCauseOptions: { value: string; label: string }[];
}

function CreateIssueModal({ isOpen, onClose, projects, onSubmit, isLoading, issueCauseOptions }: CreateIssueModalProps) {
  const queryClient = useQueryClient();
  const [isAddCauseOpen, setIsAddCauseOpen] = useState(false);
  const [newCauseName, setNewCauseName] = useState('');
  const [selectedCause, setSelectedCause] = useState('');

  // Create issue cause mutation
  const createCauseMutation = useMutation({
    mutationFn: (name: string) => issueCauseService.create({ name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lookups', 'issue-causes'] });
      setSelectedCause(data.item.name);
      setNewCauseName('');
      setIsAddCauseOpen(false);
      toast.success(`Issue cause "${data.item.name}" created`);
    },
    onError: () => {
      toast.error('Failed to create issue cause');
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Issue"
      icon={<AlertTriangle size={18} />}
      size="md"
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-issue-form" isLoading={isLoading}>
            Create Issue
          </Button>
        </ModalActions>
      }
    >
      <form id="create-issue-form" onSubmit={onSubmit} className="space-y-5">
        {/* Basic Info Section */}
        <ModalSection title="Basic Information" icon={<Info size={14} />}>
          <div className="space-y-4">
            <Select
              label="Project"
              name="projectId"
              required
              options={[
                { value: '', label: 'Select project...' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <Input
              label="Issue Title"
              name="title"
              required
              placeholder="Brief description of the issue"
            />
            <Select
              label="Priority"
              name="priority"
              options={priorityFormOptions}
              defaultValue="MEDIUM"
            />
          </div>
        </ModalSection>

        {/* Details Section */}
        <ModalSection title="Details" icon={<FileText size={14} />}>
          <div className="space-y-4">
            <Textarea
              label="Description"
              name="description"
              placeholder="Provide detailed information about the issue..."
              minRows={3}
              maxRows={8}
            />
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select
                  label="Caused By (Optional)"
                  name="causedBy"
                  value={selectedCause}
                  onChange={(e) => setSelectedCause(e.target.value)}
                  options={issueCauseOptions}
                />
              </div>
              <button
                type="button"
                onClick={() => setIsAddCauseOpen(true)}
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-surface-border bg-surface-secondary hover:bg-surface-hover text-text-secondary hover:text-primary transition-colors"
                title="Add new issue cause"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </ModalSection>
      </form>

      {/* Add Issue Cause Mini Modal */}
      {isAddCauseOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsAddCauseOpen(false)} />
          <div className="relative bg-surface rounded-lg shadow-xl border border-surface-border p-6 w-full max-w-sm mx-4">
            <h3 className="text-h4 text-text-primary mb-4">Add New Issue Cause</h3>
            <Input
              label="Cause Name"
              value={newCauseName}
              onChange={(e) => setNewCauseName(e.target.value)}
              placeholder="e.g., Third Party Delay"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsAddCauseOpen(false);
                  setNewCauseName('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createCauseMutation.mutate(newCauseName)}
                isLoading={createCauseMutation.isPending}
                disabled={!newCauseName.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ========================================
   Issue Detail Modal
   ======================================== */

function IssueDetailModal({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  // Fetch full issue details
  const { data: fullIssue, isLoading } = useQuery({
    queryKey: ['issue', issue.id],
    queryFn: () => issueService.getById(issue.id),
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (comment: string) => issueService.addComment(issue.id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issue.id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      setNewComment('');
      toast.success('Comment added');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add comment');
    },
  });

  // Update status mutation
  const updateMutation = useMutation({
    mutationFn: (status: IssueStatus) => issueService.update(issue.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issue.id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Status updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update status');
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const displayIssue = fullIssue || issue;

  // Get status action button
  const getStatusAction = () => {
    switch (displayIssue.status) {
      case 'OPEN':
        return {
          label: 'Start Working',
          icon: <Play size={16} />,
          status: 'IN_PROGRESS' as IssueStatus,
          variant: 'default' as const,
        };
      case 'IN_PROGRESS':
        return {
          label: 'Mark Resolved',
          icon: <CheckCheck size={16} />,
          status: 'RESOLVED' as IssueStatus,
          variant: 'default' as const,
        };
      case 'RESOLVED':
        return {
          label: 'Close Issue',
          icon: <CheckCircle2 size={16} />,
          status: 'CLOSED' as IssueStatus,
          variant: 'default' as const,
        };
      default:
        return null;
    }
  };

  const statusAction = getStatusAction();
  const canReopen = displayIssue.status === 'RESOLVED' || displayIssue.status === 'CLOSED';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={displayIssue.title}
      icon={<AlertTriangle size={18} />}
      size="lg"
      footer={
        <div className="flex items-center justify-between">
          {/* Add Comment - Left side */}
          <form onSubmit={handleSubmitComment} className="flex-1 flex gap-2 mr-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 bg-background border border-surface-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              isLoading={addCommentMutation.isPending}
              disabled={!newComment.trim()}
              leftIcon={<Send size={14} />}
            >
              Send
            </Button>
          </form>

          {/* Status Actions - Right side */}
          <div className="flex gap-2 shrink-0">
            {canReopen && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => updateMutation.mutate('OPEN')}
                isLoading={updateMutation.isPending}
                leftIcon={<RotateCcw size={14} />}
              >
                Reopen
              </Button>
            )}
            {statusAction && (
              <Button
                size="sm"
                onClick={() => updateMutation.mutate(statusAction.status)}
                isLoading={updateMutation.isPending}
                leftIcon={statusAction.icon}
              >
                {statusAction.label}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Status Bar */}
          <div className="flex items-center gap-2">
            <Badge variant={priorityColors[displayIssue.priority] as any}>
              {priorityLabels[displayIssue.priority]} Priority
            </Badge>
            <Badge variant={statusColors[displayIssue.status] as any}>
              {statusLabels[displayIssue.status]}
            </Badge>
          </div>

          {/* Description */}
          {displayIssue.description && (
            <ModalSection title="Description" icon={<FileText size={14} />}>
              <p className="text-sm text-text-primary leading-relaxed">
                {displayIssue.description}
              </p>
            </ModalSection>
          )}

          {/* Issue Details */}
          <ModalSection title="Details" icon={<Info size={14} />}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <ModalInfoRow
                label="Project"
                value={displayIssue.project?.name}
                icon={<Building2 size={14} />}
              />
              <ModalInfoRow
                label="Location"
                value={displayIssue.room ? `${displayIssue.room.floor?.name} / ${displayIssue.room.name}` : null}
                icon={<MapPin size={14} />}
              />
              <ModalInfoRow
                label="Caused By"
                value={displayIssue.causedBy}
                icon={<User size={14} />}
              />
              <ModalInfoRow
                label="Reported By"
                value={displayIssue.createdBy?.name}
                icon={<User size={14} />}
              />
              <ModalInfoRow
                label="Created"
                value={new Date(displayIssue.createdAt).toLocaleString()}
                icon={<Clock size={14} />}
              />
              {displayIssue.resolvedAt && (
                <ModalInfoRow
                  label="Resolved"
                  value={new Date(displayIssue.resolvedAt).toLocaleString()}
                  icon={<CheckCircle2 size={14} />}
                />
              )}
            </div>
          </ModalSection>

          {/* Photos */}
          {displayIssue.photos && displayIssue.photos.length > 0 && (
            <ModalSection title={`Photos (${displayIssue.photos.length})`} icon={<Image size={14} />}>
              <div className="grid grid-cols-3 gap-2">
                {displayIssue.photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.photoUrl}
                    alt={photo.caption || 'Issue photo'}
                    className="w-full aspect-video object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            </ModalSection>
          )}

          {/* Comments */}
          <ModalSection
            title={`Comments (${displayIssue.comments?.length || 0})`}
            icon={<MessageSquare size={14} />}
            noPadding
          >
            <div className="max-h-60 overflow-y-auto">
              {displayIssue.comments && displayIssue.comments.length > 0 ? (
                <div className="divide-y divide-surface-border">
                  {displayIssue.comments.map((comment) => (
                    <div key={comment.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {(comment.user?.name || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-text-primary">
                            {comment.user?.name || 'Unknown'}
                          </span>
                        </div>
                        <span className="text-xs text-text-tertiary">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary pl-9">
                        {comment.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <MessageSquare size={24} className="mx-auto mb-2 text-text-tertiary opacity-50" />
                  <p className="text-sm text-text-tertiary">No comments yet</p>
                </div>
              )}
            </div>
          </ModalSection>
        </div>
      )}
    </Modal>
  );
}
