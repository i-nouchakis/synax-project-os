import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Text, Group, Rect } from 'react-konva';
import Konva from 'konva';
import { ZoomIn, ZoomOut, Maximize2, Lock, Unlock, RotateCcw, Wifi, Monitor, Phone, Camera, Router, CreditCard, Tv, X } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

interface Asset {
  id: string;
  name: string;
  status: 'PLANNED' | 'IN_STOCK' | 'INSTALLED' | 'CONFIGURED' | 'VERIFIED' | 'FAULTY';
  pinX: number | null;
  pinY: number | null;
  assetType?: {
    id: string;
    name: string;
    icon?: string | null;
  } | null;
}

interface RoomPlanCanvasProps {
  imageUrl: string;
  assets: Asset[];
  availableAssets: Asset[]; // Assets without pins that can be placed
  onAssetClick?: (asset: Asset) => void;
  onAssetMove?: (assetId: string, x: number, y: number) => void;
  onPlaceAsset?: (assetId: string, x: number, y: number) => void;
  onRemoveAssetPin?: (assetId: string) => void;
  isEditable?: boolean;
  selectedAssetId?: string | null;
  onMaximize?: () => void;
  showMaximize?: boolean;
  showLegend?: boolean;
  className?: string;
}

const STATUS_COLORS: Record<Asset['status'], string> = {
  PLANNED: '#64748b', // gray
  IN_STOCK: '#8b5cf6', // purple
  INSTALLED: '#3b82f6', // blue
  CONFIGURED: '#f59e0b', // amber
  VERIFIED: '#22c55e', // green
  FAULTY: '#ef4444', // red
};

const ASSET_TYPE_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  'Access Point': Wifi,
  'Network Switch': Router,
  'Smart TV': Tv,
  'IP Camera': Camera,
  'VoIP Phone': Phone,
  'POS Terminal': CreditCard,
  'Digital Signage': Monitor,
  'Router': Router,
};

export function RoomPlanCanvas({
  imageUrl,
  assets,
  availableAssets,
  onAssetClick,
  onAssetMove,
  onPlaceAsset,
  // onRemoveAssetPin - Reserved for future use
  isEditable = false,
  selectedAssetId,
  onMaximize,
  showMaximize = true,
  showLegend = true,
  className,
}: RoomPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingStage, setIsDraggingStage] = useState(false);
  const [isDraggingPin, setIsDraggingPin] = useState(false);
  const [isPanUnlocked, setIsPanUnlocked] = useState(false);

  // Dropdown state for placing assets
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, canvasX: 0, canvasY: 0 });

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      // Fit image to container
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight || 600;
        const scaleX = containerWidth / img.width;
        const scaleY = containerHeight / img.height;
        const newScale = Math.min(scaleX, scaleY, 1);
        setScale(newScale);
        // Center the image
        setPosition({
          x: (containerWidth - img.width * newScale) / 2,
          y: (containerHeight - img.height * newScale) / 2,
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

  // Handle stage click for showing dropdown
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isEditable || !onPlaceAsset || availableAssets.length === 0) return;

    // Only show dropdown if clicking on empty area (not on a pin)
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'room-image';
    if (!clickedOnEmpty) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert to image coordinates
    const canvasX = (pointer.x - position.x) / scale;
    const canvasY = (pointer.y - position.y) / scale;

    // Only add if within image bounds
    if (image && canvasX >= 0 && canvasY >= 0 && canvasX <= image.width && canvasY <= image.height) {
      // Get screen position for dropdown
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setDropdownPosition({
          x: rect.left + pointer.x,
          y: rect.top + pointer.y,
          canvasX,
          canvasY,
        });
        setShowDropdown(true);
      }
    }
  }, [isEditable, onPlaceAsset, availableAssets, scale, position, image]);

  // Handle asset selection from dropdown
  const handleSelectAsset = (assetId: string) => {
    if (onPlaceAsset) {
      onPlaceAsset(assetId, dropdownPosition.canvasX, dropdownPosition.canvasY);
    }
    setShowDropdown(false);
  };

  // Handle pin drag start
  const handlePinDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    setIsDraggingPin(true);
  }, []);

  // Handle pin drag move - prevent stage from moving
  const handlePinDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
  }, []);

  // Handle pin drag end
  const handlePinDragEnd = useCallback((assetId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    setIsDraggingPin(false);
    if (!onAssetMove) return;

    const node = e.target;
    const x = node.x();
    const y = node.y();

    onAssetMove(assetId, x, y);
  }, [onAssetMove]);

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
    if (!image || !containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight || 600;
    const scaleX = containerWidth / image.width;
    const scaleY = containerHeight / image.height;
    const newScale = Math.min(scaleX, scaleY, 1);
    setScale(newScale);
    setPosition({
      x: (containerWidth - image.width * newScale) / 2,
      y: (containerHeight - image.height * newScale) / 2,
    });
  }, [image]);

  const togglePan = () => setIsPanUnlocked(!isPanUnlocked);

  // Get icon for asset type
  const getAssetIcon = (assetTypeName?: string) => {
    if (!assetTypeName) return Monitor;
    return ASSET_TYPE_ICONS[assetTypeName] || Monitor;
  };

  // Filter assets that have pins
  const placedAssets = assets.filter(a => a.pinX !== null && a.pinY !== null);

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
      {isEditable && availableAssets.length > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-surface/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
          <p className="text-caption text-text-secondary">
            Click to place asset | Drag pins to move
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
          {/* Room Plan Image */}
          {image && (
            <KonvaImage
              image={image}
              name="room-image"
            />
          )}

          {/* Asset Pins */}
          {placedAssets.map((asset) => {
            return (
              <Group
                key={asset.id}
                x={asset.pinX!}
                y={asset.pinY!}
                draggable={isEditable}
                onDragStart={handlePinDragStart}
                onDragMove={handlePinDragMove}
                onDragEnd={(e) => handlePinDragEnd(asset.id, e)}
                onClick={(e) => {
                  e.cancelBubble = true;
                  onAssetClick?.(asset);
                }}
                onTouchEnd={(e) => {
                  e.cancelBubble = true;
                  onAssetClick?.(asset);
                }}
              >
                {/* Pin shadow/halo for selected */}
                {selectedAssetId === asset.id && (
                  <Circle
                    radius={22}
                    fill={STATUS_COLORS[asset.status]}
                    opacity={0.3}
                  />
                )}
                {/* Pin background */}
                <Rect
                  x={-14}
                  y={-14}
                  width={28}
                  height={28}
                  cornerRadius={6}
                  fill={STATUS_COLORS[asset.status]}
                  stroke="#fff"
                  strokeWidth={2}
                  shadowColor="black"
                  shadowBlur={4}
                  shadowOpacity={0.3}
                  shadowOffsetY={2}
                />
                {/* Pin label */}
                <Text
                  text={asset.name}
                  fontSize={11}
                  fontFamily="system-ui"
                  fill="#1e293b"
                  offsetX={-18}
                  offsetY={-6}
                  padding={3}
                  align="left"
                  verticalAlign="middle"
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {/* Asset Selection Dropdown */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <Card
            className="fixed z-50 w-64 max-h-72 overflow-y-auto shadow-xl"
            style={{
              left: Math.min(dropdownPosition.x, window.innerWidth - 280),
              top: Math.min(dropdownPosition.y, window.innerHeight - 300),
            }}
          >
            <div className="flex items-center justify-between p-2 border-b border-surface-border">
              <span className="text-body-sm font-medium">Select Asset to Place</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDropdown(false)}
              >
                <X size={16} />
              </Button>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-surface-border">
                {availableAssets.map((asset) => {
                  const Icon = getAssetIcon(asset.assetType?.name);
                  return (
                    <button
                      key={asset.id}
                      className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors text-left"
                      onClick={() => handleSelectAsset(asset.id)}
                    >
                      <div
                        className="p-2 rounded-md"
                        style={{ backgroundColor: STATUS_COLORS[asset.status] + '20' }}
                      >
                        <Icon size={18} style={{ color: STATUS_COLORS[asset.status] }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium truncate">{asset.name}</p>
                        <p className="text-caption text-text-tertiary truncate">
                          {asset.assetType?.name || 'Unknown Type'}
                        </p>
                      </div>
                    </button>
                  );
                })}
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
              <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.PLANNED }} />
              <span>Planned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.IN_STOCK }} />
              <span>In Stock</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.INSTALLED }} />
              <span>Installed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.CONFIGURED }} />
              <span>Configured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.VERIFIED }} />
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.FAULTY }} />
              <span>Faulty</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
