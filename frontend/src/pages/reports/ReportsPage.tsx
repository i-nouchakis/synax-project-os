import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Building2,
  BarChart3,
  Users,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Download,
  History,
  Trash2,
  ExternalLink,
  FileDown,
  Eye,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Button,
  Badge,
  Modal,
  ModalSection,
  ModalActions,
} from '@/components/ui';
import { projectService } from '@/services/project.service';
import {
  reportService,
  type ProjectSummaryReport,
  type ClientReport,
  type GeneratedReport,
  getProgressColor,
  getProgressBarColor,
} from '@/services/report.service';
import { useAuthStore } from '@/stores/auth.store';

type ReportType = 'summary' | 'client' | 'internal';

export function ReportsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('project') || '';
  const [selectedProject, setSelectedProject] = useState(projectIdFromUrl);
  const [reportType, setReportType] = useState<ReportType>('summary');

  // Update selected project when URL param changes
  useEffect(() => {
    if (projectIdFromUrl) {
      setSelectedProject(projectIdFromUrl);
    }
  }, [projectIdFromUrl]);
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [showCreatePDFModal, setShowCreatePDFModal] = useState(false);
  const [showPDFPreviewModal, setShowPDFPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFilename, setPreviewFilename] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
  });

  // Fetch report based on type
  const { data: report, isLoading, error } = useQuery<
    ProjectSummaryReport | ClientReport | any | null
  >({
    queryKey: ['report', selectedProject, reportType],
    queryFn: async () => {
      if (!selectedProject) return null;
      switch (reportType) {
        case 'summary':
          return reportService.getSummary(selectedProject);
        case 'client':
          return reportService.getClient(selectedProject);
        case 'internal':
          return reportService.getInternal(selectedProject);
        default:
          return null;
      }
    },
    enabled: !!selectedProject,
  });

  // Fetch report history
  const { data: reportHistory = [] } = useQuery({
    queryKey: ['reportHistory', selectedProject],
    queryFn: () => reportService.getHistory(selectedProject),
    enabled: !!selectedProject,
  });

  // Export PDF mutation
  const exportPDFMutation = useMutation({
    mutationFn: () => reportService.exportPDF(selectedProject, reportType),
    onSuccess: (data) => {
      setPreviewUrl(data.url);
      setPreviewFilename(data.filename);
      setShowCreatePDFModal(false);
      setShowPDFPreviewModal(true);
      queryClient.invalidateQueries({ queryKey: ['reportHistory', selectedProject] });
    },
    onError: (error) => {
      console.error('PDF export error:', error);
      alert('Failed to export PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: (reportId: string) => reportService.deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportHistory', selectedProject] });
    },
  });

  const canViewInternal = user?.role === 'ADMIN' || user?.role === 'PM';

  const reportTypeOptions: { value: string; label: string }[] = [
    { value: 'summary', label: 'Project Summary' },
    { value: 'client', label: 'Client Report' },
  ];

  if (canViewInternal) {
    reportTypeOptions.push({ value: 'internal', label: 'Internal Report' });
  }

  const toggleFloor = (floorId: string) => {
    const newExpanded = new Set(expandedFloors);
    if (newExpanded.has(floorId)) {
      newExpanded.delete(floorId);
    } else {
      newExpanded.add(floorId);
    }
    setExpandedFloors(newExpanded);
  };

  const handleCreatePDF = () => {
    setShowCreatePDFModal(true);
  };

  const handleExportPDF = () => {
    exportPDFMutation.mutate();
  };

  const handleDownloadPDF = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = previewFilename;
      link.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getReportTypeLabel = (type: string): string => {
    switch (type) {
      case 'SUMMARY': return 'Summary';
      case 'CLIENT': return 'Client';
      case 'INTERNAL': return 'Internal';
      case 'ASSETS': return 'Assets';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-h1">Reports</h1>
          <p className="text-body text-text-secondary">
            Generate project reports and analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedProject && (
            <Button
              variant="secondary"
              onClick={() => setShowHistoryModal(true)}
              leftIcon={<History size={18} />}
            >
              History ({reportHistory.length})
            </Button>
          )}
          {report && (
            <Button
              onClick={handleCreatePDF}
              leftIcon={<FileDown size={18} />}
            >
              Create PDF
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 print:hidden">
        <div className="flex-1 max-w-md">
          <Select
            label="Project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            options={[
              { value: '', label: 'Select a project...' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
        <div className="max-w-xs">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            options={reportTypeOptions}
          />
        </div>
      </div>

      {/* No project selected */}
      {!selectedProject && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
            <h3 className="text-h3 text-text-primary mb-2">Select a Project</h3>
            <p className="text-body text-text-secondary">
              Choose a project to generate reports
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-body text-text-secondary">Generating report...</p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-error opacity-50" />
            <h3 className="text-h3 text-text-primary mb-2">Error Loading Report</h3>
            <p className="text-body text-text-secondary">
              {error instanceof Error ? error.message : 'Failed to load report'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {report && reportType === 'summary' && (
        <SummaryReport report={report as ProjectSummaryReport} />
      )}

      {report && reportType === 'client' && (
        <ClientReportView
          report={report as ClientReport}
          expandedFloors={expandedFloors}
          toggleFloor={toggleFloor}
        />
      )}

      {report && reportType === 'internal' && (
        <InternalReportView report={report} />
      )}

      {/* Create PDF Modal - Shows report preview with export option */}
      <Modal
        isOpen={showCreatePDFModal}
        onClose={() => setShowCreatePDFModal(false)}
        title="Create PDF Report"
        icon={<FileDown size={18} />}
        size="full"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowCreatePDFModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExportPDF}
              leftIcon={<FileDown size={18} />}
              isLoading={exportPDFMutation.isPending}
            >
              Export PDF
            </Button>
          </ModalActions>
        }
      >
        <div className="flex flex-col h-[70vh]">
          {/* Report Info */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-surface-border">
            <div>
              <p className="text-body font-medium text-text-primary">
                {report?.project?.name}
              </p>
              <p className="text-body-sm text-text-secondary">
                {reportType === 'summary' && 'Project Summary Report'}
                {reportType === 'client' && 'Client Progress Report'}
                {reportType === 'internal' && 'Internal Technical Report'}
              </p>
            </div>
          </div>

          {/* Report Preview */}
          <div className="flex-1 overflow-y-auto pr-2">
            {report && reportType === 'summary' && (
              <SummaryReport report={report as ProjectSummaryReport} />
            )}
            {report && reportType === 'client' && (
              <ClientReportView
                report={report as ClientReport}
                expandedFloors={expandedFloors}
                toggleFloor={toggleFloor}
              />
            )}
            {report && reportType === 'internal' && (
              <InternalReportView report={report} />
            )}
          </div>
        </div>
      </Modal>

      {/* PDF Download Modal - Shows generated PDF */}
      <Modal
        isOpen={showPDFPreviewModal}
        onClose={() => setShowPDFPreviewModal(false)}
        title="PDF Generated"
        icon={<FileText size={18} />}
        size="full"
        footer={
          <ModalActions>
            <span className="text-body-sm text-text-secondary mr-auto">
              {previewFilename}
            </span>
            <Button
              variant="secondary"
              onClick={() => window.open(previewUrl, '_blank')}
              leftIcon={<ExternalLink size={18} />}
            >
              Open in New Tab
            </Button>
            <Button
              onClick={handleDownloadPDF}
              leftIcon={<Download size={18} />}
            >
              Download PDF
            </Button>
          </ModalActions>
        }
      >
        <div className="h-[65vh] bg-surface-secondary rounded-lg overflow-hidden">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title="PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-text-tertiary">Loading preview...</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Report History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Export History"
        icon={<History size={18} />}
        size="xl"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
              Close
            </Button>
          </ModalActions>
        }
      >
        <ModalSection title={`${reportHistory.length} Exports`} icon={<FileText size={14} />}>
          {reportHistory.length === 0 ? (
            <div className="text-center py-8">
              <History size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
              <p className="text-body text-text-secondary">No exports yet</p>
              <p className="text-caption text-text-tertiary">
                Export a PDF to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {reportHistory.map((item: GeneratedReport) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-body font-medium text-text-primary">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="default" size="sm">
                          {getReportTypeLabel(item.type)}
                        </Badge>
                        <span className="text-caption text-text-tertiary">
                          {formatFileSize(item.fileSize)}
                        </span>
                        <span className="text-caption text-text-tertiary">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                        {item.generatedBy && (
                          <span className="text-caption text-text-tertiary">
                            by {item.generatedBy.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPreviewUrl(item.fileUrl);
                        setPreviewFilename(item.title + '.pdf');
                        setShowHistoryModal(false);
                        setShowPDFPreviewModal(true);
                      }}
                      leftIcon={<Eye size={16} />}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = item.fileUrl;
                        link.download = item.title + '.pdf';
                        link.click();
                      }}
                      leftIcon={<Download size={16} />}
                    >
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReportMutation.mutate(item.id)}
                      leftIcon={<Trash2 size={16} />}
                      className="text-error hover:bg-error/10"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalSection>
      </Modal>
    </div>
  );
}

// Summary Report Component
function SummaryReport({ report }: { report: ProjectSummaryReport }) {
  return (
    <div className="space-y-6 print:space-y-4">
      {/* Report Header */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-h2 text-text-primary">{report.project.name}</h2>
              <p className="text-body text-text-secondary">Project Summary Report</p>
              {report.project.clientName && (
                <p className="text-body-sm text-text-tertiary mt-1">
                  Client: {report.project.clientName}
                </p>
              )}
            </div>
            <div className="text-right">
              <Badge variant={report.project.status === 'IN_PROGRESS' ? 'primary' : 'default'}>
                {report.project.status.replace('_', ' ')}
              </Badge>
              <p className="text-caption text-text-tertiary mt-2">
                Generated: {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ProgressCard
          title="Rooms"
          value={report.progress.rooms}
          icon={<Building2 size={20} />}
          subtitle={`${report.stats.rooms.completed}/${report.stats.rooms.total} completed`}
        />
        <ProgressCard
          title="Assets"
          value={report.progress.assets}
          icon={<Package size={20} />}
          subtitle={`${report.stats.assets.verified}/${report.stats.assets.total} ready`}
        />
        <ProgressCard
          title="Checklists"
          value={report.progress.checklists}
          icon={<CheckCircle2 size={20} />}
          subtitle={`${report.stats.checklists.completedItems}/${report.stats.checklists.totalItems} items`}
        />
        <ProgressCard
          title="Issues Resolved"
          value={report.progress.issues}
          icon={<AlertTriangle size={20} />}
          subtitle={`${report.stats.issues.resolved + report.stats.issues.closed}/${report.stats.issues.total} closed`}
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rooms Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 size={18} />
              Room Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatBar label="Completed" value={report.stats.rooms.completed} total={report.stats.rooms.total} color="bg-success" />
              <StatBar label="In Progress" value={report.stats.rooms.inProgress} total={report.stats.rooms.total} color="bg-primary" />
              <StatBar label="Not Started" value={report.stats.rooms.notStarted} total={report.stats.rooms.total} color="bg-text-tertiary" />
              <StatBar label="Blocked" value={report.stats.rooms.blocked} total={report.stats.rooms.total} color="bg-error" />
            </div>
          </CardContent>
        </Card>

        {/* Assets Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package size={18} />
              Asset Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatBar label="Verified" value={report.stats.assets.verified} total={report.stats.assets.total} color="bg-success" />
              <StatBar label="Configured" value={report.stats.assets.configured} total={report.stats.assets.total} color="bg-primary" />
              <StatBar label="Installed" value={report.stats.assets.installed} total={report.stats.assets.total} color="bg-warning" />
              <StatBar label="In Stock" value={report.stats.assets.inStock} total={report.stats.assets.total} color="bg-text-secondary" />
              <StatBar label="Planned" value={report.stats.assets.planned} total={report.stats.assets.total} color="bg-text-tertiary" />
              <StatBar label="Faulty" value={report.stats.assets.faulty} total={report.stats.assets.total} color="bg-error" />
            </div>
          </CardContent>
        </Card>

        {/* Issues Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={18} />
              Issues by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatBar label="Critical" value={report.stats.issues.byPriority.critical} total={report.stats.issues.total} color="bg-error" />
              <StatBar label="High" value={report.stats.issues.byPriority.high} total={report.stats.issues.total} color="bg-warning" />
              <StatBar label="Medium" value={report.stats.issues.byPriority.medium} total={report.stats.issues.total} color="bg-primary" />
              <StatBar label="Low" value={report.stats.issues.byPriority.low} total={report.stats.issues.total} color="bg-text-secondary" />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={18} />
              Inventory Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-surface-secondary rounded-lg">
                <p className="text-h2 text-text-primary">{report.stats.inventory.totalItems}</p>
                <p className="text-caption text-text-tertiary">Item Types</p>
              </div>
              <div className="text-center p-4 bg-surface-secondary rounded-lg">
                <p className="text-h2 text-success">{report.stats.inventory.totalInStock}</p>
                <p className="text-caption text-text-tertiary">In Stock</p>
              </div>
              <div className="text-center p-4 bg-surface-secondary rounded-lg">
                <p className="text-h2 text-text-primary">{report.stats.inventory.totalReceived}</p>
                <p className="text-caption text-text-tertiary">Received</p>
              </div>
              <div className="text-center p-4 bg-surface-secondary rounded-lg">
                <p className="text-h2 text-text-secondary">{report.stats.inventory.totalUsed}</p>
                <p className="text-caption text-text-tertiary">Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} />
            Project Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {report.project.team.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                  {member.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-body-sm font-medium text-text-primary">{member.name}</p>
                  <p className="text-caption text-text-tertiary">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Client Report Component
function ClientReportView({
  report,
  expandedFloors,
  toggleFloor
}: {
  report: ClientReport;
  expandedFloors: Set<string>;
  toggleFloor: (id: string) => void;
}) {
  return (
    <div className="space-y-6 print:space-y-4">
      {/* Report Header */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-h2 text-text-primary">{report.project.name}</h2>
              <p className="text-body text-text-secondary">Client Progress Report</p>
              {report.project.clientName && (
                <p className="text-body-sm text-text-tertiary mt-1">
                  Prepared for: {report.project.clientName}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-caption text-text-tertiary">
                Generated: {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-h2 ${getProgressColor(report.summary.roomCompletionRate)}`}>
              {report.summary.roomCompletionRate}%
            </div>
            <p className="text-caption text-text-secondary">Room Completion</p>
            <p className="text-caption text-text-tertiary">
              {report.summary.completedRooms}/{report.summary.totalRooms}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-h2 ${getProgressColor(report.summary.assetCompletionRate)}`}>
              {report.summary.assetCompletionRate}%
            </div>
            <p className="text-caption text-text-secondary">Asset Completion</p>
            <p className="text-caption text-text-tertiary">
              {report.summary.completedAssets}/{report.summary.totalAssets}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-h2 ${report.summary.openIssues > 0 ? 'text-warning' : 'text-success'}`}>
              {report.summary.openIssues}
            </div>
            <p className="text-caption text-text-secondary">Open Issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-h2 text-primary">{report.summary.signatureCount}</div>
            <p className="text-caption text-text-secondary">Sign-offs</p>
          </CardContent>
        </Card>
      </div>

      {/* Floor Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={18} />
            Progress by Floor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-surface-border">
            {report.floorProgress.map((floor) => (
              <div
                key={floor.id}
                className="p-4 hover:bg-surface-hover transition-colors cursor-pointer"
                onClick={() => toggleFloor(floor.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {expandedFloors.has(floor.id) ? (
                      <ChevronDown size={16} className="text-text-tertiary" />
                    ) : (
                      <ChevronRight size={16} className="text-text-tertiary" />
                    )}
                    <span className="text-body font-medium text-text-primary">{floor.name}</span>
                    <span className="text-caption text-text-tertiary">Level {floor.level}</span>
                  </div>
                  <span className={`text-body font-medium ${getProgressColor(floor.completionRate)}`}>
                    {floor.completionRate}%
                  </span>
                </div>
                <div className="ml-6">
                  <div className="w-full bg-surface-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressBarColor(floor.completionRate)}`}
                      style={{ width: `${floor.completionRate}%` }}
                    />
                  </div>
                  <p className="text-caption text-text-tertiary mt-1">
                    {floor.completedRooms} of {floor.totalRooms} rooms completed
                  </p>
                </div>

                {/* Expanded Room List */}
                {expandedFloors.has(floor.id) && floor.rooms && floor.rooms.length > 0 && (
                  <div className="ml-6 mt-3 space-y-2">
                    {floor.rooms.map((room) => (
                      <div
                        key={room.id}
                        className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              room.status === 'COMPLETED' ? 'bg-success' :
                              room.status === 'IN_PROGRESS' ? 'bg-primary' :
                              room.status === 'BLOCKED' ? 'bg-error' :
                              'bg-text-tertiary'
                            }`}
                          />
                          <span className="text-body-sm text-text-primary">{room.name}</span>
                          {room.type && (
                            <span className="text-caption text-text-tertiary">({room.type})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-caption text-text-tertiary">
                            {room.assetCount} assets
                          </span>
                          <Badge
                            variant={
                              room.status === 'COMPLETED' ? 'success' :
                              room.status === 'IN_PROGRESS' ? 'primary' :
                              room.status === 'BLOCKED' ? 'error' :
                              'default'
                            }
                            size="sm"
                          >
                            {room.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assets by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package size={18} />
            Equipment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-4 py-2 text-caption font-medium text-text-secondary">Type</th>
                  <th className="text-left px-4 py-2 text-caption font-medium text-text-secondary">Total</th>
                  <th className="text-left px-4 py-2 text-caption font-medium text-text-secondary">Completed</th>
                  <th className="text-left px-4 py-2 text-caption font-medium text-text-secondary">Progress</th>
                </tr>
              </thead>
              <tbody>
                {report.assetsByType.map((asset) => (
                  <tr key={asset.type} className="border-b border-surface-border">
                    <td className="px-4 py-3 text-body text-text-primary">{asset.type}</td>
                    <td className="px-4 py-3 text-body text-text-secondary text-center">{asset.total}</td>
                    <td className="px-4 py-3 text-body text-text-secondary text-center">{asset.completed}</td>
                    <td className="px-4 py-3">
                      <span className={`text-body font-medium ${getProgressColor(asset.completionRate)}`}>
                        {asset.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      {report.signatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              Sign-offs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.signatures.map((sig) => (
                <div key={sig.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                  <div>
                    <p className="text-body-sm font-medium text-text-primary">{sig.signedByName}</p>
                    <p className="text-caption text-text-tertiary">{sig.location || 'Project Level'} - {sig.type}</p>
                  </div>
                  <p className="text-caption text-text-tertiary">
                    {new Date(sig.signedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Internal Report Component (simplified view)
function InternalReportView({ report }: { report: any }) {
  return (
    <div className="space-y-6 print:space-y-4">
      {/* Report Header */}
      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-h2 text-text-primary">{report.project.name}</h2>
              <p className="text-body text-text-secondary">Internal Technical Report</p>
              <p className="text-caption text-error mt-1">CONFIDENTIAL - Internal Use Only</p>
            </div>
            <div className="text-right">
              <p className="text-caption text-text-tertiary">
                Generated: {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technician Stats */}
      {report.technicianStats?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={18} />
              Technician Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left px-4 py-2 text-caption font-medium text-text-secondary">Technician</th>
                    <th className="text-left px-4 py-2 text-caption font-medium text-text-secondary">Items Completed</th>
                    <th className="text-left px-4 py-2 text-caption font-medium text-text-secondary">Assets Installed</th>
                  </tr>
                </thead>
                <tbody>
                  {report.technicianStats.map((tech: any) => (
                    <tr key={tech.id} className="border-b border-surface-border">
                      <td className="px-4 py-3 text-body text-text-primary">{tech.name}</td>
                      <td className="px-4 py-3 text-body text-text-secondary text-center">{tech.checklistItemsCompleted}</td>
                      <td className="px-4 py-3 text-body text-text-secondary text-center">{tech.assetsInstalled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues Detail */}
      {report.issues?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={18} />
              Issues ({report.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-surface-border">
              {report.issues.map((issue: any) => (
                <div key={issue.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={
                            issue.priority === 'CRITICAL' ? 'error' :
                            issue.priority === 'HIGH' ? 'warning' :
                            issue.priority === 'MEDIUM' ? 'primary' : 'default'
                          }
                          size="sm"
                        >
                          {issue.priority}
                        </Badge>
                        <Badge
                          variant={
                            issue.status === 'OPEN' ? 'error' :
                            issue.status === 'IN_PROGRESS' ? 'primary' :
                            'success'
                          }
                          size="sm"
                        >
                          {issue.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-body font-medium text-text-primary">{issue.title}</p>
                      {issue.description && (
                        <p className="text-body-sm text-text-secondary mt-1">{issue.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-caption text-text-tertiary">
                        {issue.location && <span>Location: {issue.location}</span>}
                        {issue.causedBy && <span>Caused by: {issue.causedBy}</span>}
                      </div>
                    </div>
                    <div className="text-right text-caption text-text-tertiary">
                      <p>{new Date(issue.createdAt).toLocaleDateString()}</p>
                      {issue.resolvedAt && (
                        <p className="text-success">Resolved: {new Date(issue.resolvedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Detail */}
      {report.inventory?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package size={18} />
              Material Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left px-4 py-2 text-caption font-medium text-text-secondary">Item</th>
                    <th className="text-left px-4 py-2 text-caption font-medium text-text-secondary">Received</th>
                    <th className="text-left px-4 py-2 text-caption font-medium text-text-secondary">Used</th>
                    <th className="text-left px-4 py-2 text-caption font-medium text-text-secondary">In Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {report.inventory.map((item: any) => (
                    <tr key={item.id} className="border-b border-surface-border">
                      <td className="px-4 py-3">
                        <p className="text-body text-text-primary">{item.itemType}</p>
                        <p className="text-caption text-text-tertiary">{item.description}</p>
                      </td>
                      <td className="px-4 py-3 text-body text-text-secondary text-center">
                        {item.received} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-body text-text-secondary text-center">
                        {item.used} {item.unit}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-body font-medium ${item.inStock <= 0 ? 'text-error' : item.inStock < 5 ? 'text-warning' : 'text-success'}`}>
                          {item.inStock} {item.unit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {report.recentActivity?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-surface-border max-h-96 overflow-y-auto">
              {report.recentActivity.slice(0, 20).map((activity: any, index: number) => (
                <div key={index} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-body-sm text-text-primary">{activity.itemName}</p>
                    <p className="text-caption text-text-tertiary">
                      {activity.assetName} - {activity.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-caption text-text-secondary">{activity.completedBy}</p>
                    <p className="text-caption text-text-tertiary">
                      {activity.completedAt ? new Date(activity.completedAt).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Components
function ProgressCard({ title, value, icon, subtitle }: { title: string; value: number; icon: React.ReactNode; subtitle: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2 text-text-secondary">
          {icon}
          <span className="text-caption">{title}</span>
        </div>
        <div className={`text-h2 ${getProgressColor(value)}`}>{value}%</div>
        <div className="w-full bg-surface-secondary rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full ${getProgressBarColor(value)}`}
            style={{ width: `${value}%` }}
          />
        </div>
        <p className="text-caption text-text-tertiary mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function StatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-body-sm mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary">{value}</span>
      </div>
      <div className="w-full bg-surface-secondary rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
