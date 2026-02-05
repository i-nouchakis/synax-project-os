import { useEffect, useRef, useState } from 'react';
import { Modal, ModalActions, Button } from '@/components/ui';
import { MapPin } from 'lucide-react';

interface FloorPlanPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  planImageUrl: string;
  pinX: number;
  pinY: number;
  assetName: string;
  locationLabel?: string;
}

export function FloorPlanPreviewModal({
  isOpen,
  onClose,
  planImageUrl,
  pinX,
  pinY,
  assetName,
  locationLabel,
}: FloorPlanPreviewModalProps) {
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const markerRef = useRef<HTMLDivElement>(null);

  // Load image to get natural dimensions
  useEffect(() => {
    if (!isOpen || !planImageUrl) return;
    setImageDimensions({ width: 0, height: 0 });
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = planImageUrl;
  }, [isOpen, planImageUrl]);

  // Auto-scroll to center on pin after image loads
  useEffect(() => {
    if (imageDimensions.width > 0 && markerRef.current) {
      setTimeout(() => {
        markerRef.current?.scrollIntoView({
          block: 'center',
          inline: 'center',
          behavior: 'smooth',
        });
      }, 200);
    }
  }, [imageDimensions]);

  const leftPercent =
    imageDimensions.width > 0 ? (pinX / imageDimensions.width) * 100 : 0;
  const topPercent =
    imageDimensions.height > 0 ? (pinY / imageDimensions.height) * 100 : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={locationLabel || 'Floor Plan'}
      icon={<MapPin size={18} />}
      size="xl"
      footer={
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </ModalActions>
      }
    >
      <div className="overflow-auto max-h-[70vh]">
        {planImageUrl ? (
          <div className="relative inline-block w-full">
            <img
              src={planImageUrl}
              alt="Floor Plan"
              className="w-full h-auto"
            />
            {imageDimensions.width > 0 && (
              <div
                ref={markerRef}
                className="absolute"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Pulsing ring */}
                <div className="absolute w-12 h-12 -left-6 -top-6 rounded-full bg-error/25 animate-ping" />
                <div className="absolute w-8 h-8 -left-4 -top-4 rounded-full bg-error/20 animate-pulse" />
                {/* Solid dot */}
                <div className="relative w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-error border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                {/* Asset name label */}
                <div className="absolute left-4 -top-3 whitespace-nowrap bg-surface/95 border border-surface-border rounded px-2 py-1 text-caption font-medium text-text-primary shadow-md">
                  {assetName}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-text-tertiary">
            No floor plan image available
          </div>
        )}
      </div>
    </Modal>
  );
}
