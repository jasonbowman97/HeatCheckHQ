export function getHeatmapClass(value: number, min: number, max: number): string {
  if (max === min) return "bg-secondary text-foreground"
  const ratio = (value - min) / (max - min)
  if (ratio >= 0.8) return "bg-emerald-500/20 text-emerald-400"
  if (ratio >= 0.6) return "bg-emerald-500/10 text-emerald-300"
  if (ratio >= 0.4) return "bg-amber-500/10 text-amber-300"
  if (ratio >= 0.2) return "bg-orange-500/10 text-orange-400"
  return "bg-red-500/15 text-red-400"
}
