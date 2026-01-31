import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Box,
  Wifi,
  Camera,
  Server,
  Router,
  Battery,
  Network,
  Building2,
  User,
  Calendar,
  QrCode,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Modal, ModalActions } from '@/components/ui';
import { ChecklistPanel } from '@/components/checklists';
import { QRCode } from '@/components/qr';
import { assetService, type AssetStatus } from '@/services/asset.service';

const statusBadgeVariants: Record<AssetStatus, 'default' | 'primary' | 'success' | 'error'> = {
  PLANNED: 'default',
  IN_STOCK: 'default',
  INSTALLED: 'primary',
  CONFIGURED: 'primary',
  VERIFIED: 'success',
  FAULTY: 'error',
};

const assetTypeIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi size={24} />,
  network: <Network size={24} />,
  camera: <Camera size={24} />,
  router: <Router size={24} />,
  server: <Server size={24} />,
  battery: <Battery size={24} />,
};

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showQRModal, setShowQRModal] = useState(false);

  // Fetch asset
  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-error mb-4">Asset not found</p>
        <button onClick={() => navigate(-1)} className="text-primary hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(`/rooms/${asset.roomId}`)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-2"
        >
          <ArrowLeft size={18} />
          <span className="text-body-sm">Back to {asset.room?.name || 'Room'}</span>
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {asset.assetType?.icon
                ? assetTypeIcons[asset.assetType.icon] || <Box size={24} />
                : <Box size={24} />}
            </div>
            <div>
              <h1 className="text-h1">{asset.name}</h1>
              <p className="text-body text-text-secondary">
                {asset.assetType?.name || 'Unknown type'} • {asset.model || 'No model'}
              </p>
            </div>
          </div>
          <Badge variant={statusBadgeVariants[asset.status]} size="lg">
            {asset.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location */}
              <div>
                <p className="text-caption text-text-tertiary mb-1">Location</p>
                <div className="flex items-center gap-2 text-body-sm">
                  <Building2 size={14} className="text-text-secondary" />
                  <span>{asset.room?.floor?.project?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-text-secondary ml-5">
                  <span>{asset.room?.floor?.name} / {asset.room?.name}</span>
                </div>
              </div>

              {/* Serial Number */}
              {asset.serialNumber && (
                <div>
                  <p className="text-caption text-text-tertiary mb-1">Serial Number</p>
                  <p className="text-body font-mono">{asset.serialNumber}</p>
                </div>
              )}

              {/* MAC Address */}
              {asset.macAddress && (
                <div>
                  <p className="text-caption text-text-tertiary mb-1">MAC Address</p>
                  <p className="text-body font-mono">{asset.macAddress}</p>
                </div>
              )}

              {/* IP Address */}
              {asset.ipAddress && (
                <div>
                  <p className="text-caption text-text-tertiary mb-1">IP Address</p>
                  <p className="text-body font-mono">{asset.ipAddress}</p>
                </div>
              )}

              {/* Installed By */}
              {asset.installedBy && (
                <div>
                  <p className="text-caption text-text-tertiary mb-1">Installed By</p>
                  <div className="flex items-center gap-2 text-body-sm">
                    <User size={14} className="text-text-secondary" />
                    <span>{asset.installedBy.name}</span>
                  </div>
                  {asset.installedAt && (
                    <div className="flex items-center gap-2 text-caption text-text-secondary ml-5">
                      <Calendar size={12} />
                      <span>{new Date(asset.installedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {asset.notes && (
                <div>
                  <p className="text-caption text-text-tertiary mb-1">Notes</p>
                  <p className="text-body-sm text-text-secondary">{asset.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode size={18} />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-body-sm text-text-secondary mb-4">
                Scan this QR code to quickly look up this asset in the field.
              </p>
              <Button
                variant="secondary"
                onClick={() => setShowQRModal(true)}
                leftIcon={<QrCode size={16} />}
                className="w-full"
              >
                View QR Code
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Checklists */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <ChecklistPanel assetId={asset.id} assetName={asset.name} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Asset QR Code"
        icon={<QrCode size={18} />}
        size="sm"
        footer={
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowQRModal(false)}>
              Close
            </Button>
          </ModalActions>
        }
      >
        <div className="py-4">
          <QRCode
            value={asset.serialNumber
              ? `SYNAX:${asset.serialNumber}`
              : asset.macAddress
                ? `SYNAX:${asset.macAddress}`
                : `SYNAX:ASSET:${asset.id}`
            }
            size={220}
            title={asset.name}
            subtitle={asset.serialNumber || asset.macAddress || asset.id}
          />
          <p className="text-body-sm text-text-tertiary text-center mt-4">
            Use the QR scanner in the app to quickly find this asset
          </p>
        </div>
      </Modal>
    </div>
  );
}
