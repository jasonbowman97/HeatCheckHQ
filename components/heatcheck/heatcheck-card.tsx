"use client"

import { TrendingUp, TrendingDown, Minus, ArrowRight, Flame, Snowflake } from "lucide-react"
import type { HeatCheckPick } from "@/types/heatcheck"

interface HeatCheckCardProps {
  pick: HeatCheckPick
  onAnalyze?: () => void
}

// Rank badge with color tiers
function RankBadge({ rank }: { rank: number }) {
  const bg =
    rank === 1 ? "bg-amber-500" :
    rank === 2 ? "bg-zinc-400" :
    rank === 3 ? "bg-amber-700" :
    "bg-muted"

  const text = rank <= 3 ? "text-black font-bold" : "text-muted-foreground font-semibold"

  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${bg} ${text} text-xs shrink-0`}>
      {rank}
    </div>
  )
}

// Convergence signal dots
function SignalDots({ over, under }: { over: number; under: number }) {
  const total = 9
  const neutral = Math.max(0, total - over - under)
  return (
    <div className="flex items-center gap-[3px]" title={`${over} over / ${under} under / ${neutral} neutral`}>
      {Array.from({ length: over }).map((_, i) => (
        <span key={`o${i}`} className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      ))}
      {Array.from({ length: neutral }).map((_, i) => (
        <span key={`n${i}`} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
      ))}
      {Array.from({ length: under }).map((_, i) => (
        <span key={`u${i}`} className="h-1.5 w-1.5 rounded-full bg-red-500" />
      ))}
    </div>
  )
}

export function HeatCheckCard({ pick, onAnalyze }: HeatCheckCardProps) {
  const isOver = pick.direction === "over"
  const directionColor = isOver ? "text-emerald-400" : "text-red-400"
  const directionBg = isOver ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
  const edgeSign = isOver ? "+" : ""

  // Team abbreviations
  const isHome = pick.game.homeTeam.id === pick.player.team.id
  const opponent = isHome ? pick.game.awayTeam.abbrev : pick.game.homeTeam.abbrev
  const matchupLabel = isHome ? `vs ${opponent}` : `@ ${opponent}`

  return (
    <div className="relative rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
      {/* Top row: Rank + Player + Team */}
      <div className="flex items-start gap-3">
        <RankBadge rank={pick.rank} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {pick.player.headshotUrl && (
              <img
                src={pick.player.headshotUrl}
                alt=""
                className="h-8 w-8 rounded-full bg-muted object-cover"
              />
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {pick.player.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {pick.player.team.abbrev} {pick.player.position} &middot; {matchupLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Confidence badge */}
        <div className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${directionBg}`}>
          {pick.confidence}%
        </div>
      </div>

      {/* Stat + Line + Projection row */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          <span className="text-xs text-muted-foreground">{pick.statLabel}</span>
          <span className="ml-1.5 text-sm font-medium text-foreground">O/U {pick.line}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Proj:</span>
          <span className={`text-sm font-bold ${directionColor}`}>
            {pick.projection}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className={`text-sm font-bold ${directionColor}`}>
            {edgeSign}{pick.edge}% {pick.direction.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Stats row: Convergence + Hit Rate + Trend */}
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <SignalDots over={pick.convergenceOver} under={pick.convergenceUnder} />

        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">
            L10: <span className={getHitRateClass(pick.hitRateL10)}>
              {Math.round(pick.hitRateL10 * 100)}%
            </span>
          </span>
          <span className="text-muted-foreground">
            Avg: <span className="text-foreground">{pick.seasonAvg}</span>
          </span>
          <TrendBadge trend={pick.trend} />
        </div>
      </div>

      {/* Narrative chips */}
      {pick.narratives.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pick.narratives.map((n, i) => (
            <span
              key={i}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {n}
            </span>
          ))}
        </div>
      )}

      {/* Analyze button */}
      {onAnalyze && (
        <button
          onClick={onAnalyze}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Full Analysis
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

function TrendBadge({ trend }: { trend: "hot" | "cold" | "steady" }) {
  if (trend === "hot") {
    return (
      <span className="inline-flex items-center gap-0.5 text-amber-400">
        <Flame className="h-3 w-3" />
        <span className="text-[10px] font-semibold">HOT</span>
      </span>
    )
  }
  if (trend === "cold") {
    return (
      <span className="inline-flex items-center gap-0.5 text-sky-400">
        <Snowflake className="h-3 w-3" />
        <span className="text-[10px] font-semibold">COLD</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground">
      <Minus className="h-3 w-3" />
      <span className="text-[10px] font-semibold">STEADY</span>
    </span>
  )
}

function getHitRateClass(rate: number): string {
  if (rate >= 0.7) return "text-emerald-400 font-semibold"
  if (rate >= 0.5) return "text-yellow-400 font-semibold"
  return "text-red-400 font-semibold"
}
