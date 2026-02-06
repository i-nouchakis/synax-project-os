import { CHART_COLORS } from './chart-theme';

interface Props {
  data?: {
    totalItems: number;
    completedItems: number;
    completionRate: number;
    byType: {
      cabling: { total: number; completed: number };
      equipment: { total: number; completed: number };
      config: { total: number; completed: number };
      documentation: { total: number; completed: number };
    };
  };
}

const TYPES = [
  { key: 'cabling', label: 'Cabling', color: CHART_COLORS.primary },
  { key: 'equipment', label: 'Equipment', color: CHART_COLORS.primaryMuted },
  { key: 'config', label: 'Config', color: CHART_COLORS.primaryFaint },
  { key: 'documentation', label: 'Docs', color: CHART_COLORS.gray },
] as const;

export function ChecklistProgressChart({ data }: Props) {
  if (!data) return null;

  if (data.totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[220px] text-text-tertiary">
        <p className="text-body-sm">No checklists</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-h1 text-text-primary">{data.completionRate}%</p>
        <p className="text-caption text-text-tertiary">
          {data.completedItems} of {data.totalItems} items
        </p>
      </div>

      <div className="group/main relative h-2 bg-surface-hover rounded-full overflow-hidden cursor-default">
        <div
          className="h-full rounded-full transition-all duration-700 group-hover/main:brightness-125"
          style={{ width: `${data.completionRate}%`, backgroundColor: CHART_COLORS.primary }}
        />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/main:block z-10 pointer-events-none">
          <div className="bg-[#1c2128] border border-surface-border rounded-md px-2 py-1 text-caption text-text-primary whitespace-nowrap shadow-lg">
            {data.completedItems} completed / {data.totalItems - data.completedItems} remaining
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {TYPES.map(t => {
          const typeData = data.byType[t.key as keyof typeof data.byType];
          if (typeData.total === 0) return null;
          const pct = Math.round((typeData.completed / typeData.total) * 100);
          return (
            <div key={t.key} className="group/type">
              <div className="flex items-center justify-between mb-1">
                <span className="text-caption text-text-tertiary group-hover/type:text-text-secondary transition-colors">{t.label}</span>
                <span className="text-caption text-text-secondary">
                  {typeData.completed}/{typeData.total}
                  <span className="hidden group-hover/type:inline text-text-tertiary ml-1">({pct}%)</span>
                </span>
              </div>
              <div className="h-1 bg-surface-hover rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 group-hover/type:brightness-125"
                  style={{ width: `${pct}%`, backgroundColor: t.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
