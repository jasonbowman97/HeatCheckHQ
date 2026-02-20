"use client"

import { Shield, Home, Moon, Calendar } from "lucide-react"

interface MatchupInfoProps {
  matchup: {
    opponentDefRank: number
    opponentDefLabel: string
    opponentDefStatsAllowed: number
    isHome: boolean
    venue: string
    restDays: number
    isBackToBack: boolean
  }
}

export function MatchupInfo({ matchup }: MatchupInfoProps) {
  const defColor =
    matchup.opponentDefRank >= 21
      ? "text-emerald-400" // weak defense = good for player
      : matchup.opponentDefRank <= 10
        ? "text-red-400"   // strong defense
        : "text-yellow-400" // average

  const defBg =
    matchup.opponentDefRank >= 21
      ? "bg-emerald-500/15"
      : matchup.opponentDefRank <= 10
        ? "bg-red-500/15"
        : "bg-yellow-500/10"

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Matchup Context
      </h4>

      <div className="grid grid-cols-2 gap-2">
        {/* Defense Rank */}
        <div className={`flex items-center gap-2.5 rounded-lg border border-border p-3 ${defBg}`}>
          <Shield className={`h-4 w-4 ${defColor} shrink-0`} />
          <div className="min-w-0">
            <p className={`text-sm font-bold ${defColor} tabular-nums`}>
              #{matchup.opponentDefRank}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {matchup.opponentDefRank >= 21
                ? "Weak defense"
                : matchup.opponentDefRank <= 10
                  ? "Strong defense"
                  : "Average defense"}
            </p>
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2.5 rounded-lg border border-border p-3">
          <Home className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">
              {matchup.isHome ? "Home" : "Away"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {matchup.venue}
            </p>
          </div>
        </div>

        {/* Rest */}
        <div className="flex items-center gap-2.5 rounded-lg border border-border p-3">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground tabular-nums">
              {matchup.restDays}d rest
            </p>
            <p className="text-[10px] text-muted-foreground">
              {matchup.isBackToBack ? "⚠ Back-to-back" : "Normal rest"}
            </p>
          </div>
        </div>

        {/* Stats Allowed */}
        <div className="flex items-center gap-2.5 rounded-lg border border-border p-3">
          <Moon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground tabular-nums">
              {matchup.opponentDefStatsAllowed.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Avg allowed/game
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
