import { useEffect, useState } from 'react';
import {
  FolderKanban,
  Layers,
  Box,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  dashboardService,
  type DashboardStats,
  type ActivityItem,
  type DashboardCharts,
} from '@/services/dashboard.service';
import { IssuesPriorityChart } from '@/components/dashboard/IssuesPriorityChart';
import { AssetPipelineChart } from '@/components/dashboard/AssetPipelineChart';
import { RoomProgressChart } from '@/components/dashboard/RoomProgressChart';
import { FloorProgressChart } from '@/components/dashboard/FloorProgressChart';
import { ChecklistProgressChart } from '@/components/dashboard/ChecklistProgressChart';
import { ProjectProgressChart } from '@/components/dashboard/ProjectProgressChart';
import { ProjectsTable } from '@/components/dashboard/ProjectsTable';

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
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsData, activityData, chartsData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getActivity(),
          dashboardService.getCharts(),
        ]);
        setStats(statsData);
        setActivities(activityData);
        setCharts(chartsData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h1">Dashboard</h1>
        <p className="text-body text-text-secondary mt-1">
          Welcome back, {firstName}! Here's what's happening with your projects.
        </p>
      </div>

      {/* ROW 1: Stats Grid */}
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
          change={stats ? `${stats.checklistCompletionRate}% checked` : undefined}
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

      {/* ROW 2: Project Progress + Issue Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[260px]">
                <Loader2 size={24} className="animate-spin text-text-tertiary" />
              </div>
            ) : (
              <ProjectProgressChart data={charts?.projectStatusBreakdown} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Issues by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[220px]">
                <Loader2 size={24} className="animate-spin text-text-tertiary" />
              </div>
            ) : (
              <IssuesPriorityChart data={charts?.issuesByPriority} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ROW 3: Four Metric Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Asset Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[220px]">
                <Loader2 size={24} className="animate-spin text-text-tertiary" />
              </div>
            ) : (
              <AssetPipelineChart data={charts?.assetsByStatus} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Floor Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[220px]">
                <Loader2 size={24} className="animate-spin text-text-tertiary" />
              </div>
            ) : (
              <FloorProgressChart data={charts?.floorsByProgress} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Room Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[220px]">
                <Loader2 size={24} className="animate-spin text-text-tertiary" />
              </div>
            ) : (
              <RoomProgressChart data={charts?.roomsByStatus} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Checklist Completion</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[220px]">
                <Loader2 size={24} className="animate-spin text-text-tertiary" />
              </div>
            ) : (
              <ChecklistProgressChart data={charts?.checklistProgress} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ROW 4: Activity Feed + Projects Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <Card className="self-start">
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
                  <div key={`${activity.type}-${activity.id}`} className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors">
                    <div
                      className={cn(
                        'p-1.5 rounded-md mt-0.5',
                        activity.type === 'checklist' && 'bg-success/10',
                        activity.type === 'issue' && 'bg-error/10',
                        activity.type === 'asset' && 'bg-info/10',
                        activity.type === 'project' && 'bg-primary/10'
                      )}
                    >
                      {activity.type === 'checklist' && <CheckCircle2 size={16} className="text-success" />}
                      {activity.type === 'issue' && <AlertTriangle size={16} className="text-error" />}
                      {activity.type === 'asset' && <Box size={16} className="text-info" />}
                      {activity.type === 'project' && <FolderKanban size={16} className="text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-text-primary">{activity.title}</p>
                      <p className="text-caption text-text-secondary truncate">{activity.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-caption text-text-tertiary">{activity.user}</span>
                        <span className="text-caption text-text-tertiary">&middot;</span>
                        <span className="text-caption text-text-tertiary">{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects Overview Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Projects Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-text-tertiary" />
              </div>
            ) : (
              <ProjectsTable data={charts?.projectStatusBreakdown} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
