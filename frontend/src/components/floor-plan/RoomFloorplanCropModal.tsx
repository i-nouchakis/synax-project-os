import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Crop as CropIcon, Save, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button, Modal, ModalActions } from '@/components/ui';

interface RoomFloorplanCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorplanUrl: string;
  roomName: string;
  onSave: (croppedImageBlob: Blob) => Promise<void>;
  isSaving: boolean;
}

function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to the cropped dimensions
  canvas.width = crop.width;
  canvas.height = crop.height;

  // Draw the cropped portion
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      },
      'image/png',
      1
    );
  });
}

export function RoomFloorplanCropModal({
  isOpen,
  onClose,
  floorplanUrl,
  roomName,
  onSave,
  isSaving,
}: RoomFloorplanCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    // Start with a centered crop that's 30% of the image
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 30,
        },
        1, // aspect ratio (1:1 to start, user can adjust)
        width,
        height
      ),
      width,
      height
    );

    setCrop(crop);
  }, []);

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      await onSave(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  const handleReset = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(1);
  };

  const zoomIn = () => setScale(Math.min(3, scale + 0.25));
  const zoomOut = () => setScale(Math.max(0.5, scale - 0.25));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ορισμός κάτοψης για: ${roomName}`}
      icon={<CropIcon size={18} />}
      size="full"
      footer={
        <ModalActions>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Ακύρωση
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!completedCrop || isSaving}
            leftIcon={<Save size={16} />}
          >
            Αποθήκευση Κάτοψης
          </Button>
        </ModalActions>
      }
    >
      <div className="flex flex-col h-[calc(95vh-180px)]">
        {/* Instructions */}
        <div className="bg-info/10 border border-info/20 rounded-lg p-3 mb-4">
          <p className="text-body-sm text-info">
            <strong>Οδηγίες:</strong> Σύρε τις άκρες του πλαισίου για να επιλέξεις την περιοχή του δωματίου στην κάτοψη.
            Μπορείς να μετακινήσεις ή να αλλάξεις το μέγεθος της επιλογής.
          </p>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button size="sm" variant="ghost" onClick={zoomOut} title="Zoom Out">
            <ZoomOut size={18} />
          </Button>
          <span className="text-body-sm text-text-secondary px-2 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button size="sm" variant="ghost" onClick={zoomIn} title="Zoom In">
            <ZoomIn size={18} />
          </Button>
          <div className="w-px h-6 bg-surface-border mx-2" />
          <Button size="sm" variant="ghost" onClick={handleReset} leftIcon={<RotateCcw size={16} />}>
            Reset
          </Button>
        </div>

        {/* Crop Area */}
        <div className="flex-1 overflow-auto bg-surface-secondary rounded-lg flex items-center justify-center p-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            className="max-w-full"
          >
            <img
              ref={imgRef}
              src={floorplanUrl}
              alt="Floor plan"
              style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
              onLoad={onImageLoad}
              crossOrigin="anonymous"
              className="max-w-full"
            />
          </ReactCrop>
        </div>

        {/* Preview */}
        {completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && (
          <div className="mt-4 p-4 bg-surface-secondary rounded-lg">
            <p className="text-caption text-text-secondary mb-2">
              Επιλεγμένη περιοχή: {Math.round(completedCrop.width)} x {Math.round(completedCrop.height)} pixels
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
