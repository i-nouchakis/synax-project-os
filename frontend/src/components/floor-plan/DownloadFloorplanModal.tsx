import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Check, Square, CheckSquare, Maximize2, Minimize2 } from 'lucide-react';
import { Button, Modal, ModalSection, ModalActions, Select } from '@/components/ui';
import { jsPDF } from 'jspdf';

type DownloadFormat = 'png' | 'jpeg' | 'webp' | 'pdf';

interface Pin {
  id: string;
  name: string;
  x: number;
  y: number;
  status?: string;
}

interface DownloadShape {
  type: string;
  data: { x?: number; y?: number; width?: number; height?: number; radius?: number; points?: number[]; text?: string; rotation?: number };
  style: { fill?: string; stroke?: string; strokeWidth?: number; opacity?: number; fontSize?: number; fontFamily?: string; dash?: number[] };
}

interface DownloadCable {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  color: string;
  label?: string;
}

interface DownloadFloorplanModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName: string;
  projectName?: string;
  floorName?: string;
  roomName?: string;
  pins: Pin[];
  pinType?: 'room' | 'asset' | 'floor' | 'building';
  shapes?: DownloadShape[];
  cables?: DownloadCable[];
}

const formatOptions = [
  { value: 'png', label: 'PNG - Original Quality' },
  { value: 'jpeg', label: 'JPEG - Compressed' },
  { value: 'webp', label: 'WebP - Modern Format' },
  { value: 'pdf', label: 'PDF - Print Ready' },
];

const statusColors: Record<string, string> = {
  NOT_STARTED: '#6b7280',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#22c55e',
  BLOCKED: '#f97316',
  VERIFIED: '#f97316',
  PLANNED: '#6b7280',
  IN_STOCK: '#8b5cf6',
  INSTALLED: '#22c55e',
  FAILED: '#ef4444',
};

function drawShapesOnCanvas(
  ctx: CanvasRenderingContext2D,
  shapesToDraw: DownloadShape[],
  cablesToDraw: DownloadCable[],
  scale: number
) {
  // Draw cables first (below shapes)
  cablesToDraw.forEach((cable) => {
    ctx.beginPath();
    ctx.moveTo(cable.sourceX * scale, cable.sourceY * scale);
    ctx.lineTo(cable.targetX * scale, cable.targetY * scale);
    ctx.strokeStyle = cable.color || '#6b7280';
    ctx.lineWidth = 2 * scale;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Cable endpoint dots
    [{ x: cable.sourceX, y: cable.sourceY }, { x: cable.targetX, y: cable.targetY }].forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x * scale, pt.y * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fillStyle = cable.color || '#6b7280';
      ctx.fill();
    });

    // Cable label
    if (cable.label) {
      const midX = ((cable.sourceX + cable.targetX) / 2) * scale;
      const midY = ((cable.sourceY + cable.targetY) / 2) * scale - 10 * scale;
      ctx.font = `${10 * scale}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = cable.color || '#6b7280';
      ctx.fillText(cable.label, midX, midY);
    }
  });

  // Draw shapes
  shapesToDraw.forEach((shape) => {
    const { data, style } = shape;
    const opacity = style.opacity ?? 1;
    ctx.globalAlpha = opacity;

    switch (shape.type) {
      case 'RECTANGLE': {
        const x = (data.x || 0) * scale;
        const y = (data.y || 0) * scale;
        const w = (data.width || 0) * scale;
        const h = (data.height || 0) * scale;
        if (data.rotation) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((data.rotation * Math.PI) / 180);
          if (style.fill && style.fill !== 'transparent') {
            ctx.fillStyle = style.fill;
            ctx.fillRect(0, 0, w, h);
          }
          if (style.stroke && style.stroke !== 'transparent') {
            ctx.strokeStyle = style.stroke;
            ctx.lineWidth = (style.strokeWidth || 2) * scale;
            ctx.strokeRect(0, 0, w, h);
          }
          ctx.restore();
        } else {
          if (style.fill && style.fill !== 'transparent') {
            ctx.fillStyle = style.fill;
            ctx.fillRect(x, y, w, h);
          }
          if (style.stroke && style.stroke !== 'transparent') {
            ctx.strokeStyle = style.stroke;
            ctx.lineWidth = (style.strokeWidth || 2) * scale;
            ctx.strokeRect(x, y, w, h);
          }
        }
        break;
      }
      case 'CIRCLE': {
        const cx = (data.x || 0) * scale;
        const cy = (data.y || 0) * scale;
        const r = (data.radius || 0) * scale;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        if (style.fill && style.fill !== 'transparent') {
          ctx.fillStyle = style.fill;
          ctx.fill();
        }
        if (style.stroke && style.stroke !== 'transparent') {
          ctx.strokeStyle = style.stroke;
          ctx.lineWidth = (style.strokeWidth || 2) * scale;
          ctx.stroke();
        }
        break;
      }
      case 'LINE':
      case 'FREEHAND': {
        const pts = data.points || [];
        if (pts.length < 4) break;
        ctx.beginPath();
        ctx.moveTo(pts[0] * scale, pts[1] * scale);
        for (let i = 2; i < pts.length; i += 2) {
          ctx.lineTo(pts[i] * scale, pts[i + 1] * scale);
        }
        ctx.strokeStyle = style.stroke || '#6b7280';
        ctx.lineWidth = (style.strokeWidth || 2) * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        break;
      }
      case 'ARROW': {
        const pts = data.points || [];
        if (pts.length < 4) break;
        const x1 = pts[0] * scale;
        const y1 = pts[1] * scale;
        const x2 = pts[pts.length - 2] * scale;
        const y2 = pts[pts.length - 1] * scale;
        // Line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = style.stroke || '#ef4444';
        ctx.lineWidth = (style.strokeWidth || 2) * scale;
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 10 * scale;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = style.stroke || '#ef4444';
        ctx.fill();
        break;
      }
      case 'TEXT': {
        const tx = (data.x || 0) * scale;
        const ty = (data.y || 0) * scale;
        const fontSize = (style.fontSize || 16) * scale;
        ctx.font = `${fontSize}px ${style.fontFamily || 'sans-serif'}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = style.fill || '#1f2937';
        ctx.fillText(data.text || 'Text', tx, ty);
        break;
      }
    }
    ctx.globalAlpha = 1;
  });
}

export function DownloadFloorplanModal({
  isOpen,
  onClose,
  imageUrl,
  fileName,
  projectName,
  floorName,
  roomName,
  pins,
  pinType = 'room',
  shapes = [],
  cables = [],
}: DownloadFloorplanModalProps) {
  const [format, setFormat] = useState<DownloadFormat>('png');
  const [selectedPins, setSelectedPins] = useState<Set<string>>(new Set(pins.map(p => p.id)));
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Reset selected pins when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPins(new Set(pins.map(p => p.id)));
      setImageLoaded(false);
    }
  }, [isOpen, pins]);

  // Load image
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl]);

  // Draw preview
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to fit container while maintaining aspect ratio
    const maxWidth = isFullScreen ? window.innerWidth - 100 : 600;
    const maxHeight = isFullScreen ? window.innerHeight - 300 : 400;
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw shapes and cables (below pins)
    drawShapesOnCanvas(ctx, shapes, cables, scale);

    // Draw pins - pin.x and pin.y are pixel coordinates relative to original image
    const pinRadius = 12 * scale;
    pins.forEach(pin => {
      if (!selectedPins.has(pin.id)) return;

      // Scale pin coordinates from original image to preview canvas
      const x = pin.x * scale;
      const y = pin.y * scale;
      const color = statusColors[pin.status || 'NOT_STARTED'] || '#6b7280';

      // Pin circle
      ctx.beginPath();
      ctx.arc(x, y, pinRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      // Pin label
      ctx.font = `${10 * scale}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const labelY = y + pinRadius + 4 * scale;
      const labelText = pin.name;
      const textWidth = ctx.measureText(labelText).width;

      // Label background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        x - textWidth / 2 - 4 * scale,
        labelY - 2 * scale,
        textWidth + 8 * scale,
        14 * scale
      );

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, x, labelY);
    });
  }, [imageLoaded, pins, selectedPins, isFullScreen, shapes, cables]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const togglePin = (pinId: string) => {
    setSelectedPins(prev => {
      const next = new Set(prev);
      if (next.has(pinId)) {
        next.delete(pinId);
      } else {
        next.add(pinId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPins(new Set(pins.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedPins(new Set());
  };

  const addWatermark = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const text = 'Created by Synax';
    const padding = 10;
    const fontSize = Math.max(12, Math.min(16, width / 50));

    ctx.font = `${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(
      width - textWidth - padding * 2,
      height - fontSize - padding * 2,
      textWidth + padding * 2,
      fontSize + padding * 2
    );

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(text, width - padding, height - padding);
  };

  const drawFullResolution = (): HTMLCanvasElement | null => {
    const img = imageRef.current;
    if (!img) return null;

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Draw image at full resolution
    ctx.drawImage(img, 0, 0);

    // Draw shapes and cables at full resolution (scale=1)
    drawShapesOnCanvas(ctx, shapes, cables, 1);

    // Draw pins at full resolution - pin.x and pin.y are already in pixel coordinates
    const pinRadius = 12;
    pins.forEach(pin => {
      if (!selectedPins.has(pin.id)) return;

      // Pin coordinates are already in pixels relative to original image
      const x = pin.x;
      const y = pin.y;
      const color = statusColors[pin.status || 'NOT_STARTED'] || '#6b7280';

      ctx.beginPath();
      ctx.arc(x, y, pinRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const labelY = y + pinRadius + 4;
      const labelText = pin.name;
      const textWidth = ctx.measureText(labelText).width;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        x - textWidth / 2 - 4,
        labelY - 2,
        textWidth + 8,
        16
      );

      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, x, labelY);
    });

    // Add watermark
    addWatermark(ctx, canvas.width, canvas.height);

    return canvas;
  };

  const downloadAsImage = async (imgFormat: 'png' | 'jpeg' | 'webp') => {
    const canvas = drawFullResolution();
    if (!canvas) return;

    const mimeType = imgFormat === 'png' ? 'image/png' : imgFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
    const quality = imgFormat === 'png' ? 1 : 0.92;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.${imgFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      mimeType,
      quality
    );
  };

  const downloadAsPdf = async () => {
    const canvas = drawFullResolution();
    if (!canvas) return;

    const isLandscape = canvas.width > canvas.height;
    const orientation = isLandscape ? 'landscape' : 'portrait';

    const pdf = new jsPDF({ orientation, unit: 'mm' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Header
    const headerHeight = 20;
    pdf.setFillColor(13, 17, 23);
    pdf.rect(0, 0, pageWidth, headerHeight, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');

    let title = fileName;
    if (projectName) {
      title = roomName
        ? `${projectName} - ${floorName} - ${roomName}`
        : `${projectName} - ${floorName}`;
    }
    pdf.text(title, 10, 13);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const date = new Date().toLocaleDateString('el-GR');
    pdf.text(date, pageWidth - 10, 13, { align: 'right' });

    // Calculate image dimensions
    const margin = 10;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - headerHeight - margin * 2 - 15;

    const imgRatio = canvas.width / canvas.height;
    const availableRatio = availableWidth / availableHeight;

    let imgWidth: number;
    let imgHeight: number;

    if (imgRatio > availableRatio) {
      imgWidth = availableWidth;
      imgHeight = availableWidth / imgRatio;
    } else {
      imgHeight = availableHeight;
      imgWidth = availableHeight * imgRatio;
    }

    const imgX = (pageWidth - imgWidth) / 2;
    const imgY = headerHeight + margin;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth, imgHeight);

    // Footer
    const footerY = pageHeight - 8;
    pdf.setFillColor(13, 17, 23);
    pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F');

    pdf.setTextColor(12, 148, 169);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Created by Synax', pageWidth / 2, footerY, { align: 'center' });

    pdf.save(`${fileName}.pdf`);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (format === 'pdf') {
        await downloadAsPdf();
      } else {
        await downloadAsImage(format);
      }
      onClose();
    } catch (error) {
      console.error('Error downloading:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsFullScreen(false);
        onClose();
      }}
      title="Download Floor Plan"
      size={isFullScreen ? 'full' : 'lg'}
    >
      <ModalSection>
        <div className="space-y-4">
          {/* Format selector and fullscreen toggle */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-body-sm text-text-secondary mb-2">
                Format
              </label>
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value as DownloadFormat)}
                options={formatOptions}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsFullScreen(!isFullScreen)}
              leftIcon={isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            >
              {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            </Button>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-body-sm text-text-secondary mb-2">
              Preview
            </label>
            <div className={`bg-background rounded-lg p-4 flex items-center justify-center ${isFullScreen ? 'min-h-[calc(100vh-400px)]' : 'min-h-[300px]'}`}>
              {imageLoaded ? (
                <canvas
                  ref={canvasRef}
                  className={`max-w-full rounded shadow-md ${isFullScreen ? 'max-h-[calc(100vh-420px)]' : 'max-h-[400px]'}`}
                />
              ) : (
                <div className="text-text-tertiary">Loading preview...</div>
              )}
            </div>
          </div>

          {/* Pin selection */}
          {pins.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-body-sm text-text-secondary">
                  {pinType === 'room' ? 'Rooms' : pinType === 'floor' ? 'Floors' : 'Assets'} to include ({selectedPins.size}/{pins.length})
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                    className="text-caption"
                  >
                    <CheckSquare size={14} className="mr-1" />
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deselectAll}
                    className="text-caption"
                  >
                    <Square size={14} className="mr-1" />
                    None
                  </Button>
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 max-h-[150px] overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {pins.map(pin => (
                    <label
                      key={pin.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        selectedPins.has(pin.id)
                          ? 'bg-primary/10 text-text-primary'
                          : 'bg-surface hover:bg-surface-hover text-text-secondary'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPins.has(pin.id)}
                        onChange={() => togglePin(pin.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedPins.has(pin.id)
                            ? 'bg-primary border-primary'
                            : 'border-surface-border'
                        }`}
                      >
                        {selectedPins.has(pin.id) && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                      <span className="text-body-sm truncate">{pin.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </ModalSection>

      <ModalActions>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleDownload}
          disabled={isDownloading || !imageLoaded}
          leftIcon={<Download size={16} />}
        >
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
      </ModalActions>
    </Modal>
  );
}
