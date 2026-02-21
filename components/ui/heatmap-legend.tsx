export function HeatmapLegend({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-[10px] text-muted-foreground ${className ?? ""}`}>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-6 rounded-sm bg-emerald-500/20" />
        <span className="text-emerald-400 font-medium">Above Avg</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-6 rounded-sm bg-secondary" />
        <span>Average</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-6 rounded-sm bg-red-500/20" />
        <span className="text-red-400 font-medium">Below Avg</span>
      </div>
    </div>
  )
}
