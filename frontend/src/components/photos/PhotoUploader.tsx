import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { Button, Modal, ModalActions } from '@/components/ui';
import { CameraCapture } from './CameraCapture';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  onUpload: (file: File) => Promise<void>;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  accept?: string;
  className?: string;
  multiple?: boolean;
  disabled?: boolean;
}

export function PhotoUploader({
  onUpload,
  maxSizeMB = 2,
  maxWidthOrHeight = 1920,
  accept = 'image/*',
  className,
  multiple = false,
  disabled = false,
}: PhotoUploaderProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressAndUpload = async (file: File) => {
    setUploading(true);
    try {
      // Compress image
      const compressed = await imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
      });
      await onUpload(compressed);
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        await compressAndUpload(file);
      }
    }
  };

  const handleCameraCapture = async (_: string, file: File) => {
    setShowCamera(false);
    await compressAndUpload(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (!disabled) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [disabled]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-surface-border hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-body-sm text-text-secondary">Uploading...</p>
          </div>
        ) : (
          <>
            <ImageIcon size={32} className="mx-auto text-text-tertiary mb-3" />
            <p className="text-body-sm text-text-secondary mb-4">
              Drag & drop images here, or
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                leftIcon={<Upload size={16} />}
              >
                Browse
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCamera(true)}
                disabled={disabled}
                leftIcon={<Camera size={16} />}
              >
                Camera
              </Button>
            </div>
            <p className="text-caption text-text-tertiary mt-3">
              Max {maxSizeMB}MB per image
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Camera Modal */}
      <Modal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        title="Take Photo"
        icon={<Camera size={18} />}
        size="lg"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowCamera(false)}>
              Cancel
            </Button>
          </ModalActions>
        }
      >
        <div className="aspect-[4/3]">
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
            className="h-full"
          />
        </div>
      </Modal>
    </>
  );
}

// Compact version for inline use
interface PhotoUploaderCompactProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function PhotoUploaderCompact({ onUpload, disabled }: PhotoUploaderCompactProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      await onUpload(compressed);
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = async (_: string, file: File) => {
    setShowCamera(false);
    await handleFile(file);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="p-2 rounded-md text-text-secondary hover:bg-surface-hover disabled:opacity-50"
          title="Upload Photo"
        >
          {uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Upload size={18} />
          )}
        </button>
        <button
          onClick={() => setShowCamera(true)}
          disabled={disabled || uploading}
          className="p-2 rounded-md text-text-secondary hover:bg-surface-hover disabled:opacity-50"
          title="Take Photo"
        >
          <Camera size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
          disabled={disabled || uploading}
        />
      </div>

      <Modal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        title="Take Photo"
        icon={<Camera size={18} />}
        size="lg"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowCamera(false)}>
              Cancel
            </Button>
          </ModalActions>
        }
      >
        <div className="aspect-[4/3]">
          <CameraCapture
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
            className="h-full"
          />
        </div>
      </Modal>
    </>
  );
}
