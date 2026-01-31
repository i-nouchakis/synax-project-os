import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface-hover text-text-primary',
        primary: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
        info: 'bg-info/10 text-info',
        purple: 'bg-accent-purple/10 text-accent-purple',
        outline: 'border border-surface-border text-text-secondary',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-tiny',
        md: 'px-2 py-1 text-caption',
        lg: 'px-2.5 py-1 text-body-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

function Badge({ className, variant, size, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full mr-1.5', dotColor || 'bg-current')}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
