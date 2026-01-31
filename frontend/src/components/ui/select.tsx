import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-body-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full appearance-none bg-surface border rounded-md px-3 py-2 pr-10',
              'text-body text-text-primary',
              'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-error' : 'border-surface-border',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
          />
        </div>
        {error && <p className="text-caption text-error">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
