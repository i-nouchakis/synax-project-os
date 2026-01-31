import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, FlipHorizontal, Flashlight } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (imageData: string, file: File) => void;
  onClose?: () => void;
  aspectRatio?: number;
  className?: string;
}

export function CameraCapture({
  onCapture,
  onClose,
  aspectRatio = 4 / 3,
  className,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // Check for multiple cameras
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    });
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setCapturedImage(null);

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check flash support
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      setFlashSupported(capabilities?.torch === true);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please grant camera permissions.');
    }
  }, [facingMode, stream]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Restart when facing mode changes
  useEffect(() => {
    if (stream) {
      startCamera();
    }
  }, [facingMode]);

  // Toggle flash
  const toggleFlash = async () => {
    if (!stream || !flashSupported) return;

    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !flashOn } as MediaTrackConstraintSet],
      });
      setFlashOn(!flashOn);
    } catch (err) {
      console.error('Flash toggle error:', err);
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
  };

  // Confirm and send photo
  const confirmPhoto = () => {
    if (!capturedImage) return;

    // Convert data URL to File
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(capturedImage, file);
      });
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
  };

  // Switch camera
  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className={cn('relative bg-black rounded-lg overflow-hidden', className)}>
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
        >
          <X size={24} />
        </button>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center p-6">
            <Camera size={48} className="mx-auto text-error mb-4" />
            <p className="text-white text-body mb-4">{error}</p>
            <Button onClick={startCamera} variant="primary">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Video preview or captured image */}
      <div className="relative" style={{ aspectRatio }}>
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Viewfinder overlay */}
        {!capturedImage && !error && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-8 border-2 border-white/30 rounded-lg" />
            <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
            <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
            <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
            <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-6">
          {capturedImage ? (
            <>
              <button
                onClick={retakePhoto}
                className="p-3 bg-white/20 rounded-full text-white hover:bg-white/30"
                title="Retake"
              >
                <RotateCcw size={24} />
              </button>
              <button
                onClick={confirmPhoto}
                className="p-4 bg-success rounded-full text-white hover:bg-success/90"
                title="Use Photo"
              >
                <Check size={28} />
              </button>
            </>
          ) : (
            <>
              {hasMultipleCameras && (
                <button
                  onClick={switchCamera}
                  className="p-3 bg-white/20 rounded-full text-white hover:bg-white/30"
                  title="Switch Camera"
                >
                  <FlipHorizontal size={24} />
                </button>
              )}
              <button
                onClick={capturePhoto}
                className="p-4 bg-white rounded-full text-black hover:bg-white/90"
                title="Capture"
              >
                <Camera size={28} />
              </button>
              {flashSupported && (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
