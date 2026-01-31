import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pencil,
  Square,
  Circle,
  ArrowRight,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

type Tool = 'pencil' | 'rectangle' | 'circle' | 'arrow' | 'text';
type Color = string;

interface Annotation {
  id: string;
  type: Tool;
  color: Color;
  strokeWidth: number;
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
}

interface PhotoAnnotatorProps {
  imageUrl: string;
  onSave: (annotatedImageData: string, annotations: Annotation[]) => void;
  onCancel: () => void;
  initialAnnotations?: Annotation[];
  className?: string;
}

const COLORS = [
  '#ef4444', // red
  '#f59e0b', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ffffff', // white
  '#000000', // black
];

export function PhotoAnnotator({
  imageUrl,
  onSave,
  onCancel,
  initialAnnotations = [],
  className,
}: PhotoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState<Color>('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    // Set canvas size
    canvas.width = image.width;
    canvas.height = image.height;

    // Draw image
    ctx.drawImage(image, 0, 0);

    // Draw annotations
    [...annotations, currentAnnotation].filter(Boolean).forEach((ann) => {
      if (!ann) return;
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = ann.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (ann.type) {
        case 'pencil':
          if (ann.points && ann.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(ann.points[0], ann.points[1]);
            for (let i = 2; i < ann.points.length; i += 2) {
              ctx.lineTo(ann.points[i], ann.points[i + 1]);
            }
            ctx.stroke();
          }
          break;

        case 'rectangle':
          if (ann.x !== undefined && ann.y !== undefined && ann.width !== undefined && ann.height !== undefined) {
            ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
          }
          break;

        case 'circle':
          if (ann.x !== undefined && ann.y !== undefined && ann.width !== undefined && ann.height !== undefined) {
            const radiusX = Math.abs(ann.width) / 2;
            const radiusY = Math.abs(ann.height) / 2;
            const centerX = ann.x + ann.width / 2;
            const centerY = ann.y + ann.height / 2;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;

        case 'arrow':
          if (ann.points && ann.points.length >= 4) {
            const [x1, y1, x2, y2] = ann.points;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Arrow head
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const headLength = 15;
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(
              x2 - headLength * Math.cos(angle - Math.PI / 6),
              y2 - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(x2, y2);
            ctx.lineTo(
              x2 - headLength * Math.cos(angle + Math.PI / 6),
              y2 - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;

        case 'text':
          if (ann.x !== undefined && ann.y !== undefined && ann.text) {
            ctx.font = `${ann.strokeWidth * 6}px sans-serif`;
            ctx.fillText(ann.text, ann.x, ann.y);
          }
          break;
      }
    });
  }, [image, annotations, currentAnnotation]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Get canvas coordinates
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Mouse/Touch handlers
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasCoords(e);
    setStartPos(pos);
    setIsDrawing(true);

    if (tool === 'text') {
      setTextPosition(pos);
      return;
    }

    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      type: tool,
      color,
      strokeWidth,
    };

    if (tool === 'pencil') {
      newAnnotation.points = [pos.x, pos.y];
    } else if (tool === 'arrow') {
      newAnnotation.points = [pos.x, pos.y, pos.x, pos.y];
    } else {
      newAnnotation.x = pos.x;
      newAnnotation.y = pos.y;
      newAnnotation.width = 0;
      newAnnotation.height = 0;
    }

    setCurrentAnnotation(newAnnotation);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentAnnotation) return;
    if (tool === 'text') return;

    const pos = getCanvasCoords(e);

    if (tool === 'pencil') {
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [...(currentAnnotation.points || []), pos.x, pos.y],
      });
    } else if (tool === 'arrow') {
      setCurrentAnnotation({
        ...currentAnnotation,
        points: [startPos.x, startPos.y, pos.x, pos.y],
      });
    } else {
      setCurrentAnnotation({
        ...currentAnnotation,
        width: pos.x - startPos.x,
        height: pos.y - startPos.y,
      });
    }
  };

  const handleEnd = () => {
    if (currentAnnotation && tool !== 'text') {
      setUndoStack([...undoStack, annotations]);
      setRedoStack([]);
      setAnnotations([...annotations, currentAnnotation]);
    }
    setIsDrawing(false);
    setCurrentAnnotation(null);
  };

  // Add text annotation
  const handleAddText = () => {
    if (!textPosition || !textInput.trim()) return;

    const textAnnotation: Annotation = {
      id: crypto.randomUUID(),
      type: 'text',
      color,
      strokeWidth,
      x: textPosition.x,
      y: textPosition.y,
      text: textInput,
    };

    setUndoStack([...undoStack, annotations]);
    setRedoStack([]);
    setAnnotations([...annotations, textAnnotation]);
    setTextPosition(null);
    setTextInput('');
  };

  // Undo/Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack([...redoStack, annotations]);
    setAnnotations(previous);
    setUndoStack(undoStack.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack([...undoStack, annotations]);
    setAnnotations(next);
    setRedoStack(redoStack.slice(0, -1));
  };

  // Clear all
  const handleClear = () => {
    setUndoStack([...undoStack, annotations]);
    setRedoStack([]);
    setAnnotations([]);
  };

  // Save
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    onSave(imageData, annotations);
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'pencil', icon: <Pencil size={18} />, label: 'Pencil' },
    { id: 'rectangle', icon: <Square size={18} />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle size={18} />, label: 'Circle' },
    { id: 'arrow', icon: <ArrowRight size={18} />, label: 'Arrow' },
    { id: 'text', icon: <Type size={18} />, label: 'Text' },
  ];

  return (
    <div className={cn('flex flex-col h-full bg-surface', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-surface-border bg-background">
        {/* Tools */}
        <div className="flex items-center gap-1">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={cn(
                'p-2 rounded-md transition-colors',
                tool === t.id
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-surface-hover'
              )}
              title={t.label}
            >
              {t.icon}
            </button>
          ))}
          <div className="w-px h-6 bg-surface-border mx-2" />
          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-md text-text-secondary hover:bg-surface-hover"
              title="Color"
            >
              <div
                className="w-5 h-5 rounded border border-surface-border"
                style={{ backgroundColor: color }}
              />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-surface border border-surface-border rounded-lg shadow-lg z-10 flex gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      setShowColorPicker(false);
                    }}
                    className={cn(
                      'w-6 h-6 rounded border-2',
                      color === c ? 'border-primary' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Stroke width */}
          <select
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="bg-surface border border-surface-border rounded-md px-2 py-1 text-body-sm text-text-primary"
          >
            <option value={2}>Thin</option>
            <option value={3}>Medium</option>
            <option value={5}>Thick</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="p-2 rounded-md text-text-secondary hover:bg-surface-hover disabled:opacity-50"
            title="Undo"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-md text-text-secondary hover:bg-surface-hover disabled:opacity-50"
            title="Redo"
          >
            <Redo2 size={18} />
          </button>
          <button
            onClick={handleClear}
            disabled={annotations.length === 0}
            className="p-2 rounded-md text-error hover:bg-error/10 disabled:opacity-50"
            title="Clear All"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/50"
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full cursor-crosshair shadow-lg"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      {/* Text input modal */}
      {textPosition && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-surface p-4 rounded-lg shadow-lg">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              className="input-base w-64 mb-3"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTextPosition(null);
                  setTextInput('');
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddText}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-surface-border bg-background">
        <Button variant="ghost" onClick={onCancel} leftIcon={<X size={16} />}>
          Cancel
        </Button>
        <Button onClick={handleSave} leftIcon={<Check size={16} />}>
          Save
        </Button>
      </div>
    </div>
  );
}
