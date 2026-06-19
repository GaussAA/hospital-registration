"use client";

import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton — 基础骨架屏组件（使用 shadcn Skeleton）
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <ShadcnSkeleton className={className} />;
}

/**
 * CardSkeleton — 模拟标准卡片加载状态
 */
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/6" />
    </div>
  );
}

/**
 * TableSkeleton — 模拟表格加载状态
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex gap-4 px-4 py-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/6" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t border-border/60">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  );
}

/**
 * CalendarSkeleton — 模拟日历排班加载状态
 */
export function CalendarSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border/60">
        <Skeleton className="h-5 w-28 mb-1" />
        <Skeleton className="h-3 w-36" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, r) => (
          <div key={r} className="flex gap-3">
            <Skeleton className="h-4 w-10 shrink-0 mt-1" />
            {Array.from({ length: 7 }).map((_, c) => (
              <Skeleton key={c} className="h-14 flex-1 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
