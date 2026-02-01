import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Plus, Trash2, Copy } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';

// Fallback for crypto.randomUUID (not available in HTTP)
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return generateUUID();
  }
  // Fallback UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Label types
export type LabelType = 'cable' | 'rack' | 'asset' | 'room';

interface Label {
  id: string;
  type: LabelType;
  title: string;
  subtitle?: string;
  code: string;
  qrValue?: string;
  color?: string;
}

interface LabelGeneratorProps {
  projectName?: string;
  onGenerate?: (labels: Label[]) => void;
}

const LABEL_COLORS = [
  { name: 'White', value: '#ffffff', text: '#000000' },
  { name: 'Yellow', value: '#fef08a', text: '#000000' },
  { name: 'Orange', value: '#fed7aa', text: '#000000' },
  { name: 'Blue', value: '#bfdbfe', text: '#000000' },
  { name: 'Green', value: '#bbf7d0', text: '#000000' },
  { name: 'Red', value: '#fecaca', text: '#000000' },
];

export function LabelGenerator({ projectName, onGenerate }: LabelGeneratorProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [labelType, setLabelType] = useState<LabelType>('cable');
  const [prefix, setPrefix] = useState('');
  const [startNumber, setStartNumber] = useState(1);
  const [count, setCount] = useState(10);
  const [includeQR, setIncludeQR] = useState(true);
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0]);
  const printRef = useRef<HTMLDivElement>(null);

  // Generate labels
  const generateLabels = () => {
    const newLabels: Label[] = [];
    const typePrefix = {
      cable: 'CBL',
      rack: 'RCK',
      asset: 'AST',
      room: 'RM',
    }[labelType];

    const finalPrefix = prefix || typePrefix;

    for (let i = 0; i < count; i++) {
      const num = startNumber + i;
      const code = `${finalPrefix}-${String(num).padStart(4, '0')}`;
      newLabels.push({
        id: generateUUID(),
        type: labelType,
        title: code,
        subtitle: projectName,
        code,
        qrValue: includeQR ? `SYNAX:${code}` : undefined,
        color: selectedColor.value,
      });
    }

    setLabels(newLabels);
    onGenerate?.(newLabels);
  };

  // Add single label
  const addSingleLabel = () => {
    const code = prefix || 'LABEL';
    const newLabel: Label = {
      id: generateUUID(),
      type: labelType,
      title: code,
      subtitle: projectName,
      code,
      qrValue: includeQR ? `SYNAX:${code}` : undefined,
      color: selectedColor.value,
    };
    setLabels([...labels, newLabel]);
  };

  // Remove label
  const removeLabel = (id: string) => {
    setLabels(labels.filter((l) => l.id !== id));
  };

  // Duplicate label
  const duplicateLabel = (label: Label) => {
    setLabels([...labels, { ...label, id: generateUUID() }]);
  };

  // Print labels
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Labels</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .labels-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 5mm;
            }
            .label {
              border: 1px solid #ccc;
              border-radius: 4px;
              padding: 5mm;
              text-align: center;
              page-break-inside: avoid;
            }
            .label-title {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 2mm;
            }
            .label-subtitle {
              font-size: 9pt;
              color: #666;
              margin-bottom: 3mm;
            }
            .label-qr {
              margin: 3mm auto;
            }
            .label-code {
              font-family: monospace;
              font-size: 8pt;
              color: #888;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Download as PDF (using print to PDF)
  const handleDownload = () => {
    handlePrint();
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Label Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Label Type */}
          <div>
            <label className="text-body-sm text-text-secondary block mb-2">
              Label Type
            </label>
            <div className="flex gap-2">
              {(['cable', 'rack', 'asset', 'room'] as LabelType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setLabelType(type)}
                  className={cn(
                    'px-4 py-2 rounded-md text-body-sm capitalize transition-colors',
                    labelType === type
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Prefix and Numbers */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-body-sm text-text-secondary block mb-2">
                Prefix
              </label>
              <Input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="CBL"
              />
            </div>
            <div>
              <label className="text-body-sm text-text-secondary block mb-2">
                Start Number
              </label>
              <Input
                type="number"
                min={1}
                value={startNumber}
                onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="text-body-sm text-text-secondary block mb-2">
                Count
              </label>
              <Input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="text-body-sm text-text-secondary block mb-2">
              Label Color
            </label>
            <div className="flex gap-2">
              {LABEL_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'w-8 h-8 rounded-md border-2 transition-all',
                    selectedColor.name === color.name
                      ? 'border-primary scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQR}
                onChange={(e) => setIncludeQR(e.target.checked)}
                className="w-4 h-4 rounded border-surface-border text-primary focus:ring-primary"
              />
              <span className="text-body-sm text-text-secondary">Include QR Code</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={generateLabels}>Generate {count} Labels</Button>
            <Button variant="secondary" onClick={addSingleLabel} leftIcon={<Plus size={16} />}>
              Add Single
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Labels Preview */}
      {labels.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Labels ({labels.length})</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                leftIcon={<Download size={16} />}
              >
                Download PDF
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer size={16} />}
              >
                Print
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              ref={printRef}
              className="labels-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {labels.map((label) => (
                <LabelCard
                  key={label.id}
                  label={label}
                  onDelete={() => removeLabel(label.id)}
                  onDuplicate={() => duplicateLabel(label)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Individual Label Card
interface LabelCardProps {
  label: Label;
  onDelete?: () => void;
  onDuplicate?: () => void;
  showActions?: boolean;
}

export function LabelCard({
  label,
  onDelete,
  onDuplicate,
  showActions = true,
}: LabelCardProps) {
  const colorInfo = LABEL_COLORS.find((c) => c.value === label.color) || LABEL_COLORS[0];

  return (
    <div
      className="label relative border border-surface-border rounded-lg p-4 text-center group"
      style={{ backgroundColor: label.color || '#ffffff' }}
    >
      {/* Actions */}
      {showActions && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="p-1 rounded bg-surface/80 text-text-secondary hover:text-text-primary"
              title="Duplicate"
            >
              <Copy size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded bg-surface/80 text-error hover:text-error"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="label-title text-h4 font-bold" style={{ color: colorInfo.text }}>
        {label.title}
      </div>
      {label.subtitle && (
        <div className="label-subtitle text-caption text-text-secondary mt-1">
          {label.subtitle}
        </div>
      )}
      {label.qrValue && (
        <div className="label-qr my-3 flex justify-center">
          <QRCodeSVG
            value={label.qrValue}
            size={64}
            level="M"
            bgColor="transparent"
            fgColor={colorInfo.text}
          />
        </div>
      )}
      <div className="label-code text-tiny font-mono text-text-tertiary">
        {label.code}
      </div>
    </div>
  );
}

// Quick Cable Label Generator
interface QuickCableLabelProps {
  from: string;
  to: string;
  cableType?: string;
  projectName?: string;
}

export function QuickCableLabel({ from, to, cableType, projectName }: QuickCableLabelProps) {
  const label: Label = {
    id: 'quick',
    type: 'cable',
    title: `${from} ↔ ${to}`,
    subtitle: cableType || projectName,
    code: `${from}-${to}`,
    qrValue: `SYNAX:CBL:${from}-${to}`,
    color: '#fef08a',
  };

  return <LabelCard label={label} showActions={false} />;
}
