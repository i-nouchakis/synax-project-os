import {
  MousePointer2,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Type,
  Pencil,
  Hexagon,
  Cable,
  Ruler,
  Undo2,
  Redo2,
  Trash2,
  Save,
} from 'lucide-react';
import { useDrawingStore, type DrawingTool } from '@/stores/drawing.store';
import { ExportPanel } from './ExportPanel';

interface ToolButton {
  tool: DrawingTool;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const TOOLS: ToolButton[] = [
  { tool: 'select', icon: <MousePointer2 size={18} />, label: 'Select', shortcut: 'V' },
  { tool: 'rectangle', icon: <Square size={18} />, label: 'Rectangle', shortcut: 'R' },
  { tool: 'circle', icon: <Circle size={18} />, label: 'Circle', shortcut: 'C' },
  { tool: 'line', icon: <Minus size={18} />, label: 'Line', shortcut: 'L' },
  { tool: 'arrow', icon: <ArrowRight size={18} />, label: 'Arrow', shortcut: 'A' },
  { tool: 'text', icon: <Type size={18} />, label: 'Text', shortcut: 'T' },
  { tool: 'freehand', icon: <Pencil size={18} />, label: 'Freehand', shortcut: 'P' },
  { tool: 'polygon', icon: <Hexagon size={18} />, label: 'Polygon' },
  { tool: 'cable', icon: <Cable size={18} />, label: 'Cable', shortcut: 'K' },
  { tool: 'measure', icon: <Ruler size={18} />, label: 'Measure', shortcut: 'M' },
];

interface DrawingToolbarProps {
  onSave?: () => void;
  onDelete?: () => void;
  isSaving?: boolean;
  exportFileName?: string;
}

export function DrawingToolbar({ onSave, onDelete, isSaving, exportFileName }: DrawingToolbarProps) {
  const activeTool = useDrawingStore((s) => s.activeTool);
  const setActiveTool = useDrawingStore((s) => s.setActiveTool);
  const selectedIds = useDrawingStore((s) => s.selectedIds);
  const selectedCableIds = useDrawingStore((s) => s.selectedCableIds);
  const shapes = useDrawingStore((s) => s.shapes);
  const cables = useDrawingStore((s) => s.cables);
  const isDirty = useDrawingStore((s) => s.isDirty);
  const historyIndex = useDrawingStore((s) => s.historyIndex);
  const historyLength = useDrawingStore((s) => s.history.length);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  return (
    <div className="flex items-center gap-1 p-1.5 bg-surface border border-surface-border rounded-lg shadow-sm flex-wrap">
      {/* Drawing Tools */}
      {TOOLS.map((t) => (
        <button
          key={t.tool}
          onClick={() => setActiveTool(t.tool)}
          title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''}`}
          className={`p-2 rounded-md transition-colors ${
            activeTool === t.tool
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
          }`}
        >
          {t.icon}
        </button>
      ))}

      {/* Separator */}
      <div className="w-px h-6 bg-surface-border mx-1" />

      {/* Undo/Redo */}
      <button
        onClick={() => useDrawingStore.getState().undo()}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className="p-2 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Undo2 size={18} />
      </button>
      <button
        onClick={() => useDrawingStore.getState().redo()}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        className="p-2 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Redo2 size={18} />
      </button>

      {/* Separator */}
      <div className="w-px h-6 bg-surface-border mx-1" />

      {/* Delete selected */}
      {(selectedIds.length > 0 || selectedCableIds.length > 0) && onDelete && (
        <button
          onClick={onDelete}
          title={`Delete ${selectedIds.length + selectedCableIds.length} selected (Del)`}
          className="p-2 rounded-md text-error hover:bg-error/10 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      )}

      {/* Save */}
      {onSave && (
        <button
          onClick={onSave}
          disabled={isSaving}
          title="Save drawings"
          className={`p-2 rounded-md transition-colors ${
            isDirty
              ? 'text-success hover:bg-success/10'
              : 'text-text-tertiary'
          } disabled:opacity-50`}
        >
          <Save size={18} />
        </button>
      )}

      {/* Export JSON */}
      <ExportPanel fileName={exportFileName} />

      {/* Shape & cable count */}
      {(shapes.length > 0 || cables.length > 0) && (
        <span className="text-caption text-text-tertiary ml-1">
          {shapes.length > 0 && `${shapes.length} shape${shapes.length !== 1 ? 's' : ''}`}
          {shapes.length > 0 && cables.length > 0 && ', '}
          {cables.length > 0 && `${cables.length} cable${cables.length !== 1 ? 's' : ''}`}
          {isDirty && ' *'}
        </span>
      )}
    </div>
  );
}
