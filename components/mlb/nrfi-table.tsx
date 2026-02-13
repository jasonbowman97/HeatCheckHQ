"use client"

import { Calendar } from "lucide-react"
import type { NrfiGame, NrfiPitcher } from "@/lib/nrfi-data"
import { getStreakColor, getNrfiPctColor } from "@/lib/nrfi-data"

interface NrfiTableProps {
  games: NrfiGame[]
}

function PitcherCard({ pitcher, team, align }: { pitcher: NrfiPitcher | null; team: string; align: "left" | "right" }) {
  if (!pitcher) {
    return (
      <div className={`flex-1 flex flex-col gap-1.5 ${align === "right" ? "items-end text-right" : "items-start"}`}>
        <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
          <span className="text-sm text-muted-foreground italic">TBD</span>
          <span className="text-xs font-semibold text-muted-foreground">{team}</span>
        </div>
      </div>
    )
  }

  const hasStarts = pitcher.nrfiWins + pitcher.nrfiLosses > 0
  const streakAbs = Math.abs(pitcher.streak)
  const showStreakBadge = streakAbs >= 2

  return (
    <div className={`flex-1 flex flex-col gap-1.5 ${align === "right" ? "items-end text-right" : "items-start"}`}>
      {/* Pitcher name + hand + team */}
      <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
        <span className="text-sm font-semibold text-foreground">{pitcher.name}</span>
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          pitcher.hand === "L" ? "bg-amber-500/15 text-amber-400" : "bg-sky-500/15 text-sky-400"
        }`}>
          {pitcher.hand}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{team}</span>
      </div>

      {/* NRFI record + % + streak */}
      {hasStarts ? (
        <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}>
          {/* Record */}
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {pitcher.nrfiWins}-{pitcher.nrfiLosses}
          </span>
          {/* Percentage */}
          <span className={`text-sm font-bold font-mono tabular-nums ${getNrfiPctColor(pitcher.nrfiPct)}`}>
            {pitcher.nrfiPct}%
          </span>
          {/* Streak */}
          {showStreakBadge && (
            <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold font-mono tabular-nums ${getStreakColor(pitcher.streak)}`}>
              {pitcher.streak > 0 ? `+${pitcher.streak}` : pitcher.streak}
            </span>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic">No starts yet</span>
      )}
    </div>
  )
}

export function NrfiTable({ games }: NrfiTableProps) {
  if (games.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-16 text-center flex flex-col items-center gap-3">
        <Calendar className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">No games scheduled</p>
        <p className="text-xs text-muted-foreground">Try navigating to a different date to see NRFI matchups.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-wider">
        <span>NRFI Record (W-L)</span>
        <span>NRFI %</span>
        <span>Streak (+NRFI / -RFI)</span>
      </div>

      {/* Game cards */}
      {games.map((game) => (
        <div
          key={game.gamePk}
          className="rounded-xl border border-border bg-card p-4 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-4">
            {/* Away pitcher */}
            <PitcherCard pitcher={game.away.pitcher} team={game.away.team} align="left" />

            {/* Center: time + vs */}
            <div className="flex flex-col items-center gap-0.5 shrink-0 px-4">
              <span className="text-xs text-muted-foreground font-mono tabular-nums">{game.time}</span>
              <span className="text-lg font-bold text-muted-foreground/40">@</span>
            </div>

            {/* Home pitcher */}
            <PitcherCard pitcher={game.home.pitcher} team={game.home.team} align="right" />
          </div>
        </div>
      ))}
    </div>
  )
}
