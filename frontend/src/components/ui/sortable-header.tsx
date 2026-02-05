import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { SortDirection } from '@/hooks/useSortable';
import { cn } from '@/lib/utils';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  direction: SortDirection;
  onSort: (key: string) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  direction,
  onSort,
  align = 'left',
  className,
}: SortableHeaderProps) {
  const alignmentClasses = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right',
  };

  return (
    <th
      className={cn(
        'text-caption font-medium text-text-secondary px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors select-none',
        alignmentClasses[align],
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className={cn('flex items-center gap-1', alignmentClasses[align])}>
        <span>{label}</span>
        <span className="w-4 h-4 flex items-center justify-center">
          {direction === 'asc' ? (
            <ChevronUp size={14} className="text-primary" />
          ) : direction === 'desc' ? (
            <ChevronDown size={14} className="text-primary" />
          ) : (
            <ChevronsUpDown size={14} className="text-text-tertiary opacity-50" />
          )}
        </span>
      </div>
    </th>
  );
}
