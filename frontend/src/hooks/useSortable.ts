import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export function useSortable<T>(items: T[], defaultSort?: SortConfig) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    defaultSort || { key: '', direction: null }
  );

  const sortedItems = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return items;
    }

    return [...items].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Handle date strings
      if (isDateString(aValue) && isDateString(bValue)) {
        const dateA = new Date(aValue).getTime();
        const dateB = new Date(bValue).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // Handle strings
      const strA = String(aValue).toLowerCase();
      const strB = String(bValue).toLowerCase();

      if (sortConfig.direction === 'asc') {
        return strA.localeCompare(strB);
      }
      return strB.localeCompare(strA);
    });
  }, [items, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig((current) => {
      if (current.key === key) {
        // Cycle through: asc -> desc -> null
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        if (current.direction === 'desc') {
          return { key: '', direction: null };
        }
      }
      // New column or was null
      return { key, direction: 'asc' };
    });
  };

  const getSortDirection = (key: string): SortDirection => {
    if (sortConfig.key === key) {
      return sortConfig.direction;
    }
    return null;
  };

  return {
    sortedItems,
    sortConfig,
    requestSort,
    getSortDirection,
  };
}

// Helper to get nested object values like "room.floor.name"
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// Check if a string looks like a date
function isDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.includes('-');
}
