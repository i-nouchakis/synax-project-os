import { CHART_COLORS } from './chart-theme';

interface Props {
  data?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

const SEGMENTS = [
  { key: 'critical', label: 'Critical', color: CHART_COLORS.danger },
  { key: 'high', label: 'High', color: CHART_COLORS.warning },
  { key: 'medium', label: 'Medium', color: CHART_COLORS.primaryMuted },
  { key: 'low', label: 'Low', color: CHART_COLORS.grayFaint },
] as const;

export function IssuesPriorityChart({ data }: Props) {
  if (!data) return null;

  const total = data.critical + data.high + data.medium + data.low;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[220px] text-text-tertiary">
        <p className="text-body-sm">No issues reported</p>
      </div>
    );
  }

  const max = Math.max(data.critical, data.high, data.medium, data.low);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-h1 text-text-primary">{total}</p>
        <p className="text-caption text-text-tertiary">Total Issues</p>
      </div>

      <div className="space-y-3">
        {SEGMENTS.map(s => {
          const value = data[s.key];
          const pct = max > 0 ? (value / max) * 100 : 0;
          const totalPct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div key={s.key} className="group/bar relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-body-sm text-text-secondary group-hover/bar:text-text-primary transition-colors">{s.label}</span>
                <span className="text-body-sm text-text-primary font-medium">{value}</span>
              </div>
              <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 group-hover/bar:brightness-125"
                  style={{ width: `${pct}%`, backgroundColor: s.color }}
                />
              </div>
              {/* Hover tooltip */}
              <div className="absolute right-0 -top-1 hidden group-hover/bar:block z-10">
                <div className="bg-[#1c2128] border border-surface-border rounded-md px-2 py-0.5 text-caption text-text-primary whitespace-nowrap shadow-lg">
                  {totalPct}% of total
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
