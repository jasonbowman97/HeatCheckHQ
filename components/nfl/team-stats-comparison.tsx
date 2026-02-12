"use client"

import type { NFLTeam } from "@/lib/nfl-matchup-data"

interface TeamStatsComparisonProps {
  away: NFLTeam
  home: NFLTeam
}

const statRows = [
  { label: "Points / Game", awayKey: "pointsScored", homeKey: "pointsScored", higherBetter: true },
  { label: "Points Allowed / Game", awayKey: "pointsAllowed", homeKey: "pointsAllowed", higherBetter: false },
  { label: "Pass Yards / Game", awayKey: "passYards", homeKey: "passYards", higherBetter: true },
  { label: "Pass Yards Allowed / Game", awayKey: "passYardsAllowed", homeKey: "passYardsAllowed", higherBetter: false },
  { label: "Rush Yards / Game", awayKey: "rushingYards", homeKey: "rushingYards", higherBetter: true },
  { label: "Rush Yards Allowed / Game", awayKey: "rushingYardsAllowed", homeKey: "rushingYardsAllowed", higherBetter: false },
] as const

function getStatColor(awayVal: number, homeVal: number, higherBetter: boolean, side: "away" | "home"): string {
  const val = side === "away" ? awayVal : homeVal
  const opp = side === "away" ? homeVal : awayVal
  if (higherBetter) {
    return val > opp ? "text-emerald-400" : val < opp ? "text-red-400" : "text-foreground"
  }
  return val < opp ? "text-emerald-400" : val > opp ? "text-red-400" : "text-foreground"
}

export function TeamStatsComparison({ away, home }: TeamStatsComparisonProps) {
  // Filter out rows where both values are 0 (unavailable stats)
  const visibleRows = statRows.filter((row) => {
    const awayVal = away.stats[row.awayKey] as number
    const homeVal = home.stats[row.homeKey] as number
    return awayVal !== 0 || homeVal !== 0
  })

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-foreground">{away.abbreviation}</span>
          <span className="text-xs text-muted-foreground font-mono">({away.spread})</span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-6">
          Team Stat
        </span>
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs text-muted-foreground font-mono">({home.spread})</span>
          <span className="text-lg font-bold text-foreground">{home.abbreviation}</span>
        </div>
      </div>

      {/* Stat rows */}
      {visibleRows.map((row, i) => {
        const awayVal = away.stats[row.awayKey] as number
        const homeVal = home.stats[row.homeKey] as number

        return (
          <div
            key={row.label}
            className={`grid grid-cols-[1fr_auto_1fr] items-center px-6 py-3 ${
              i < visibleRows.length - 1 ? "border-b border-border/50" : ""
            } hover:bg-secondary/30 transition-colors`}
          >
            {/* Away side */}
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold font-mono tabular-nums ${getStatColor(awayVal, homeVal, row.higherBetter, "away")}`}>
                {awayVal.toFixed(1)}
              </span>
            </div>

            {/* Center label */}
            <span className="text-sm text-muted-foreground text-center px-6 min-w-[180px]">
              {row.label}
            </span>

            {/* Home side */}
            <div className="flex items-center justify-end gap-3">
              <span className={`text-lg font-bold font-mono tabular-nums ${getStatColor(awayVal, homeVal, row.higherBetter, "home")}`}>
                {homeVal.toFixed(1)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
