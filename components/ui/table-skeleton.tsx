import { Skeleton } from "@/components/ui/skeleton"

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export function TableSkeleton({ rows = 8, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-secondary/30">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 rounded" style={{ width: `${i === 0 ? 20 : 12}%` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={col} className="h-3 rounded" style={{ width: `${col === 0 ? 20 : 10 + Math.random() * 5}%` }} />
          ))}
        </div>
      ))}
    </div>
  )
}
