import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  /** Minimum number of rows */
  minRows?: number;
  /** Maximum number of rows before scrolling */
  maxRows?: number;
  /** Auto-resize based on content */
  autoResize?: boolean;
  /** Allow manual resize (drag corner) */
  resizable?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      minRows = 3,
      maxRows = 10,
      autoResize = true,
      resizable = true,
      id,
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const textareaId = id || React.useId();
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Calculate line height for row calculations
    const lineHeight = 24; // Approximate line height in pixels
    const padding = 16; // Top + bottom padding (py-2 = 8px * 2)
    const minHeight = minRows * lineHeight + padding;
    const maxHeight = maxRows * lineHeight + padding;

    // Auto-resize function
    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';

      // Calculate new height
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }, [autoResize, minHeight, maxHeight, textareaRef]);

    // Adjust height on mount and when value changes
    React.useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    // Handle change with auto-resize
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        adjustHeight();
      }
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-caption font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          className={cn(
            'flex w-full bg-background border rounded-md px-3 py-2',
            'text-body text-text-primary placeholder:text-text-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:bg-surface disabled:text-text-disabled disabled:cursor-not-allowed',
            'transition-colors duration-200',
            error
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-surface-border focus:border-primary focus:ring-primary/20',
            resizable ? 'resize-y' : 'resize-none',
            className
          )}
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: autoResize ? `${maxHeight}px` : undefined,
          }}
          {...props}
        />
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

Textarea.displayName = 'Textarea';

export { Textarea };
