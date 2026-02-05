import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Layers,
  Box,
  ClipboardCheck,
  AlertTriangle,
  Package,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Book,
  Tags,
  Clock,
  ListFilter,
  ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
}

// Navigation will be built dynamically to include live badge counts
const getNavigation = (openIssuesCount: number): NavSection[] => [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    ],
  },
  {
    title: 'Project',
    items: [
      { label: 'Projects', icon: <FolderKanban size={20} />, href: '/projects' },
      { label: 'Buildings', icon: <Building2 size={20} />, href: '/buildings' },
      { label: 'Floors', icon: <Layers size={20} />, href: '/floors' },
      { label: 'Assets', icon: <Box size={20} />, href: '/assets' },
    ],
  },
  {
    title: 'Field Work',
    items: [
      { label: 'Checklists', icon: <ClipboardCheck size={20} />, href: '/checklists' },
      { label: 'Issues', icon: <AlertTriangle size={20} />, href: '/issues', badge: openIssuesCount > 0 ? openIssuesCount : undefined },
      { label: 'Inventory', icon: <Package size={20} />, href: '/inventory' },
      { label: 'Time Tracking', icon: <Clock size={20} />, href: '/time-tracking' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Reports', icon: <FileText size={20} />, href: '/reports' },
      { label: 'Labels', icon: <Tags size={20} />, href: '/labels' },
    ],
  },
  {
    title: 'Help',
    items: [
      { label: 'Manual', icon: <Book size={20} />, href: '/manual' },
    ],
  },
  {
    title: 'Admin',
    adminOnly: true,
    items: [
      { label: 'Users', icon: <Users size={20} />, href: '/users', adminOnly: true },
      { label: 'Dropdowns', icon: <ListFilter size={20} />, href: '/lookups', adminOnly: true },
      { label: 'Templates', icon: <ClipboardList size={20} />, href: '/checklist-templates', adminOnly: true },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  // Fetch open issues count
  const { data: openIssuesCount = 0 } = useQuery({
    queryKey: ['open-issues-count'],
    queryFn: async () => {
      const response = await api.get<{ issues: Array<{ id: string }> }>('/issues?status=OPEN');
      return response.issues.length;
    },
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refresh every minute
  });

  const handleToggle = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    onCollapsedChange?.(newValue);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get navigation with dynamic badge counts and filter based on user role
  const navigation = getNavigation(openIssuesCount);
  const filteredNavigation = navigation.filter(
    (section) => !section.adminOnly || isAdmin
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-background border-r border-surface-border',
        'flex flex-col transition-all duration-300 z-40',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-surface-border">
        {!isCollapsed && (
          <span className="text-h3 font-bold text-primary">Synax</span>
        )}
        <button
          onClick={handleToggle}
          className="p-2 rounded-md hover:bg-surface-hover text-text-secondary"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {filteredNavigation.map((section) => (
          <div key={section.title} className="mb-4">
            {!isCollapsed && (
              <div className="px-4 py-2 text-caption text-text-tertiary uppercase tracking-wider">
                {section.title}
              </div>
            )}
            <ul className="space-y-1 px-2">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                        'text-body text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                        isActive && 'bg-surface-hover text-primary border-l-2 border-primary',
                        isCollapsed && 'justify-center'
                      )
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="bg-error text-white text-tiny px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-surface-border p-2">
        <NavLink
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
            'text-body text-text-secondary hover:bg-surface-hover hover:text-text-primary',
            isCollapsed && 'justify-center'
          )}
        >
          <Settings size={20} />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
            'text-body text-text-secondary hover:bg-surface-hover hover:text-error',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
