import { useState } from 'react';
import { CHART_COLORS } from './chart-theme';

interface Props {
  data?: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    hasBlocked: number;
  };
}

const STATUS_CONFIG = [
  { key: 'completed', label: 'Completed', color: CHART_COLORS.primary },
  { key: 'inProgress', label: 'In Progress', color: CHART_COLORS.primaryMuted },
  { key: 'notStarted', label: 'Not Started', color: CHART_COLORS.grayFaint },
  { key: 'hasBlocked', label: 'Has Blocked', color: CHART_COLORS.danger },
] as const;

export function FloorProgressChart({ data }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!data) return null;

  const { total, completed } = data;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[220px] text-text-tertiary">
        <p className="text-body-sm">No floors</p>
      </div>
    );
  }

  const size = 130;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Build ring segments for hover
  const segments = STATUS_CONFIG.map(s => ({
    ...s,
    value: data[s.key as keyof typeof data],
    pct: total > 0 ? (data[s.key as keyof typeof data] / total) * 100 : 0,
  })).filter(s => s.value > 0);

  let cumulativeOffset = 0;
  const ringSegments = segments.map(s => {
    const dashLen = (s.pct / 100) * circumference;
    const gap = circumference - dashLen;
    const offset = cumulativeOffset;
    cumulativeOffset += dashLen;
    return { ...s, dashLen, gap, offset };
  });

  const hoveredSeg = hovered ? ringSegments.find(s => s.key === hovered) : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="#1c2128" strokeWidth={strokeWidth}
            />
            {/* Colored segments */}
            {ringSegments.map(s => (
              <circle
                key={s.key}
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={hovered === s.key ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${s.dashLen} ${s.gap}`}
                strokeDashoffset={-s.offset}
                className="transition-all duration-300 cursor-pointer"
                style={{ opacity: hovered && hovered !== s.key ? 0.4 : 1 }}
                onMouseEnter={() => setHovered(s.key)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {hoveredSeg ? (
              <>
                <span className="text-2xl font-bold text-text-primary">{hoveredSeg.value}</span>
                <span className="text-caption text-text-tertiary">{hoveredSeg.label}</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-text-primary">{pct}%</span>
                <span className="text-caption text-text-tertiary">{completed}/{total}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STATUS_CONFIG.map(s => {
          const val = data[s.key as keyof typeof data];
          const itemPct = total > 0 ? Math.round((val / total) * 100) : 0;
          return (
            <div
              key={s.key}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-surface-hover/40 hover:bg-surface-hover/80 transition-all cursor-default"
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
              style={{ outline: hovered === s.key ? `1px solid ${s.color}40` : 'none' }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform"
                style={{
                  backgroundColor: s.color,
                  transform: hovered === s.key ? 'scale(1.5)' : 'scale(1)',
                }}
              />
              <span className="text-caption text-text-tertiary flex-1">{s.label}</span>
              <span className="text-caption text-text-secondary font-medium">
                {val}{hovered === s.key ? ` (${itemPct}%)` : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
