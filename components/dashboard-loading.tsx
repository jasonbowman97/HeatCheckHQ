import { Skeleton } from "@/components/ui/skeleton"

interface DashboardLoadingProps {
  /** Number of filter/control skeleton bars to show above the table */
  filters?: number
  /** Number of table rows */
  rows?: number
  /** Number of table columns */
  columns?: number
}

export function DashboardLoading({
  filters = 3,
  rows = 10,
  columns = 6,
}: DashboardLoadingProps) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-6 space-y-6">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Filters row */}
      {filters > 0 && (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: filters }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-md" />
          ))}
        </div>
      )}

      {/* Table skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-secondary/30">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-3 rounded"
              style={{ width: i === 0 ? "20%" : "12%" }}
            />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0"
          >
            {Array.from({ length: columns }).map((_, col) => (
              <Skeleton
                key={col}
                className="h-3 rounded"
                style={{ width: col === 0 ? "20%" : `${10 + (col % 3) * 2}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
