import { useDrawingStore } from '@/stores/drawing.store';
import { CABLE_TYPE_COLORS, type CableType } from '@/services/drawing.service';

const COLOR_PRESETS = [
  '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6',
  '#ec4899', '#6b7280', '#1f2937', '#ffffff', 'transparent',
];

const FILL_PRESETS = [
  'rgba(239,68,68,0.15)', 'rgba(245,158,11,0.15)', 'rgba(34,197,94,0.15)',
  'rgba(59,130,246,0.15)', 'rgba(139,92,246,0.15)', 'rgba(236,72,153,0.15)',
  'transparent',
];

const CABLE_TYPES: { value: CableType; label: string }[] = [
  { value: 'ETHERNET', label: 'Ethernet' },
  { value: 'FIBER', label: 'Fiber' },
  { value: 'POWER', label: 'Power' },
  { value: 'COAXIAL', label: 'Coaxial' },
  { value: 'HDMI', label: 'HDMI' },
  { value: 'USB', label: 'USB' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'OTHER', label: 'Other' },
];

export function PropertiesPanel() {
  const selectedIds = useDrawingStore((s) => s.selectedIds);
  const selectedCableIds = useDrawingStore((s) => s.selectedCableIds);
  const shapes = useDrawingStore((s) => s.shapes);
  const cables = useDrawingStore((s) => s.cables);
  const updateShape = useDrawingStore((s) => s.updateShape);
  const updateCable = useDrawingStore((s) => s.updateCable);
  const pushHistory = useDrawingStore((s) => s.pushHistory);

  // Cable properties panel
  if (selectedCableIds.length > 0) {
    const selectedCables = cables.filter((c) => selectedCableIds.includes(c.id));
    if (selectedCables.length === 0) return null;

    const firstCable = selectedCables[0];

    const applyCableUpdate = (updates: Record<string, unknown>) => {
      pushHistory();
      selectedCableIds.forEach((cId) => {
        updateCable(cId, updates);
      });
    };

    return (
      <div className="flex items-center gap-3 p-2 bg-surface border border-surface-border rounded-lg shadow-sm text-body-sm">
        <span className="text-text-tertiary text-caption font-medium">
          {selectedCableIds.length} cable{selectedCableIds.length !== 1 ? 's' : ''}
        </span>

        <div className="w-px h-5 bg-surface-border" />

        {/* Cable type */}
        <div className="flex items-center gap-1.5">
          <span className="text-caption text-text-tertiary">Type</span>
          <select
            value={firstCable.cableType}
            onChange={(e) => {
              const newType = e.target.value as CableType;
              applyCableUpdate({ cableType: newType, color: CABLE_TYPE_COLORS[newType] });
            }}
            className="h-7 bg-background border border-surface-border rounded text-caption text-text-primary px-1"
          >
            {CABLE_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>{ct.label}</option>
            ))}
          </select>
        </div>

        <div className="w-px h-5 bg-surface-border" />

        {/* Cable label */}
        <div className="flex items-center gap-1.5">
          <span className="text-caption text-text-tertiary">Label</span>
          <input
            type="text"
            value={firstCable.label || ''}
            onChange={(e) => applyCableUpdate({ label: e.target.value || undefined })}
            placeholder="e.g. CAT6-01"
            className="w-24 h-7 bg-background border border-surface-border rounded text-caption text-text-primary px-1.5"
          />
        </div>

        <div className="w-px h-5 bg-surface-border" />

        {/* Cable curve/tension */}
        <div className="flex items-center gap-1.5">
          <span className="text-caption text-text-tertiary">Curve</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={firstCable.tension || 0}
            onChange={(e) => {
              const tension = Number(e.target.value);
              selectedCableIds.forEach((cId) => {
                const cable = cables.find((c) => c.id === cId);
                if (!cable) return;
                // Konva tension needs 3+ points - auto-add midpoint if none exist
                const hasRoutingPts = cable.routingPoints && cable.routingPoints.length > 0;
                if (tension > 0 && !hasRoutingPts) {
                  const midX = (cable.sourceX + cable.targetX) / 2;
                  const midY = (cable.sourceY + cable.targetY) / 2;
                  updateCable(cId, {
                    tension,
                    routingPoints: [{ x: midX, y: midY }],
                  });
                } else {
                  updateCable(cId, { tension });
                }
              });
            }}
            onMouseDown={() => pushHistory()}
            className="w-16 h-1 accent-primary"
          />
          <span className="text-caption text-text-tertiary w-6">
            {Math.round((firstCable.tension || 0) * 100)}%
          </span>
        </div>

        <div className="w-px h-5 bg-surface-border" />

        {/* Connection info */}
        <span className="text-caption text-text-tertiary">
          {firstCable.sourceAssetName || 'Source'} → {firstCable.targetAssetName || 'Target'}
        </span>
      </div>
    );
  }

  // Shape properties panel
  if (selectedIds.length === 0) return null;

  const selectedShapes = shapes.filter((s) => selectedIds.includes(s.id));
  if (selectedShapes.length === 0) return null;

  // Get common style values
  const firstStyle = selectedShapes[0].style;
  const firstType = selectedShapes[0].type;
  const allSameType = selectedShapes.every((s) => s.type === firstType);
  const isText = allSameType && firstType === 'TEXT';
  const isLine = allSameType && (firstType === 'LINE' || firstType === 'ARROW' || firstType === 'FREEHAND');

  const applyStyle = (updates: Record<string, unknown>) => {
    pushHistory();
    selectedIds.forEach((id) => {
      const shape = shapes.find((s) => s.id === id);
      if (shape) {
        updateShape(id, { style: { ...shape.style, ...updates } });
      }
    });
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-surface border border-surface-border rounded-lg shadow-sm text-body-sm">
      <span className="text-text-tertiary text-caption font-medium">
        {selectedIds.length} selected
      </span>

      <div className="w-px h-5 bg-surface-border" />

      {/* Stroke color */}
      <div className="flex items-center gap-1.5">
        <span className="text-caption text-text-tertiary">Stroke</span>
        <div className="flex gap-0.5">
          {COLOR_PRESETS.slice(0, 7).map((color) => (
            <button
              key={`stroke-${color}`}
              onClick={() => applyStyle({ stroke: color })}
              className={`w-5 h-5 rounded border transition-transform hover:scale-110 ${
                firstStyle.stroke === color ? 'border-primary ring-1 ring-primary' : 'border-surface-border'
              }`}
              style={{ backgroundColor: color === 'transparent' ? undefined : color }}
              title={color}
            >
              {color === 'transparent' && (
                <span className="text-[8px] text-text-tertiary">X</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fill color - not for lines */}
      {!isLine && (
        <>
          <div className="w-px h-5 bg-surface-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-caption text-text-tertiary">Fill</span>
            <div className="flex gap-0.5">
              {FILL_PRESETS.map((color) => (
                <button
                  key={`fill-${color}`}
                  onClick={() => applyStyle({ fill: color })}
                  className={`w-5 h-5 rounded border transition-transform hover:scale-110 ${
                    firstStyle.fill === color ? 'border-primary ring-1 ring-primary' : 'border-surface-border'
                  }`}
                  style={{
                    backgroundColor: color === 'transparent' ? undefined : color,
                    backgroundImage: color === 'transparent'
                      ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)'
                      : undefined,
                    backgroundSize: color === 'transparent' ? '6px 6px' : undefined,
                    backgroundPosition: color === 'transparent' ? '0 0, 3px 3px' : undefined,
                  }}
                  title={color === 'transparent' ? 'No fill' : color}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <div className="w-px h-5 bg-surface-border" />

      {/* Stroke width */}
      <div className="flex items-center gap-1.5">
        <span className="text-caption text-text-tertiary">Width</span>
        <select
          value={firstStyle.strokeWidth || 2}
          onChange={(e) => applyStyle({ strokeWidth: Number(e.target.value) })}
          className="w-14 h-7 bg-background border border-surface-border rounded text-caption text-text-primary px-1"
        >
          {[1, 2, 3, 4, 6, 8].map((w) => (
            <option key={w} value={w}>{w}px</option>
          ))}
        </select>
      </div>

      {/* Opacity */}
      <div className="flex items-center gap-1.5">
        <span className="text-caption text-text-tertiary">Opacity</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={firstStyle.opacity ?? 1}
          onChange={(e) => applyStyle({ opacity: Number(e.target.value) })}
          className="w-16 h-1 accent-primary"
        />
        <span className="text-caption text-text-tertiary w-7">
          {Math.round((firstStyle.opacity ?? 1) * 100)}%
        </span>
      </div>

      {/* Tension/Curve for lines and arrows */}
      {allSameType && (firstType === 'LINE' || firstType === 'ARROW') && (
        <>
          <div className="w-px h-5 bg-surface-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-caption text-text-tertiary">Curve</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedShapes[0].data.tension || 0}
              onChange={(e) => {
                const tension = Number(e.target.value);
                selectedIds.forEach((sid) => {
                  const shape = shapes.find((s) => s.id === sid);
                  if (shape) {
                    updateShape(sid, { data: { ...shape.data, tension } });
                  }
                });
              }}
              onMouseDown={() => pushHistory()}
              className="w-16 h-1 accent-primary"
            />
            <span className="text-caption text-text-tertiary w-6">
              {Math.round((selectedShapes[0].data.tension || 0) * 100)}%
            </span>
          </div>
        </>
      )}

      {/* Font size for text */}
      {isText && (
        <>
          <div className="w-px h-5 bg-surface-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-caption text-text-tertiary">Size</span>
            <select
              value={firstStyle.fontSize || 16}
              onChange={(e) => applyStyle({ fontSize: Number(e.target.value) })}
              className="w-14 h-7 bg-background border border-surface-border rounded text-caption text-text-primary px-1"
            >
              {[10, 12, 14, 16, 20, 24, 32, 48].map((s) => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
          </div>
        </>
      )}

    </div>
  );
}
