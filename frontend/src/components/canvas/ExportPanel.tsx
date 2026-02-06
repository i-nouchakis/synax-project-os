import { FileJson } from 'lucide-react';
import { useDrawingStore } from '@/stores/drawing.store';

interface ExportPanelProps {
  fileName?: string;
}

export function ExportPanel({ fileName = 'drawing' }: ExportPanelProps) {
  const shapes = useDrawingStore((s) => s.shapes);
  const cables = useDrawingStore((s) => s.cables);
  const layers = useDrawingStore((s) => s.layers);
  const measurements = useDrawingStore((s) => s.measurements);
  const calibration = useDrawingStore((s) => s.calibration);

  const hasData = shapes.length > 0 || cables.length > 0 || measurements.length > 0;

  const exportJSON = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      layers: layers.map((l) => ({ id: l.id, name: l.name, order: l.order, visible: l.visible, locked: l.locked })),
      shapes: shapes.map((s) => ({
        type: s.type,
        layer: s.layer,
        zIndex: s.zIndex,
        data: s.data,
        style: s.style,
        locked: s.locked,
        visible: s.visible,
      })),
      cables: cables.map((c) => ({
        sourceAssetId: c.sourceAssetId,
        targetAssetId: c.targetAssetId,
        cableType: c.cableType,
        routingMode: c.routingMode,
        label: c.label,
        color: c.color,
      })),
      measurements: measurements.map((m) => ({
        startX: m.startX,
        startY: m.startY,
        endX: m.endX,
        endY: m.endY,
      })),
      calibration,
    };
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (!hasData) return null;

  return (
    <div className="flex items-center gap-1">
      <div className="w-px h-6 bg-surface-border mx-1" />

      <button
        onClick={exportJSON}
        title="Export drawing data (JSON)"
        className="flex items-center gap-1 p-2 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
      >
        <FileJson size={18} />
      </button>
    </div>
  );
}
