/**
 * Reusable skeleton components for loading states.
 * Animated shimmer effect that adapts to light/dark mode.
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] p-6 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-6 px-6 py-4 border-t border-gray-100 dark:border-gray-700/50"
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className={`h-4 ${colIdx === 0 ? "w-32" : "w-16"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDoctorDetail() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Doctor info card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e293b] p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </div>
      {/* Schedule table skeleton */}
      <SkeletonTable rows={3} cols={7} />
    </div>
  );
}
