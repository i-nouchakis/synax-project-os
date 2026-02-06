import { useState, useEffect, useCallback, useRef } from 'react';
import { Layer, Rect, Circle, Line, Arrow, Text, Transformer, Group } from 'react-konva';
import type Konva from 'konva';
import {
  useDrawingStore,
  toolToShapeType,
  DEFAULT_STYLES,
  generateLocalId,
  type LocalShape,
  type LocalCable,
} from '@/stores/drawing.store';
import { CABLE_TYPE_COLORS } from '@/services/drawing.service';

interface AssetPin {
  id: string;
  name: string;
  pinX: number;
  pinY: number;
}

interface DrawingLayerProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  imageWidth: number;
  imageHeight: number;
  scale: number;
  assetPins?: AssetPin[];
  readOnly?: boolean;
}

export function DrawingLayer({ stageRef, imageWidth, imageHeight, scale, assetPins = [], readOnly = false }: DrawingLayerProps) {
  const shapes = useDrawingStore((s) => s.shapes);
  const cables = useDrawingStore((s) => s.cables);
  const activeTool = useDrawingStore((s) => s.activeTool);
  const selectedIds = useDrawingStore((s) => s.selectedIds);
  const selectedCableIds = useDrawingStore((s) => s.selectedCableIds);
  const setSelectedIds = useDrawingStore((s) => s.setSelectedIds);
  const setSelectedCableIds = useDrawingStore((s) => s.setSelectedCableIds);
  const addShape = useDrawingStore((s) => s.addShape);
  const updateShape = useDrawingStore((s) => s.updateShape);
  const isDrawing = useDrawingStore((s) => s.isDrawing);
  const setIsDrawing = useDrawingStore((s) => s.setIsDrawing);
  const drawingShape = useDrawingStore((s) => s.drawingShape);
  const setDrawingShape = useDrawingStore((s) => s.setDrawingShape);
  const pushHistory = useDrawingStore((s) => s.pushHistory);

  const visibleShapes = shapes.filter((s) => s.visible);

  // Cable drawing state
  const cablePhase = useDrawingStore((s) => s.cablePhase);
  const pendingCable = useDrawingStore((s) => s.pendingCable);
  // Measurement state
  const measurements = useDrawingStore((s) => s.measurements);
  const calibration = useDrawingStore((s) => s.calibration);
  const addMeasurement = useDrawingStore((s) => s.addMeasurement);

  const transformerRef = useRef<Konva.Transformer>(null);

  // Mouse position for cable preview line
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Multi-select rectangle state
  const [selectionRect, setSelectionRect] = useState<{ startX: number; startY: number; x: number; y: number; width: number; height: number } | null>(null);
  const isSelecting = useRef(false);

  // Measurement drawing state
  const [measuringLine, setMeasuringLine] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const isMeasuring = useRef(false);

  // Line bend point editing state
  const [lineEditPoints, setLineEditPoints] = useState<number[] | null>(null);
  const lineEditShapeId = useRef<string | null>(null);

  // Cable bend point editing state
  const [cableEditPoints, setCableEditPoints] = useState<number[] | null>(null);
  const cableEditId = useRef<string | null>(null);
  const updateCable = useDrawingStore((s) => s.updateCable);

  // Keyboard shortcuts (only in edit mode)
  useEffect(() => {
    if (readOnly) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const store = useDrawingStore.getState();

      // Delete / Backspace - delete selected shapes or cables
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedIds.length > 0) {
          e.preventDefault();
          store.pushHistory();
          store.removeShapes(store.selectedIds);
          store.setSelectedIds([]);
        }
        if (store.selectedCableIds.length > 0) {
          e.preventDefault();
          store.pushHistory();
          store.removeCables(store.selectedCableIds);
          store.setSelectedCableIds([]);
        }
        return;
      }

      // Escape - deselect, cancel cable drawing, or switch to select tool
      if (e.key === 'Escape') {
        if (store.cablePhase === 'selecting_type' || store.cablePhase === 'selecting_target') {
          store.setCablePhase('selecting_source');
          store.setPendingCable(null);
          return;
        }
        if (store.selectedIds.length > 0 || store.selectedCableIds.length > 0) {
          store.setSelectedIds([]);
          store.setSelectedCableIds([]);
        } else if (store.activeTool !== 'select') {
          store.setActiveTool('select');
        }
        return;
      }

      // Ctrl+Z - undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undo();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y - redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || e.key === 'y')) {
        e.preventDefault();
        store.redo();
        return;
      }

      // Tool shortcuts (single keys)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const toolKeys: Record<string, typeof store.activeTool> = {
          v: 'select',
          r: 'rectangle',
          c: 'circle',
          l: 'line',
          a: 'arrow',
          t: 'text',
          p: 'freehand',
          k: 'cable',
          m: 'measure',
        };
        const tool = toolKeys[e.key.toLowerCase()];
        if (tool) {
          store.setActiveTool(tool);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly]);

  // Right-click to cancel pending cable
  useEffect(() => {
    if (readOnly) return;
    const handleContextMenu = (e: MouseEvent) => {
      const store = useDrawingStore.getState();
      if (store.activeTool === 'cable' && (store.cablePhase === 'selecting_target' || store.cablePhase === 'selecting_type')) {
        e.preventDefault();
        store.setCablePhase('selecting_source');
        store.setPendingCable(null);
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, [readOnly]);

  // Clear line edit state when selection changes
  useEffect(() => {
    lineEditShapeId.current = null;
    setLineEditPoints(null);
  }, [selectedIds]);

  // Clear cable edit state when cable selection changes
  useEffect(() => {
    cableEditId.current = null;
    setCableEditPoints(null);
  }, [selectedCableIds]);

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    const nodes = selectedIds
      .map((id) => stage.findOne(`#shape-${id}`))
      .filter(Boolean) as Konva.Node[];
    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, stageRef, shapes]);

  // Get pointer position relative to image
  const getPointerPos = useCallback(() => {
    if (!stageRef.current) return null;
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const transform = stage.getAbsoluteTransform().copy().invert();
    return transform.point(pointer);
  }, [stageRef]);

  // Find nearest asset pin to a position (within threshold)
  const findNearestAssetPin = useCallback(
    (pos: { x: number; y: number }, threshold = 30): AssetPin | null => {
      let nearest: AssetPin | null = null;
      let minDist = threshold / scale; // Adjust threshold by scale
      for (const pin of assetPins) {
        const dx = pos.x - pin.pinX;
        const dy = pos.y - pin.pinY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearest = pin;
        }
      }
      return nearest;
    },
    [assetPins, scale]
  );

  // Get bounding box of a shape for intersection testing
  const getShapeBounds = useCallback((shape: LocalShape): { x: number; y: number; w: number; h: number } | null => {
    const d = shape.data;
    switch (shape.type) {
      case 'RECTANGLE':
      case 'POLYGON':
        return { x: d.x || 0, y: d.y || 0, w: d.width || 0, h: d.height || 0 };
      case 'CIRCLE':
        return { x: (d.x || 0) - (d.radius || 0), y: (d.y || 0) - (d.radius || 0), w: (d.radius || 0) * 2, h: (d.radius || 0) * 2 };
      case 'TEXT':
        return { x: d.x || 0, y: d.y || 0, w: 80, h: 20 }; // Approximate text bounds
      case 'LINE':
      case 'ARROW':
      case 'FREEHAND': {
        const pts = d.points || [];
        if (pts.length < 2) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < pts.length; i += 2) {
          minX = Math.min(minX, pts[i]);
          maxX = Math.max(maxX, pts[i]);
          minY = Math.min(minY, pts[i + 1]);
          maxY = Math.max(maxY, pts[i + 1]);
        }
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      }
      default:
        return null;
    }
  }, []);

  // Check if two rectangles intersect
  const rectsIntersect = useCallback((
    r1: { x: number; y: number; w: number; h: number },
    r2: { x: number; y: number; w: number; h: number }
  ): boolean => {
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
  }, []);

  // Mouse down - start drawing or handle cable clicks
  const handleMouseDown = useCallback(() => {
    const store = useDrawingStore.getState();

    if (store.activeTool === 'cable') {
      const pos = getPointerPos();
      if (!pos) return;

      if (store.cablePhase === 'selecting_source') {
        // Find asset pin near click
        const assetPin = findNearestAssetPin(pos);
        if (assetPin) {
          store.setPendingCable({
            sourceAssetId: assetPin.id,
            sourceX: assetPin.pinX,
            sourceY: assetPin.pinY,
            sourceAssetName: assetPin.name,
          });
          store.setCablePhase('selecting_type');
        }
        return;
      }

      if (store.cablePhase === 'selecting_target' && store.pendingCable?.cableType) {
        // Find target asset pin
        const assetPin = findNearestAssetPin(pos);
        if (assetPin && assetPin.id !== store.pendingCable.sourceAssetId) {
          const cableType = store.pendingCable.cableType;
          const newCable: LocalCable = {
            id: generateLocalId(),
            sourceAssetId: store.pendingCable.sourceAssetId,
            targetAssetId: assetPin.id,
            cableType,
            routingMode: 'STRAIGHT',
            color: CABLE_TYPE_COLORS[cableType],
            sourceX: store.pendingCable.sourceX,
            sourceY: store.pendingCable.sourceY,
            targetX: assetPin.pinX,
            targetY: assetPin.pinY,
            sourceAssetName: store.pendingCable.sourceAssetName,
            targetAssetName: assetPin.name,
          };
          store.pushHistory();
          store.addCable(newCable);
          // Reset to selecting_source for next cable
          store.setPendingCable(null);
          store.setCablePhase('selecting_source');
          setMousePos(null);
        }
        return;
      }

      return;
    }

    if (activeTool === 'measure') {
      const pos = getPointerPos();
      if (pos) {
        isMeasuring.current = true;
        setMeasuringLine({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
      }
      return;
    }

    if (activeTool === 'select') {
      // Start multi-select rectangle on empty canvas click
      const pos = getPointerPos();
      if (pos) {
        isSelecting.current = true;
        setSelectionRect({ startX: pos.x, startY: pos.y, x: pos.x, y: pos.y, width: 0, height: 0 });
      }
      return;
    }

    // Don't draw on hidden or locked active layer

    const pos = getPointerPos();
    if (!pos) return;

    // Check bounds
    if (pos.x < 0 || pos.y < 0 || pos.x > imageWidth || pos.y > imageHeight) return;

    const shapeType = toolToShapeType(activeTool);
    if (!shapeType) return;

    const style = DEFAULT_STYLES[shapeType];
    const id = generateLocalId();
    const targetLayer = 'default';

    let newShape: LocalShape;

    if (shapeType === 'TEXT') {
      // Text: single click to place
      newShape = {
        id,
        type: 'TEXT',
        data: { x: pos.x, y: pos.y, text: 'Text' },
        style: { ...style },
        layer: targetLayer,
        zIndex: shapes.length,
        locked: false,
        visible: true,
      };
      pushHistory();
      addShape(newShape);
      setSelectedIds([id]);
      return;
    }

    if (shapeType === 'FREEHAND') {
      newShape = {
        id,
        type: 'FREEHAND',
        data: { x: 0, y: 0, points: [pos.x, pos.y] },
        style: { ...style },
        layer: targetLayer,
        zIndex: shapes.length,
        locked: false,
        visible: true,
      };
    } else if (shapeType === 'CIRCLE') {
      newShape = {
        id,
        type: 'CIRCLE',
        data: { x: pos.x, y: pos.y, radius: 0 },
        style: { ...style },
        layer: targetLayer,
        zIndex: shapes.length,
        locked: false,
        visible: true,
      };
    } else if (shapeType === 'LINE' || shapeType === 'ARROW') {
      newShape = {
        id,
        type: shapeType,
        data: { x: 0, y: 0, points: [pos.x, pos.y, pos.x, pos.y] },
        style: { ...style },
        layer: targetLayer,
        zIndex: shapes.length,
        locked: false,
        visible: true,
      };
    } else {
      // Rectangle, Polygon
      newShape = {
        id,
        type: shapeType,
        data: { x: pos.x, y: pos.y, width: 0, height: 0 },
        style: { ...style },
        layer: targetLayer,
        zIndex: shapes.length,
        locked: false,
        visible: true,
      };
    }

    setIsDrawing(true);
    setDrawingShape(newShape);
  }, [activeTool, getPointerPos, imageWidth, imageHeight, shapes.length, addShape, setSelectedIds, setIsDrawing, setDrawingShape, pushHistory, findNearestAssetPin]);

  // Mouse move - update drawing shape, selection rect, or cable preview
  const handleMouseMove = useCallback(() => {
    const store = useDrawingStore.getState();

    // Cable preview line - track mouse when selecting target
    if (store.activeTool === 'cable' && store.cablePhase === 'selecting_target') {
      const pos = getPointerPos();
      if (pos) setMousePos(pos);
      return;
    }

    // Update measurement line
    if (isMeasuring.current && measuringLine) {
      const pos = getPointerPos();
      if (pos) {
        setMeasuringLine({ ...measuringLine, endX: pos.x, endY: pos.y });
      }
      return;
    }

    // Update multi-select rectangle
    if (isSelecting.current && selectionRect) {
      const pos = getPointerPos();
      if (pos) {
        const x = Math.min(selectionRect.startX, pos.x);
        const y = Math.min(selectionRect.startY, pos.y);
        const width = Math.abs(pos.x - selectionRect.startX);
        const height = Math.abs(pos.y - selectionRect.startY);
        setSelectionRect({ ...selectionRect, x, y, width, height });
      }
      return;
    }

    if (!isDrawing || !drawingShape) return;

    const pos = getPointerPos();
    if (!pos) return;

    const updated = { ...drawingShape, data: { ...drawingShape.data } };

    if (drawingShape.type === 'FREEHAND') {
      const points = [...(drawingShape.data.points || []), pos.x, pos.y];
      updated.data.points = points;
    } else if (drawingShape.type === 'CIRCLE') {
      const dx = pos.x - (drawingShape.data.x || 0);
      const dy = pos.y - (drawingShape.data.y || 0);
      updated.data.radius = Math.sqrt(dx * dx + dy * dy);
    } else if (drawingShape.type === 'LINE' || drawingShape.type === 'ARROW') {
      const points = drawingShape.data.points || [0, 0, 0, 0];
      updated.data.points = [points[0], points[1], pos.x, pos.y];
    } else {
      // Rectangle
      const startX = drawingShape.data.x || 0;
      const startY = drawingShape.data.y || 0;
      updated.data.width = pos.x - startX;
      updated.data.height = pos.y - startY;
    }

    setDrawingShape(updated);
  }, [isDrawing, drawingShape, getPointerPos, setDrawingShape, selectionRect, measuringLine]);

  // Mouse up - finish drawing, measurement, or finalize selection rect
  const handleMouseUp = useCallback((e?: Konva.KonvaEventObject<MouseEvent>) => {
    // Finalize measurement line
    if (isMeasuring.current && measuringLine) {
      isMeasuring.current = false;
      const dx = measuringLine.endX - measuringLine.startX;
      const dy = measuringLine.endY - measuringLine.startY;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);
      if (pixelDist > 5) {
        addMeasurement({
          id: `meas_${Date.now()}`,
          startX: measuringLine.startX,
          startY: measuringLine.startY,
          endX: measuringLine.endX,
          endY: measuringLine.endY,
        });
      }
      setMeasuringLine(null);
      return;
    }

    // Finalize multi-select rectangle
    if (isSelecting.current && selectionRect) {
      isSelecting.current = false;
      const { x, y, width, height } = selectionRect;

      // Only select if rectangle has meaningful size (not just a click)
      if (width > 3 || height > 3) {
        const selRect = { x, y, w: width, h: height };
        const hitIds: string[] = [];
        for (const shape of visibleShapes) {
          if (shape.locked) continue;
          const bounds = getShapeBounds(shape);
          if (bounds && rectsIntersect(selRect, bounds)) {
            hitIds.push(shape.id);
          }
        }

        const shiftKey = e?.evt?.shiftKey ?? false;
        if (shiftKey) {
          const current = useDrawingStore.getState().selectedIds;
          const combined = new Set([...current, ...hitIds]);
          setSelectedIds(Array.from(combined));
        } else {
          setSelectedIds(hitIds);
        }
      } else {
        // It was just a click on empty area - deselect
        setSelectedIds([]);
        setSelectedCableIds([]);
      }

      setSelectionRect(null);
      return;
    }

    if (!isDrawing || !drawingShape) return;

    setIsDrawing(false);

    // Check minimum size
    const d = drawingShape.data;
    let hasSize = false;
    if (drawingShape.type === 'CIRCLE') {
      hasSize = (d.radius || 0) > 3;
    } else if (drawingShape.type === 'FREEHAND') {
      hasSize = (d.points?.length || 0) > 4;
    } else if (drawingShape.type === 'LINE' || drawingShape.type === 'ARROW') {
      const pts = d.points || [0, 0, 0, 0];
      const dx = pts[2] - pts[0];
      const dy = pts[3] - pts[1];
      hasSize = Math.sqrt(dx * dx + dy * dy) > 5;
    } else {
      hasSize = Math.abs(d.width || 0) > 3 || Math.abs(d.height || 0) > 3;
    }

    if (hasSize) {
      // Normalize negative width/height for rectangles
      if (drawingShape.type === 'RECTANGLE' || drawingShape.type === 'POLYGON') {
        const finalShape = { ...drawingShape, data: { ...drawingShape.data } };
        if ((finalShape.data.width || 0) < 0) {
          finalShape.data.x = (finalShape.data.x || 0) + (finalShape.data.width || 0);
          finalShape.data.width = Math.abs(finalShape.data.width || 0);
        }
        if ((finalShape.data.height || 0) < 0) {
          finalShape.data.y = (finalShape.data.y || 0) + (finalShape.data.height || 0);
          finalShape.data.height = Math.abs(finalShape.data.height || 0);
        }
        pushHistory();
        addShape(finalShape);
        setSelectedIds([finalShape.id]);
      } else {
        pushHistory();
        addShape(drawingShape);
        setSelectedIds([drawingShape.id]);
      }
    }

    setDrawingShape(null);
  }, [isDrawing, drawingShape, setIsDrawing, addShape, setSelectedIds, setSelectedCableIds, setDrawingShape, pushHistory, selectionRect, visibleShapes, getShapeBounds, rectsIntersect, measuringLine, addMeasurement]);

  // Mouse leave - cleanup in-progress operations
  const handleMouseLeave = useCallback(() => {
    if (isSelecting.current) {
      isSelecting.current = false;
      setSelectionRect(null);
    }
    if (isMeasuring.current) {
      isMeasuring.current = false;
      setMeasuringLine(null);
    }
    if (isDrawing) {
      setIsDrawing(false);
      setDrawingShape(null);
    }
  }, [isDrawing, setIsDrawing, setDrawingShape]);

  // Click on shape (select tool)
  const handleShapeClick = useCallback(
    (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== 'select') return;
      e.cancelBubble = true;

      if (e.evt.shiftKey) {
        // Multi-select with Shift
        const store = useDrawingStore.getState();
        if (store.selectedIds.includes(id)) {
          setSelectedIds(store.selectedIds.filter((i) => i !== id));
        } else {
          setSelectedIds([...store.selectedIds, id]);
        }
      } else {
        setSelectedIds([id]);
      }
    },
    [activeTool, setSelectedIds]
  );

  // Click on cable (select tool)
  const handleCableClick = useCallback(
    (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== 'select') return;
      e.cancelBubble = true;

      if (e.evt.shiftKey) {
        const store = useDrawingStore.getState();
        if (store.selectedCableIds.includes(id)) {
          setSelectedCableIds(store.selectedCableIds.filter((i) => i !== id));
        } else {
          setSelectedCableIds([...store.selectedCableIds, id]);
        }
      } else {
        // IMPORTANT: setSelectedIds clears selectedCableIds, so call it FIRST
        setSelectedIds([]);
        setSelectedCableIds([id]);
      }
    },
    [activeTool, setSelectedCableIds, setSelectedIds]
  );

  // Handle shape drag end
  const handleDragEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const shape = useDrawingStore.getState().shapes.find((s) => s.id === id);
      if (!shape) return;

      pushHistory();

      if (shape.type === 'LINE' || shape.type === 'ARROW' || shape.type === 'FREEHAND') {
        // Update points by drag offset, keep node at origin
        const dx = node.x();
        const dy = node.y();
        if (dx !== 0 || dy !== 0) {
          const pts = shape.data.points || [];
          const newPts: number[] = [];
          for (let i = 0; i < pts.length; i += 2) {
            newPts.push(pts[i] + dx, pts[i + 1] + dy);
          }
          node.position({ x: 0, y: 0 });
          updateShape(id, { data: { ...shape.data, points: newPts } });
        }
      } else {
        updateShape(id, {
          data: {
            ...shape.data,
            x: node.x(),
            y: node.y(),
          },
        });
      }
    },
    [updateShape, pushHistory]
  );

  // Handle transform end (resize)
  const handleTransformEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale and apply to dimensions
      node.scaleX(1);
      node.scaleY(1);

      const shape = useDrawingStore.getState().shapes.find((s) => s.id === id);
      if (!shape) return;

      pushHistory();

      if (shape.type === 'CIRCLE') {
        updateShape(id, {
          data: {
            ...shape.data,
            x: node.x(),
            y: node.y(),
            radius: Math.max(5, (shape.data.radius || 20) * Math.max(scaleX, scaleY)),
          },
        });
      } else if (shape.type === 'RECTANGLE' || shape.type === 'POLYGON') {
        updateShape(id, {
          data: {
            ...shape.data,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, (shape.data.width || 20) * scaleX),
            height: Math.max(5, (shape.data.height || 20) * scaleY),
            rotation: node.rotation(),
          },
        });
      }
    },
    [updateShape, pushHistory]
  );

  // Render a single shape
  const renderShape = (shape: LocalShape, isPreview = false) => {
    if (!shape.visible && !isPreview) return null;

    const id = isPreview ? 'preview' : `shape-${shape.id}`;
    const draggable = !isPreview && !readOnly && activeTool === 'select' && !shape.locked;
    const { data, style } = shape;
    const isSelected = !isPreview && !readOnly && selectedIds.includes(shape.id);
    const commonProps = {
      opacity: style.opacity ?? 1,
      listening: !isPreview && !readOnly && activeTool === 'select',
    };

    switch (shape.type) {
      case 'RECTANGLE':
        return (
          <Rect
            key={id}
            id={id}
            x={data.x}
            y={data.y}
            width={data.width || 0}
            height={data.height || 0}
            rotation={data.rotation || 0}
            fill={style.fill}
            stroke={isSelected ? '#0ea5e9' : style.stroke}
            strokeWidth={(style.strokeWidth || 2) / scale}
            draggable={draggable}
            onClick={(e) => !isPreview && handleShapeClick(shape.id, e)}
            onDragEnd={(e) => !isPreview && handleDragEnd(shape.id, e)}
            onTransformEnd={(e) => !isPreview && handleTransformEnd(shape.id, e)}
            {...commonProps}
          />
        );

      case 'CIRCLE':
        return (
          <Circle
            key={id}
            id={id}
            x={data.x}
            y={data.y}
            radius={data.radius || 0}
            fill={style.fill}
            stroke={isSelected ? '#0ea5e9' : style.stroke}
            strokeWidth={(style.strokeWidth || 2) / scale}
            draggable={draggable}
            onClick={(e) => !isPreview && handleShapeClick(shape.id, e)}
            onDragEnd={(e) => !isPreview && handleDragEnd(shape.id, e)}
            onTransformEnd={(e) => !isPreview && handleTransformEnd(shape.id, e)}
            {...commonProps}
          />
        );

      case 'LINE': {
        const editPts = (!isPreview && lineEditShapeId.current === shape.id && lineEditPoints) ? lineEditPoints : null;
        return (
          <Line
            key={id}
            id={id}
            points={editPts || data.points || []}
            stroke={isSelected ? '#0ea5e9' : style.stroke}
            strokeWidth={(style.strokeWidth || 2) / scale}
            tension={data.tension || 0}
            draggable={draggable}
            onClick={(e) => !isPreview && handleShapeClick(shape.id, e)}
            onDragEnd={(e) => !isPreview && handleDragEnd(shape.id, e)}
            hitStrokeWidth={10 / scale}
            {...commonProps}
          />
        );
      }

      case 'ARROW': {
        const editPts = (!isPreview && lineEditShapeId.current === shape.id && lineEditPoints) ? lineEditPoints : null;
        return (
          <Arrow
            key={id}
            id={id}
            points={editPts || data.points || []}
            stroke={isSelected ? '#0ea5e9' : style.stroke}
            strokeWidth={(style.strokeWidth || 2) / scale}
            fill={isSelected ? '#0ea5e9' : style.stroke}
            pointerLength={10 / scale}
            pointerWidth={8 / scale}
            tension={data.tension || 0}
            draggable={draggable}
            onClick={(e) => !isPreview && handleShapeClick(shape.id, e)}
            onDragEnd={(e) => !isPreview && handleDragEnd(shape.id, e)}
            hitStrokeWidth={10 / scale}
            {...commonProps}
          />
        );
      }

      case 'TEXT':
        return (
          <Text
            key={id}
            id={id}
            x={data.x}
            y={data.y}
            text={data.text || 'Text'}
            fontSize={(style.fontSize || 16) / scale}
            fontFamily={style.fontFamily || 'sans-serif'}
            fill={isSelected ? '#0ea5e9' : (style.fill || '#1f2937')}
            draggable={draggable}
            onClick={(e) => !isPreview && handleShapeClick(shape.id, e)}
            onDragEnd={(e) => !isPreview && handleDragEnd(shape.id, e)}
            {...commonProps}
          />
        );

      case 'FREEHAND':
        return (
          <Line
            key={id}
            id={id}
            points={data.points || []}
            stroke={isSelected ? '#0ea5e9' : style.stroke}
            strokeWidth={(style.strokeWidth || 2) / scale}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            draggable={draggable}
            onClick={(e) => !isPreview && handleShapeClick(shape.id, e)}
            onDragEnd={(e) => !isPreview && handleDragEnd(shape.id, e)}
            hitStrokeWidth={10 / scale}
            {...commonProps}
          />
        );

      default:
        return null;
    }
  };

  // Build flat points array for a cable: source → routingPoints → target
  const buildCablePoints = (cable: LocalCable): number[] => {
    const pts: number[] = [cable.sourceX, cable.sourceY];
    if (cable.routingPoints && cable.routingPoints.length > 0) {
      for (const rp of cable.routingPoints) {
        pts.push(rp.x, rp.y);
      }
    }
    pts.push(cable.targetX, cable.targetY);
    return pts;
  };

  // Render a cable
  const renderCable = (cable: LocalCable) => {
    const isSelected = selectedCableIds.includes(cable.id);
    const strokeColor = isSelected ? '#0ea5e9' : cable.color;
    const strokeWidth = (isSelected ? 3 : 2) / scale;

    // Use edit points if actively editing, else build from cable data
    const editPts = (!readOnly && cableEditId.current === cable.id && cableEditPoints) ? cableEditPoints : null;
    const pts = editPts || buildCablePoints(cable);

    // Label at midpoint of path
    const midIdx = Math.floor(pts.length / 2);
    const labelX = midIdx % 2 === 0 ? pts[midIdx] : (pts[midIdx - 1] + pts[midIdx + 1]) / 2;
    const labelY = midIdx % 2 === 0 ? pts[midIdx + 1] : (pts[midIdx] + pts[midIdx + 2]) / 2;

    return (
      <Group key={`cable-${cable.id}`}>
        <Line
          points={pts}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          tension={cable.tension || 0}
          hitStrokeWidth={20 / scale}
          lineCap="round"
          lineJoin="round"
          listening={!readOnly && activeTool === 'select'}
          onMouseDown={(e) => {
            if (!readOnly && activeTool === 'select') {
              e.cancelBubble = true;
            }
          }}
          onClick={(e) => handleCableClick(cable.id, e)}
        />
        {/* Cable label at midpoint */}
        {cable.label && (
          <Text
            x={labelX}
            y={labelY - 12 / scale}
            text={cable.label}
            fontSize={11 / scale}
            fill={strokeColor}
            align="center"
            listening={false}
          />
        )}
        {/* Small dots at connection points */}
        <Circle
          x={cable.sourceX}
          y={cable.sourceY}
          radius={4 / scale}
          fill={strokeColor}
          listening={false}
        />
        <Circle
          x={cable.targetX}
          y={cable.targetY}
          radius={4 / scale}
          fill={strokeColor}
          listening={false}
        />
      </Group>
    );
  };

  // Render cable preview line (while selecting target)
  const renderCablePreview = () => {
    if (cablePhase !== 'selecting_target' || !pendingCable || !mousePos) return null;

    const cableType = pendingCable.cableType || 'ETHERNET';
    return (
      <Line
        points={[pendingCable.sourceX, pendingCable.sourceY, mousePos.x, mousePos.y]}
        stroke={CABLE_TYPE_COLORS[cableType]}
        strokeWidth={2 / scale}
        dash={[8 / scale, 4 / scale]}
        lineCap="round"
        listening={false}
        opacity={0.7}
      />
    );
  };

  // Render source pin highlight when cable tool is active
  const renderCableSourceHighlight = () => {
    if (activeTool !== 'cable' || cablePhase !== 'selecting_source') return null;

    return assetPins.map((pin) => (
      <Circle
        key={`highlight-${pin.id}`}
        x={pin.pinX}
        y={pin.pinY}
        radius={18 / scale}
        fill="transparent"
        stroke="#0ea5e9"
        strokeWidth={2 / scale}
        dash={[4 / scale, 4 / scale]}
        listening={false}
        opacity={0.6}
      />
    ));
  };

  // Render target pin highlights (when selecting target)
  const renderCableTargetHighlights = () => {
    if (cablePhase !== 'selecting_target' || !pendingCable) return null;

    return assetPins
      .filter((pin) => pin.id !== pendingCable.sourceAssetId)
      .map((pin) => (
        <Circle
          key={`target-${pin.id}`}
          x={pin.pinX}
          y={pin.pinY}
          radius={18 / scale}
          fill="transparent"
          stroke="#22c55e"
          strokeWidth={2.5 / scale}
          dash={[4 / scale, 4 / scale]}
          listening={false}
          opacity={0.8}
        />
      ));
  };

  // Format measurement distance with calibration
  const formatDistance = (pixelDist: number): string => {
    if (calibration) {
      const realDist = pixelDist / calibration.pixelsPerUnit;
      return `${realDist.toFixed(2)} ${calibration.unit}`;
    }
    return `${Math.round(pixelDist)} px`;
  };

  // Render measurement lines
  const renderMeasurement = (m: { id: string; startX: number; startY: number; endX: number; endY: number }, isPreview = false) => {
    const dx = m.endX - m.startX;
    const dy = m.endY - m.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 3) return null;
    const midX = (m.startX + m.endX) / 2;
    const midY = (m.startY + m.endY) / 2;
    const label = formatDistance(dist);

    return (
      <Group key={isPreview ? 'meas-preview' : `meas-${m.id}`}>
        <Line
          points={[m.startX, m.startY, m.endX, m.endY]}
          stroke="#f59e0b"
          strokeWidth={(isPreview ? 1.5 : 2) / scale}
          dash={[6 / scale, 3 / scale]}
          lineCap="round"
          listening={!isPreview && !readOnly}
          opacity={isPreview ? 0.7 : 1}
          onClick={!isPreview && !readOnly ? () => useDrawingStore.getState().removeMeasurement(m.id) : undefined}
          hitStrokeWidth={12 / scale}
        />
        {/* Endpoints */}
        <Circle x={m.startX} y={m.startY} radius={3 / scale} fill="#f59e0b" listening={false} />
        <Circle x={m.endX} y={m.endY} radius={3 / scale} fill="#f59e0b" listening={false} />
        {/* Label background + text */}
        <Rect
          x={midX - (label.length * 3.5) / scale}
          y={midY - 9 / scale}
          width={(label.length * 7 + 8) / scale}
          height={16 / scale}
          fill="rgba(0,0,0,0.75)"
          cornerRadius={3 / scale}
          listening={false}
        />
        <Text
          x={midX - (label.length * 3.5) / scale + 4 / scale}
          y={midY - 7 / scale}
          text={label}
          fontSize={11 / scale}
          fill="#f59e0b"
          listening={false}
        />
      </Group>
    );
  };

  // Render line bend point handles (vertex + midpoint)
  const renderLineHandles = (shape: LocalShape) => {
    if (shape.type !== 'LINE' && shape.type !== 'ARROW') return null;

    const pts = (lineEditShapeId.current === shape.id && lineEditPoints)
      ? lineEditPoints
      : (shape.data.points || []);
    const handles: React.ReactNode[] = [];
    const handleR = 5 / scale;
    const midR = 3.5 / scale;

    // Vertex handles (draggable, real-time line update)
    for (let i = 0; i < pts.length; i += 2) {
      const pIdx = i;
      handles.push(
        <Circle
          key={`vh-${shape.id}-${i}`}
          x={pts[i]}
          y={pts[i + 1]}
          radius={handleR}
          fill="#0ea5e9"
          stroke="#ffffff"
          strokeWidth={1.5 / scale}
          draggable
          onDragStart={() => {
            lineEditShapeId.current = shape.id;
            setLineEditPoints([...pts]);
          }}
          onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
            const newPts = [...(lineEditPoints || pts)];
            newPts[pIdx] = e.target.x();
            newPts[pIdx + 1] = e.target.y();
            setLineEditPoints(newPts);
          }}
          onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
            const newPts = [...(lineEditPoints || pts)];
            newPts[pIdx] = e.target.x();
            newPts[pIdx + 1] = e.target.y();
            pushHistory();
            updateShape(shape.id, { data: { ...shape.data, points: newPts } });
            lineEditShapeId.current = null;
            setLineEditPoints(null);
          }}
          onDblClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
            e.cancelBubble = true;
            // Remove bend point (keep minimum 2 points = 4 values)
            if (pts.length > 4) {
              const newPts = [...pts];
              newPts.splice(pIdx, 2);
              pushHistory();
              updateShape(shape.id, { data: { ...shape.data, points: newPts } });
            }
          }}
        />
      );
    }

    // Midpoint handles (click-drag to insert new bend point)
    // Only show when NOT in vertex-edit mode
    if (!lineEditPoints) {
      for (let i = 0; i < pts.length - 2; i += 2) {
        const midX = (pts[i] + pts[i + 2]) / 2;
        const midY = (pts[i + 1] + pts[i + 3]) / 2;
        const insertAt = i + 2;

        handles.push(
          <Circle
            key={`mh-${shape.id}-${i}`}
            x={midX}
            y={midY}
            radius={midR}
            fill="#22c55e"
            stroke="#ffffff"
            strokeWidth={1 / scale}
            opacity={0.6}
            draggable
            onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
              const newPts = [...pts];
              newPts.splice(insertAt, 0, e.target.x(), e.target.y());
              e.target.position({ x: midX, y: midY });
              pushHistory();
              updateShape(shape.id, { data: { ...shape.data, points: newPts } });
            }}
          />
        );
      }
    }

    return <Group>{handles}</Group>;
  };

  // Render cable bend point handles (vertex + midpoint)
  const renderCableHandles = (cable: LocalCable) => {
    const pts = (cableEditId.current === cable.id && cableEditPoints)
      ? cableEditPoints
      : buildCablePoints(cable);
    const handles: React.ReactNode[] = [];
    const handleR = 6 / scale;
    const midR = 5 / scale;

    // Vertex handles for routing points only (NOT source/target endpoints - those are fixed to assets)
    // Points array: [sourceX, sourceY, ...routingPoints..., targetX, targetY]
    // Skip first pair (source) and last pair (target)
    for (let i = 2; i < pts.length - 2; i += 2) {
      const pIdx = i;
      handles.push(
        <Circle
          key={`cvh-${cable.id}-${i}`}
          x={pts[i]}
          y={pts[i + 1]}
          radius={handleR}
          fill="#0ea5e9"
          stroke="#ffffff"
          strokeWidth={1.5 / scale}
          draggable
          onDragStart={() => {
            cableEditId.current = cable.id;
            setCableEditPoints([...pts]);
          }}
          onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
            const newPts = [...(cableEditPoints || pts)];
            newPts[pIdx] = e.target.x();
            newPts[pIdx + 1] = e.target.y();
            setCableEditPoints(newPts);
          }}
          onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
            const newPts = [...(cableEditPoints || pts)];
            newPts[pIdx] = e.target.x();
            newPts[pIdx + 1] = e.target.y();
            // Convert flat points back to routingPoints (skip source + target)
            const rp: { x: number; y: number }[] = [];
            for (let j = 2; j < newPts.length - 2; j += 2) {
              rp.push({ x: newPts[j], y: newPts[j + 1] });
            }
            pushHistory();
            updateCable(cable.id, { routingPoints: rp.length > 0 ? rp : undefined });
            cableEditId.current = null;
            setCableEditPoints(null);
          }}
          onDblClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
            e.cancelBubble = true;
            // Remove this routing point
            const rp: { x: number; y: number }[] = [];
            for (let j = 2; j < pts.length - 2; j += 2) {
              if (j !== pIdx) {
                rp.push({ x: pts[j], y: pts[j + 1] });
              }
            }
            pushHistory();
            updateCable(cable.id, { routingPoints: rp.length > 0 ? rp : undefined });
          }}
        />
      );
    }

    // Midpoint handles (click-drag to insert new routing point)
    // Only show when NOT in vertex-edit mode
    if (!cableEditPoints) {
      for (let i = 0; i < pts.length - 2; i += 2) {
        const midX = (pts[i] + pts[i + 2]) / 2;
        const midY = (pts[i + 1] + pts[i + 3]) / 2;
        const segIdx = i; // index of the segment start

        handles.push(
          <Circle
            key={`cmh-${cable.id}-${i}`}
            x={midX}
            y={midY}
            radius={midR}
            fill="#22c55e"
            stroke="#ffffff"
            strokeWidth={1.5 / scale}
            opacity={0.85}
            draggable
            onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
              const newPt = { x: e.target.x(), y: e.target.y() };
              // Reset node position so stale handle disappears on re-render
              e.target.position({ x: midX, y: midY });
              const rpInsertIdx = segIdx / 2;
              const existingRp = cable.routingPoints ? [...cable.routingPoints] : [];
              existingRp.splice(rpInsertIdx, 0, newPt);
              pushHistory();
              updateCable(cable.id, { routingPoints: existingRp });
            }}
          />
        );
      }
    }

    return <Group>{handles}</Group>;
  };

  // Read-only mode: just render shapes and cables, no interactivity
  if (readOnly) {
    return (
      <Layer listening={false}>
        {cables.map((cable) => renderCable(cable))}
        {visibleShapes.map((shape) => renderShape(shape))}
        {measurements.map((m) => renderMeasurement(m))}
      </Layer>
    );
  }

  return (
    <Layer>
      {/* Invisible rect for capturing mouse events - MUST be first (below shapes) */}
      <Rect
        x={0}
        y={0}
        width={imageWidth}
        height={imageHeight}
        fill="transparent"
        listening={true}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

      {/* Rendered cables */}
      {cables.map((cable) => renderCable(cable))}

      {/* Cable preview line */}
      {renderCablePreview()}

      {/* Cable source/target highlights */}
      {renderCableSourceHighlight()}
      {renderCableTargetHighlights()}

      {/* Rendered shapes (respecting layer visibility) */}
      {visibleShapes.map((shape) => renderShape(shape))}

      {/* Drawing preview (in-progress shape) */}
      {drawingShape && renderShape(drawingShape, true)}

      {/* Measurement lines */}
      {measurements.map((m) => renderMeasurement(m))}
      {measuringLine && renderMeasurement({ id: 'preview', ...measuringLine }, true)}

      {/* Multi-select rectangle overlay */}
      {selectionRect && (selectionRect.width > 3 || selectionRect.height > 3) && (
        <Rect
          x={selectionRect.x}
          y={selectionRect.y}
          width={selectionRect.width}
          height={selectionRect.height}
          fill="rgba(14,165,233,0.08)"
          stroke="#0ea5e9"
          strokeWidth={1 / scale}
          dash={[6 / scale, 3 / scale]}
          listening={false}
        />
      )}

      {/* Transformer for selected shapes */}
      {activeTool === 'select' && selectedIds.length > 0 && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
        />
      )}

      {/* Line bend point handles */}
      {activeTool === 'select' && selectedIds.length === 1 && (() => {
        const shape = visibleShapes.find((s) => s.id === selectedIds[0]);
        if (shape && (shape.type === 'LINE' || shape.type === 'ARROW')) {
          return renderLineHandles(shape);
        }
        return null;
      })()}

      {/* Cable bend point handles */}
      {activeTool === 'select' && selectedCableIds.length === 1 && (() => {
        const cable = cables.find((c) => c.id === selectedCableIds[0]);
        if (cable) return renderCableHandles(cable);
        return null;
      })()}
    </Layer>
  );
}

