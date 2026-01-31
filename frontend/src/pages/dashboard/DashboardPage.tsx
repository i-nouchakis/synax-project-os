import { useEffect, useState } from 'react';
import {
  FolderKanban,
  Layers,
  Box,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { projectService } from '@/services/project.service';
import type { Project, ProjectStatus } from '@/services/project.service';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalFloors: number;
  totalRooms: number;
  totalAssets: number;
  openIssues: number;
  resolvedIssues: number;
  totalIssues: number;
  completedChecklists: number;
  totalChecklists: number;
  checklistCompletionRate: number;
}

interface ActivityItem {
  id: string;
  type: 'checklist' | 'issue' | 'asset' | 'project';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  priority?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  iconColor: string;
  loading?: boolean;
}

function StatCard({ title, value, change, changeType = 'neutral', icon, iconColor, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-caption text-text-secondary">{title}</p>
            {loading ? (
              <Loader2 size={24} className="animate-spin text-text-tertiary mt-2" />
            ) : (
              <>
                <p className="text-h1 mt-1">{value}</p>
                {change && (
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp
                      size={14}
                      className={cn(
                        changeType === 'positive' && 'text-success',
                        changeType === 'negative' && 'text-error rotate-180',
                        changeType === 'neutral' && 'text-text-tertiary'
                      )}
                    />
                    <span
                      className={cn(
                        'text-caption',
                        changeType === 'positive' && 'text-success',
                        changeType === 'negative' && 'text-error',
                        changeType === 'neutral' && 'text-text-tertiary'
                      )}
                    >
                      {change}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', iconColor)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('el-GR');
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] || 'User';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, activityRes, projectsData] = await Promise.all([
          api.get<{ stats: DashboardStats }>('/dashboard/stats'),
          api.get<{ activities: ActivityItem[] }>('/dashboard/activity'),
          projectService.getAll(),
        ]);
        setStats(statsRes.stats);
        setActivities(activityRes.activities);
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'PLANNING':
        return 'bg-info/20 text-info';
      case 'IN_PROGRESS':
        return 'bg-primary/20 text-primary';
      case 'ON_HOLD':
        return 'bg-warning/20 text-warning';
      case 'COMPLETED':
        return 'bg-success/20 text-success';
      case 'ARCHIVED':
        return 'bg-surface-hover text-text-tertiary';
      default:
        return 'bg-surface-hover text-text-secondary';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'PLANNING':
        return 'Planning';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'ON_HOLD':
        return 'On Hold';
      case 'COMPLETED':
        return 'Completed';
      case 'ARCHIVED':
        return 'Archived';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h1">Dashboard</h1>
        <p className="text-body text-text-secondary mt-1">
          Welcome back, {firstName}! Here's what's happening with your projects.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={stats?.activeProjects ?? '-'}
          change={stats ? `${stats.totalProjects} total` : undefined}
          changeType="neutral"
          icon={<FolderKanban size={24} className="text-primary" />}
          iconColor="bg-primary/10"
          loading={loading}
        />
        <StatCard
          title="Total Floors"
          value={stats?.totalFloors ?? '-'}
          change={stats ? `${stats.totalRooms} rooms` : undefined}
          changeType="neutral"
          icon={<Layers size={24} className="text-info" />}
          iconColor="bg-info/10"
          loading={loading}
        />
        <StatCard
          title="Assets Installed"
          value={stats?.totalAssets ?? '-'}
          change={stats ? `${stats.checklistCompletionRate}% complete` : undefined}
          changeType="neutral"
          icon={<Box size={24} className="text-success" />}
          iconColor="bg-success/10"
          loading={loading}
        />
        <StatCard
          title="Open Issues"
          value={stats?.openIssues ?? '-'}
          change={stats ? `${stats.resolvedIssues} resolved` : undefined}
          changeType={stats && stats.openIssues > 0 ? 'negative' : 'positive'}
          icon={<AlertTriangle size={24} className="text-warning" />}
          iconColor="bg-warning/10"
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-text-tertiary" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                No recent activity
              </div>
            ) : (
              <div className="divide-y divide-surface-border max-h-[400px] overflow-y-auto">
                {activities.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-4 p-4 hover:bg-surface-hover transition-colors">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        activity.type === 'checklist' && 'bg-success/10',
                        activity.type === 'issue' && 'bg-error/10',
                        activity.type === 'asset' && 'bg-info/10',
                        activity.type === 'project' && 'bg-primary/10'
                      )}
                    >
                      {activity.type === 'checklist' && <CheckCircle2 size={18} className="text-success" />}
                      {activity.type === 'issue' && <AlertTriangle size={18} className="text-error" />}
                      {activity.type === 'asset' && <Box size={18} className="text-info" />}
                      {activity.type === 'project' && <FolderKanban size={18} className="text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-text-primary">{activity.title}</p>
                      <p className="text-body-sm text-text-secondary truncate">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-caption text-text-tertiary">{activity.user}</span>
                        <span className="text-caption text-text-tertiary">-</span>
                        <span className="text-caption text-text-tertiary">{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-text-tertiary" />
              </div>
            ) : (
              <>
                <div>
                  <div className="flex justify-between text-body-sm mb-2">
                    <span className="text-text-secondary">Checklists Completed</span>
                    <span className="text-text-primary font-medium">
                      {stats?.completedChecklists ?? 0} / {stats?.totalChecklists ?? 0}
                    </span>
                  </div>
                  <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all duration-500"
                      style={{ width: `${stats?.checklistCompletionRate ?? 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-body-sm mb-2">
                    <span className="text-text-secondary">Issues Resolved</span>
                    <span className="text-text-primary font-medium">
                      {stats?.resolvedIssues ?? 0} / {stats?.totalIssues ?? 0}
                    </span>
                  </div>
                  <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className="h-full bg-warning rounded-full transition-all duration-500"
                      style={{
                        width: `${stats?.totalIssues ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-border">
                  <h4 className="text-body font-medium mb-3">Summary</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-text-secondary flex items-center gap-2">
                        <FolderKanban size={14} className="text-primary" />
                        Projects
                      </span>
                      <span className="text-text-primary">{stats?.totalProjects ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-text-secondary flex items-center gap-2">
                        <Layers size={14} className="text-info" />
                        Floors
                      </span>
                      <span className="text-text-primary">{stats?.totalFloors ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-text-secondary flex items-center gap-2">
                        <Box size={14} className="text-success" />
                        Assets
                      </span>
                      <span className="text-text-primary">{stats?.totalAssets ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-text-secondary flex items-center gap-2">
                        <Clock size={14} className="text-warning" />
                        Open Issues
                      </span>
                      <span className="text-text-primary">{stats?.openIssues ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Projects List */}
                <div className="pt-4 border-t border-surface-border">
                  <h4 className="text-body font-medium mb-3">Projects</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {projects.length === 0 ? (
                      <p className="text-body-sm text-text-tertiary">No projects yet</p>
                    ) : (
                      projects.map((project) => (
                        <Link
                          key={project.id}
                          to={`/projects/${project.id}`}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FolderKanban size={14} className="text-primary flex-shrink-0" />
                            <span className="text-body-sm text-text-primary truncate group-hover:text-primary">
                              {project.name}
                            </span>
                          </div>
                          <span
                            className={cn(
                              'text-caption px-2 py-0.5 rounded-full flex-shrink-0',
                              getStatusColor(project.status)
                            )}
                          >
                            {getStatusLabel(project.status)}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
