import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  size = 'md'
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        className={cn(
          'bg-surface border border-surface-border rounded-xl shadow-xl w-full flex flex-col',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          size === 'sm' && 'max-w-md max-h-[85vh]',
          size === 'md' && 'max-w-xl max-h-[85vh]',
          size === 'lg' && 'max-w-3xl max-h-[85vh]',
          size === 'xl' && 'max-w-5xl max-h-[85vh]',
          size === 'full' && 'max-w-[95vw] max-h-[95vh]'
        )}
      >
        {/* Header - Sticky */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
            )}
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-hover text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer - Sticky */}
        {footer && (
          <div className="px-6 py-4 border-t border-surface-border shrink-0 bg-surface">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================
   Modal Section Component
   ======================================== */

interface ModalSectionProps {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function ModalSection({
  title,
  icon,
  children,
  className,
  noPadding = false
}: ModalSectionProps) {
  return (
    <div className={cn('rounded-lg bg-background border border-surface-border', className)}>
      {title && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
          {icon && <span className="text-text-secondary">{icon}</span>}
          <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
            {title}
          </h3>
        </div>
      )}
      <div className={cn(!noPadding && 'p-4')}>
        {children}
      </div>
    </div>
  );
}

/* ========================================
   Modal Info Row Component
   ======================================== */

interface ModalInfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

export function ModalInfoRow({ label, value, icon }: ModalInfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && (
        <span className="text-text-tertiary mt-0.5">{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-tertiary uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-text-primary">{value || '—'}</p>
      </div>
    </div>
  );
}

/* ========================================
   Modal Actions (Footer helper)
   ======================================== */

interface ModalActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalActions({ children, className }: ModalActionsProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3', className)}>
      {children}
    </div>
  );
}
