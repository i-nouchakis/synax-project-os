import { useRef, useState, useEffect, useCallback } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onCancel?: () => void;
  width?: number;
  height?: number;
  className?: string;
  initialSignature?: string;
}

export function SignaturePad({
  onSave,
  onCancel,
  width = 500,
  height = 200,
  className,
  initialSignature,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Set drawing style
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // White background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = initialSignature;
    }

    setCtx(context);
  }, [width, height, initialSignature]);

  // Get coordinates relative to canvas
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Start drawing
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  // Draw
  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Stop drawing
  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  // Clear signature
  const clearSignature = useCallback(() => {
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
  }, [ctx]);

  // Save signature
  const saveSignature = () => {
    if (!canvasRef.current || !hasSignature) return;
    const signatureData = canvasRef.current.toDataURL('image/png');
    onSave(signatureData);
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Canvas */}
      <div className="relative border border-surface-border rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair"
          style={{ aspectRatio: `${width}/${height}` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {/* Signature line */}
        <div className="absolute bottom-8 left-8 right-8 border-b border-gray-300" />
        <span className="absolute bottom-2 left-8 text-gray-400 text-body-sm">
          Sign above the line
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSignature}
          disabled={!hasSignature}
          leftIcon={<RotateCcw size={16} />}
        >
          Clear
        </Button>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={saveSignature}
            disabled={!hasSignature}
            leftIcon={<Check size={16} />}
          >
            Accept Signature
          </Button>
        </div>
      </div>
    </div>
  );
}

// Display-only signature component
interface SignatureDisplayProps {
  signatureData: string;
  signerName?: string;
  signedAt?: string;
  className?: string;
}

export function SignatureDisplay({
  signatureData,
  signerName,
  signedAt,
  className,
}: SignatureDisplayProps) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="bg-white border border-surface-border rounded-lg p-2">
        <img
          src={signatureData}
          alt="Signature"
          className="max-w-[200px] max-h-[80px] object-contain"
        />
      </div>
      {signerName && (
        <p className="text-body-sm text-text-primary mt-2 font-medium">
          {signerName}
        </p>
      )}
      {signedAt && (
        <p className="text-caption text-text-tertiary">
          {new Date(signedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
