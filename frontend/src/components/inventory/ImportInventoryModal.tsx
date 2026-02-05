import { useState, useMemo } from 'react';
import {
  Search,
  Package,
  CheckSquare,
  Square,
  Wifi,
  Monitor,
  Phone,
  Camera,
  Router,
  CreditCard,
  Tv,
  Box,
} from 'lucide-react';
import { Modal, ModalActions } from '../ui/modal';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface Asset {
  id: string;
  name: string;
  status: 'PLANNED' | 'IN_STOCK' | 'INSTALLED' | 'CONFIGURED' | 'VERIFIED' | 'FAULTY';
  serialNumber?: string | null;
  macAddress?: string | null;
  assetType?: {
    id: string;
    name: string;
    icon?: string | null;
  } | null;
  // model can be either a string (from basic API) or an object (from expanded lookup)
  model?: string | {
    id: string;
    name: string;
    manufacturer?: {
      name: string;
    } | null;
  } | null;
}

interface ImportInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onImport: (assetIds: string[]) => void;
  isLoading?: boolean;
  title?: string;
  targetName?: string; // e.g., "Floor 1" or "Room 101"
  nested?: boolean;
}

const STATUS_COLORS: Record<Asset['status'], string> = {
  PLANNED: '#64748b',
  IN_STOCK: '#8b5cf6',
  INSTALLED: '#3b82f6',
  CONFIGURED: '#f59e0b',
  VERIFIED: '#22c55e',
  FAULTY: '#ef4444',
};

const ASSET_TYPE_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  'Access Point': Wifi,
  'Network Switch': Router,
  'Smart TV': Tv,
  'IP Camera': Camera,
  'VoIP Phone': Phone,
  'POS Terminal': CreditCard,
  'Digital Signage': Monitor,
  'Router': Router,
};

function getAssetIcon(typeName?: string | null) {
  if (!typeName) return Box;
  return ASSET_TYPE_ICONS[typeName] || Box;
}

export function ImportInventoryModal({
  isOpen,
  onClose,
  assets,
  onImport,
  isLoading,
  title = 'Import from Inventory',
  targetName,
  nested,
}: ImportInventoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Helper to get model name (handles both string and object formats)
  const getModelName = (model: Asset['model']) => {
    if (!model) return '';
    if (typeof model === 'string') return model;
    return model.name || '';
  };

  // Helper to get manufacturer name
  const getManufacturerName = (model: Asset['model']) => {
    if (!model || typeof model === 'string') return '';
    return model.manufacturer?.name || '';
  };

  // Filter assets based on search
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const query = searchQuery.toLowerCase();
    return assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(query) ||
        asset.assetType?.name?.toLowerCase().includes(query) ||
        asset.serialNumber?.toLowerCase().includes(query) ||
        asset.macAddress?.toLowerCase().includes(query) ||
        getModelName(asset.model).toLowerCase().includes(query) ||
        getManufacturerName(asset.model).toLowerCase().includes(query)
    );
  }, [assets, searchQuery]);

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all filtered
  const selectAll = () => {
    setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Handle import
  const handleImport = () => {
    if (selectedIds.size === 0) return;
    onImport(Array.from(selectedIds));
  };

  // Reset on close
  const handleClose = () => {
    setSearchQuery('');
    setSelectedIds(new Set());
    onClose();
  };

  const selectedCount = selectedIds.size;
  const allSelected = filteredAssets.length > 0 && filteredAssets.every((a) => selectedIds.has(a.id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      icon={<Package size={18} />}
      size="lg"
      nested={nested}
      footer={
        <ModalActions>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            isLoading={isLoading}
            disabled={selectedCount === 0}
          >
            Import {selectedCount > 0 ? `${selectedCount} Selected` : ''}
          </Button>
        </ModalActions>
      }
    >
      <div className="space-y-4">
        {/* Target info */}
        {targetName && (
          <div className="text-body-sm text-text-secondary">
            Importing to: <span className="font-medium text-text-primary">{targetName}</span>
          </div>
        )}

        {/* Search and select all */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, type, serial, MAC..."
              className="w-full pl-9 pr-3 py-2 bg-background border border-surface-border rounded-md text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={allSelected ? clearSelection : selectAll}
          >
            {allSelected ? 'Clear All' : 'Select All'}
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-body-sm">
          <span className="text-text-secondary">
            {filteredAssets.length} available
          </span>
          {selectedCount > 0 && (
            <Badge variant="primary" size="sm">
              {selectedCount} selected
            </Badge>
          )}
        </div>

        {/* Asset list */}
        <div className="border border-surface-border rounded-lg max-h-96 overflow-y-auto">
          {filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-text-tertiary">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              <p>{searchQuery ? 'No matching assets found' : 'No assets available in inventory'}</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {filteredAssets.map((asset) => {
                const Icon = getAssetIcon(asset.assetType?.name);
                const isSelected = selectedIds.has(asset.id);
                return (
                  <button
                    key={asset.id}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors text-left ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => toggleSelect(asset.id)}
                  >
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckSquare size={20} className="text-primary" />
                      ) : (
                        <Square size={20} className="text-text-tertiary" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className="flex-shrink-0 p-2 rounded-md"
                      style={{ backgroundColor: STATUS_COLORS[asset.status] + '20' }}
                    >
                      <Icon size={18} style={{ color: STATUS_COLORS[asset.status] }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium truncate">{asset.name}</p>
                      <p className="text-caption text-text-tertiary truncate">
                        {asset.assetType?.name || 'Unknown Type'}
                        {getModelName(asset.model) && ` • ${getModelName(asset.model)}`}
                        {getManufacturerName(asset.model) && ` (${getManufacturerName(asset.model)})`}
                      </p>
                      {(asset.serialNumber || asset.macAddress) && (
                        <p className="text-tiny text-text-tertiary truncate mt-0.5">
                          {asset.serialNumber && `S/N: ${asset.serialNumber}`}
                          {asset.serialNumber && asset.macAddress && ' • '}
                          {asset.macAddress && `MAC: ${asset.macAddress}`}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <Badge
                      size="sm"
                      style={{
                        backgroundColor: STATUS_COLORS[asset.status] + '20',
                        color: STATUS_COLORS[asset.status],
                      }}
                    >
                      {asset.status}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ImportInventoryModal;
