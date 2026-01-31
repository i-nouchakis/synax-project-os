import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';
import { Select } from './select';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSize = true,
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1 && !showPageSize) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-surface-border">
      {/* Left side - Navigation & Page Size */}
      <div className="flex items-center gap-4">
        {/* Page Navigation - Always visible */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || totalPages <= 1}
            title="First page"
          >
            <ChevronsLeft size={16} />
          </Button>

          {/* Previous Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || totalPages <= 1}
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </Button>

          {/* Page Numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {totalPages <= 1 ? (
              <Button
                variant="primary"
                size="sm"
                className="min-w-[32px]"
                disabled
              >
                1
              </Button>
            ) : (
              getVisiblePages().map((page, index) =>
                page === '...' ? (
                  <span key={`dots-${index}`} className="px-2 text-text-tertiary">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className="min-w-[32px]"
                  >
                    {page}
                  </Button>
                )
              )
            )}
          </div>

          {/* Mobile Page Indicator */}
          <span className="sm:hidden text-body-sm text-text-secondary px-2">
            {currentPage} / {Math.max(1, totalPages)}
          </span>

          {/* Next Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages <= 1}
            title="Next page"
          >
            <ChevronRight size={16} />
          </Button>

          {/* Last Page */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages <= 1}
            title="Last page"
          >
            <ChevronsRight size={16} />
          </Button>
        </div>
      </div>

      {/* Right side - Info & Page Size */}
      <div className="flex items-center gap-4">
        {/* Info */}
        <div className="text-body-sm text-text-secondary">
          Showing <span className="font-medium text-text-primary">{startItem}</span> to{' '}
          <span className="font-medium text-text-primary">{endItem}</span> of{' '}
          <span className="font-medium text-text-primary">{totalItems}</span> results
        </div>

        {/* Page Size Selector */}
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-text-secondary">Show:</span>
            <Select
              value={pageSize.toString()}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              options={pageSizeOptions.map((size) => ({
                value: size.toString(),
                label: `${size}`,
              }))}
              className="w-20"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for pagination logic
export function usePagination<T>(items: T[], defaultPageSize = 25) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Reset to first page if current page is out of bounds
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const paginatedItems = items.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    handlePageChange,
    handlePageSizeChange,
  };
}
