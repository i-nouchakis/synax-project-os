import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Text, Group, Rect, Path } from 'react-konva';
import Konva from 'konva';
import { ZoomIn, ZoomOut, Maximize2, Lock, Unlock, RotateCcw, Wifi, Monitor, Phone, Camera, Router, CreditCard, Tv, X, MapPin, ChevronRight, Package, Search, Eye, Trash2 } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { DrawingLayer } from '@/components/canvas/DrawingLayer';
import { CableOverlays } from '@/components/canvas/CableOverlays';
import { useDrawingStore } from '@/stores/drawing.store';

interface Asset {
  id: string;
  name: string;
  status: 'PLANNED' | 'IN_STOCK' | 'INSTALLED' | 'CONFIGURED' | 'VERIFIED' | 'FAULTY';
  pinX?: number | null;
  pinY?: number | null;
  assetType?: {
    id: string;
    name: string;
    icon?: string | null;
  } | null;
}

interface RoomPlanCanvasProps {
  imageUrl: string;
  assets: Asset[];
  availableAssets: Asset[]; // Room assets without pins that can be placed (Existing)
  inventoryAssets?: Asset[]; // Assets from project inventory (Import from Inventory)
  onAssetClick?: (asset: Asset) => void;
  onAssetMove?: (assetId: string, x: number, y: number) => void;
  onPlaceAsset?: (assetId: string, x: number, y: number) => void; // Place existing room asset
  onImportAsset?: (assetId: string, x: number, y: number) => void; // Import from inventory
  onRemoveAssetPin?: (assetId: string) => void;
  isEditable?: boolean;
  selectedAssetId?: string | null;
  onMaximize?: () => void;
  showMaximize?: boolean;
  showLegend?: boolean;
  className?: string;
  drawingMode?: boolean;
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

// SVG path data for Konva canvas rendering (from Lucide icons, normalized to 24x24 viewBox)
const ASSET_TYPE_SVG_PATHS: Record<string, string[]> = {
  'Access Point': [
    'M12 20h.01', // dot
    'M2 8.82a15 15 0 0 1 20 0', // outer arc
    'M5 12.859a10 10 0 0 1 14 0', // middle arc
    'M8.5 16.429a5 5 0 0 1 7 0', // inner arc
  ],
  'Network Switch': [
    'M4 14a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H4z', // rect
    'M6 18h.01', // dot 1
    'M10 18h.01', // dot 2
    'M6 6v8', // line 1
    'M12 4v10', // line 2
    'M18 6v8', // line 3
  ],
  'Smart TV': [
    'M4 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H4z', // screen
    'M17 2l-5 5-5-5', // antenna
  ],
  'IP Camera': [
    'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z', // body
    'M12 13m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0', // lens circle
  ],
  'VoIP Phone': [
    'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  ],
  'POS Terminal': [
    'M1 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4z', // body
    'M5 6h10', // line 1
    'M5 10h10', // line 2
    'M5 14h4', // line 3
    'M14 14h2', // chip
  ],
  'Digital Signage': [
    'M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5z', // screen
    'M8 21h8', // stand
    'M12 17v4', // stand pole
  ],
  'Router': [
    'M4 14a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H4z', // body
    'M6 18h.01', // dot 1
    'M10 18h.01', // dot 2
    'M9 6l3-3 3 3', // antenna 1
    'M12 3v11', // antenna line
  ],
  // Default box icon
  'default': [
    'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', // box outer
    'M3.3 7L12 12l8.7-5', // box top line
    'M12 22V12', // box vertical line
  ],
};

export function RoomPlanCanvas({
  imageUrl,
  assets,
  availableAssets,
  inventoryAssets = [],
  onAssetClick,
  onAssetMove,
  onPlaceAsset,
  onImportAsset,
  onRemoveAssetPin,
  isEditable = false,
  selectedAssetId,
  onMaximize,
  showMaximize = true,
  showLegend = true,
  className,
  drawingMode = false,
}: RoomPlanCanvasProps) {
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

  // Action menu state for placing assets
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showAssetList, setShowAssetList] = useState(false); // Existing room assets
  const [showInventoryList, setShowInventoryList] = useState(false); // Inventory assets
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, canvasX: 0, canvasY: 0 });
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');

  // Selected placed asset state (for showing actions popup)
  const [selectedPlacedAsset, setSelectedPlacedAsset] = useState<{ asset: Asset; screenX: number; screenY: number } | null>(null);

  // Draggable popup state
  const [popupOffset, setPopupOffset] = useState({ x: 0, y: 0 });
  const [isDraggingPopup, setIsDraggingPopup] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  // Handle popup drag
  const handlePopupDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingPopup(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: popupOffset.x,
      offsetY: popupOffset.y,
    };
  };

  useEffect(() => {
    if (!isDraggingPopup) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setPopupOffset({
        x: dragStartRef.current.offsetX + deltaX,
        y: dragStartRef.current.offsetY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDraggingPopup(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPopup]);

  // Reset popup offset when closing menus
  const resetPopupOffset = () => {
    setPopupOffset({ x: 0, y: 0 });
  };

  // Filter inventory assets based on search
  const filteredInventoryAssets = inventoryAssets.filter(asset => {
    if (!inventorySearchQuery.trim()) return true;
    const query = inventorySearchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.assetType?.name?.toLowerCase().includes(query)
    );
  });

  // Load image
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      const imgWidth = img.naturalWidth || img.width;
      const imgHeight = img.naturalHeight || img.height;
      setImage(img);
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

  // Handle stage click for showing action menu
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isEditable) return;

    // Only show menu if clicking on empty area (not on a pin)
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
      // Get screen position for menu
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        // Reset popup offset for new click position
        resetPopupOffset();
        setDropdownPosition({
          x: rect.left + pointer.x,
          y: rect.top + pointer.y,
          canvasX,
          canvasY,
        });
        // Show action menu
        setShowActionMenu(true);
        setShowAssetList(false);
      }
    }
  }, [isEditable, scale, position, image]);

  // Handle "Existing" action (room assets without pin)
  const handlePlaceExisting = () => {
    setShowActionMenu(false);
    setShowAssetList(true);
  };

  // Handle "Import from Inventory" action
  const handleImportFromInventory = () => {
    setShowActionMenu(false);
    setShowInventoryList(true);
  };

  // Handle existing asset selection from list
  const handleSelectAsset = (assetId: string) => {
    if (onPlaceAsset) {
      onPlaceAsset(assetId, dropdownPosition.canvasX, dropdownPosition.canvasY);
    }
    setShowAssetList(false);
  };

  // Handle inventory asset selection
  const handleSelectInventoryAsset = (assetId: string) => {
    if (onImportAsset) {
      onImportAsset(assetId, dropdownPosition.canvasX, dropdownPosition.canvasY);
    }
    setShowInventoryList(false);
  };

  // Close all menus
  const closeMenus = () => {
    setShowActionMenu(false);
    setShowAssetList(false);
    setShowInventoryList(false);
    setInventorySearchQuery('');
    setSelectedPlacedAsset(null);
    // Don't reset popup offset here - only reset on new canvas click
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

  // Handle asset pin drag move - also update cable endpoints in real-time
  const handleAssetDragMove = useCallback((assetId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (!image) return;

    const node = e.target;
    const margin = 12;
    const maxX = (image.naturalWidth || image.width) - margin;
    const maxY = (image.naturalHeight || image.height) - margin;

    const x = Math.max(margin, Math.min(maxX, node.x()));
    const y = Math.max(margin, Math.min(maxY, node.y()));

    if (node.x() !== x || node.y() !== y) {
      node.x(x);
      node.y(y);
    }

    // Update cable endpoints so cable lines follow the pin
    useDrawingStore.getState().updateCableEndpointsForAsset(assetId, x, y);
  }, [image]);

  // Handle pin drag end
  const handlePinDragEnd = useCallback((assetId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    setIsDraggingPin(false);
    if (!onAssetMove || !image) return;

    const node = e.target;
    const margin = 12;
    const maxX = (image.naturalWidth || image.width) - margin;
    const maxY = (image.naturalHeight || image.height) - margin;

    const x = Math.max(margin, Math.min(maxX, node.x()));
    const y = Math.max(margin, Math.min(maxY, node.y()));

    node.x(x);
    node.y(y);

    // Update cable endpoints to final position
    useDrawingStore.getState().updateCableEndpointsForAsset(assetId, x, y);

    onAssetMove(assetId, x, y);
  }, [onAssetMove, image]);

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
      {isEditable && (availableAssets.length > 0 || inventoryAssets.length > 0) && (
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
        draggable={isPanUnlocked && !isDraggingPin && !drawingMode}
        onDragStart={(e) => {
          if (e.target === e.target.getStage()) setIsDraggingStage(true);
        }}
        onDragEnd={(e) => {
          if (e.target !== e.target.getStage()) return;
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

          {/* Asset Pins - render above drawing shapes so they're clickable */}
          {placedAssets.map((asset) => {
            return (
              <Group
                key={asset.id}
                x={asset.pinX!}
                y={asset.pinY!}
                draggable={isEditable}
                onDragStart={handlePinDragStart}
                onDragMove={(e) => handleAssetDragMove(asset.id, e)}
                onDragEnd={(e) => handlePinDragEnd(asset.id, e)}
                onClick={(e) => {
                  e.cancelBubble = true;
                  // Get screen position for popup
                  const stage = stageRef.current;
                  const container = containerRef.current;
                  if (stage && container) {
                    const rect = container.getBoundingClientRect();
                    const pointer = stage.getPointerPosition();
                    if (pointer) {
                      setSelectedPlacedAsset({
                        asset,
                        screenX: rect.left + pointer.x,
                        screenY: rect.top + pointer.y,
                      });
                    }
                  }
                }}
                onTouchEnd={(e) => {
                  e.cancelBubble = true;
                  // Get screen position for popup
                  const stage = stageRef.current;
                  const container = containerRef.current;
                  if (stage && container) {
                    const rect = container.getBoundingClientRect();
                    const pointer = stage.getPointerPosition();
                    if (pointer) {
                      setSelectedPlacedAsset({
                        asset,
                        screenX: rect.left + pointer.x,
                        screenY: rect.top + pointer.y,
                      });
                    }
                  }
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
                {/* Asset type icon - SVG paths are 24x24, scale to ~18x18 to fit in pin */}
                <Group x={-9} y={-9} scaleX={0.75} scaleY={0.75}>
                  {(ASSET_TYPE_SVG_PATHS[asset.assetType?.name || ''] || ASSET_TYPE_SVG_PATHS['default']).map((pathData, index) => (
                    <Path
                      key={index}
                      data={pathData}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </Group>
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

        {/* Drawing Layer - shapes overlay (always visible; interactive only in drawingMode) */}
        {imageDimensions.width > 0 && (
          <DrawingLayer
            stageRef={stageRef}
            imageWidth={imageDimensions.width}
            imageHeight={imageDimensions.height}
            scale={scale}
            readOnly={!drawingMode}
            assetPins={assets
              .filter((a) => a.pinX != null && a.pinY != null)
              .map((a) => ({ id: a.id, name: a.name, pinX: a.pinX!, pinY: a.pinY! }))}
          />
        )}
      </Stage>

      {/* Cable overlays (HTML popups/status) - MUST be outside Stage */}
      {drawingMode && (
        <CableOverlays
          stageRef={stageRef}
          assetPinCount={assets.filter((a) => a.pinX != null && a.pinY != null).length}
        />
      )}

      {/* Action Menu - Choose between existing, import, or create new */}
      {showActionMenu && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={closeMenus}
          />
          <div
            className="fixed z-[70] animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: Math.min(dropdownPosition.x, window.innerWidth - 320) + popupOffset.x,
              top: Math.min(dropdownPosition.y, window.innerHeight - 250) + popupOffset.y,
            }}
          >
            <div className="bg-surface backdrop-blur-sm rounded-xl border border-surface-border shadow-xl overflow-hidden min-w-[280px]">
              {/* Draggable Header */}
              <div
                className="px-4 py-3 border-b border-surface-border bg-surface-secondary/50 cursor-move select-none"
                onMouseDown={handlePopupDragStart}
              >
                <p className="text-body-sm font-medium text-text-secondary uppercase tracking-wide">Add Asset</p>
              </div>

              {/* Options */}
              <div className="p-2">
                {/* Existing option - room assets without pin */}
                {availableAssets.length > 0 && onPlaceAsset && (
                  <button
                    className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-surface-hover active:bg-surface-active transition-colors text-left"
                    onClick={handlePlaceExisting}
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin size={24} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-text-primary">Existing</p>
                      <p className="text-body-sm text-text-tertiary">
                        {availableAssets.length} without pin
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
                  </button>
                )}

                {/* Import from inventory option */}
                {inventoryAssets.length > 0 && onImportAsset && (
                  <button
                    className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-surface-hover active:bg-surface-active transition-colors text-left"
                    onClick={handleImportFromInventory}
                  >
                    <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                      <Package size={24} className="text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-text-primary">Import from Inventory</p>
                      <p className="text-body-sm text-text-tertiary">
                        {inventoryAssets.length} available
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Asset Selection List - shown after choosing "Place Existing" */}
      {showAssetList && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={closeMenus}
          />
          <Card
            className="fixed z-[70] w-80 shadow-xl"
            style={{
              left: Math.min(dropdownPosition.x, window.innerWidth - 340) + popupOffset.x,
              top: Math.min(dropdownPosition.y, window.innerHeight - 420) + popupOffset.y,
            }}
          >
            <div
              className="flex items-center justify-between p-2 border-b border-surface-border cursor-move select-none"
              onMouseDown={handlePopupDragStart}
            >
              <span className="text-body-sm font-medium">Place Existing Asset</span>
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

      {/* Inventory Asset Selection List - shown after choosing "Import from Inventory" */}
      {showInventoryList && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={closeMenus}
          />
          <Card
            className="fixed z-[70] w-80 shadow-xl"
            style={{
              left: Math.min(dropdownPosition.x, window.innerWidth - 340) + popupOffset.x,
              top: Math.min(dropdownPosition.y, window.innerHeight - 420) + popupOffset.y,
            }}
          >
            <div
              className="flex items-center justify-between p-2 border-b border-surface-border cursor-move select-none"
              onMouseDown={handlePopupDragStart}
            >
              <span className="text-body-sm font-medium">Import from Inventory</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={closeMenus}
              >
                <X size={16} />
              </Button>
            </div>
            {/* Search Input */}
            {inventoryAssets.length > 2 && (
              <div className="p-2 border-b border-surface-border">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    value={inventorySearchQuery}
                    onChange={(e) => setInventorySearchQuery(e.target.value)}
                    placeholder="Search assets..."
                    className="w-full pl-9 pr-3 py-2 bg-background border border-surface-border rounded-md text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                </div>
              </div>
            )}
            <CardContent className="p-0 max-h-80 overflow-y-auto">
              {filteredInventoryAssets.length === 0 ? (
                <div className="p-4 text-center text-text-tertiary text-body-sm">
                  {inventorySearchQuery ? 'No matching assets' : 'No assets available in inventory'}
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {filteredInventoryAssets.map((asset) => {
                    const Icon = getAssetIcon(asset.assetType?.name);
                    return (
                      <button
                        key={asset.id}
                        className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors text-left"
                        onClick={() => handleSelectInventoryAsset(asset.id)}
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
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Selected Asset Popup - Actions for placed asset */}
      {selectedPlacedAsset && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={closeMenus}
          />
          <div
            className="fixed z-[70] animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: Math.min(selectedPlacedAsset.screenX, window.innerWidth - 240),
              top: Math.min(selectedPlacedAsset.screenY, window.innerHeight - 200),
            }}
          >
            <div className="bg-surface backdrop-blur-sm rounded-xl border border-surface-border shadow-xl overflow-hidden min-w-[220px]">
              {/* Header with asset info */}
              <div className="px-3 py-2.5 border-b border-surface-border bg-surface-secondary/50">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getAssetIcon(selectedPlacedAsset.asset.assetType?.name);
                    return (
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: STATUS_COLORS[selectedPlacedAsset.asset.status] + '20' }}
                      >
                        <Icon size={16} style={{ color: STATUS_COLORS[selectedPlacedAsset.asset.status] }} />
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-text-primary truncate">
                      {selectedPlacedAsset.asset.name}
                    </p>
                    <p className="text-caption text-text-tertiary truncate">
                      {selectedPlacedAsset.asset.assetType?.name || 'Asset'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-1.5">
                {/* View/Edit action */}
                <button
                  className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-hover active:bg-surface-active transition-colors text-left"
                  onClick={() => {
                    onAssetClick?.(selectedPlacedAsset.asset);
                    setSelectedPlacedAsset(null);
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Eye size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-text-primary">View / Edit</p>
                    <p className="text-caption text-text-tertiary">Open asset details</p>
                  </div>
                </button>

                {/* Remove from plan - only in edit mode */}
                {isEditable && onRemoveAssetPin && (
                  <button
                    className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-error/10 active:bg-error/20 transition-colors text-left"
                    onClick={() => {
                      onRemoveAssetPin(selectedPlacedAsset.asset.id);
                      setSelectedPlacedAsset(null);
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center group-hover:bg-error/20 transition-colors">
                      <Trash2 size={16} className="text-error" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-error">Remove from Plan</p>
                      <p className="text-caption text-text-tertiary">Keep asset, remove pin</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
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
