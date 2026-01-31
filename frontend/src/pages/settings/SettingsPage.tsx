import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  User,
  Lock,
  Bell,
  Palette,
  Building2,
  Key,
  Camera,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Copy,
  Check,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Button,
  Badge,
  Modal,
  ModalSection,
  ModalActions,
} from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { api } from '@/lib/api';

type SettingsTab = 'profile' | 'password' | 'notifications' | 'theme' | 'company' | 'api-keys';

interface NotificationSettings {
  emailOnIssue: boolean;
  emailOnAssignment: boolean;
  emailOnComment: boolean;
  emailDigest: boolean;
}

interface CompanySettings {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

export function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: <User size={18} /> },
    { id: 'password' as const, label: 'Password', icon: <Lock size={18} /> },
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'theme' as const, label: 'Theme', icon: <Palette size={18} /> },
    { id: 'company' as const, label: 'Company', icon: <Building2 size={18} /> },
    { id: 'api-keys' as const, label: 'API Keys', icon: <Key size={18} /> },
  ];

  // Only show company and API keys for admin
  const visibleTabs = user?.role === 'ADMIN'
    ? tabs
    : tabs.filter(t => !['company', 'api-keys'].includes(t.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1">Settings</h1>
        <p className="text-body text-text-secondary">
          Manage your account and application settings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }`}
                  >
                    {tab.icon}
                    <span className="text-body">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'password' && <PasswordSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'theme' && <ThemeSettings />}
          {activeTab === 'company' && <CompanySettings />}
          {activeTab === 'api-keys' && <ApiKeysSettings />}
        </div>
      </div>
    </div>
  );
}

// Profile Settings Component
function ProfileSettings() {
  const { user, checkAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      return api.put('/users/profile', data);
    },
    onSuccess: () => {
      checkAuth();
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('synax_token')}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      checkAuth();
      toast.success('Avatar updated!');
    },
    onError: (error) => {
      toast.error('Failed to upload avatar: ' + (error instanceof Error ? error.message : 'Unknown error'));
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
    if (avatarFile) {
      uploadAvatarMutation.mutate(avatarFile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User size={20} />
          Profile Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || '?'
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-surface border border-surface-border rounded-full cursor-pointer hover:bg-surface-hover">
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="text-body font-medium text-text-primary">{user?.name}</p>
              <p className="text-body-sm text-text-secondary">{user?.email}</p>
              <Badge variant="primary" size="sm" className="mt-1">{user?.role}</Badge>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <Button
            type="submit"
            leftIcon={<Save size={18} />}
            isLoading={updateProfileMutation.isPending || uploadAvatarMutation.isPending}
          >
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Password Settings Component
function PasswordSettings() {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return api.put('/users/password', data);
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      toast.error('Failed to change password: ' + (error instanceof Error ? error.message : 'Unknown error'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock size={20} />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type={showPasswords.current ? 'text' : 'password'}
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="text-text-tertiary hover:text-text-primary"
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <Input
            label="New Password"
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="text-text-tertiary hover:text-text-primary"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <Input
            label="Confirm New Password"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="text-text-tertiary hover:text-text-primary"
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <Button
            type="submit"
            leftIcon={<Save size={18} />}
            isLoading={changePasswordMutation.isPending}
          >
            Change Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Notification Settings Component
function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailOnIssue: true,
    emailOnAssignment: true,
    emailOnComment: false,
    emailDigest: true,
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      return api.put('/users/notifications', data);
    },
    onSuccess: () => {
      toast.success('Notification settings saved!');
    },
    onError: (error) => {
      toast.error('Failed to save notifications: ' + (error instanceof Error ? error.message : 'Unknown error'));
    },
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleSave = () => {
    updateNotificationsMutation.mutate(settings);
  };

  const notificationOptions = [
    { key: 'emailOnIssue' as const, label: 'New Issue Created', description: 'Get notified when a new issue is created in your projects' },
    { key: 'emailOnAssignment' as const, label: 'Task Assignment', description: 'Get notified when you are assigned to a task or checklist' },
    { key: 'emailOnComment' as const, label: 'Comments', description: 'Get notified when someone comments on your issues' },
    { key: 'emailDigest' as const, label: 'Weekly Digest', description: 'Receive a weekly summary of project activity' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={20} />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notificationOptions.map((option) => (
            <div
              key={option.key}
              className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg"
            >
              <div>
                <p className="text-body font-medium text-text-primary">{option.label}</p>
                <p className="text-body-sm text-text-secondary">{option.description}</p>
              </div>
              <button
                onClick={() => handleToggle(option.key)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings[option.key] ? 'bg-primary' : 'bg-surface-border'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings[option.key] ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
          <Button
            onClick={handleSave}
            leftIcon={<Save size={18} />}
            isLoading={updateNotificationsMutation.isPending}
          >
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Theme Settings Component
function ThemeSettings() {
  const { theme, setTheme } = useThemeStore();

  const themes = [
    {
      id: 'dark' as const,
      label: 'Dark',
      description: 'Dark theme for low-light environments',
      icon: <Moon size={24} />,
      preview: 'bg-[#0d1117]',
    },
    {
      id: 'light' as const,
      label: 'Light',
      description: 'Light theme for bright environments',
      icon: <Sun size={24} />,
      preview: 'bg-[#f8fafc]',
    },
    {
      id: 'system' as const,
      label: 'System',
      description: 'Follow your system preferences',
      icon: <Monitor size={24} />,
      preview: 'bg-gradient-to-r from-[#0d1117] to-[#f8fafc]',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette size={20} />
          Theme
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-text-secondary mb-6">
          Choose how Synax looks to you. Select a single theme, or sync with your system settings.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                theme === t.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-surface-border hover:border-primary/50'
              }`}
            >
              <div className={`w-full h-20 rounded-md mb-3 ${t.preview} flex items-center justify-center border border-surface-border`}>
                <span className={theme === t.id ? 'text-primary' : 'text-text-tertiary'}>
                  {t.icon}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-body font-medium text-text-primary">{t.label}</p>
                {theme === t.id && (
                  <Check size={16} className="text-primary" />
                )}
              </div>
              <p className="text-caption text-text-secondary">{t.description}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Company Settings Component (Admin only)
function CompanySettings() {
  const [formData, setFormData] = useState({
    name: 'Synax',
    address: '',
    phone: '',
    email: '',
    website: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Fetch current company settings
  const { data: companyData } = useQuery({
    queryKey: ['companySettings'],
    queryFn: async () => {
      try {
        return await api.get<{
          name: string;
          logo: string | null;
          address: string;
          phone: string;
          email: string;
          website: string;
        }>('/settings/company');
      } catch {
        return null;
      }
    },
  });

  // Update form when data loads
  if (companyData && !logoPreview && companyData.logo) {
    setLogoPreview(companyData.logo);
  }

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.put('/settings/company', data);
    },
    onSuccess: () => {
      toast.success('Company settings saved!');
    },
    onError: (error) => {
      toast.error('Failed to save company settings: ' + (error instanceof Error ? error.message : 'Unknown error'));
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/settings/company/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('synax_token')}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data) => {
      setLogoPreview(data.logo);
      toast.success('Logo uploaded successfully!');
    },
    onError: (error) => {
      toast.error('Failed to upload logo: ' + (error instanceof Error ? error.message : 'Unknown error'));
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Upload to server
      uploadLogoMutation.mutate(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 size={20} />
          Company Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo */}
          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-2">
              Company Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 rounded-lg bg-surface-secondary border-2 border-dashed border-surface-border flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 size={40} className="text-text-tertiary" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Camera size={16} />}
                  isLoading={uploadLogoMutation.isPending}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  Upload Logo
                </Button>
                <p className="text-caption text-text-tertiary mt-2">
                  Recommended: 512x512px PNG or SVG
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <div className="md:col-span-2">
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <Button
            type="submit"
            leftIcon={<Save size={18} />}
            isLoading={updateCompanyMutation.isPending}
          >
            Save Company Info
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// API Keys Settings Component (Admin only)
function ApiKeysSettings() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: async () => {
      try {
        const response = await api.get<ApiKey[]>('/settings/api-keys');
        return response;
      } catch {
        return [];
      }
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      return api.post<{ key: ApiKey; secret: string }>('/settings/api-keys', { name });
    },
    onSuccess: (data) => {
      setNewlyCreatedKey(data.secret);
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create API key: ' + (error instanceof Error ? error.message : 'Unknown error'));
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/settings/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete API key: ' + (error instanceof Error ? error.message : 'Unknown error'));
    },
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    createKeyMutation.mutate(newKeyName);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success('API key copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key size={20} />
            API Keys
          </CardTitle>
          <Button
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => {
              setShowCreateModal(true);
              setNewKeyName('');
              setNewlyCreatedKey(null);
            }}
          >
            Create Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-text-secondary mb-4">
          API keys allow external applications to access the Synax API on your behalf.
        </p>

        {apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key size={48} className="mx-auto mb-4 text-text-tertiary opacity-50" />
            <p className="text-body text-text-secondary">No API keys created yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg"
              >
                <div>
                  <p className="text-body font-medium text-text-primary">{key.name}</p>
                  <p className="text-caption text-text-tertiary font-mono">
                    {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                  </p>
                  <p className="text-caption text-text-tertiary">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsed && ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Delete this API key? This action cannot be undone.')) {
                      deleteKeyMutation.mutate(key.id);
                    }
                  }}
                  leftIcon={<Trash2 size={16} />}
                  className="text-error hover:bg-error/10"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Key Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={newlyCreatedKey ? 'API Key Created' : 'Create API Key'}
        icon={<Key size={18} />}
        size="md"
        footer={
          newlyCreatedKey ? (
            <ModalActions>
              <Button onClick={() => setShowCreateModal(false)}>
                Done
              </Button>
            </ModalActions>
          ) : (
            <ModalActions>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateKey}
                isLoading={createKeyMutation.isPending}
                disabled={!newKeyName.trim()}
              >
                Create Key
              </Button>
            </ModalActions>
          )
        }
      >
        {newlyCreatedKey ? (
          <div className="space-y-5">
            <ModalSection title="Important" icon={<Key size={14} />}>
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-body-sm text-warning font-medium">
                  Copy your API key now. You won't be able to see it again!
                </p>
              </div>
            </ModalSection>

            <ModalSection title="Your API Key" icon={<Key size={14} />}>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-background rounded font-mono text-sm break-all">
                  {newlyCreatedKey}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopyKey(newlyCreatedKey)}
                  leftIcon={copiedKey === newlyCreatedKey ? <Check size={16} /> : <Copy size={16} />}
                >
                  {copiedKey === newlyCreatedKey ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </ModalSection>
          </div>
        ) : (
          <ModalSection title="Key Details" icon={<Key size={14} />}>
            <Input
              label="Key Name"
              placeholder="e.g., Production Server"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              leftIcon={<Key size={16} />}
            />
            <p className="text-xs text-text-tertiary mt-2">
              Give your API key a descriptive name so you can identify it later.
            </p>
          </ModalSection>
        )}
      </Modal>
    </Card>
  );
}

export default SettingsPage;
