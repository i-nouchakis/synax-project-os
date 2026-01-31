import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, AlertCircle, Loader2, QrCode } from 'lucide-react';
import { Modal, ModalSection, ModalActions, Button, Input } from '@/components/ui';
import { QRScanner } from './QRScanner';
import { assetService, type Asset } from '@/services/asset.service';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ScanMode = 'camera' | 'manual';
type ScanStatus = 'scanning' | 'loading' | 'found' | 'not-found' | 'error';

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ScanMode>('camera');
  const [status, setStatus] = useState<ScanStatus>('scanning');
  const [scannedValue, setScannedValue] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [foundAsset, setFoundAsset] = useState<Asset | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (value: string) => {
    setScannedValue(value);
    setStatus('loading');
    setError(null);

    try {
      // Parse QR code value - expected format: "SYNAX:ASSET:{id}" or just serial/MAC
      let searchValue = value;

      if (value.startsWith('SYNAX:ASSET:')) {
        // Direct asset ID
        const assetId = value.replace('SYNAX:ASSET:', '');
        const asset = await assetService.getById(assetId);
        if (asset) {
          setFoundAsset(asset);
          setStatus('found');
          return;
        }
      }

      // Search by serial or MAC
      searchValue = value.replace('SYNAX:', '');
      const result = await assetService.searchByCode(searchValue);

      if (result) {
        setFoundAsset(result);
        setStatus('found');
      } else {
        setStatus('not-found');
      }
    } catch (err) {
      console.error('Error looking up asset:', err);
      setError('Failed to lookup asset. Please try again.');
      setStatus('error');
    }
  };

  const handleManualSearch = () => {
    if (manualInput.trim()) {
      handleScan(manualInput.trim());
    }
  };

  const handleGoToAsset = () => {
    if (foundAsset) {
      onClose();
      navigate(`/assets/${foundAsset.id}`);
    }
  };

  const resetScanner = () => {
    setStatus('scanning');
    setScannedValue('');
    setFoundAsset(null);
    setError(null);
    setManualInput('');
  };

  const handleClose = () => {
    resetScanner();
    onClose();
  };

  const getFooter = () => {
    if (status === 'found' && foundAsset) {
      return (
        <ModalActions>
          <Button variant="secondary" onClick={resetScanner}>
            Scan Another
          </Button>
          <Button onClick={handleGoToAsset}>
            View Asset
          </Button>
        </ModalActions>
      );
    }
    if (status === 'not-found' || status === 'error') {
      return (
        <ModalActions>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={resetScanner}>
            Try Again
          </Button>
        </ModalActions>
      );
    }
    return (
      <ModalActions>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
      </ModalActions>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Scan QR Code"
      icon={<QrCode size={18} />}
      size="lg"
      footer={getFooter()}
    >
      <div className="space-y-5">
        {/* Mode toggle */}
        {status === 'scanning' && (
          <div className="flex rounded-lg bg-surface-secondary p-1">
            <button
              onClick={() => { setMode('camera'); resetScanner(); }}
              className={`flex-1 py-2 px-4 rounded-md text-body-sm transition-colors ${
                mode === 'camera'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Camera
            </button>
            <button
              onClick={() => { setMode('manual'); resetScanner(); }}
              className={`flex-1 py-2 px-4 rounded-md text-body-sm transition-colors ${
                mode === 'manual'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Manual Entry
            </button>
          </div>
        )}

        {/* Camera mode */}
        {mode === 'camera' && status === 'scanning' && (
          <ModalSection title="Scan QR Code" icon={<QrCode size={14} />}>
            <div className="aspect-square max-h-[400px] mx-auto">
              <QRScanner onScan={handleScan} className="h-full" />
            </div>
          </ModalSection>
        )}

        {/* Manual mode */}
        {mode === 'manual' && status === 'scanning' && (
          <ModalSection title="Manual Search" icon={<Search size={14} />}>
            <p className="text-body-sm text-text-secondary mb-4">
              Enter the asset serial number, MAC address, or QR code value
            </p>
            <div className="flex gap-2">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Serial number or MAC address..."
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              />
              <Button onClick={handleManualSearch} disabled={!manualInput.trim()}>
                <Search size={18} />
              </Button>
            </div>
          </ModalSection>
        )}

        {/* Loading state */}
        {status === 'loading' && (
          <div className="py-12 text-center">
            <Loader2 size={48} className="mx-auto text-primary animate-spin mb-4" />
            <p className="text-body text-text-secondary">Looking up asset...</p>
            <p className="text-body-sm text-text-tertiary mt-1">{scannedValue}</p>
          </div>
        )}

        {/* Found state */}
        {status === 'found' && foundAsset && (
          <ModalSection title="Asset Found" icon={<Package size={14} />}>
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <Package size={24} className="text-success" />
              </div>
            </div>

            <div className="text-center mb-4">
              <p className="text-body-sm text-text-tertiary font-mono">
                {scannedValue}
              </p>
            </div>

            <div className="bg-background rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-body-sm">
                <div>
                  <span className="text-text-tertiary">Name</span>
                  <p className="text-text-primary font-medium">{foundAsset.name}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">Type</span>
                  <p className="text-text-primary">{foundAsset.assetType?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">Serial</span>
                  <p className="text-text-primary font-mono">{foundAsset.serialNumber || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-text-tertiary">Status</span>
                  <p className="text-text-primary capitalize">{foundAsset.status.toLowerCase().replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </ModalSection>
        )}

        {/* Not found state */}
        {status === 'not-found' && (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-warning" />
            </div>
            <h3 className="text-body font-medium text-text-primary mb-2">Asset Not Found</h3>
            <p className="text-body-sm text-text-secondary mb-2">
              No asset matches the scanned code:
            </p>
            <p className="text-body-sm text-text-tertiary font-mono">
              {scannedValue}
            </p>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-error" />
            </div>
            <h3 className="text-body font-medium text-text-primary mb-2">Error</h3>
            <p className="text-body-sm text-text-secondary">
              {error}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
