import { CHART_COLORS } from './chart-theme';

interface Props {
  data?: {
    planned: number;
    inStock: number;
    installed: number;
    configured: number;
    verified: number;
    faulty: number;
  };
}

const SEGMENTS = [
  { key: 'planned', label: 'Planned', color: CHART_COLORS.grayFaint },
  { key: 'inStock', label: 'In Stock', color: CHART_COLORS.gray },
  { key: 'installed', label: 'Installed', color: CHART_COLORS.primaryFaint },
  { key: 'configured', label: 'Configured', color: CHART_COLORS.primaryMuted },
  { key: 'verified', label: 'Verified', color: CHART_COLORS.primary },
  { key: 'faulty', label: 'Faulty', color: CHART_COLORS.danger },
] as const;

export function AssetPipelineChart({ data }: Props) {
  if (!data) return null;

  const total = Object.values(data).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[220px] text-text-tertiary">
        <p className="text-body-sm">No assets</p>
      </div>
    );
  }

  const activeSegments = SEGMENTS
    .map(s => ({ ...s, value: data[s.key as keyof typeof data] }))
    .filter(s => s.value > 0);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-h1 text-text-primary">{total}</p>
        <p className="text-caption text-text-tertiary">Total Assets</p>
      </div>

      {/* Stacked bar */}
      <div className="h-3 bg-surface-hover rounded-full overflow-hidden flex">
        {activeSegments.map((s, idx) => {
          const pct = (s.value / total) * 100;
          const pctRound = Math.round(pct);
          return (
            <div
              key={s.key}
              className="h-full transition-all duration-700 relative group/seg hover:brightness-125"
              style={{
                width: `${pct}%`,
                backgroundColor: s.color,
                borderRadius: idx === 0 && activeSegments.length === 1 ? '9999px' :
                  idx === 0 ? '9999px 0 0 9999px' :
                  idx === activeSegments.length - 1 ? '0 9999px 9999px 0' : '0',
              }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/seg:block z-10 pointer-events-none">
                <div className="bg-[#1c2128] border border-surface-border rounded-md px-2 py-1 text-caption text-text-primary whitespace-nowrap shadow-lg">
                  {s.label}: {s.value} ({pctRound}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {SEGMENTS.map(s => {
          const val = data[s.key as keyof typeof data];
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          return (
            <div
              key={s.key}
              className="group/leg flex items-center justify-between rounded-md px-1.5 py-0.5 hover:bg-surface-hover/60 transition-colors cursor-default"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-sm flex-shrink-0 transition-transform group-hover/leg:scale-125"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-caption text-text-tertiary group-hover/leg:text-text-secondary transition-colors">{s.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-caption text-text-secondary font-medium">{val}</span>
                <span className="text-caption text-text-tertiary hidden group-hover/leg:inline transition-opacity">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
