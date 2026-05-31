"use client";

interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton — a shimmer placeholder for loading states.
 * Combine with Tailwind classes to match the dimensions of the real content.
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

/**
 * CardSkeleton — mimics a standard card in the app.
 */
export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] p-5 space-y-4">
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
 * TableSkeleton — mimics a 5-row table loading state.
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/6" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t border-gray-100 dark:border-gray-700/50">
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
 * CalendarSkeleton — mimics the schedule calendar loading state.
 */
export function CalendarSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700/50">
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
