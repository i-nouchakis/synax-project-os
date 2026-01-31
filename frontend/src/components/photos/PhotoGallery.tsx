import { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
} from 'lucide-react';
import { Modal } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface Photo {
  id: string;
  url: string;
  thumbnail?: string;
  caption?: string;
  createdAt?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photoId: string) => void;
  onDownload?: (photo: Photo) => void;
  className?: string;
  columns?: 2 | 3 | 4;
  allowDelete?: boolean;
}

export function PhotoGallery({
  photos,
  onDelete,
  onDownload,
  className,
  columns = 3,
  allowDelete = true,
}: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  const openPhoto = (index: number) => {
    setSelectedIndex(index);
    setZoom(1);
    setRotation(0);
  };

  const closePhoto = () => {
    setSelectedIndex(null);
    setZoom(1);
    setRotation(0);
  };

  const goToPrevious = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : photos.length - 1);
    setZoom(1);
    setRotation(0);
  };

  const goToNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex < photos.length - 1 ? selectedIndex + 1 : 0);
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.5, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleDownload = (photo: Photo) => {
    if (onDownload) {
      onDownload(photo);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = photo.url;
      link.download = `photo-${photo.id}.jpg`;
      link.click();
    }
  };

  const handleDelete = (photoId: string) => {
    if (onDelete) {
      onDelete(photoId);
      closePhoto();
    }
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  if (photos.length === 0) {
    return (
      <div className={cn('text-center py-8 text-text-tertiary', className)}>
        No photos yet
      </div>
    );
  }

  return (
    <>
      {/* Grid */}
      <div className={cn(`grid ${gridCols[columns]} gap-2`, className)}>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => openPhoto(index)}
          >
            <img
              src={photo.thumbnail || photo.url}
              alt={photo.caption || `Photo ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <Maximize2
                size={24}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-caption truncate">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <Modal
        isOpen={selectedIndex !== null}
        onClose={closePhoto}
        title=""
        size="full"
      >
        <div className="relative h-[calc(100vh-120px)] bg-black -m-6 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50">
            <div className="text-white">
              <span className="text-body-sm">
                {selectedIndex !== null ? selectedIndex + 1 : 0} / {photos.length}
              </span>
              {selectedPhoto?.caption && (
                <span className="ml-4 text-text-secondary">{selectedPhoto.caption}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 text-white hover:bg-white/10 rounded-md"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>
              <span className="text-white text-body-sm w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 text-white hover:bg-white/10 rounded-md"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 text-white hover:bg-white/10 rounded-md"
                title="Rotate"
              >
                <RotateCw size={20} />
              </button>
              {selectedPhoto && (
                <button
                  onClick={() => handleDownload(selectedPhoto)}
                  className="p-2 text-white hover:bg-white/10 rounded-md"
                  title="Download"
                >
                  <Download size={20} />
                </button>
              )}
              {allowDelete && selectedPhoto && onDelete && (
                <button
                  onClick={() => handleDelete(selectedPhoto.id)}
                  className="p-2 text-error hover:bg-error/10 rounded-md"
                  title="Delete"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button
                onClick={closePhoto}
                className="p-2 text-white hover:bg-white/10 rounded-md ml-2"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {selectedPhoto && (
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Photo'}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              />
            )}

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 p-3 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 p-3 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="p-4 bg-black/50 overflow-x-auto">
              <div className="flex gap-2 justify-center">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      setSelectedIndex(index);
                      setZoom(1);
                      setRotation(0);
                    }}
                    className={cn(
                      'w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors',
                      index === selectedIndex
                        ? 'border-primary'
                        : 'border-transparent hover:border-white/50'
                    )}
                  >
                    <img
                      src={photo.thumbnail || photo.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

// Compact gallery for smaller spaces
interface PhotoGalleryCompactProps {
  photos: Photo[];
  maxVisible?: number;
  onViewAll?: () => void;
  className?: string;
}

export function PhotoGalleryCompact({
  photos,
  maxVisible = 4,
  onViewAll,
  className,
}: PhotoGalleryCompactProps) {
  const visiblePhotos = photos.slice(0, maxVisible);
  const remainingCount = photos.length - maxVisible;

  return (
    <div className={cn('flex gap-1', className)}>
      {visiblePhotos.map((photo, index) => (
        <div
          key={photo.id}
          className="relative w-12 h-12 rounded overflow-hidden"
        >
          <img
            src={photo.thumbnail || photo.url}
            alt=""
            className="w-full h-full object-cover"
          />
          {index === maxVisible - 1 && remainingCount > 0 && (
            <button
              onClick={onViewAll}
              className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-body-sm font-medium"
            >
              +{remainingCount}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
