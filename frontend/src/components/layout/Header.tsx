import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Bell, Wifi, WifiOff, RefreshCw, LogOut, User, Settings, CloudOff, QrCode, AlertTriangle, CheckCircle2, Box, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { QRScannerModal } from '@/components/qr';
import { useAuthStore } from '@/stores/auth.store';
import { useOfflineStore } from '@/stores/offline.store';
import { api } from '@/lib/api';

interface HeaderProps {
  sidebarCollapsed?: boolean;
}

interface ActivityItem {
  id: string;
  type: 'issue' | 'checklist' | 'asset';
  title: string;
  description: string;
  timestamp: string;
  projectName?: string;
}

export function Header({ sidebarCollapsed = false }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isOnline, isSyncing, pendingMutations, syncNow } = useOfflineStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Fetch recent activity
  const { data: activityData } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => api.get<{ items: ActivityItem[] }>('/dashboard/activity'),
    staleTime: 30000, // 30 seconds
  });

  const notifications = activityData?.items?.slice(0, 5) || [];

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user initials
  const getInitials = (name: string | undefined | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format role for display
  const formatRole = (role: string | undefined) => {
    if (!role) return '';
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'issue':
        return <AlertTriangle size={16} className="text-warning" />;
      case 'checklist':
        return <CheckCircle2 size={16} className="text-success" />;
      case 'asset':
        return <Box size={16} className="text-primary" />;
      default:
        return <Clock size={16} className="text-text-tertiary" />;
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-background/95 backdrop-blur border-b border-surface-border',
        'flex items-center justify-between px-6 z-30 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
          <input
            type="text"
            placeholder="Search projects, assets, issues..."
            className="w-full bg-surface border border-surface-border rounded-md pl-10 pr-4 py-2 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-tiny text-text-tertiary bg-background px-1.5 py-0.5 rounded border border-surface-border">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Sync Status */}
        <div className="flex items-center gap-2">
          {isSyncing ? (
            <Badge variant="primary" size="sm" dot>
              <RefreshCw size={14} className="animate-spin mr-1" />
              Syncing...
            </Badge>
          ) : !isOnline ? (
            <Badge variant="warning" size="sm" dot>
              <WifiOff size={14} className="mr-1" />
              Offline
              {pendingMutations > 0 && ` (${pendingMutations})`}
            </Badge>
          ) : pendingMutations > 0 ? (
            <button onClick={() => syncNow()} className="focus:outline-none">
              <Badge variant="warning" size="sm" dot>
                <CloudOff size={14} className="mr-1" />
                {pendingMutations} pending
              </Badge>
            </button>
          ) : (
            <Badge variant="success" size="sm" dot>
              <Wifi size={14} className="mr-1" />
              Synced
            </Badge>
          )}
        </div>

        {/* QR Scanner */}
        <button
          onClick={() => setShowQRScanner(true)}
          className="p-2 rounded-md hover:bg-surface-hover text-text-secondary"
          title="Scan QR Code"
        >
          <QrCode size={20} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-md hover:bg-surface-hover text-text-secondary"
            title="Notifications"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-surface-border rounded-lg shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
                <span className="text-body-sm font-medium text-text-primary">Recent Activity</span>
                {notifications.length > 0 && (
                  <span className="text-caption text-text-tertiary">{notifications.length} new</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={24} className="mx-auto text-text-tertiary mb-2" />
                    <p className="text-body-sm text-text-tertiary">No recent activity</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setShowNotifications(false);
                        if (item.type === 'issue') navigate('/issues');
                        else if (item.type === 'asset') navigate('/assets');
                        else if (item.type === 'checklist') navigate('/checklists');
                      }}
                      className="w-full px-4 py-3 flex items-start gap-3 hover:bg-surface-hover border-b border-surface-border/50 last:border-0 text-left"
                    >
                      <div className="mt-0.5">{getActivityIcon(item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm text-text-primary truncate">{item.title}</p>
                        <p className="text-caption text-text-tertiary truncate">{item.description}</p>
                        {item.projectName && (
                          <p className="text-caption text-text-tertiary mt-1">{item.projectName}</p>
                        )}
                      </div>
                      <span className="text-tiny text-text-tertiary whitespace-nowrap">
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-surface-border">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/dashboard');
                    }}
                    className="w-full text-center text-body-sm text-primary hover:text-primary-600"
                  >
                    View all activity
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-surface-hover"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-text-inverse font-medium text-body-sm">
              {user ? getInitials(user.name) : '?'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-body-sm text-text-primary">{user?.name || 'Guest'}</div>
              <div className="text-caption text-text-tertiary">
                {user?.role ? formatRole(user.role) : ''}
              </div>
            </div>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-surface-border rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-border">
                <p className="text-body-sm text-text-primary font-medium">{user?.name}</p>
                <p className="text-caption text-text-tertiary">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-body-sm text-text-secondary hover:bg-surface-hover"
                >
                  <User size={16} />
                  Profile
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-body-sm text-text-secondary hover:bg-surface-hover"
                >
                  <Settings size={16} />
                  Settings
                </button>
              </div>
              <div className="border-t border-surface-border py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-body-sm text-error hover:bg-surface-hover"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
      />
    </header>
  );
}
