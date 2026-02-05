import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Briefcase,
  Wrench,
  Users,
  User,
  Mail,
  Key,
  AlertTriangle,
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
  Input,
  Select,
  Pagination,
  usePagination,
  SortableHeader,
} from '@/components/ui';
import { useSortable } from '@/hooks/useSortable';
import { userService, type CreateUserData, type UpdateUserData } from '@/services/user.service';
import type { User as UserType, UserRole } from '@/stores/auth.store';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const roleOptions = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PM', label: 'Project Manager' },
  { value: 'TECHNICIAN', label: 'Technician' },
  { value: 'CLIENT', label: 'Client' },
];

const roleIcons: Record<UserRole, React.ReactNode> = {
  ADMIN: <Shield size={16} className="text-error" />,
  PM: <Briefcase size={16} className="text-primary" />,
  TECHNICIAN: <Wrench size={16} className="text-warning" />,
  CLIENT: <Users size={16} className="text-info" />,
};

const roleBadgeVariants: Record<UserRole, 'error' | 'primary' | 'warning' | 'info'> = {
  ADMIN: 'error',
  PM: 'primary',
  TECHNICIAN: 'warning',
  CLIENT: 'info',
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserType | null>(null);

  // Fetch users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAll,
  });

  // Sorting
  const { sortedItems: sortedUsers, requestSort, getSortDirection } = useSortable(users);

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedUsers,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(sortedUsers, 25);

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
      toast.success('User created successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create user');
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      toast.success('User updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update user');
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirmUser(null);
      toast.success('User deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete user');
    },
  });

  // Toggle user active status
  const toggleActive = (user: UserType) => {
    updateMutation.mutate({
      id: user.id,
      data: { isActive: !user.isActive },
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-error">Failed to load users. Make sure you have admin access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">User Management</h1>
          <p className="text-body text-text-secondary mt-1">
            Manage system users and their roles
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={18} />}>
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              No users found. Create your first user.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-secondary">
                      <SortableHeader label="User" sortKey="name" direction={getSortDirection('name')} onSort={requestSort} align="left" />
                      <SortableHeader label="Role" sortKey="role" direction={getSortDirection('role')} onSort={requestSort} align="left" />
                      <SortableHeader label="Status" sortKey="isActive" direction={getSortDirection('isActive')} onSort={requestSort} align="left" />
                      <SortableHeader label="Created" sortKey="createdAt" direction={getSortDirection('createdAt')} onSort={requestSort} align="left" />
                      <th className="text-right text-caption font-medium text-text-secondary px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-surface-border hover:bg-surface-hover transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                              {(user.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-body font-medium text-text-primary">{user.name || 'Unknown'}</p>
                              <p className="text-caption text-text-tertiary">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={roleBadgeVariants[user.role]} size="sm">
                            <span className="flex items-center gap-1.5">
                              {roleIcons[user.role]}
                              {user.role}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={user.isActive ? 'success' : 'default'} size="sm">
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-body-sm text-text-secondary">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => toggleActive(user)}
                              className={cn(
                                'p-2 rounded hover:bg-surface-hover',
                                user.isActive ? 'text-warning' : 'text-success'
                              )}
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {user.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                            </button>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-2 rounded hover:bg-surface-hover text-text-secondary"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmUser(user)}
                              className="p-2 rounded hover:bg-surface-hover text-error"
                              title="Delete"
                              disabled={user.id === currentUser?.id}
                            >
                              <Trash2 size={18} className={user.id === currentUser?.id ? 'opacity-30' : ''} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          onSubmit={(data) => updateMutation.mutate({ id: editingUser.id, data })}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <Modal
          isOpen={!!deleteConfirmUser}
          onClose={() => setDeleteConfirmUser(null)}
          title="Delete User"
          icon={<AlertTriangle size={18} />}
          size="sm"
          footer={
            <ModalActions>
              <Button variant="secondary" onClick={() => setDeleteConfirmUser(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(deleteConfirmUser.id)}
                isLoading={deleteMutation.isPending}
              >
                Delete User
              </Button>
            </ModalActions>
          }
        >
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-error" />
            </div>
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete <strong className="text-text-primary">{deleteConfirmUser.name}</strong>?
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              This action cannot be undone.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ========================================
   Create User Modal
   ======================================== */

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserData) => void;
  isLoading: boolean;
}

function CreateUserModal({ isOpen, onClose, onSubmit, isLoading }: CreateUserModalProps) {
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    role: 'TECHNICIAN',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ email: '', password: '', name: '', role: 'TECHNICIAN' });
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New User"
      icon={<User size={18} />}
      size="md"
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-user-form" isLoading={isLoading}>
            Create User
          </Button>
        </ModalActions>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit} className="space-y-5">
        <ModalSection title="Account Information" icon={<User size={14} />}>
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
              leftIcon={<User size={16} />}
            />
            <Input
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
              leftIcon={<Mail size={16} />}
            />
          </div>
        </ModalSection>

        <ModalSection title="Security & Role" icon={<Key size={14} />}>
          <div className="space-y-4">
            <Input
              type="password"
              label="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 6 characters"
              required
              leftIcon={<Key size={16} />}
            />
            <Select
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={roleOptions}
            />
          </div>
        </ModalSection>
      </form>
    </Modal>
  );
}

/* ========================================
   Edit User Modal
   ======================================== */

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  onSubmit: (data: UpdateUserData) => void;
  isLoading: boolean;
}

function EditUserModal({ isOpen, onClose, user, onSubmit, isLoading }: EditUserModalProps) {
  const [formData, setFormData] = useState<UpdateUserData>({
    name: user.name,
    role: user.role,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Update form when user changes
  useEffect(() => {
    setFormData({ name: user.name, role: user.role });
  }, [user]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User"
      icon={<Pencil size={18} />}
      size="md"
      footer={
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-user-form" isLoading={isLoading}>
            Save Changes
          </Button>
        </ModalActions>
      }
    >
      <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-5">
        <ModalSection title="User Information" icon={<User size={14} />}>
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
              leftIcon={<User size={16} />}
            />
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Email Address
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-background border border-surface-border rounded-lg text-sm text-text-tertiary">
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              <p className="text-xs text-text-tertiary mt-1">Email cannot be changed</p>
            </div>
          </div>
        </ModalSection>

        <ModalSection title="Role & Permissions" icon={<Shield size={14} />}>
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            options={roleOptions}
          />
        </ModalSection>
      </form>
    </Modal>
  );
}
