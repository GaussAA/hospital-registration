"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui";

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
}

export default function Pagination({
  page,
  totalPages,
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => goToPage(page - 1)}
      >
        <ChevronLeft className="w-4 h-4" />
        上一页
      </Button>

      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
        const startPage = Math.max(1, page - 4);
        const p = startPage + i;
        if (p > totalPages) return null;
        return (
          <Button
            key={p}
            type="button"
            variant={p === page ? "default" : "outline"}
            size="sm"
            onClick={() => goToPage(p)}
            className={p === page ? "shadow-sm scale-105" : ""}
          >
            {p}
          </Button>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => goToPage(page + 1)}
      >
        下一页
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
