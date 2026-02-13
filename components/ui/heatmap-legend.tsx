export function HeatmapLegend({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-[10px] text-muted-foreground ${className ?? ""}`}>
      <span>Low</span>
      <div className="flex gap-0.5">
        <div className="h-3 w-6 rounded-sm bg-red-500/20" />
        <div className="h-3 w-6 rounded-sm bg-orange-500/15" />
        <div className="h-3 w-6 rounded-sm bg-amber-500/15" />
        <div className="h-3 w-6 rounded-sm bg-emerald-500/10" />
        <div className="h-3 w-6 rounded-sm bg-emerald-500/20" />
      </div>
      <span>High</span>
    </div>
  )
}
