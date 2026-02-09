import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearchStore } from '@/stores/search.store';
import { useNotificationStore } from '@/stores/notification.store';
import { Search, Bell, Wifi, WifiOff, RefreshCw, LogOut, User, Settings, CloudOff, QrCode, AlertTriangle, CheckCircle2, ListChecks, MessageSquare, Menu, Check, X, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { QRScannerModal } from '@/components/qr';
import { useAuthStore } from '@/stores/auth.store';
import { useOfflineStore } from '@/stores/offline.store';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  isMobile?: boolean;
  onToggleMobileSidebar?: () => void;
}

// Get search placeholder based on current route
const getSearchPlaceholder = (pathname: string): string => {
  if (pathname.startsWith('/clients')) return 'Search clients...';
  if (pathname.startsWith('/calendar')) return 'Search events...';
  if (pathname.startsWith('/messenger')) return 'Search conversations...';
  if (pathname.startsWith('/projects')) return 'Search projects...';
  if (pathname.startsWith('/buildings')) return 'Search buildings...';
  if (pathname.startsWith('/floors')) return 'Search floors...';
  if (pathname.startsWith('/rooms')) return 'Search rooms...';
  if (pathname.startsWith('/assets')) return 'Search assets...';
  if (pathname.startsWith('/inventory')) return 'Search inventory...';
  if (pathname.startsWith('/issues')) return 'Search issues...';
  if (pathname.startsWith('/checklists')) return 'Search checklists...';
  if (pathname.startsWith('/checklist-templates')) return 'Search templates...';
  return 'Search...';
};

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  ISSUE_CREATED: <AlertTriangle size={16} className="text-warning" />,
  TASK_ASSIGNED: <ListChecks size={16} className="text-primary" />,
  COMMENT_ADDED: <MessageSquare size={16} className="text-info" />,
  CHECKLIST_COMPLETED: <CheckCircle2 size={16} className="text-success" />,
};

export function Header({ sidebarCollapsed = false, isMobile = false, onToggleMobileSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { query, setQuery } = useSearchStore();
  const { user, logout } = useAuthStore();
  const { isOnline, isSyncing, pendingMutations, syncNow } = useOfflineStore();
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<typeof notifications[0] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Clear search when navigating to different section
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    const prevSection = prevPathRef.current.split('/')[1];
    const currentSection = location.pathname.split('/')[1];
    if (prevSection !== currentSection) {
      setQuery('');
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, setQuery]);

  // Fetch notifications on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  // Refresh when dropdown opens
  useEffect(() => {
    if (showNotifications) fetchNotifications();
  }, [showNotifications, fetchNotifications]);

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

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatRole = (role: string | undefined) => {
    if (!role) return '';
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

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

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.read) markAsRead(notification.id);
    setSelectedNotification(notification);
    setShowNotifications(false);
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-background/95 backdrop-blur border-b border-surface-border',
        'flex items-center justify-between px-4 md:px-6 z-30 transition-all duration-300',
        isMobile ? 'left-0' : sidebarCollapsed ? 'left-16' : 'left-64'
      )}
    >
      {/* Hamburger menu (mobile only) */}
      {isMobile && (
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 mr-2 rounded-md hover:bg-surface-hover text-text-secondary"
          title="Menu"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={getSearchPlaceholder(location.pathname)}
            className="w-full bg-surface border border-surface-border rounded-md pl-10 pr-4 py-2 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Sync Status */}
        <div className="hidden sm:flex items-center gap-2">
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
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-error text-white text-[10px] font-bold rounded-full px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-surface-border rounded-lg shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
                <span className="text-body-sm font-medium text-text-primary">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="flex items-center gap-1 text-caption text-primary hover:text-primary-600 transition-colors"
                  >
                    <Check size={12} />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={24} className="mx-auto text-text-tertiary mb-2" />
                    <p className="text-body-sm text-text-tertiary">No notifications</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={cn(
                        'w-full px-4 py-3 flex items-start gap-3 hover:bg-surface-hover border-b border-surface-border/50 last:border-0 text-left transition-colors',
                        !item.read && 'bg-primary/5'
                      )}
                    >
                      <div className="mt-0.5">
                        {NOTIFICATION_ICONS[item.type] || <Bell size={16} className="text-text-tertiary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            'text-body-sm truncate',
                            !item.read ? 'text-text-primary font-medium' : 'text-text-secondary'
                          )}>
                            {item.title}
                          </p>
                          {!item.read && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-caption text-text-tertiary truncate">{item.message}</p>
                      </div>
                      <span className="text-tiny text-text-tertiary whitespace-nowrap">
                        {formatTimeAgo(item.createdAt)}
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

      {/* Notification Detail Popup */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedNotification(null)}
          />
          {/* Popup */}
          <div className="relative w-full max-w-md mx-4 bg-surface border border-surface-border rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-secondary flex items-center justify-center">
                  {NOTIFICATION_ICONS[selectedNotification.type] || <Bell size={18} className="text-text-tertiary" />}
                </div>
                <div>
                  <p className="text-caption text-text-tertiary uppercase tracking-wider">
                    {selectedNotification.type === 'ISSUE_CREATED' ? 'Issue Created' :
                     selectedNotification.type === 'TASK_ASSIGNED' ? 'Task Assigned' :
                     selectedNotification.type === 'COMMENT_ADDED' ? 'Comment Added' :
                     selectedNotification.type === 'CHECKLIST_COMPLETED' ? 'Checklist Completed' :
                     selectedNotification.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1.5 rounded-md hover:bg-surface-hover text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              <h3 className="text-body font-semibold text-text-primary">
                {selectedNotification.title}
              </h3>
              <p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {selectedNotification.message}
              </p>
              <div className="flex items-center gap-1.5 text-caption text-text-tertiary">
                <Clock size={13} />
                <span>{formatTimeAgo(selectedNotification.createdAt)}</span>
                <span className="mx-1">·</span>
                <span>{new Date(selectedNotification.createdAt).toLocaleString('el-GR')}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-surface-border">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 text-body-sm text-text-secondary rounded-lg hover:bg-surface-hover transition-colors"
              >
                Close
              </button>
              {selectedNotification.link && (
                <button
                  onClick={() => {
                    const link = selectedNotification.link!;
                    setSelectedNotification(null);
                    navigate(link);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-body-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink size={14} />
                  Go to
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
      />
    </header>
  );
}
