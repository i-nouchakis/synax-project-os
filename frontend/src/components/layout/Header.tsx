import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Wifi, WifiOff, RefreshCw, LogOut, User, Settings, CloudOff, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { QRScannerModal } from '@/components/qr';
import { useAuthStore } from '@/stores/auth.store';
import { useOfflineStore } from '@/stores/offline.store';

interface HeaderProps {
  sidebarCollapsed?: boolean;
}

export function Header({ sidebarCollapsed = false }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isOnline, isSyncing, pendingMutations, syncNow } = useOfflineStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
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
        <button className="relative p-2 rounded-md hover:bg-surface-hover text-text-secondary">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        </button>

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
