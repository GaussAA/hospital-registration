"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  searchParams: string;
}

export default function Pagination({
  page,
  totalPages,
  searchParams,
}: PaginationProps) {
  const setPageParam = (queryString: string, newPage: number): string => {
    const params = new URLSearchParams(queryString);
    params.set("page", String(newPage));
    return params.toString();
  };

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <a
        href={page > 1 ? `?${setPageParam(searchParams, page - 1)}` : "#"}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          page <= 1
            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed pointer-events-none"
            : "bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
        onClick={(e) => {
          if (page <= 1) e.preventDefault();
        }}
      >
        上一页
      </a>
      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
        const startPage = Math.max(1, page - 4);
        const p = startPage + i;
        if (p > totalPages) return null;
        return (
          <a
            key={p}
            href={`?${setPageParam(searchParams, p)}`}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              p === page
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {p}
          </a>
        );
      })}
      <a
        href={page < totalPages ? `?${setPageParam(searchParams, page + 1)}` : "#"}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          page >= totalPages
            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed pointer-events-none"
            : "bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
        }`}
        onClick={(e) => {
          if (page >= totalPages) e.preventDefault();
        }}
      >
        下一页
      </a>
    </div>
  );
}
