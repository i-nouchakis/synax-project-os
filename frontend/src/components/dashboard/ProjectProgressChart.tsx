import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CHART_COLORS, TOOLTIP_STYLE } from './chart-theme';
import type { ProjectStatusItem } from '@/services/dashboard.service';

interface Props {
  data?: ProjectStatusItem[];
}

export function ProjectProgressChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[260px] text-text-tertiary">
        <p className="text-body-sm">No projects</p>
      </div>
    );
  }

  const chartData = data
    .filter(p => p.roomsTotal > 0)
    .map(p => ({
      name: p.name.length > 22 ? p.name.slice(0, 20) + '...' : p.name,
      Completed: p.roomsCompleted,
      'In Progress': p.roomsInProgress,
      'Not Started': p.roomsTotal - p.roomsCompleted - p.roomsInProgress - p.roomsBlocked,
      Blocked: p.roomsBlocked,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[260px] text-text-tertiary">
        <p className="text-body-sm">No room data yet</p>
      </div>
    );
  }

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid horizontal={false} stroke="#30363d" strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip {...TOOLTIP_STYLE} />
          <Bar dataKey="Completed" stackId="rooms" fill={CHART_COLORS.primary} barSize={14} />
          <Bar dataKey="In Progress" stackId="rooms" fill={CHART_COLORS.primaryMuted} />
          <Bar dataKey="Not Started" stackId="rooms" fill={CHART_COLORS.grayFaint} />
          <Bar dataKey="Blocked" stackId="rooms" fill={CHART_COLORS.danger} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
