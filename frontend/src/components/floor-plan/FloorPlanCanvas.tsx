import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Text, Group, Rect, Path } from 'react-konva';
import Konva from 'konva';
import { ZoomIn, ZoomOut, Maximize2, Lock, Unlock, RotateCcw, Layers, X, Plus, MapPin, ChevronRight, Search, Eye, Trash2, Wifi, Monitor, Phone, Camera, Router, CreditCard, Tv, DoorOpen, Package } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

// Room Pin interface
interface Pin {
  id: string;
  x: number;
  y: number;
  name: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
}

// Available room (not yet placed)
interface AvailableItem {
  id: string;
  name: string;
  level?: number;
}

// Asset interface for floor-level assets
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

// SVG paths for asset type icons (same as RoomPlanCanvas)
const ASSET_TYPE_SVG_PATHS: Record<string, string[]> = {
  'Access Point': ['M12 20h.01', 'M2 8.82a15 15 0 0 1 20 0', 'M5 12.859a10 10 0 0 1 14 0', 'M8.5 16.429a5 5 0 0 1 7 0'],
  'Network Switch': ['M4 14a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H4z', 'M6 18h.01', 'M10 18h.01', 'M6 6v8', 'M12 4v10', 'M18 6v8'],
  'Smart TV': ['M4 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H4z', 'M17 2l-5 5-5-5'],
  'IP Camera': ['M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z', 'M12 13m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
  'VoIP Phone': ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'],
  'POS Terminal': ['M1 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4z', 'M5 6h10', 'M5 10h10', 'M5 14h4', 'M14 14h2'],
  'Digital Signage': ['M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5z', 'M8 21h8', 'M12 17v4'],
  'Router': ['M4 14a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H4z', 'M6 18h.01', 'M10 18h.01', 'M9 6l3-3 3 3', 'M12 3v11'],
  'default': ['M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z', 'M3.3 7L12 12l8.7-5', 'M12 22V12'],
};

const ASSET_STATUS_COLORS: Record<Asset['status'], string> = {
  PLANNED: '#64748b',
  IN_STOCK: '#8b5cf6',
  INSTALLED: '#3b82f6',
  CONFIGURED: '#f59e0b',
  VERIFIED: '#22c55e',
  FAULTY: '#ef4444',
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

interface FloorPlanCanvasProps {
  imageUrl: string;
  pins: Pin[];
  availableItems?: AvailableItem[]; // Rooms without pins that can be placed
  onPinClick?: (pin: Pin) => void;
  onPinMove?: (pinId: string, x: number, y: number) => void;
  onAddPin?: (x: number, y: number) => void;
  onPlaceItem?: (itemId: string, x: number, y: number) => void;
  onRemovePin?: (pinId: string) => void;
  // Asset-related props
  assets?: Asset[]; // Floor-level assets with pins
  availableAssets?: Asset[]; // Assets from project inventory (IN_STOCK) that can be placed
  floorAssetsWithoutPin?: Asset[]; // Floor assets that exist but don't have pin coordinates yet
  onAssetClick?: (asset: Asset) => void;
  onAssetMove?: (assetId: string, x: number, y: number) => void;
  onPlaceAsset?: (assetId: string, x: number, y: number) => void;
  onPlaceExistingAsset?: (assetId: string, x: number, y: number) => void; // Place existing floor asset
  onRemoveAssetPin?: (assetId: string) => void;
  // Common props
  isEditable?: boolean;
  selectedPinId?: string | null;
  selectedAssetId?: string | null;
  onMaximize?: () => void;
  showMaximize?: boolean;
  showLegend?: boolean;
  className?: string;
}

const ROOM_STATUS_COLORS: Record<Pin['status'], string> = {
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
  onRemovePin,
  // Asset props
  assets = [],
  availableAssets = [],
  floorAssetsWithoutPin = [],
  onAssetClick,
  onAssetMove,
  onPlaceAsset,
  onPlaceExistingAsset,
  onRemoveAssetPin,
  // Common props
  isEditable = false,
  selectedPinId,
  selectedAssetId,
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

  // First-level choice: Room or Asset
  const [showTypeChoice, setShowTypeChoice] = useState(false);
  const [, setSelectedType] = useState<'room' | 'asset' | null>(null);

  // Dropdown state for placing rooms
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showItemList, setShowItemList] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, canvasX: 0, canvasY: 0 });
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Asset action menu state (Existing vs Import)
  const [showAssetActionMenu, setShowAssetActionMenu] = useState(false);

  // Asset list state (for import from inventory)
  const [showAssetList, setShowAssetList] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  // Existing floor assets list state (floor assets without pin)
  const [showExistingAssetList, setShowExistingAssetList] = useState(false);
  const [existingAssetSearchQuery, setExistingAssetSearchQuery] = useState('');

  // Selected placed pin state (for showing actions popup)
  const [selectedPlacedPin, setSelectedPlacedPin] = useState<{ pin: Pin; screenX: number; screenY: number } | null>(null);

  // Selected placed asset state
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

  // Filter placed assets (with pinX and pinY)
  const placedAssets = assets.filter(a => a.pinX !== null && a.pinY !== null);

  // Filter available assets based on search (inventory assets)
  const filteredAvailableAssets = availableAssets.filter(asset => {
    if (!assetSearchQuery.trim()) return true;
    const query = assetSearchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.assetType?.name?.toLowerCase().includes(query)
    );
  });

  // Filter existing floor assets without pin based on search
  const filteredExistingAssets = floorAssetsWithoutPin.filter(asset => {
    if (!existingAssetSearchQuery.trim()) return true;
    const query = existingAssetSearchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.assetType?.name?.toLowerCase().includes(query)
    );
  });

  // Get icon for asset type
  const getAssetIcon = (assetTypeName?: string) => {
    if (!assetTypeName) return Monitor;
    return ASSET_TYPE_ICONS[assetTypeName] || Monitor;
  };

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

  // Handle container resize - recalculate size, scale, and position
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight || 600;

        setStageSize({
          width: containerWidth,
          height: containerHeight,
        });

        // Recalculate scale and position if image is loaded
        if (imageDimensions.width > 0 && imageDimensions.height > 0) {
          const scaleX = containerWidth / imageDimensions.width;
          const scaleY = containerHeight / imageDimensions.height;
          const newScale = Math.min(scaleX, scaleY, 1);
          setScale(newScale);
          // Center the image
          setPosition({
            x: (containerWidth - imageDimensions.width * newScale) / 2,
            y: (containerHeight - imageDimensions.height * newScale) / 2,
          });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [imageDimensions]);

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
        // Reset popup offset for new click position
        resetPopupOffset();
        setDropdownPosition({
          x: rect.left + pointer.x,
          y: rect.top + pointer.y,
          canvasX,
          canvasY,
        });
        // Check what options are available
        const hasRoomOptions = availableItems.length > 0 || onAddPin;
        const hasAssetOptions = availableAssets.length > 0 || floorAssetsWithoutPin.length > 0;

        if (hasRoomOptions && hasAssetOptions) {
          // Show type choice first (Room or Asset)
          setShowTypeChoice(true);
          setSelectedType(null);
        } else if (hasRoomOptions) {
          // Only room options available - show room action menu
          setShowActionMenu(true);
        } else if (hasAssetOptions) {
          // Only asset options available - show asset list
          setShowAssetList(true);
        }
        // Reset other menus
        setShowItemList(false);
      }
    }
  }, [isEditable, scale, position, imageDimensions, availableItems.length, availableAssets.length, onAddPin]);

  // Handle type choice (Room or Asset)
  const handleTypeChoice = (type: 'room' | 'asset') => {
    setShowTypeChoice(false);
    setSelectedType(type);
    if (type === 'room') {
      setShowActionMenu(true);
    } else {
      // For assets, show action menu if there are both existing and inventory options
      const hasExisting = floorAssetsWithoutPin.length > 0;
      const hasInventory = availableAssets.length > 0;

      if (hasExisting && hasInventory) {
        setShowAssetActionMenu(true);
      } else if (hasExisting) {
        setShowExistingAssetList(true);
      } else if (hasInventory) {
        setShowAssetList(true);
      }
    }
  };

  // Handle asset action choice (Existing vs Import)
  const handleAssetActionChoice = (action: 'existing' | 'import') => {
    setShowAssetActionMenu(false);
    if (action === 'existing') {
      setShowExistingAssetList(true);
    } else {
      setShowAssetList(true);
    }
  };

  // Handle "Place existing" action (for rooms)
  const handlePlaceExisting = () => {
    setShowActionMenu(false);
    setShowItemList(true);
  };

  // Handle "Create new" action (for rooms)
  const handleCreateNew = () => {
    setShowActionMenu(false);
    setShowItemList(false);
    if (onAddPin) {
      onAddPin(dropdownPosition.canvasX, dropdownPosition.canvasY);
    }
  };

  // Handle room selection from dropdown
  const handleSelectItem = (itemId: string) => {
    if (onPlaceItem) {
      onPlaceItem(itemId, dropdownPosition.canvasX, dropdownPosition.canvasY);
    }
    setShowItemList(false);
  };

  // Handle asset selection from dropdown (import from inventory)
  const handleSelectAsset = (assetId: string) => {
    if (onPlaceAsset) {
      onPlaceAsset(assetId, dropdownPosition.canvasX, dropdownPosition.canvasY);
    }
    setShowAssetList(false);
  };

  // Handle existing floor asset selection (place existing)
  const handleSelectExistingAsset = (assetId: string) => {
    if (onPlaceExistingAsset) {
      onPlaceExistingAsset(assetId, dropdownPosition.canvasX, dropdownPosition.canvasY);
    }
    setShowExistingAssetList(false);
  };

  // Close all menus
  const closeMenus = () => {
    setShowTypeChoice(false);
    setSelectedType(null);
    setShowActionMenu(false);
    setShowItemList(false);
    setShowAssetActionMenu(false);
    setShowAssetList(false);
    setShowExistingAssetList(false);
    setItemSearchQuery('');
    setAssetSearchQuery('');
    setExistingAssetSearchQuery('');
    setSelectedPlacedPin(null);
    setSelectedPlacedAsset(null);
    // Don't reset popup offset here - only reset on new canvas click
  };

  // Filter available items based on search
  const filteredItems = availableItems.filter(item => {
    if (!itemSearchQuery.trim()) return true;
    const query = itemSearchQuery.toLowerCase();
    return item.name.toLowerCase().includes(query);
  });

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

  // Handle asset pin drag end
  const handleAssetDragEnd = useCallback((assetId: string, e: Konva.KonvaEventObject<DragEvent>) => {
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
                // Get screen position for popup
                const stage = stageRef.current;
                const container = containerRef.current;
                if (stage && container) {
                  const rect = container.getBoundingClientRect();
                  const pointer = stage.getPointerPosition();
                  if (pointer) {
                    setSelectedPlacedPin({
                      pin,
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
                    setSelectedPlacedPin({
                      pin,
                      screenX: rect.left + pointer.x,
                      screenY: rect.top + pointer.y,
                    });
                  }
                }
              }}
            >
              {/* Pin shadow/halo for selected */}
              {selectedPinId === pin.id && (
                <Circle
                  radius={20}
                  fill={ROOM_STATUS_COLORS[pin.status]}
                  opacity={0.3}
                />
              )}
              {/* Pin marker */}
              <Circle
                radius={12}
                fill={ROOM_STATUS_COLORS[pin.status]}
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

          {/* Asset Pins - floor-level assets */}
          {image && placedAssets.map((asset) => (
            <Group
              key={asset.id}
              x={asset.pinX!}
              y={asset.pinY!}
              draggable={isEditable}
              onDragStart={handlePinDragStart}
              onDragMove={handlePinDragMove}
              onDragEnd={(e) => handleAssetDragEnd(asset.id, e)}
              onClick={(e) => {
                e.cancelBubble = true;
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
              {/* Asset pin shadow/halo for selected */}
              {selectedAssetId === asset.id && (
                <Circle
                  radius={22}
                  fill={ASSET_STATUS_COLORS[asset.status]}
                  opacity={0.3}
                />
              )}
              {/* Asset pin background (square) */}
              <Rect
                x={-14}
                y={-14}
                width={28}
                height={28}
                cornerRadius={6}
                fill={ASSET_STATUS_COLORS[asset.status]}
                stroke="#fff"
                strokeWidth={2}
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={0.3}
                shadowOffsetY={2}
              />
              {/* Asset type icon - SVG paths */}
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
              {/* Asset pin label */}
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
          ))}
        </Layer>
      </Stage>

      {/* Type Choice Menu - Room or Asset */}
      {showTypeChoice && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeMenus}
          />
          <div
            className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: Math.min(dropdownPosition.x, window.innerWidth - 320) + popupOffset.x,
              top: Math.min(dropdownPosition.y, window.innerHeight - 220) + popupOffset.y,
            }}
          >
            <div className="bg-surface backdrop-blur-sm rounded-xl border border-surface-border shadow-xl overflow-hidden min-w-[280px]">
              {/* Draggable Header */}
              <div
                className="px-4 py-3 border-b border-surface-border bg-surface-secondary/50 cursor-move select-none"
                onMouseDown={handlePopupDragStart}
              >
                <p className="text-body-sm font-medium text-text-secondary uppercase tracking-wide">What to add?</p>
              </div>

              {/* Options */}
              <div className="p-2">
                {/* Room option */}
                <button
                  className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-surface-hover active:bg-surface-active transition-colors text-left"
                  onClick={() => handleTypeChoice('room')}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <DoorOpen size={24} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-text-primary">Room</p>
                    <p className="text-body-sm text-text-tertiary">
                      Place or create room
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
                </button>

                {/* Asset option */}
                <button
                  className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-surface-hover active:bg-surface-active transition-colors text-left"
                  onClick={() => handleTypeChoice('asset')}
                >
                  <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                    <Package size={24} className="text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-text-primary">Asset</p>
                    <p className="text-body-sm text-text-tertiary">
                      {availableAssets.length + floorAssetsWithoutPin.length} available
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action Menu - Choose between place existing or create new (for rooms) */}
      {showActionMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeMenus}
          />
          <div
            className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: Math.min(dropdownPosition.x, window.innerWidth - 320) + popupOffset.x,
              top: Math.min(dropdownPosition.y, window.innerHeight - 220) + popupOffset.y,
            }}
          >
            <div className="bg-surface backdrop-blur-sm rounded-xl border border-surface-border shadow-xl overflow-hidden min-w-[280px]">
              {/* Draggable Header */}
              <div
                className="px-4 py-3 border-b border-surface-border bg-surface-secondary/50 cursor-move select-none"
                onMouseDown={handlePopupDragStart}
              >
                <p className="text-body-sm font-medium text-text-secondary uppercase tracking-wide">Add Room</p>
              </div>

              {/* Options */}
              <div className="p-2">
                {/* Place existing option */}
                {availableItems.length > 0 && onPlaceItem && (
                  <button
                    className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-surface-hover active:bg-surface-active transition-colors text-left"
                    onClick={handlePlaceExisting}
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin size={24} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-text-primary">Place Existing</p>
                      <p className="text-body-sm text-text-tertiary">
                        {availableItems.length} available
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
                  </button>
                )}

                {/* Create new option */}
                {onAddPin && (
                  <button
                    className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-surface-hover active:bg-surface-active transition-colors text-left"
                    onClick={handleCreateNew}
                  >
                    <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                      <Plus size={24} className="text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-text-primary">Create New</p>
                      <p className="text-body-sm text-text-tertiary">Add new room</p>
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
            className="fixed z-50 w-80 shadow-xl"
            style={{
              left: Math.min(dropdownPosition.x, window.innerWidth - 340) + popupOffset.x,
              top: Math.min(dropdownPosition.y, window.innerHeight - 420) + popupOffset.y,
            }}
          >
            <div
              className="flex items-center justify-between p-2 border-b border-surface-border cursor-move select-none"
              onMouseDown={handlePopupDragStart}
            >
              <span className="text-body-sm font-medium">Select Item to Place</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={closeMenus}
              >
                <X size={16} />
              </Button>
            </div>
            {/* Search Input */}
            {availableItems.length > 2 && (
              <div className="p-2 border-b border-surface-border">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 bg-background border border-surface-border rounded-md text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                </div>
              </div>
            )}
            <CardContent className="p-0 max-h-80 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="p-4 text-center text-text-tertiary text-body-sm">
                  {itemSearchQuery ? 'No matching items' : 'No items available'}
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {filteredItems.map((item) => (
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
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Asset Action Menu - Choose between existing or import (for assets) */}
      {showAssetActionMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeMenus}
          />
          <div
            className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: Math.min(dropdownPosition.x, window.innerWidth - 320) + popupOffset.x,
              top: Math.min(dropdownPosition.y, window.innerHeight - 220) + popupOffset.y,
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
                {/* Existing floor assets option */}
                {floorAssetsWithoutPin.length > 0 && (
                  <button
                    className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-surface-hover active:bg-surface-active transition-colors text-left"
                    onClick={() => handleAssetActionChoice('existing')}
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin size={24} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-text-primary">Existing</p>
                      <p className="text-body-sm text-text-tertiary">
                        {floorAssetsWithoutPin.length} without pin
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
                  </button>
                )}

                {/* Import from inventory option */}
                {availableAssets.length > 0 && (
                  <button
                    className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-surface-hover active:bg-surface-active transition-colors text-left"
                    onClick={() => handleAssetActionChoice('import')}
                  >
                    <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                      <Package size={24} className="text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-text-primary">Import from Inventory</p>
                      <p className="text-body-sm text-text-tertiary">
                        {availableAssets.length} available
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

      {/* Existing Floor Assets List - shown after choosing "Existing" */}
      {showExistingAssetList && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeMenus}
          />
          <Card
            className="fixed z-50 w-80 shadow-xl"
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
            {/* Search Input */}
            {floorAssetsWithoutPin.length > 2 && (
              <div className="p-2 border-b border-surface-border">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    value={existingAssetSearchQuery}
                    onChange={(e) => setExistingAssetSearchQuery(e.target.value)}
                    placeholder="Search assets..."
                    className="w-full pl-9 pr-3 py-2 bg-background border border-surface-border rounded-md text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                </div>
              </div>
            )}
            <CardContent className="p-0 max-h-80 overflow-y-auto">
              {filteredExistingAssets.length === 0 ? (
                <div className="p-4 text-center text-text-tertiary text-body-sm">
                  {existingAssetSearchQuery ? 'No matching assets' : 'No assets without pin'}
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {filteredExistingAssets.map((asset) => {
                    const Icon = getAssetIcon(asset.assetType?.name);
                    return (
                      <button
                        key={asset.id}
                        className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors text-left"
                        onClick={() => handleSelectExistingAsset(asset.id)}
                      >
                        <div
                          className="p-2 rounded-md"
                          style={{ backgroundColor: ASSET_STATUS_COLORS[asset.status] + '20' }}
                        >
                          <Icon size={18} style={{ color: ASSET_STATUS_COLORS[asset.status] }} />
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

      {/* Selected Pin Popup - Actions for placed pin */}
      {selectedPlacedPin && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeMenus}
          />
          <div
            className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: Math.min(selectedPlacedPin.screenX, window.innerWidth - 240),
              top: Math.min(selectedPlacedPin.screenY, window.innerHeight - 200),
            }}
          >
            <div className="bg-surface backdrop-blur-sm rounded-xl border border-surface-border shadow-xl overflow-hidden min-w-[220px]">
              {/* Header with pin info */}
              <div className="px-3 py-2.5 border-b border-surface-border bg-surface-secondary/50">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: ROOM_STATUS_COLORS[selectedPlacedPin.pin.status] }}
                  >
                    <MapPin size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-text-primary truncate">
                      {selectedPlacedPin.pin.name}
                    </p>
                    <p className="text-caption text-text-tertiary">
                      {selectedPlacedPin.pin.status.replace('_', ' ')}
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
                    onPinClick?.(selectedPlacedPin.pin);
                    setSelectedPlacedPin(null);
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Eye size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-text-primary">View / Edit</p>
                    <p className="text-caption text-text-tertiary">Open room details</p>
                  </div>
                </button>

                {/* Remove from plan - only in edit mode */}
                {isEditable && onRemovePin && (
                  <button
                    className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-error/10 active:bg-error/20 transition-colors text-left"
                    onClick={() => {
                      onRemovePin(selectedPlacedPin.pin.id);
                      setSelectedPlacedPin(null);
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center group-hover:bg-error/20 transition-colors">
                      <Trash2 size={16} className="text-error" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-error">Remove from Plan</p>
                      <p className="text-caption text-text-tertiary">Keep room, remove pin</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Asset Selection List - Import from project inventory */}
      {showAssetList && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeMenus}
          />
          <Card
            className="fixed z-50 w-80 shadow-xl"
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
            {availableAssets.length > 2 && (
              <div className="p-2 border-b border-surface-border">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    value={assetSearchQuery}
                    onChange={(e) => setAssetSearchQuery(e.target.value)}
                    placeholder="Search assets..."
                    className="w-full pl-9 pr-3 py-2 bg-background border border-surface-border rounded-md text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                </div>
              </div>
            )}
            <CardContent className="p-0 max-h-80 overflow-y-auto">
              {filteredAvailableAssets.length === 0 ? (
                <div className="p-4 text-center text-text-tertiary text-body-sm">
                  {assetSearchQuery ? 'No matching assets' : 'No assets available in inventory'}
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {filteredAvailableAssets.map((asset) => {
                    const Icon = getAssetIcon(asset.assetType?.name);
                    return (
                      <button
                        key={asset.id}
                        className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors text-left"
                        onClick={() => handleSelectAsset(asset.id)}
                      >
                        <div
                          className="p-2 rounded-md"
                          style={{ backgroundColor: ASSET_STATUS_COLORS[asset.status] + '20' }}
                        >
                          <Icon size={18} style={{ color: ASSET_STATUS_COLORS[asset.status] }} />
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
            className="fixed inset-0 z-40"
            onClick={closeMenus}
          />
          <div
            className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
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
                        style={{ backgroundColor: ASSET_STATUS_COLORS[selectedPlacedAsset.asset.status] + '20' }}
                      >
                        <Icon size={16} style={{ color: ASSET_STATUS_COLORS[selectedPlacedAsset.asset.status] }} />
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

      {/* Legend - Rooms */}
      {showLegend && (
        <div className="absolute bottom-2 left-2 z-10 bg-surface/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
          <div className="flex flex-wrap gap-3 text-caption">
            <span className="text-text-secondary font-medium">Rooms:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ROOM_STATUS_COLORS.NOT_STARTED }} />
              <span>Not Started</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ROOM_STATUS_COLORS.IN_PROGRESS }} />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ROOM_STATUS_COLORS.COMPLETED }} />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ROOM_STATUS_COLORS.BLOCKED }} />
              <span>Blocked</span>
            </div>
          </div>
          {/* Asset legend - only if there are assets */}
          {(placedAssets.length > 0 || availableAssets.length > 0) && (
            <div className="flex flex-wrap gap-3 text-caption mt-2 pt-2 border-t border-surface-border">
              <span className="text-text-secondary font-medium">Assets:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: ASSET_STATUS_COLORS.IN_STOCK }} />
                <span>In Stock</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: ASSET_STATUS_COLORS.INSTALLED }} />
                <span>Installed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: ASSET_STATUS_COLORS.VERIFIED }} />
                <span>Verified</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
