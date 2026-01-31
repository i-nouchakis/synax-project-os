import { useState } from 'react';
import { PenLine, User } from 'lucide-react';
import { Modal, ModalSection, ModalActions, Input, Button } from '@/components/ui';
import { SignaturePad } from './SignaturePad';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (data: { signatureData: string; signerName: string }) => void;
  title?: string;
  description?: string;
  requireName?: boolean;
}

export function SignatureModal({
  isOpen,
  onClose,
  onSign,
  title = 'Sign Document',
  description,
  requireName = true,
}: SignatureModalProps) {
  const [signerName, setSignerName] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [step, setStep] = useState<'name' | 'signature'>('name');

  const handleNameSubmit = () => {
    if (requireName && !signerName.trim()) return;
    setStep('signature');
  };

  const handleSignatureCapture = (data: string) => {
    setSignatureData(data);
  };

  const handleComplete = () => {
    if (!signatureData) return;
    onSign({
      signatureData,
      signerName: signerName.trim(),
    });
    // Reset state
    setSignerName('');
    setSignatureData(null);
    setStep('name');
    onClose();
  };

  const handleClose = () => {
    setSignerName('');
    setSignatureData(null);
    setStep('name');
    onClose();
  };

  const getFooter = () => {
    if (step === 'name' && requireName) {
      return (
        <ModalActions>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleNameSubmit} disabled={!signerName.trim()}>
            Continue
          </Button>
        </ModalActions>
      );
    }
    if (signatureData) {
      return (
        <ModalActions>
          <Button variant="secondary" onClick={() => setSignatureData(null)}>
            Re-sign
          </Button>
          <Button onClick={handleComplete}>Confirm & Save</Button>
        </ModalActions>
      );
    }
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      icon={<PenLine size={18} />}
      size="lg"
      footer={getFooter()}
    >
      <div className="space-y-5">
        {description && (
          <p className="text-body-sm text-text-secondary">{description}</p>
        )}

        {step === 'name' && requireName && (
          <ModalSection title="Your Name" icon={<User size={14} />}>
            <Input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Full name"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              leftIcon={<User size={16} />}
            />
            <p className="text-xs text-text-tertiary mt-2">
              Enter your full name to sign the document.
            </p>
          </ModalSection>
        )}

        {(step === 'signature' || !requireName) && !signatureData && (
          <ModalSection
            title={signerName ? `Signature for ${signerName}` : 'Your Signature'}
            icon={<PenLine size={14} />}
          >
            <SignaturePad
              onSave={handleSignatureCapture}
              onCancel={() => (requireName ? setStep('name') : handleClose())}
            />
          </ModalSection>
        )}

        {signatureData && (
          <ModalSection title="Confirm Signature" icon={<PenLine size={14} />}>
            <div className="text-center">
              <p className="text-body text-text-secondary mb-4">
                Please confirm your signature
              </p>
              <div className="bg-white border border-surface-border rounded-lg p-4 inline-block">
                <img
                  src={signatureData}
                  alt="Your signature"
                  className="max-w-[300px] max-h-[120px]"
                />
              </div>
              {signerName && (
                <p className="text-body font-medium text-text-primary mt-2">
                  {signerName}
                </p>
              )}
            </div>
          </ModalSection>
        )}
      </div>
    </Modal>
  );
}
