"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
}

export default function Pagination({
  page,
  totalPages,
  pageSize,
  total,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => goToPage(page - 1)}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 enabled:active:scale-95"
      >
        ← 上一页
      </button>

      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
        const startPage = Math.max(1, page - 4);
        const p = startPage + i;
        if (p > totalPages) return null;
        return (
          <button
            key={p}
            type="button"
            onClick={() => goToPage(p)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              p === page
                ? "bg-blue-600 text-white shadow-sm scale-105"
                : "bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => goToPage(page + 1)}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 bg-white dark:bg-[#1e293b] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 enabled:active:scale-95"
      >
        下一页 →
      </button>
    </div>
  );
}
