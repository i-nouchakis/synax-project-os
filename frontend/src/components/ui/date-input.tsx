import * as React from 'react';
import DatePicker from 'react-datepicker';
import { format, parse } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-datepicker/dist/react-datepicker.css';

export interface DateInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

const DateInput = React.forwardRef<HTMLDivElement, DateInputProps>(
  ({ className, label, error, helperText, value, onChange, placeholder = 'Select date', disabled, id, ...props }, ref) => {
    const inputId = id || React.useId();

    // Convert ISO string to Date object
    const dateValue = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;

    // Handle date change
    const handleChange = (date: Date | null) => {
      if (date && onChange) {
        onChange(format(date, 'yyyy-MM-dd'));
      } else if (onChange) {
        onChange('');
      }
    };

    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-caption font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <DatePicker
            id={inputId}
            selected={dateValue}
            onChange={handleChange}
            dateFormat="dd/MM/yyyy"
            locale={enUS}
            placeholderText={placeholder}
            disabled={disabled}
            className={cn(
              'flex w-full bg-background border rounded-md pl-10 pr-3 py-2',
              'text-body text-text-primary placeholder:text-text-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:bg-surface disabled:text-text-disabled disabled:cursor-not-allowed',
              'transition-colors duration-200',
              error
                ? 'border-error focus:border-error focus:ring-error/20'
                : 'border-surface-border focus:border-primary focus:ring-primary/20',
              className
            )}
            calendarClassName="synax-datepicker"
            showPopperArrow={false}
            {...props}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            <Calendar size={18} />
          </div>
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

DateInput.displayName = 'DateInput';

export { DateInput };
