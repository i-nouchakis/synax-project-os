import { create } from 'zustand';
import type { ShapeType, ShapeData, ShapeStyle, DrawingShape, Cable, CableType, RoutingMode } from '@/services/drawing.service';
import { CABLE_TYPE_COLORS } from '@/services/drawing.service';

export type DrawingTool =
  | 'select'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'text'
  | 'freehand'
  | 'polygon'
  | 'cable'
  | 'measure';

const TOOL_TO_SHAPE_TYPE: Partial<Record<DrawingTool, ShapeType>> = {
  rectangle: 'RECTANGLE',
  circle: 'CIRCLE',
  line: 'LINE',
  arrow: 'ARROW',
  text: 'TEXT',
  freehand: 'FREEHAND',
  polygon: 'POLYGON',
};

export function toolToShapeType(tool: DrawingTool): ShapeType | null {
  return TOOL_TO_SHAPE_TYPE[tool] || null;
}

// Default styles per shape type
export const DEFAULT_STYLES: Record<ShapeType, ShapeStyle> = {
  RECTANGLE: { fill: 'rgba(59,130,246,0.15)', stroke: '#3b82f6', strokeWidth: 2, opacity: 1 },
  CIRCLE: { fill: 'rgba(139,92,246,0.15)', stroke: '#8b5cf6', strokeWidth: 2, opacity: 1 },
  LINE: { stroke: '#6b7280', strokeWidth: 2, opacity: 1 },
  ARROW: { stroke: '#ef4444', strokeWidth: 2, opacity: 1 },
  TEXT: { fill: '#1f2937', fontSize: 16, fontFamily: 'sans-serif', opacity: 1 },
  FREEHAND: { stroke: '#10b981', strokeWidth: 2, opacity: 1 },
  POLYGON: { fill: 'rgba(245,158,11,0.15)', stroke: '#f59e0b', strokeWidth: 2, opacity: 1 },
};

export interface LocalShape {
  id: string; // temp ID for local-only shapes, replaced by server ID on save
  serverId?: string; // actual DB id
  type: ShapeType;
  data: ShapeData;
  style: ShapeStyle;
  layer: string;
  zIndex: number;
  locked: boolean;
  visible: boolean;
}

export interface DrawingLayerInfo {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
}

// Cable drawing state machine
export type CableDrawingPhase = 'idle' | 'selecting_source' | 'selecting_type' | 'selecting_target';

export interface LocalCable {
  id: string;
  serverId?: string;
  sourceAssetId: string;
  targetAssetId: string;
  cableType: CableType;
  routingMode: RoutingMode;
  routingPoints?: { x: number; y: number }[];
  tension?: number;
  label?: string;
  color: string;
  // Denormalized asset positions for rendering
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourceAssetName?: string;
  targetAssetName?: string;
}

export interface PendingCable {
  sourceAssetId: string;
  sourceX: number;
  sourceY: number;
  sourceAssetName: string;
  cableType?: CableType;
}

interface HistoryEntry {
  shapes: LocalShape[];
  cables: LocalCable[];
  deletedServerIds: string[];
  deletedCableServerIds: string[];
}

interface DrawingState {
  // Tool
  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;

  // Layers (kept minimal for DB compat)
  layers: DrawingLayerInfo[];
  activeLayerId: string;

  // Shapes (local state, synced with backend)
  shapes: LocalShape[];
  setShapes: (shapes: LocalShape[]) => void;
  addShape: (shape: LocalShape) => void;
  updateShape: (id: string, updates: Partial<LocalShape>) => void;
  removeShape: (id: string) => void;
  removeShapes: (ids: string[]) => void;

  // Cables
  cables: LocalCable[];
  addCable: (cable: LocalCable) => void;
  updateCable: (id: string, updates: Partial<LocalCable>) => void;
  removeCable: (id: string) => void;
  removeCables: (ids: string[]) => void;
  updateCableEndpointsForAsset: (assetId: string, newX: number, newY: number) => void;

  // Cable drawing state
  cablePhase: CableDrawingPhase;
  setCablePhase: (phase: CableDrawingPhase) => void;
  pendingCable: PendingCable | null;
  setPendingCable: (pending: PendingCable | null) => void;

  // Selected cables (separate from shape selection)
  selectedCableIds: string[];
  setSelectedCableIds: (ids: string[]) => void;

  // Server sync
  deletedServerIds: string[]; // server IDs of shapes deleted locally
  deletedCableServerIds: string[];
  isDirty: boolean;
  loadFromServer: (serverShapes: DrawingShape[], serverCables?: Cable[]) => void;
  resetStore: () => void;

  // Selection
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;

  // Drawing state (for in-progress shape)
  isDrawing: boolean;
  setIsDrawing: (v: boolean) => void;
  drawingShape: LocalShape | null;
  setDrawingShape: (shape: LocalShape | null) => void;

  // Style for new shapes
  currentStyle: ShapeStyle;
  setCurrentStyle: (style: Partial<ShapeStyle>) => void;

  // Measurement / Calibration
  calibration: { pixelsPerUnit: number; unit: string } | null; // null = not calibrated
  setCalibration: (cal: { pixelsPerUnit: number; unit: string } | null) => void;
  measurements: { id: string; startX: number; startY: number; endX: number; endY: number }[];
  addMeasurement: (m: { id: string; startX: number; startY: number; endX: number; endY: number }) => void;
  removeMeasurement: (id: string) => void;
  clearMeasurements: () => void;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const DEFAULT_LAYER: DrawingLayerInfo = {
  id: 'default',
  name: 'Default',
  visible: true,
  locked: false,
  order: 0,
};

let nextId = 1;
export function generateLocalId(): string {
  return `local_${nextId++}_${Date.now()}`;
}

// Parse routingPoints from server: supports old format (array) and new format (object with waypoints + tension)
function parseRoutingData(raw: unknown): { waypoints?: { x: number; y: number }[]; tension?: number } {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    // Old format: [{x,y}, ...]
    return { waypoints: raw as { x: number; y: number }[] };
  }
  if (typeof raw === 'object') {
    const obj = raw as { waypoints?: { x: number; y: number }[]; tension?: number };
    return { waypoints: obj.waypoints, tension: obj.tension };
  }
  return {};
}

// Encode routingPoints for server save
export function encodeRoutingData(cable: LocalCable): { x: number; y: number }[] | { waypoints: { x: number; y: number }[]; tension: number } | null {
  const hasWaypoints = cable.routingPoints && cable.routingPoints.length > 0;
  const hasTension = cable.tension && cable.tension > 0;
  if (!hasWaypoints && !hasTension) return null;
  if (hasTension) {
    return { waypoints: cable.routingPoints || [], tension: cable.tension! };
  }
  return cable.routingPoints || null;
}

function cableFromServer(c: Cable): LocalCable {
  const routing = parseRoutingData(c.routingPoints);
  return {
    id: c.id,
    serverId: c.id,
    sourceAssetId: c.sourceAssetId || '',
    targetAssetId: c.targetAssetId || '',
    cableType: c.cableType,
    routingMode: c.routingMode,
    routingPoints: routing.waypoints,
    tension: routing.tension,
    label: c.label || undefined,
    color: c.color || CABLE_TYPE_COLORS[c.cableType] || '#6b7280',
    sourceX: c.sourceAsset?.pinX ?? 0,
    sourceY: c.sourceAsset?.pinY ?? 0,
    targetX: c.targetAsset?.pinX ?? 0,
    targetY: c.targetAsset?.pinY ?? 0,
    sourceAssetName: c.sourceAsset?.name,
    targetAssetName: c.targetAsset?.name,
  };
}

export const useDrawingStore = create<DrawingState>((set, get) => ({
  // Tool
  activeTool: 'select',
  setActiveTool: (tool) => {
    // Reset cable drawing state when switching away from cable tool
    if (tool === 'cable') {
      set({ activeTool: tool, cablePhase: 'selecting_source', pendingCable: null, selectedIds: [], selectedCableIds: [] });
    } else if (tool === 'measure') {
      set({ activeTool: tool, cablePhase: 'idle', pendingCable: null, selectedIds: [], selectedCableIds: [] });
    } else {
      set({ activeTool: tool, cablePhase: 'idle', pendingCable: null });
    }
  },

  // Layers (kept minimal for DB compat)
  layers: [{ ...DEFAULT_LAYER }],
  activeLayerId: 'default',

  // Shapes
  shapes: [],
  setShapes: (shapes) => set({ shapes, isDirty: true }),
  addShape: (shape) => set((s) => ({ shapes: [...s.shapes, shape], isDirty: true })),
  updateShape: (id, updates) =>
    set((s) => ({
      shapes: s.shapes.map((sh) => (sh.id === id ? { ...sh, ...updates } : sh)),
      isDirty: true,
    })),
  removeShape: (id) => {
    const shape = get().shapes.find((s) => s.id === id);
    set((s) => ({
      shapes: s.shapes.filter((sh) => sh.id !== id),
      deletedServerIds: shape?.serverId
        ? [...s.deletedServerIds, shape.serverId]
        : s.deletedServerIds,
      isDirty: true,
    }));
  },
  removeShapes: (ids) => {
    const toDelete = get().shapes.filter((s) => ids.includes(s.id) && s.serverId);
    set((s) => ({
      shapes: s.shapes.filter((sh) => !ids.includes(sh.id)),
      deletedServerIds: [
        ...s.deletedServerIds,
        ...toDelete.map((d) => d.serverId!),
      ],
      isDirty: true,
    }));
  },

  // Cables
  cables: [],
  addCable: (cable) => set((s) => ({ cables: [...s.cables, cable], isDirty: true })),
  updateCable: (id, updates) =>
    set((s) => ({
      cables: s.cables.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      isDirty: true,
    })),
  removeCable: (id) => {
    const cable = get().cables.find((c) => c.id === id);
    set((s) => ({
      cables: s.cables.filter((c) => c.id !== id),
      deletedCableServerIds: cable?.serverId
        ? [...s.deletedCableServerIds, cable.serverId]
        : s.deletedCableServerIds,
      isDirty: true,
    }));
  },
  removeCables: (ids) => {
    const toDelete = get().cables.filter((c) => ids.includes(c.id) && c.serverId);
    set((s) => ({
      cables: s.cables.filter((c) => !ids.includes(c.id)),
      deletedCableServerIds: [
        ...s.deletedCableServerIds,
        ...toDelete.map((d) => d.serverId!),
      ],
      isDirty: true,
    }));
  },

  // Update cable endpoints when an asset pin moves
  updateCableEndpointsForAsset: (assetId, newX, newY) => {
    set((s) => {
      let anyChanged = false;
      const updated = s.cables.map((c) => {
        let changed = false;
        const copy = { ...c };
        if (c.sourceAssetId === assetId) {
          copy.sourceX = newX;
          copy.sourceY = newY;
          changed = true;
        }
        if (c.targetAssetId === assetId) {
          copy.targetX = newX;
          copy.targetY = newY;
          changed = true;
        }
        if (changed) anyChanged = true;
        return changed ? copy : c;
      });
      return anyChanged ? { cables: updated } : {};
    });
  },

  // Cable drawing state
  cablePhase: 'idle',
  setCablePhase: (phase) => set({ cablePhase: phase }),
  pendingCable: null,
  setPendingCable: (pending) => set({ pendingCable: pending }),

  // Selected cables
  selectedCableIds: [],
  setSelectedCableIds: (ids) => set({ selectedCableIds: ids }),

  // Server sync
  deletedServerIds: [],
  deletedCableServerIds: [],
  isDirty: false,
  loadFromServer: (serverShapes, serverCables = []) => {
    const localShapes: LocalShape[] = serverShapes.map((s) => ({
      id: s.id,
      serverId: s.id,
      type: s.type,
      data: s.data,
      style: s.style,
      layer: s.layer,
      zIndex: s.zIndex,
      locked: s.locked,
      visible: s.visible,
    }));
    const localCables: LocalCable[] = serverCables.map(cableFromServer);

    // Extract unique layer names from shapes and build layer list
    const layerNames = new Set(localShapes.map((s) => s.layer));
    layerNames.add('default'); // Always include default
    const layers: DrawingLayerInfo[] = [];
    let order = 0;
    for (const name of layerNames) {
      layers.push({
        id: name,
        name: name === 'default' ? 'Default' : name,
        visible: true,
        locked: false,
        order: order++,
      });
    }

    set({
      shapes: localShapes,
      cables: localCables,
      layers,
      activeLayerId: 'default',
      deletedServerIds: [],
      deletedCableServerIds: [],
      isDirty: false,
      selectedIds: [],
      selectedCableIds: [],
      cablePhase: 'idle',
      pendingCable: null,
      history: [{
        shapes: JSON.parse(JSON.stringify(localShapes)),
        cables: JSON.parse(JSON.stringify(localCables)),
        deletedServerIds: [],
        deletedCableServerIds: [],
      }],
      historyIndex: 0,
    });
  },
  resetStore: () =>
    set({
      shapes: [],
      cables: [],
      layers: [{ ...DEFAULT_LAYER }],
      activeLayerId: 'default',
      deletedServerIds: [],
      deletedCableServerIds: [],
      isDirty: false,
      selectedIds: [],
      selectedCableIds: [],
      activeTool: 'select',
      isDrawing: false,
      drawingShape: null,
      cablePhase: 'idle',
      pendingCable: null,
      calibration: null,
      measurements: [],
      currentStyle: DEFAULT_STYLES.RECTANGLE,
      history: [],
      historyIndex: -1,
    }),

  // Selection
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids, selectedCableIds: [] }),
  toggleSelection: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((i) => i !== id)
        : [...s.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [], selectedCableIds: [] }),

  // Drawing
  isDrawing: false,
  setIsDrawing: (v) => set({ isDrawing: v }),
  drawingShape: null,
  setDrawingShape: (shape) => set({ drawingShape: shape }),

  // Style
  currentStyle: DEFAULT_STYLES.RECTANGLE,
  setCurrentStyle: (style) =>
    set((s) => ({ currentStyle: { ...s.currentStyle, ...style } })),

  // Measurement / Calibration
  calibration: null,
  setCalibration: (cal) => set({ calibration: cal }),
  measurements: [],
  addMeasurement: (m) => set((s) => ({ measurements: [...s.measurements, m] })),
  removeMeasurement: (id) => set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) })),
  clearMeasurements: () => set({ measurements: [] }),

  // History
  history: [],
  historyIndex: -1,
  pushHistory: () => {
    const { shapes, cables, deletedServerIds, deletedCableServerIds, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      shapes: JSON.parse(JSON.stringify(shapes)),
      cables: JSON.parse(JSON.stringify(cables)),
      deletedServerIds: [...deletedServerIds],
      deletedCableServerIds: [...deletedCableServerIds],
    });
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },
  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    set({
      shapes: JSON.parse(JSON.stringify(entry.shapes)),
      cables: JSON.parse(JSON.stringify(entry.cables)),
      deletedServerIds: [...entry.deletedServerIds],
      deletedCableServerIds: [...entry.deletedCableServerIds],
      historyIndex: newIndex,
      selectedIds: [],
      selectedCableIds: [],
      isDirty: true,
    });
  },
  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    set({
      shapes: JSON.parse(JSON.stringify(entry.shapes)),
      cables: JSON.parse(JSON.stringify(entry.cables)),
      deletedServerIds: [...entry.deletedServerIds],
      deletedCableServerIds: [...entry.deletedCableServerIds],
      historyIndex: newIndex,
      selectedIds: [],
      selectedCableIds: [],
      isDirty: true,
    });
  },
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
}));
