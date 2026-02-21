"use client"

import { ArrowRight, ArrowUpRight, ArrowDownRight, Flame, Snowflake, Minus, Shield } from "lucide-react"
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

// Lean badge
function LeanBadge({ lean, confidence }: { lean: "over" | "under" | "neutral"; confidence: number }) {
  if (lean === "over") {
    return (
      <div className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5">
        <ArrowUpRight className="h-3 w-3 text-emerald-400" />
        <span className="text-xs font-bold text-emerald-400">{confidence}%</span>
      </div>
    )
  }
  if (lean === "under") {
    return (
      <div className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5">
        <ArrowDownRight className="h-3 w-3 text-red-400" />
        <span className="text-xs font-bold text-red-400">{confidence}%</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
      <Minus className="h-3 w-3 text-muted-foreground" />
      <span className="text-xs font-bold text-muted-foreground">{confidence}%</span>
    </div>
  )
}

export function HeatCheckCard({ pick, onAnalyze }: HeatCheckCardProps) {
  // Team abbreviations
  const isHome = pick.game.homeTeam.id === pick.player.team.id
  const opponent = isHome ? pick.game.awayTeam.abbrev : pick.game.homeTeam.abbrev
  const matchupLabel = isHome ? `vs ${opponent}` : `@ ${opponent}`

  // Projection vs season avg delta
  const projDelta = pick.projection - pick.seasonAvg
  const projDeltaSign = projDelta >= 0 ? "+" : ""
  const projDeltaColor = projDelta > 0 ? "text-emerald-400" : projDelta < 0 ? "text-red-400" : "text-muted-foreground"

  // Defense rank label
  const defLabel =
    pick.defenseRank <= 5 ? "Elite DEF" :
    pick.defenseRank <= 10 ? "Good DEF" :
    pick.defenseRank >= 26 ? "Weak DEF" :
    pick.defenseRank >= 21 ? "Poor DEF" :
    "Avg DEF"
  const defColor =
    pick.defenseRank >= 26 ? "text-emerald-400" :
    pick.defenseRank >= 21 ? "text-emerald-400/70" :
    pick.defenseRank <= 5 ? "text-red-400" :
    pick.defenseRank <= 10 ? "text-red-400/70" :
    "text-muted-foreground"

  return (
    <div className="relative rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
      {/* Top row: Rank + Player + Confidence */}
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

        <LeanBadge lean={pick.convergenceLean} confidence={pick.confidence} />
      </div>

      {/* Projection row */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          <span className="text-xs text-muted-foreground">{pick.statLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">{pick.projection}</span>
          <span className={`text-xs font-semibold ${projDeltaColor}`}>
            {projDeltaSign}{projDelta.toFixed(1)} vs avg
          </span>
        </div>
      </div>

      {/* Data row: Season Avg + L5 + EWMA + Matchup */}
      <div className="mt-2 grid grid-cols-4 gap-1 text-center">
        <div className="rounded-md bg-muted/50 px-1 py-1">
          <div className="text-[10px] text-muted-foreground">Season</div>
          <div className="text-xs font-semibold text-foreground">{pick.seasonAvg}</div>
        </div>
        <div className="rounded-md bg-muted/50 px-1 py-1">
          <div className="text-[10px] text-muted-foreground">L5 Avg</div>
          <div className="text-xs font-semibold text-foreground">{pick.last5Avg}</div>
        </div>
        <div className="rounded-md bg-muted/50 px-1 py-1">
          <div className="text-[10px] text-muted-foreground">EWMA</div>
          <div className="text-xs font-semibold text-foreground">{pick.ewmaRecent}</div>
        </div>
        <div className="rounded-md bg-muted/50 px-1 py-1">
          <div className="text-[10px] text-muted-foreground">Opp DEF</div>
          <div className={`text-xs font-semibold ${defColor}`}>#{pick.defenseRank}</div>
        </div>
      </div>

      {/* Bottom row: Convergence + Trend */}
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <SignalDots over={pick.convergenceOver} under={pick.convergenceUnder} />

        <div className="flex items-center gap-2 text-xs">
          <span className={`flex items-center gap-0.5 ${defColor}`}>
            <Shield className="h-3 w-3" />
            {defLabel}
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
