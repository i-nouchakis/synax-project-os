import { useState, useRef, useEffect } from 'react';
import { Download, FileImage, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui';
import { jsPDF } from 'jspdf';

type DownloadFormat = 'png' | 'jpeg' | 'webp' | 'pdf';

interface DownloadOption {
  format: DownloadFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const downloadOptions: DownloadOption[] = [
  { format: 'png', label: 'PNG', description: 'Original Quality', icon: <FileImage size={16} /> },
  { format: 'jpeg', label: 'JPEG', description: 'Compressed', icon: <FileImage size={16} /> },
  { format: 'webp', label: 'WebP', description: 'Modern Format', icon: <FileImage size={16} /> },
  { format: 'pdf', label: 'PDF', description: 'Print Ready', icon: <FileText size={16} /> },
];

interface DownloadFloorplanDropdownProps {
  imageUrl: string;
  fileName: string;
  projectName?: string;
  floorName?: string;
  roomName?: string;
}

export function DownloadFloorplanDropdown({
  imageUrl,
  fileName,
  projectName,
  floorName,
  roomName,
}: DownloadFloorplanDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
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

    // Semi-transparent background for readability
    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(
      width - textWidth - padding * 2,
      height - fontSize - padding * 2,
      textWidth + padding * 2,
      fontSize + padding * 2
    );

    // White text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(text, width - padding, height - padding);
  };

  const downloadAsImage = async (format: 'png' | 'jpeg' | 'webp') => {
    try {
      setIsDownloading(true);
      const img = await loadImage(imageUrl);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Add watermark
      addWatermark(ctx, canvas.width, canvas.height);

      // Convert to blob
      const mimeType = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp';
      const quality = format === 'png' ? 1 : 0.92;

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${fileName}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsDownloading(false);
          setIsOpen(false);
        },
        mimeType,
        quality
      );
    } catch (error) {
      console.error('Error downloading image:', error);
      setIsDownloading(false);
    }
  };

  const downloadAsPdf = async () => {
    try {
      setIsDownloading(true);
      const img = await loadImage(imageUrl);

      // Determine orientation based on image dimensions
      const isLandscape = img.width > img.height;
      const orientation = isLandscape ? 'landscape' : 'portrait';

      // Create PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Header
      const headerHeight = 20;
      pdf.setFillColor(13, 17, 23); // Dark background
      pdf.rect(0, 0, pageWidth, headerHeight, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');

      // Title
      let title = fileName;
      if (projectName) {
        title = roomName
          ? `${projectName} - ${floorName} - ${roomName}`
          : `${projectName} - ${floorName}`;
      }
      pdf.text(title, 10, 13);

      // Date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const date = new Date().toLocaleDateString('el-GR');
      pdf.text(date, pageWidth - 10, 13, { align: 'right' });

      // Calculate image dimensions to fit page
      const margin = 10;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - headerHeight - margin * 2 - 15; // 15 for footer

      const imgRatio = img.width / img.height;
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

      // Center image
      const imgX = (pageWidth - imgWidth) / 2;
      const imgY = headerHeight + margin;

      // Add image to PDF
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth, imgHeight);
      }

      // Footer
      const footerY = pageHeight - 8;
      pdf.setFillColor(13, 17, 23);
      pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F');

      pdf.setTextColor(12, 148, 169); // Primary color
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Created by Synax', pageWidth / 2, footerY, { align: 'center' });

      // Save PDF
      pdf.save(`${fileName}.pdf`);

      setIsDownloading(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating PDF:', error);
      setIsDownloading(false);
    }
  };

  const handleDownload = (format: DownloadFormat) => {
    if (format === 'pdf') {
      downloadAsPdf();
    } else {
      downloadAsImage(format);
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDownloading}
        className="gap-2"
      >
        <Download size={16} />
        {isDownloading ? 'Downloading...' : 'Download'}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface border border-surface-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {downloadOptions.map((option) => (
              <button
                key={option.format}
                onClick={() => handleDownload(option.format)}
                disabled={isDownloading}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-surface-hover transition-colors disabled:opacity-50"
              >
                <span className="text-text-tertiary">{option.icon}</span>
                <div className="flex-1">
                  <div className="text-body text-text-primary">{option.label}</div>
                  <div className="text-caption text-text-tertiary">{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
