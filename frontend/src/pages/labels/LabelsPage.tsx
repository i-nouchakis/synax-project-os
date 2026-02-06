import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Tags,
  Building2,
  Plus,
  Trash2,
  Printer,
  CheckSquare,
  Square,
  Package,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Modal,
  ModalActions,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { projectService } from '@/services/project.service';
import {
  labelService,
  type LabelType,
  LABEL_TYPE_LABELS,
  LABEL_TYPE_PREFIXES,
  LABEL_STATUS_LABELS,
  LABEL_STATUS_COLORS,
} from '@/services/label.service';

const LABEL_COLORS = [
  { name: 'White', value: '#ffffff', text: '#000000' },
  { name: 'Yellow', value: '#fef08a', text: '#000000' },
  { name: 'Orange', value: '#fed7aa', text: '#000000' },
  { name: 'Blue', value: '#bfdbfe', text: '#000000' },
  { name: 'Green', value: '#bbf7d0', text: '#000000' },
  { name: 'Red', value: '#fecaca', text: '#000000' },
];

export function LabelsPage() {
  const queryClient = useQueryClient();
  // State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [labelType, setLabelType] = useState<LabelType>('ASSET');
  const [prefix, setPrefix] = useState('');
  const [startNumber, setStartNumber] = useState(1);
  const [count, setCount] = useState(10);
  const [includeQR, setIncludeQR] = useState(true);
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAll(),
  });

  // Fetch labels for selected project
  const { data: labels = [], isLoading: labelsLoading } = useQuery({
    queryKey: ['labels', selectedProjectId],
    queryFn: () => labelService.getByProject(selectedProjectId),
    enabled: !!selectedProjectId,
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Mutations
  const createBatchMutation = useMutation({
    mutationFn: (data: { prefix: string; startNumber: number; count: number; type: LabelType }) =>
      labelService.createBatch(selectedProjectId, {
        ...data,
        padding: 4,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['labels', selectedProjectId] });
      toast.success(`Created ${response.created} labels${response.skipped > 0 ? `, ${response.skipped} skipped (already exist)` : ''}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create labels');
    },
  });

  const markPrintedMutation = useMutation({
    mutationFn: (ids: string[]) => labelService.markPrintedBatch(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', selectedProjectId] });
      toast.success('Labels marked as printed');
      setSelectedLabelIds(new Set());
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark labels as printed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => labelService.deleteBatch(ids),
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ['labels', selectedProjectId] });
      toast.success(`Deleted ${deleted} labels`);
      setSelectedLabelIds(new Set());
      setIsDeleteModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete labels');
    },
  });

  // Handlers
  const handleGenerate = () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }
    const finalPrefix = prefix || LABEL_TYPE_PREFIXES[labelType];
    createBatchMutation.mutate({
      prefix: finalPrefix,
      startNumber,
      count,
      type: labelType,
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedLabelIds(new Set(labels.map((l) => l.id)));
  };

  const clearSelection = () => {
    setSelectedLabelIds(new Set());
  };

  const handlePrint = () => {
    const labelsToPrint = labels.filter((l) => selectedLabelIds.has(l.id));
    if (labelsToPrint.length === 0) {
      toast.error('Please select labels to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Labels - ${selectedProject?.name || 'Synax'}</title>
          <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .labels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; }
            .label { border: 1px solid #ccc; border-radius: 4px; padding: 5mm; text-align: center; page-break-inside: avoid; }
            .label-title { font-size: 14pt; font-weight: bold; margin-bottom: 2mm; }
            .label-subtitle { font-size: 9pt; color: #666; margin-bottom: 3mm; }
            .label-qr { margin: 3mm auto; }
            .label-qr canvas { display: block; margin: 0 auto; }
            .qr-value { font-size: 6pt; color: #888; margin-top: 1mm; }
            .label-code { font-family: monospace; font-size: 8pt; color: #888; }
          </style>
        </head>
        <body>
          <div class="labels-grid">
            ${labelsToPrint
              .map(
                (label) => `
                <div class="label" style="background-color: ${selectedColor.value}">
                  <div class="label-title">${label.code}</div>
                  ${selectedProject ? `<div class="label-subtitle">${selectedProject.name}</div>` : ''}
                  ${includeQR ? `<div class="label-qr" id="qr-${label.id}"></div>` : ''}
                  <div class="label-code">${label.code}</div>
                </div>
              `
              )
              .join('')}
          </div>
          <script>
            ${
              includeQR
                ? `
              ${labelsToPrint
                .map(
                  (label) => `
                (function() {
                  var qr = qrcode(0, 'M');
                  qr.addData('SYNAX:${label.code}');
                  qr.make();
                  document.getElementById('qr-${label.id}').innerHTML = qr.createSvgTag(2);
                })();
              `
                )
                .join('')}
            `
                : ''
            }
            setTimeout(function() { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Mark as printed after printing
    markPrintedMutation.mutate(Array.from(selectedLabelIds));
  };

  const handleDeleteSelected = () => {
    const selectedLabels = labels.filter((l) => selectedLabelIds.has(l.id));
    const assignedLabels = selectedLabels.filter((l) => l.status === 'ASSIGNED');

    if (assignedLabels.length > 0) {
      toast.error(`Cannot delete ${assignedLabels.length} assigned labels. Unassign them first.`);
      return;
    }

    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(Array.from(selectedLabelIds));
  };

  // Stats
  const stats = {
    total: labels.length,
    available: labels.filter((l) => l.status === 'AVAILABLE').length,
    printed: labels.filter((l) => l.status === 'PRINTED').length,
    assigned: labels.filter((l) => l.status === 'ASSIGNED').length,
  };

  const selectedCount = selectedLabelIds.size;
  const allSelected = labels.length > 0 && labels.every((l) => selectedLabelIds.has(l.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 flex items-center gap-2">
            <Tags size={28} />
            Labels
          </h1>
          <p className="text-body text-text-secondary mt-1">
            Generate, print, and manage labels for assets
          </p>
        </div>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={18} />
            Select Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setSelectedLabelIds(new Set());
            }}
            className="input-base w-full md:w-64"
          >
            <option value="">Select a project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {!selectedProjectId && (
            <p className="text-body-sm text-warning mt-2 flex items-center gap-1">
              <AlertCircle size={14} />
              Please select a project to manage labels
            </p>
          )}
        </CardContent>
      </Card>

      {selectedProjectId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-h2 font-bold text-text-primary">{stats.total}</div>
                <div className="text-body-sm text-text-tertiary">Total Labels</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-h2 font-bold text-gray-600">{stats.available}</div>
                <div className="text-body-sm text-text-tertiary">Available</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-h2 font-bold text-blue-600">{stats.printed}</div>
                <div className="text-body-sm text-text-tertiary">Printed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-h2 font-bold text-green-600">{stats.assigned}</div>
                <div className="text-body-sm text-text-tertiary">Assigned</div>
              </CardContent>
            </Card>
          </div>

          {/* Generate Labels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus size={18} />
                Generate Labels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Label Type */}
              <div>
                <label className="text-body-sm text-text-secondary block mb-2">Label Type</label>
                <div className="flex flex-wrap gap-2">
                  {(['CABLE', 'RACK', 'ASSET', 'ROOM'] as LabelType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setLabelType(type);
                        setPrefix('');
                      }}
                      className={cn(
                        'px-4 py-2 rounded-md text-body-sm transition-colors',
                        labelType === type
                          ? 'bg-primary text-white'
                          : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                      )}
                    >
                      {LABEL_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-body-sm text-text-secondary block mb-2">
                    Prefix (default: {LABEL_TYPE_PREFIXES[labelType]})
                  </label>
                  <Input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    placeholder={LABEL_TYPE_PREFIXES[labelType]}
                  />
                </div>
                <div>
                  <label className="text-body-sm text-text-secondary block mb-2">Start Number</label>
                  <Input
                    type="number"
                    min={1}
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="text-body-sm text-text-secondary block mb-2">Count (max 100)</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    onChange={(e) => setCount(Math.min(100, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>

              {/* Color & QR */}
              <div className="flex items-center gap-6">
                <div>
                  <label className="text-body-sm text-text-secondary block mb-2">Print Color</label>
                  <div className="flex flex-wrap gap-2">
                    {LABEL_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          'w-8 h-8 rounded-md border-2 transition-all',
                          selectedColor.name === color.name
                            ? 'border-primary scale-110'
                            : 'border-surface-border hover:scale-105'
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-6">
                  <input
                    type="checkbox"
                    checked={includeQR}
                    onChange={(e) => setIncludeQR(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-border text-primary focus:ring-primary"
                  />
                  <span className="text-body-sm text-text-secondary">Include QR Code</span>
                </label>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                isLoading={createBatchMutation.isPending}
                leftIcon={<Plus size={16} />}
              >
                Generate {count} Labels
              </Button>

              {/* Preview */}
              <div className="text-body-sm text-text-tertiary">
                Preview: {prefix || LABEL_TYPE_PREFIXES[labelType]}-{String(startNumber).padStart(4, '0')} to{' '}
                {prefix || LABEL_TYPE_PREFIXES[labelType]}-{String(startNumber + count - 1).padStart(4, '0')}
              </div>
            </CardContent>
          </Card>

          {/* Labels Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package size={18} />
                Labels ({labels.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <>
                    <Badge variant="primary" size="sm">
                      {selectedCount} selected
                    </Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handlePrint}
                      leftIcon={<Printer size={14} />}
                    >
                      Print Selected
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteSelected}
                      className="text-error hover:text-error"
                      leftIcon={<Trash2 size={14} />}
                    >
                      Delete
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={allSelected ? clearSelection : selectAll}
                >
                  {allSelected ? 'Clear All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {labelsLoading ? (
                <div className="py-8 text-center text-text-tertiary">Loading labels...</div>
              ) : labels.length === 0 ? (
                <div className="py-8 text-center text-text-tertiary">
                  <Tags size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No labels yet. Generate some above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-border">
                        <th className="text-left py-3 px-2 w-10"></th>
                        <th className="text-left py-3 px-2 text-body-sm font-medium text-text-secondary">
                          Code
                        </th>
                        <th className="text-left py-3 px-2 text-body-sm font-medium text-text-secondary">
                          Type
                        </th>
                        <th className="text-left py-3 px-2 text-body-sm font-medium text-text-secondary">
                          Status
                        </th>
                        <th className="text-left py-3 px-2 text-body-sm font-medium text-text-secondary">
                          Assigned To
                        </th>
                        <th className="text-left py-3 px-2 text-body-sm font-medium text-text-secondary">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {labels.map((label) => {
                        const isSelected = selectedLabelIds.has(label.id);
                        return (
                          <tr
                            key={label.id}
                            className={cn(
                              'border-b border-surface-border/50 hover:bg-surface-hover cursor-pointer transition-colors',
                              isSelected && 'bg-primary/5'
                            )}
                            onClick={() => toggleSelect(label.id)}
                          >
                            <td className="py-3 px-2">
                              {isSelected ? (
                                <CheckSquare size={18} className="text-primary" />
                              ) : (
                                <Square size={18} className="text-text-tertiary" />
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <span className="font-mono font-medium">{label.code}</span>
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-body-sm text-text-secondary">
                                {LABEL_TYPE_LABELS[label.type]}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <Badge size="sm" className={LABEL_STATUS_COLORS[label.status]}>
                                {LABEL_STATUS_LABELS[label.status]}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">
                              {label.asset ? (
                                <span className="text-body-sm">{label.asset.name}</span>
                              ) : (
                                <span className="text-body-sm text-text-tertiary">-</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-body-sm text-text-tertiary">
                                {new Date(label.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Labels"
        icon={<Trash2 size={18} />}
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmDelete}
              isLoading={deleteMutation.isPending}
              className="bg-error hover:bg-error/90"
            >
              Delete {selectedCount} Labels
            </Button>
          </ModalActions>
        }
      >
        <p className="text-body text-text-secondary">
          Are you sure you want to delete {selectedCount} labels? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
