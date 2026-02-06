export const CHART_COLORS = {
  // Primary palette (cyan shades)
  primary: '#22d3ee',
  primaryMuted: '#0e7490',
  primaryFaint: '#164e63',

  // Neutral
  gray: '#475569',
  grayLight: '#64748b',
  grayFaint: '#334155',

  // Accents (use sparingly)
  danger: '#ef4444',
  dangerMuted: '#991b1b',
  warning: '#f59e0b',
  success: '#22c55e',
} as const;

export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#1c2128',
    border: '1px solid #30363d',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  itemStyle: {
    color: '#f1f5f9',
    fontSize: 12,
  },
  cursor: false as const,
};
