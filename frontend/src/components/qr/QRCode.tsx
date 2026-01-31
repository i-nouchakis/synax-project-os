import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface QRCodeProps {
  value: string;
  size?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showActions?: boolean;
}

export function QRCode({
  value,
  size = 200,
  title,
  subtitle,
  className,
  showActions = true,
}: QRCodeProps) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with padding
    const padding = 20;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2 + (title ? 40 : 0);

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add title if present
    if (title) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 25);
    }

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, (title ? 40 : 0) + padding, size, size);

      // Download
      const link = document.createElement('a');
      link.download = `qr-${title?.replace(/\s+/g, '-').toLowerCase() || 'code'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Title */}
      {title && (
        <div className="text-center mb-3">
          <h4 className="text-body font-medium text-text-primary">{title}</h4>
          {subtitle && (
            <p className="text-body-sm text-text-secondary">{subtitle}</p>
          )}
        </div>
      )}

      {/* QR Code */}
      <div
        ref={qrRef}
        className="bg-white p-4 rounded-lg shadow-sm border border-surface-border"
      >
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          includeMargin={false}
          bgColor="white"
          fgColor="#0f172a"
        />
      </div>

      {/* Value display */}
      <div className="mt-3 px-3 py-1.5 bg-surface rounded-md max-w-full">
        <code className="text-caption text-text-secondary break-all">
          {value.length > 40 ? value.slice(0, 40) + '...' : value}
        </code>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            leftIcon={<Download size={14} />}
          >
            Download
          </Button>
        </div>
      )}
    </div>
  );
}

// Compact version for lists
interface QRCodeCompactProps {
  value: string;
  size?: number;
}

export function QRCodeCompact({ value, size = 48 }: QRCodeCompactProps) {
  return (
    <div className="bg-white p-1 rounded border border-surface-border">
      <QRCodeSVG
        value={value}
        size={size}
        level="L"
        includeMargin={false}
        bgColor="white"
        fgColor="#0f172a"
      />
    </div>
  );
}
