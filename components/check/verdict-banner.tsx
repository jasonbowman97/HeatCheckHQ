"use client"

import type { PropCheckResult } from "@/types/check-prop"

interface VerdictBannerProps {
  verdict: PropCheckResult["verdict"]
  statLabel: string
  line: number
  playerName: string
}

export function VerdictBanner({ verdict, statLabel, line, playerName }: VerdictBannerProps) {
  const bgGradient = verdict.direction === 'over'
    ? 'from-emerald-950/60 to-emerald-900/30 border-emerald-700/40'
    : verdict.direction === 'under'
    ? 'from-red-950/60 to-red-900/30 border-red-700/40'
    : 'from-yellow-950/60 to-yellow-900/30 border-yellow-700/40'

  return (
    <div className={`rounded-xl border bg-gradient-to-r p-4 sm:p-6 ${bgGradient}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Verdict */}
        <div className="flex items-center gap-4">
          <span className="text-3xl sm:text-4xl">{verdict.icon}</span>
          <div>
            <h3
              className="text-lg sm:text-xl font-bold tracking-tight"
              style={{ color: verdict.color }}
            >
              {verdict.label}
            </h3>
            <p className="text-sm text-muted-foreground">{verdict.sublabel}</p>
          </div>
        </div>

        {/* Right: Key Stats */}
        <div className="flex items-center gap-6">
          <VerdictStat
            label="Convergence"
            value={`${verdict.convergenceScore}/9`}
            color={verdict.color}
          />
          <VerdictStat
            label="Confidence"
            value={`${verdict.confidence}%`}
            color={verdict.color}
          />
          <VerdictStat
            label="L10 Hit Rate"
            value={`${Math.round(verdict.hitRateL10 * 100)}%`}
          />
          <VerdictStat
            label="Season Avg"
            value={verdict.seasonAvg.toFixed(1)}
          />
        </div>
      </div>

      {/* Prop Summary Line */}
      <p className="mt-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{playerName}</span>
        {" "}
        <span className="font-mono">{statLabel} {verdict.direction === 'over' ? 'Over' : verdict.direction === 'under' ? 'Under' : ''} {line}</span>
        {" "}
        · Avg margin: <span className="font-mono">{verdict.avgMarginL10 > 0 ? '+' : ''}{verdict.avgMarginL10.toFixed(1)}</span>
      </p>
    </div>
  )
}

function VerdictStat({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="text-center">
      <p
        className="text-lg sm:text-xl font-bold font-mono"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  )
}
