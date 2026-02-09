import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bug,
  Lightbulb,
  Trash2,
  MessageSquarePlus,
  AlertTriangle,
  Image as ImageIcon,
  CheckCircle2,
  Circle,
  MessageCircle,
  Maximize2,
  Save,
  User,
  Clock,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  Badge,
  Button,
  Modal,
  ModalActions,
  ModalSection,
} from '@/components/ui';
import { feedbackService, type FeedbackType, type Feedback } from '@/services/feedback.service';

const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: React.ReactNode; color: string; variant: 'error' | 'warning' }> = {
  BUG: { label: 'Bug', icon: <Bug size={14} />, color: 'text-error', variant: 'error' },
  CHANGE: { label: 'Change', icon: <Lightbulb size={14} />, color: 'text-warning', variant: 'warning' },
};

export function FeedbackPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<FeedbackType | ''>('');
  const [filterResolved, setFilterResolved] = useState<'all' | 'open' | 'resolved'>('all');
  const [selectedItem, setSelectedItem] = useState<Feedback | null>(null);
  const [deleteItem, setDeleteItem] = useState<Feedback | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['feedback', filterType],
    queryFn: () => feedbackService.getAll(filterType || undefined),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { adminNotes?: string; resolved?: boolean; type?: FeedbackType } }) =>
      feedbackService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast.success('Saved');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => feedbackService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      setDeleteItem(null);
      setSelectedItem(null);
      toast.success('Deleted');
    },
  });

  // Apply resolved filter
  const filtered = items.filter((i) => {
    if (filterResolved === 'open') return !i.resolved;
    if (filterResolved === 'resolved') return i.resolved;
    return true;
  });

  const bugCount = items.filter((i) => i.type === 'BUG').length;
  const changeCount = items.filter((i) => i.type === 'CHANGE').length;
  const openCount = items.filter((i) => !i.resolved).length;

  const openItem = (item: Feedback) => {
    setSelectedItem(item);
    setAdminNotes(item.adminNotes || '');
  };

  const handleSaveNotes = () => {
    if (!selectedItem) return;
    updateMutation.mutate({ id: selectedItem.id, data: { adminNotes } });
  };

  const handleToggleResolved = (item: Feedback) => {
    updateMutation.mutate(
      { id: item.id, data: { resolved: !item.resolved } },
      { onSuccess: () => { if (selectedItem?.id === item.id) setSelectedItem({ ...item, resolved: !item.resolved }); } }
    );
  };

  const handleToggleType = (item: Feedback) => {
    const newType: FeedbackType = item.type === 'BUG' ? 'CHANGE' : 'BUG';
    updateMutation.mutate(
      { id: item.id, data: { type: newType } },
      { onSuccess: () => { if (selectedItem?.id === item.id) setSelectedItem({ ...item, type: newType }); } }
    );
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('el-GR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

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
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <MessageSquarePlus size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-h1">Feedback</h1>
          <p className="text-body-sm text-text-secondary">
            {openCount} open &middot; {items.length} total
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: items.length, color: 'text-text-primary' },
          { label: 'Bugs', value: bugCount, color: 'text-error' },
          { label: 'Changes', value: changeCount, color: 'text-warning' },
          { label: 'Open', value: openCount, color: 'text-primary' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className={`text-h2 ${s.color}`}>{s.value}</p>
              <p className="text-caption text-text-secondary">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 bg-surface border border-surface-border rounded-lg p-1">
          {(['all', 'open', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterResolved(f)}
              className={`px-3 py-1.5 rounded-md text-caption font-medium transition-colors ${
                filterResolved === f ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Resolved'}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-surface-border" />
        <div className="flex gap-1 bg-surface border border-surface-border rounded-lg p-1">
          {(['' as const, 'BUG' as FeedbackType, 'CHANGE' as FeedbackType]).map((t) => (
            <button
              key={t || 'all'}
              onClick={() => setFilterType(t)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-caption font-medium transition-colors ${
                filterType === t ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {t === '' ? 'All types' : t === 'BUG' ? <><Bug size={12} /> Bugs</> : <><Lightbulb size={12} /> Changes</>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquarePlus size={48} className="mx-auto text-text-tertiary mb-4 opacity-30" />
            <p className="text-text-secondary">No feedback items</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-secondary">
                  <th className="text-left text-caption font-medium text-text-secondary px-4 py-3 w-10"></th>
                  <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Type</th>
                  <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Description</th>
                  <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">User</th>
                  <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Page</th>
                  <th className="text-left text-caption font-medium text-text-secondary px-4 py-3">Date</th>
                  <th className="text-left text-caption font-medium text-text-secondary px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const config = TYPE_CONFIG[item.type];
                  return (
                    <tr
                      key={item.id}
                      onClick={() => openItem(item)}
                      className={`border-b border-surface-border hover:bg-surface-hover transition-colors cursor-pointer ${
                        item.resolved ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleResolved(item); }}
                          title={item.resolved ? 'Mark as open' : 'Mark as resolved'}
                        >
                          {item.resolved ? (
                            <CheckCircle2 size={18} className="text-success" />
                          ) : (
                            <Circle size={18} className="text-text-tertiary" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={config.variant} size="sm">
                          {config.icon}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-center gap-2">
                          {item.screenshotUrl && (
                            <div className="flex-shrink-0 w-10 h-7 rounded overflow-hidden border border-surface-border">
                              <img src={item.screenshotUrl} alt="" className="w-full h-full object-cover object-top" />
                            </div>
                          )}
                          <p className="text-body-sm text-text-primary truncate">{item.description}</p>
                          {item.adminNotes && (
                            <MessageCircle size={14} className="flex-shrink-0 text-primary" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-body-sm text-text-secondary">{item.user.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-caption text-text-tertiary font-mono">{item.pageUrl}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-caption text-text-tertiary whitespace-nowrap">{formatDate(item.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteItem(item); }}
                          className="p-1.5 rounded hover:bg-surface-hover text-text-tertiary hover:text-error transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.type === 'BUG' ? 'Bug Report' : 'Change Request'}
          icon={selectedItem.type === 'BUG' ? <Bug size={18} className="text-error" /> : <Lightbulb size={18} className="text-warning" />}
          size="lg"
          footer={
            <ModalActions>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleToggleResolved(selectedItem)}
                leftIcon={selectedItem.resolved ? <Circle size={14} /> : <CheckCircle2 size={14} />}
              >
                {selectedItem.resolved ? 'Reopen' : 'Resolve'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteItem(selectedItem)}
                leftIcon={<Trash2 size={14} />}
              >
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setSelectedItem(null)}>Close</Button>
            </ModalActions>
          }
        >
          <div className="space-y-4">
            {/* Meta info */}
            <div className="flex items-center gap-4 text-caption text-text-tertiary flex-wrap">
              <div className="flex gap-1 bg-surface border border-surface-border rounded-lg p-0.5">
                {(['BUG', 'CHANGE'] as FeedbackType[]).map((t) => {
                  const cfg = TYPE_CONFIG[t];
                  const isActive = selectedItem.type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => { if (!isActive) handleToggleType(selectedItem); }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-caption font-medium transition-colors ${
                        isActive ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                      }`}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
              {selectedItem.resolved && (
                <Badge variant="success" size="sm">
                  <CheckCircle2 size={12} className="mr-1" />
                  Resolved
                </Badge>
              )}
              <span className="flex items-center gap-1"><User size={12} />{selectedItem.user.name}</span>
              <span className="flex items-center gap-1"><Clock size={12} />{formatDate(selectedItem.createdAt)}</span>
              <span className="flex items-center gap-1"><MapPin size={12} /><code className="font-mono">{selectedItem.pageUrl}</code></span>
            </div>

            {/* Screenshot */}
            {selectedItem.screenshotUrl && (
              <ModalSection title="Screenshot" icon={<ImageIcon size={14} />}>
                <div className="relative group">
                  <img
                    src={selectedItem.screenshotUrl}
                    alt="Screenshot"
                    className="w-full rounded-lg border border-surface-border cursor-pointer"
                    onClick={() => setFullScreenImage(selectedItem.screenshotUrl)}
                  />
                  <button
                    onClick={() => setFullScreenImage(selectedItem.screenshotUrl)}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </ModalSection>
            )}

            {/* Description */}
            <ModalSection title="Description" icon={<MessageSquarePlus size={14} />}>
              <p className="text-body-sm text-text-primary whitespace-pre-wrap bg-background rounded-lg p-3 border border-surface-border">
                {selectedItem.description}
              </p>
            </ModalSection>

            {/* Admin Notes */}
            <ModalSection title="Admin Notes" icon={<MessageCircle size={14} />}>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Write your notes here..."
                rows={3}
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveNotes}
                  leftIcon={<Save size={14} />}
                  disabled={adminNotes === (selectedItem.adminNotes || '')}
                  isLoading={updateMutation.isPending}
                >
                  Save Notes
                </Button>
              </div>
            </ModalSection>
          </div>
        </Modal>
      )}

      {/* Full Screen Screenshot */}
      {fullScreenImage && (
        <Modal
          isOpen={!!fullScreenImage}
          onClose={() => setFullScreenImage(null)}
          title="Screenshot"
          icon={<ImageIcon size={18} />}
          size="full"
        >
          <div className="flex items-center justify-center -mx-6 -mb-6">
            <img
              src={fullScreenImage}
              alt="Screenshot"
              className="max-w-full max-h-[calc(100vh-120px)] object-contain"
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteItem && (
        <Modal
          isOpen={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          title="Delete Feedback"
          icon={<AlertTriangle size={18} />}
          size="sm"
          nested
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setDeleteItem(null)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(deleteItem.id)}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </ModalActions>
          }
        >
          <p className="text-body-sm text-text-secondary text-center py-4">
            Delete this feedback item?
          </p>
        </Modal>
      )}
    </div>
  );
}
