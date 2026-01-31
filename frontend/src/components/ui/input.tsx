import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-caption font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              'flex w-full bg-background border rounded-md px-3 py-2',
              'text-body text-text-primary placeholder:text-text-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:bg-surface disabled:text-text-disabled disabled:cursor-not-allowed',
              'transition-colors duration-200',
              error
                ? 'border-error focus:border-error focus:ring-error/20'
                : 'border-surface-border focus:border-primary focus:ring-primary/20',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={cn(
              'mt-1 text-caption',
              error ? 'text-error' : 'text-text-tertiary'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
