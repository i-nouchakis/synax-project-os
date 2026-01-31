import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, CameraOff, FlipHorizontal, Flashlight, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose?: () => void;
  className?: string;
}

export function QRScanner({ onScan, onClose, className }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const qrCodeRegionId = 'qr-reader';

  // Get available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera
          const backCameraIndex = devices.findIndex(
            (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
          );
          if (backCameraIndex !== -1) {
            setCurrentCameraIndex(backCameraIndex);
          }
        } else {
          setError('No cameras found on this device');
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        setError('Unable to access camera. Please grant camera permissions.');
      });
  }, []);

  const startScanner = useCallback(async () => {
    if (cameras.length === 0) return;

    setError(null);

    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      }

      scannerRef.current = new Html5Qrcode(qrCodeRegionId);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
      };

      await scannerRef.current.start(
        cameras[currentCameraIndex].id,
        config,
        (decodedText) => {
          // Stop scanning after successful read
          stopScanner();
          onScan(decodedText);
        },
        () => {
          // QR code not found - this is called continuously while scanning
        }
      );

      setIsScanning(true);

      // Check if flash is available
      try {
        const capabilities = scannerRef.current.getRunningTrackCameraCapabilities();
        setHasFlash(capabilities.torchFeature().isSupported());
      } catch {
        setHasFlash(false);
      }
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please ensure camera permissions are granted.');
    }
  }, [cameras, currentCameraIndex, onScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
    setFlashOn(false);
  }, []);

  // Auto-start when cameras are loaded
  useEffect(() => {
    if (cameras.length > 0 && !isScanning) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [cameras]);

  // Switch camera
  const switchCamera = async () => {
    if (cameras.length <= 1) return;

    await stopScanner();
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
  };

  // Restart scanner when camera changes
  useEffect(() => {
    if (cameras.length > 0) {
      startScanner();
    }
  }, [currentCameraIndex]);

  // Toggle flash
  const toggleFlash = async () => {
    if (!scannerRef.current || !hasFlash) return;

    try {
      const capabilities = scannerRef.current.getRunningTrackCameraCapabilities();
      await capabilities.torchFeature().apply(!flashOn);
      setFlashOn(!flashOn);
    } catch (err) {
      console.error('Error toggling flash:', err);
    }
  };

  return (
    <div className={cn('relative bg-black rounded-lg overflow-hidden', className)}>
      {/* Close button */}
      {onClose && (
        <button
          onClick={() => {
            stopScanner();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
        >
          <X size={24} />
        </button>
      )}

      {/* Scanner viewport */}
      <div className="relative">
        <div id={qrCodeRegionId} className="w-full" />

        {/* Scanning overlay with corners */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 relative">
                {/* Corner indicators */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />

                {/* Scanning line animation */}
                <div className="absolute left-4 right-4 h-0.5 bg-primary animate-scan" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center p-6">
            <CameraOff size={48} className="mx-auto text-error mb-4" />
            <p className="text-white text-body mb-4">{error}</p>
            <Button onClick={startScanner} variant="primary">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-4">
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-3 bg-white/20 rounded-full text-white hover:bg-white/30"
              title="Switch Camera"
            >
              <FlipHorizontal size={24} />
            </button>
          )}

          {!isScanning ? (
            <button
              onClick={startScanner}
              className="p-4 bg-primary rounded-full text-white hover:bg-primary/90"
              title="Start Scanning"
            >
              <Camera size={28} />
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="p-4 bg-error rounded-full text-white hover:bg-error/90"
              title="Stop Scanning"
            >
              <CameraOff size={28} />
            </button>
          )}

          {hasFlash && (
            <button
              onClick={toggleFlash}
              className={cn(
                'p-3 rounded-full text-white',
                flashOn ? 'bg-warning' : 'bg-white/20 hover:bg-white/30'
              )}
              title={flashOn ? 'Turn Off Flash' : 'Turn On Flash'}
            >
              <Flashlight size={24} />
            </button>
          )}
        </div>

        <p className="text-white/70 text-center text-body-sm mt-3">
          Point your camera at a QR code
        </p>
      </div>
    </div>
  );
}
