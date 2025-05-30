import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationProps {
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showPageSize?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  showPageSize = true,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const totalPages = Math.ceil(total / limit);
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pageNumbers: number[] = [];
    const maxVisiblePages = isMobile ? 3 : 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, page - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return (
    <div className="bg-white dark:bg-gray-800 px-2 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 dark:border-gray-700">
      {/* Results info - Full width on mobile, left-aligned on desktop */}
      <div className="flex-1 text-center sm:text-left">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Showing <span className="font-medium">{showingFrom}</span> to{' '}
          <span className="font-medium">{showingTo}</span> of{' '}
          <span className="font-medium">{total}</span> results
        </p>
      </div>

      {/* Controls container - Stack on mobile, side by side on desktop */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Page size selector */}
        {showPageSize && onLimitChange && (
          <div className="w-full sm:w-auto">
            <select
              id="page-size"
              name="page-size"
              className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        )}

        {/* Navigation buttons */}
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          {/* First page - Hidden on mobile */}
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="hidden sm:inline-flex relative items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <span className="sr-only">First</span>
            <FaChevronLeft className="h-4 w-4" />
            <FaChevronLeft className="h-4 w-4 -ml-2" />
          </button>

          {/* Previous page */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md sm:rounded-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <span className="sr-only">Previous</span>
            <FaChevronLeft className="h-4 w-4" />
          </button>

          {/* Page numbers - Responsive */}
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-sm font-medium
                ${pageNum === page
                  ? 'z-10 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                }
                ${isMobile && pageNum !== page ? 'hidden sm:inline-flex' : 'inline-flex'}
              `}
            >
              {pageNum}
            </button>
          ))}

          {/* Next page */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md sm:rounded-none border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <span className="sr-only">Next</span>
            <FaChevronRight className="h-4 w-4" />
          </button>

          {/* Last page - Hidden on mobile */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="hidden sm:inline-flex relative items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <span className="sr-only">Last</span>
            <FaChevronRight className="h-4 w-4" />
            <FaChevronRight className="h-4 w-4 -ml-2" />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Pagination; 