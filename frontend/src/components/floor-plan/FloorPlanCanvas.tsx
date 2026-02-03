import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Text, Group } from 'react-konva';
import Konva from 'konva';
import { ZoomIn, ZoomOut, Maximize2, Lock, Unlock, RotateCcw, Layers, X, Plus, MapPin, ChevronRight } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

interface Pin {
  id: string;
  x: number;
  y: number;
  name: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
}

interface AvailableItem {
  id: string;
  name: string;
  level?: number;
}

interface FloorPlanCanvasProps {
  imageUrl: string;
  pins: Pin[];
  availableItems?: AvailableItem[]; // Items without pins that can be placed
  onPinClick?: (pin: Pin) => void;
  onPinMove?: (pinId: string, x: number, y: number) => void;
  onAddPin?: (x: number, y: number) => void;
  onPlaceItem?: (itemId: string, x: number, y: number) => void;
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
  availableItems = [],
  onPinClick,
  onPinMove,
  onAddPin,
  onPlaceItem,
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

  // Dropdown state for placing items
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showItemList, setShowItemList] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, canvasX: 0, canvasY: 0 });

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
    // Only prevent default and handle zoom when pan is unlocked
    // This allows page scroll to work when locked
    if (!isPanUnlocked) return;

    e.evt.preventDefault();

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

  // Handle stage click for adding pins or showing action menu
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isEditable) return;

    // Only add pin if clicking on empty area (not on a pin)
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'floor-image';
    if (!clickedOnEmpty) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert to image coordinates
    const canvasX = (pointer.x - position.x) / scale;
    const canvasY = (pointer.y - position.y) / scale;

    // Only add if within image bounds using stored dimensions
    if (imageDimensions.width > 0 && canvasX >= 0 && canvasY >= 0 && canvasX <= imageDimensions.width && canvasY <= imageDimensions.height) {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setDropdownPosition({
          x: rect.left + pointer.x,
          y: rect.top + pointer.y,
          canvasX,
          canvasY,
        });
        // Show action menu (choose between place existing or create new)
        setShowActionMenu(true);
        setShowItemList(false);
      }
    }
  }, [isEditable, scale, position, imageDimensions]);

  // Handle "Place existing" action
  const handlePlaceExisting = () => {
    setShowActionMenu(false);
    setShowItemList(true);
  };

  // Handle "Create new" action
  const handleCreateNew = () => {
    setShowActionMenu(false);
    setShowItemList(false);
    if (onAddPin) {
      onAddPin(dropdownPosition.canvasX, dropdownPosition.canvasY);
    }
  };

  // Handle item selection from dropdown
  const handleSelectItem = (itemId: string) => {
    if (onPlaceItem) {
      onPlaceItem(itemId, dropdownPosition.canvasX, dropdownPosition.canvasY);
    }
    setShowItemList(false);
  };

  // Close all menus
  const closeMenus = () => {
    setShowActionMenu(false);
    setShowItemList(false);
  };

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
      {isEditable && (availableItems.length > 0 || onAddPin) && (
        <div className="absolute top-2 left-2 z-10 bg-surface/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
          <p className="text-caption text-text-secondary">
            Click to add | Drag pins to move
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

      {/* Action Menu - Choose between place existing or create new */}
      {showActionMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeMenus}
          />
          <div
            className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: Math.min(dropdownPosition.x, window.innerWidth - 240),
              top: Math.min(dropdownPosition.y, window.innerHeight - 180),
            }}
          >
            <div className="bg-surface backdrop-blur-sm rounded-xl border border-surface-border shadow-xl overflow-hidden min-w-[220px]">
              {/* Header */}
              <div className="px-3 py-2.5 border-b border-surface-border bg-surface-secondary/50">
                <p className="text-caption font-medium text-text-secondary uppercase tracking-wide">Add Pin</p>
              </div>

              {/* Options */}
              <div className="p-1.5">
                {/* Place existing option */}
                {availableItems.length > 0 && onPlaceItem && (
                  <button
                    className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-hover active:bg-surface-active transition-colors text-left"
                    onClick={handlePlaceExisting}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-text-primary">Place Existing</p>
                      <p className="text-caption text-text-tertiary">
                        {availableItems.length} available
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
                  </button>
                )}

                {/* Create new option */}
                {onAddPin && (
                  <button
                    className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-hover active:bg-surface-active transition-colors text-left"
                    onClick={handleCreateNew}
                  >
                    <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                      <Plus size={18} className="text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-text-primary">Create New</p>
                      <p className="text-caption text-text-tertiary">Add new item</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Item Selection List - shown after choosing "Place Existing" */}
      {showItemList && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeMenus}
          />
          <Card
            className="fixed z-50 w-64 max-h-72 overflow-y-auto shadow-xl"
            style={{
              left: Math.min(dropdownPosition.x, window.innerWidth - 280),
              top: Math.min(dropdownPosition.y, window.innerHeight - 300),
            }}
          >
            <div className="flex items-center justify-between p-2 border-b border-surface-border">
              <span className="text-body-sm font-medium">Select Item to Place</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={closeMenus}
              >
                <X size={16} />
              </Button>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-surface-border">
                {availableItems.map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors text-left"
                    onClick={() => handleSelectItem(item.id)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {item.level !== undefined ? (
                        <span className="text-body font-bold text-primary">{item.level}</span>
                      ) : (
                        <Layers size={18} className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium truncate">{item.name}</p>
                      {item.level !== undefined && (
                        <p className="text-caption text-text-tertiary">Level {item.level}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

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
