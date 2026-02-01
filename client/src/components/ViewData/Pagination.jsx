const Pagination = ({ currentPage, totalPages, totalRecords, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 rounded-lg border border-gray-200">
      {/* Record count */}
      <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
        Showing <span className="font-semibold">{startRecord}</span> to{" "}
        <span className="font-semibold">{endRecord}</span> of{" "}
        <span className="font-semibold">{totalRecords}</span> records
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full">
        {/* First page button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="hidden sm:flex px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          title="First page"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Previous button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1 text-xs sm:text-sm"
        >
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {(() => {
            const pages = [];
            const maxVisible = 3;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);

            if (endPage - startPage + 1 < maxVisible) {
              startPage = Math.max(1, endPage - maxVisible + 1);
            }

            if (startPage > 1) {
              pages.push(
                <button
                  key="page-1"
                  onClick={() => onPageChange(1)}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  1
                </button>
              );
              if (startPage > 2) {
                pages.push(
                  <span key="ellipsis-1" className="px-1 sm:px-2 text-gray-500 text-xs sm:text-sm">
                    ...
                  </span>
                );
              }
            }

            for (let i = startPage; i <= endPage; i++) {
              pages.push(
                <button
                  key={`page-${i}`}
                  onClick={() => onPageChange(i)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors duration-200 ${
                    currentPage === i
                      ? "bg-blue-600 text-white font-semibold"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {i}
                </button>
              );
            }

            if (endPage < totalPages) {
              if (endPage < totalPages - 1) {
                pages.push(
                  <span key="ellipsis-2" className="px-1 sm:px-2 text-gray-500 text-xs sm:text-sm">
                    ...
                  </span>
                );
              }
              pages.push(
                <button
                  key={`page-${totalPages}`}
                  onClick={() => onPageChange(totalPages)}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  {totalPages}
                </button>
              );
            }

            return pages;
          })()}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1 text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Last page button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:flex px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          title="Last page"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
