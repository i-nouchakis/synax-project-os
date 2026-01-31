import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Text, Group } from 'react-konva';
import Konva from 'konva';
import { ZoomIn, ZoomOut, Maximize2, Lock, Unlock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui';

interface Pin {
  id: string;
  x: number;
  y: number;
  name: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
}

interface FloorPlanCanvasProps {
  imageUrl: string;
  pins: Pin[];
  onPinClick?: (pin: Pin) => void;
  onPinMove?: (pinId: string, x: number, y: number) => void;
  onAddPin?: (x: number, y: number) => void;
  isEditable?: boolean;
  selectedPinId?: string | null;
  onMaximize?: () => void;
  showMaximize?: boolean;
  showLegend?: boolean;
  className?: string;
}

const STATUS_COLORS: Record<Pin['status'], string> = {
  NOT_STARTED: '#64748b', // gray
  IN_PROGRESS: '#3b82f6', // blue
  COMPLETED: '#22c55e', // green
  BLOCKED: '#ef4444', // red
};

export function FloorPlanCanvas({
  imageUrl,
  pins,
  onPinClick,
  onPinMove,
  onAddPin,
  isEditable = false,
  selectedPinId,
  onMaximize,
  showMaximize = true,
  showLegend = true,
  className,
}: FloorPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [isDraggingPin, setIsDraggingPin] = useState(false);
  const [isPanUnlocked, setIsPanUnlocked] = useState(false);

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      // Use naturalWidth/naturalHeight for actual image dimensions
      const imgWidth = img.naturalWidth || img.width;
      const imgHeight = img.naturalHeight || img.height;

      setImage(img);
      // Store image dimensions for bounds checking
      setImageDimensions({ width: imgWidth, height: imgHeight });

      // Fit image to container
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight || 600;
        const scaleX = containerWidth / imgWidth;
        const scaleY = containerHeight / imgHeight;
        const newScale = Math.min(scaleX, scaleY, 1);
        setScale(newScale);
        // Center the image
        setPosition({
          x: (containerWidth - imgWidth * newScale) / 2,
          y: (containerHeight - imgHeight * newScale) / 2,
        });
      }
    };
  }, [imageUrl]);

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight || 600,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Zoom with scroll wheel - only when unlocked
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    // Only allow zoom when pan is unlocked
    if (!isPanUnlocked) return;

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * 1.1 : oldScale / 1.1;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }, [scale, position, isPanUnlocked]);

  // Handle stage click for adding pins
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isEditable || !onAddPin) return;

    // Only add pin if clicking on empty area (not on a pin)
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'floor-image';
    if (!clickedOnEmpty) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert to image coordinates
    const x = (pointer.x - position.x) / scale;
    const y = (pointer.y - position.y) / scale;

    // Only add if within image bounds using stored dimensions
    if (imageDimensions.width > 0 && x >= 0 && y >= 0 && x <= imageDimensions.width && y <= imageDimensions.height) {
      onAddPin(x, y);
    }
  }, [isEditable, onAddPin, scale, position, imageDimensions]);

  // Handle pin drag start
  const handlePinDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    setIsDraggingPin(true);
  }, []);

  // Handle pin drag move - constrain in real-time and prevent stage from moving
  const handlePinDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;

    // Get actual image dimensions from the loaded image element
    if (!image) return;

    const node = e.target;
    const margin = 12;

    // Use image.naturalWidth/Height for accurate bounds
    const maxX = (image.naturalWidth || image.width) - margin;
    const maxY = (image.naturalHeight || image.height) - margin;

    // Clamp position in real-time during drag
    const x = node.x();
    const y = node.y();
    const clampedX = Math.max(margin, Math.min(maxX, x));
    const clampedY = Math.max(margin, Math.min(maxY, y));

    if (x !== clampedX || y !== clampedY) {
      node.x(clampedX);
      node.y(clampedY);
    }
  }, [image]);

  // Handle pin drag end - constrain to image bounds with margin
  const handlePinDragEnd = useCallback((pinId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    setIsDraggingPin(false);
    if (!onPinMove || !image) return;

    const node = e.target;
    const margin = 12;

    // Use image.naturalWidth/Height for accurate bounds
    const maxX = (image.naturalWidth || image.width) - margin;
    const maxY = (image.naturalHeight || image.height) - margin;

    // Constrain position within image bounds
    const x = Math.max(margin, Math.min(maxX, node.x()));
    const y = Math.max(margin, Math.min(maxY, node.y()));

    // Update node position to constrained values
    node.x(x);
    node.y(y);

    onPinMove(pinId, x, y);
  }, [onPinMove, image]);

  // Zoom controls - only when unlocked
  const zoomIn = () => {
    if (!isPanUnlocked) return;
    setScale(Math.min(5, scale * 1.2));
  };
  const zoomOut = () => {
    if (!isPanUnlocked) return;
    setScale(Math.max(0.1, scale / 1.2));
  };
  const fitToScreen = useCallback(() => {
    if (imageDimensions.width === 0 || !containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight || 600;
    const scaleX = containerWidth / imageDimensions.width;
    const scaleY = containerHeight / imageDimensions.height;
    const newScale = Math.min(scaleX, scaleY, 1);
    setScale(newScale);
    setPosition({
      x: (containerWidth - imageDimensions.width * newScale) / 2,
      y: (containerHeight - imageDimensions.height * newScale) / 2,
    });
  }, [imageDimensions]);

  const togglePan = () => setIsPanUnlocked(!isPanUnlocked);

  return (
    <div className={`relative h-full ${className || ''}`} ref={containerRef}>
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 bg-surface/90 backdrop-blur-sm rounded-lg p-1 shadow-md">
        {/* Lock/Unlock - Always first */}
        <Button
          size="sm"
          variant={isPanUnlocked ? 'primary' : 'ghost'}
          onClick={togglePan}
          title={isPanUnlocked ? 'Lock (Click to lock view)' : 'Unlock (Click to enable zoom & pan)'}
        >
          {isPanUnlocked ? <Unlock size={18} /> : <Lock size={18} />}
        </Button>
        <div className="border-t border-surface-border my-1" />
        {/* Zoom controls - show disabled state when locked */}
        <Button
          size="sm"
          variant="ghost"
          onClick={zoomIn}
          title={isPanUnlocked ? 'Zoom In' : 'Unlock to zoom'}
          className={!isPanUnlocked ? 'opacity-40 cursor-not-allowed' : ''}
        >
          <ZoomIn size={18} />
        </Button>
        <div className={`text-center text-caption py-1 ${isPanUnlocked ? 'text-text-secondary' : 'text-text-tertiary'}`}>
          {Math.round(scale * 100)}%
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={zoomOut}
          title={isPanUnlocked ? 'Zoom Out' : 'Unlock to zoom'}
          className={!isPanUnlocked ? 'opacity-40 cursor-not-allowed' : ''}
        >
          <ZoomOut size={18} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={fitToScreen}
          title="Reset View"
          className={!isPanUnlocked ? 'opacity-40 cursor-not-allowed' : ''}
        >
          <RotateCcw size={18} />
        </Button>
        {showMaximize && onMaximize && (
          <>
            <div className="border-t border-surface-border my-1" />
            <Button size="sm" variant="ghost" onClick={onMaximize} title="Full Screen">
              <Maximize2 size={18} />
            </Button>
          </>
        )}
      </div>

      {/* Instructions */}
      {isEditable && (
        <div className="absolute top-2 left-2 z-10 bg-surface/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
          <p className="text-caption text-text-secondary">
            Click to add pin | Drag pins to move
          </p>
        </div>
      )}

      {/* Canvas */}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTouchEnd={handleStageClick as (e: Konva.KonvaEventObject<TouchEvent>) => void}
        draggable={isPanUnlocked && !isDraggingPin}
        onDragStart={() => setIsDraggingStage(true)}
        onDragEnd={(e) => {
          setIsDraggingStage(false);
          setPosition({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        x={position.x}
        y={position.y}
        scaleX={scale}
        scaleY={scale}
        className="bg-surface-secondary rounded-lg"
        style={{
          cursor: isDraggingPin
            ? 'move'
            : isPanUnlocked
              ? (isDraggingStage ? 'grabbing' : 'grab')
              : 'default'
        }}
      >
        <Layer>
          {/* Floor Plan Image */}
          {image && (
            <KonvaImage
              image={image}
              name="floor-image"
            />
          )}

          {/* Room Pins - only render if image is loaded */}
          {image && pins.map((pin) => (
            <Group
              key={pin.id}
              x={pin.x}
              y={pin.y}
              draggable={isEditable}
              onDragStart={handlePinDragStart}
              onDragMove={handlePinDragMove}
              onDragEnd={(e) => handlePinDragEnd(pin.id, e)}
              onClick={(e) => {
                e.cancelBubble = true;
                onPinClick?.(pin);
              }}
              onTouchEnd={(e) => {
                e.cancelBubble = true;
                onPinClick?.(pin);
              }}
            >
              {/* Pin shadow/halo for selected */}
              {selectedPinId === pin.id && (
                <Circle
                  radius={20}
                  fill={STATUS_COLORS[pin.status]}
                  opacity={0.3}
                />
              )}
              {/* Pin marker */}
              <Circle
                radius={12}
                fill={STATUS_COLORS[pin.status]}
                stroke="#fff"
                strokeWidth={2}
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={0.3}
                shadowOffsetY={2}
              />
              {/* Pin label */}
              <Text
                text={pin.name}
                fontSize={12}
                fontFamily="system-ui"
                fill="#1e293b"
                offsetX={-16}
                offsetY={-8}
                padding={4}
                align="left"
                verticalAlign="middle"
              />
            </Group>
          ))}
        </Layer>
      </Stage>

      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-2 left-2 z-10 bg-surface/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
          <div className="flex flex-wrap gap-3 text-caption">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.NOT_STARTED }} />
              <span>Not Started</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.IN_PROGRESS }} />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.COMPLETED }} />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.BLOCKED }} />
              <span>Blocked</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
