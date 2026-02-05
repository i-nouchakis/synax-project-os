import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  UserCircle,
  Pencil,
  Trash2,
  FolderKanban,
} from 'lucide-react';
import { Card, CardContent, Button, Modal, ModalActions, Input, Textarea } from '@/components/ui';
import { useSearchStore } from '@/stores/search.store';
import { clientService, type Client, type CreateClientData } from '@/services/client.service';
import { toast } from 'sonner';

export function ClientsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { query: searchQuery } = useSearchStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateClientData) => clientService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowCreateModal(false);
      toast.success('Client created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateClientData> }) =>
      clientService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setEditingClient(null);
      toast.success('Client updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDeletingClient(null);
      toast.success('Client deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Filter clients by search
  const filteredClients = clients.filter((client) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      client.email?.toLowerCase().includes(q) ||
      client.phone?.toLowerCase().includes(q) ||
      client.contactPerson?.toLowerCase().includes(q)
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Clients</h1>
          <p className="text-body text-text-secondary mt-1">
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus size={16} />}>
          Add Client
        </Button>
      </div>

      {/* Client Cards */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 size={48} className="mx-auto text-text-tertiary mb-4" />
            <p className="text-body text-text-secondary">
              {searchQuery ? 'No clients match your search' : 'No clients yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Building2 size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-body font-medium text-text-primary truncate">
                        {client.name}
                      </h3>
                      {client.contactPerson && (
                        <p className="text-caption text-text-tertiary truncate">
                          {client.contactPerson}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditingClient(client)}
                      className="p-1.5 rounded hover:bg-surface-hover text-text-tertiary hover:text-text-primary"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingClient(client)}
                      className="p-1.5 rounded hover:bg-surface-hover text-text-tertiary hover:text-error"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-body-sm text-text-secondary">
                  {client.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={13} className="flex-shrink-0 text-text-tertiary" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="flex-shrink-0 text-text-tertiary" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 truncate">
                      <MapPin size={13} className="flex-shrink-0 text-text-tertiary" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-surface-border flex items-center gap-2 text-caption text-text-tertiary">
                  <FolderKanban size={13} />
                  <span>{client._count?.projects || 0} project{(client._count?.projects || 0) !== 1 ? 's' : ''}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <ClientFormModal
        isOpen={showCreateModal || !!editingClient}
        onClose={() => {
          setShowCreateModal(false);
          setEditingClient(null);
        }}
        initialData={editingClient}
        onSubmit={(data) => {
          if (editingClient) {
            updateMutation.mutate({ id: editingClient.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        title="Delete Client"
        size="sm"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={() => setDeletingClient(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deletingClient && deleteMutation.mutate(deletingClient.id)}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </ModalActions>
        }
      >
        <p className="text-body text-text-secondary">
          Are you sure you want to delete <strong>{deletingClient?.name}</strong>?
          {(deletingClient?._count?.projects || 0) > 0 && (
            <span className="block mt-2 text-warning">
              This client has {deletingClient?._count?.projects} project(s). They will be unlinked but not deleted.
            </span>
          )}
        </p>
      </Modal>
    </div>
  );
}

// --- Client Form Modal ---
interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Client | null;
  onSubmit: (data: CreateClientData) => void;
  isLoading?: boolean;
}

function ClientFormModal({ isOpen, onClose, initialData, onSubmit, isLoading }: ClientFormModalProps) {
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    notes: '',
  });

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: initialData.address || '',
          contactPerson: initialData.contactPerson || '',
          notes: initialData.notes || '',
        });
      } else {
        setFormData({ name: '', email: '', phone: '', address: '', contactPerson: '', notes: '' });
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      contactPerson: formData.contactPerson || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Client' : 'New Client'}
      icon={<Building2 size={18} />}
      size="md"
      footer={
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="client-form" isLoading={isLoading}>
            {initialData ? 'Save Changes' : 'Create Client'}
          </Button>
        </ModalActions>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Company Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Astoria Hotels S.A."
          required
          leftIcon={<Building2 size={16} />}
        />
        <Input
          label="Contact Person"
          value={formData.contactPerson}
          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          placeholder="John Smith"
          leftIcon={<UserCircle size={16} />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="info@company.com"
            leftIcon={<Mail size={16} />}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+30 210 1234567"
            leftIcon={<Phone size={16} />}
          />
        </div>
        <Input
          label="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="123 Business Ave, Athens"
          leftIcon={<MapPin size={16} />}
        />
        <Textarea
          label="Notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
        />
      </form>
    </Modal>
  );
}
