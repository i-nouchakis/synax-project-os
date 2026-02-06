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

  // Cable drawing state
  const cablePhase = useDrawingStore((s) => s.cablePhase);
  const pendingCable = useDrawingStore((s) => s.pendingCable);
  const addCable = useDrawingStore((s) => s.addCable);

  const transformerRef = useRef<Konva.Transformer>(null);

  // Mouse position for cable preview line
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

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

    if (activeTool === 'select') return;

    const pos = getPointerPos();
    if (!pos) return;

    // Check bounds
    if (pos.x < 0 || pos.y < 0 || pos.x > imageWidth || pos.y > imageHeight) return;

    const shapeType = toolToShapeType(activeTool);
    if (!shapeType) return;

    const style = DEFAULT_STYLES[shapeType];
    const id = generateLocalId();

    let newShape: LocalShape;

    if (shapeType === 'TEXT') {
      // Text: single click to place
      newShape = {
        id,
        type: 'TEXT',
        data: { x: pos.x, y: pos.y, text: 'Text' },
        style: { ...style },
        layer: 'default',
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
        layer: 'default',
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
        layer: 'default',
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
        layer: 'default',
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
        layer: 'default',
        zIndex: shapes.length,
        locked: false,
        visible: true,
      };
    }

    setIsDrawing(true);
    setDrawingShape(newShape);
  }, [activeTool, getPointerPos, imageWidth, imageHeight, shapes.length, addShape, setSelectedIds, setIsDrawing, setDrawingShape, pushHistory, findNearestAssetPin]);

  // Mouse move - update drawing shape or cable preview
  const handleMouseMove = useCallback(() => {
    const store = useDrawingStore.getState();

    // Cable preview line - track mouse when selecting target
    if (store.activeTool === 'cable' && store.cablePhase === 'selecting_target') {
      const pos = getPointerPos();
      if (pos) setMousePos(pos);
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
  }, [isDrawing, drawingShape, getPointerPos, setDrawingShape]);

  // Mouse up - finish drawing
  const handleMouseUp = useCallback(() => {
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
  }, [isDrawing, drawingShape, setIsDrawing, addShape, setSelectedIds, setDrawingShape, pushHistory]);

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
        setSelectedCableIds([id]);
        setSelectedIds([]);
      }
    },
    [activeTool, setSelectedCableIds, setSelectedIds]
  );

  // Handle shape drag end
  const handleDragEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      pushHistory();
      updateShape(id, {
        data: {
          ...useDrawingStore.getState().shapes.find((s) => s.id === id)!.data,
          x: node.x(),
          y: node.y(),
        },
      });
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
      listening: !isPreview && !readOnly,
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

      case 'LINE':
        return (
          <Line
            key={id}
            id={id}
            points={data.points || []}
            stroke={isSelected ? '#0ea5e9' : style.stroke}
            strokeWidth={(style.strokeWidth || 2) / scale}
            draggable={draggable}
            onClick={(e) => !isPreview && handleShapeClick(shape.id, e)}
            onDragEnd={(e) => !isPreview && handleDragEnd(shape.id, e)}
            hitStrokeWidth={10 / scale}
            {...commonProps}
          />
        );

      case 'ARROW':
        return (
          <Arrow
            key={id}
            id={id}
            points={data.points || []}
            stroke={isSelected ? '#0ea5e9' : style.stroke}
            strokeWidth={(style.strokeWidth || 2) / scale}
            fill={isSelected ? '#0ea5e9' : style.stroke}
            pointerLength={10 / scale}
            pointerWidth={8 / scale}
            draggable={draggable}
            onClick={(e) => !isPreview && handleShapeClick(shape.id, e)}
            onDragEnd={(e) => !isPreview && handleDragEnd(shape.id, e)}
            hitStrokeWidth={10 / scale}
            {...commonProps}
          />
        );

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

  // Render a cable
  const renderCable = (cable: LocalCable) => {
    const isSelected = selectedCableIds.includes(cable.id);
    const strokeColor = isSelected ? '#0ea5e9' : cable.color;
    const strokeWidth = (isSelected ? 3 : 2) / scale;

    return (
      <Group key={`cable-${cable.id}`}>
        <Line
          points={[cable.sourceX, cable.sourceY, cable.targetX, cable.targetY]}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          hitStrokeWidth={12 / scale}
          lineCap="round"
          onClick={(e) => handleCableClick(cable.id, e)}
        />
        {/* Cable label at midpoint */}
        {cable.label && (
          <Text
            x={(cable.sourceX + cable.targetX) / 2}
            y={(cable.sourceY + cable.targetY) / 2 - 12 / scale}
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

  // Read-only mode: just render shapes and cables, no interactivity
  if (readOnly) {
    return (
      <Layer listening={false}>
        {cables.map((cable) => renderCable(cable))}
        {shapes.filter((s) => s.visible).map((shape) => renderShape(shape))}
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
        listening={activeTool !== 'select'}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* Rendered cables */}
      {cables.map((cable) => renderCable(cable))}

      {/* Cable preview line */}
      {renderCablePreview()}

      {/* Cable source/target highlights */}
      {renderCableSourceHighlight()}
      {renderCableTargetHighlights()}

      {/* Rendered shapes */}
      {shapes.filter((s) => s.visible).map((shape) => renderShape(shape))}

      {/* Drawing preview (in-progress shape) */}
      {drawingShape && renderShape(drawingShape, true)}

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
    </Layer>
  );
}

