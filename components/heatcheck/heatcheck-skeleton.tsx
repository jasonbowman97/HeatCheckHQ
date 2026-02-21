// Skeleton loading state for The HeatCheck board

export function HeatCheckSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-4 animate-pulse"
        >
          {/* Top row */}
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="space-y-1">
                  <div className="h-3.5 w-24 rounded bg-muted" />
                  <div className="h-2.5 w-16 rounded bg-muted" />
                </div>
              </div>
            </div>
            <div className="h-5 w-10 rounded-md bg-muted" />
          </div>

          {/* Middle row */}
          <div className="mt-3 flex items-center justify-between">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>

          {/* Bottom row */}
          <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="h-1.5 w-1.5 rounded-full bg-muted" />
              ))}
            </div>
            <div className="h-3 w-28 rounded bg-muted" />
          </div>

          {/* Button */}
          <div className="mt-3 h-7 w-full rounded-lg bg-muted" />
        </div>
      ))}
    </div>
  )
}
