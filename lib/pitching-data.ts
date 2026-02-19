import type { PitchArsenalEntry } from "@/lib/mlb-api"

export interface PitcherStats {
  id: number
  name: string
  team: string
  hand: "L" | "R"
  era: number
  whip: number
  wins: number
  losses: number
  kPer9: number
  kPct: number
  inningsPitched: number
  barrelPct: number
  hardHitPct: number
  whiffPct: number
  /** Live pitch arsenal (loaded on demand in detail view) */
  arsenal: PitchArsenalEntry[]
  /** Whether this pitcher is a today's probable starter */
  isTodayStarter?: boolean
}

export function getHeatmapColor(value: number, min: number, max: number): string {
  if (max === min) return "bg-secondary text-foreground"
  const ratio = (value - min) / (max - min)
  if (ratio <= 0.2) return "bg-red-500/20 text-red-400"
  if (ratio <= 0.4) return "bg-orange-500/20 text-orange-400"
  if (ratio <= 0.6) return "bg-yellow-500/20 text-yellow-300"
  if (ratio <= 0.8) return "bg-emerald-500/20 text-emerald-400"
  return "bg-green-500/20 text-green-400"
}

// Inverted: lower is better (for ERA, WHIP, Barrel%, Hard-Hit%)
export function getHeatmapColorInverted(value: number, min: number, max: number): string {
  if (max === min) return "bg-secondary text-foreground"
  const ratio = (value - min) / (max - min)
  if (ratio <= 0.2) return "bg-green-500/20 text-green-400"
  if (ratio <= 0.4) return "bg-emerald-500/20 text-emerald-400"
  if (ratio <= 0.6) return "bg-yellow-500/20 text-yellow-300"
  if (ratio <= 0.8) return "bg-orange-500/20 text-orange-400"
  return "bg-red-500/20 text-red-400"
}
