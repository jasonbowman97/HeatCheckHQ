// ============================================================
// components/check/similar-situations.tsx — Pro-only similar games card
// ============================================================

"use client"

import type { PropCheckResult } from "@/types/check-prop"

interface SimilarSituationsProps {
  data: NonNullable<PropCheckResult["similarSituations"]>
  statLabel: string
  line: number
}

export function SimilarSituations({ data, statLabel, line }: SimilarSituationsProps) {
  const marginColor = data.avgMargin > 0 ? "text-emerald-400" : data.avgMargin < 0 ? "text-red-400" : "text-muted-foreground"
  const hitColor = data.hitRate >= 0.6 ? "text-emerald-400" : data.hitRate <= 0.4 ? "text-red-400" : "text-yellow-400"

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Similar Situations
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          Pro
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4">{data.description}</p>

      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-lg font-bold font-mono text-foreground">{data.matchingGames}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Games</p>
        </div>
        <div>
          <p className="text-lg font-bold font-mono text-foreground">{data.avgValue.toFixed(1)}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg {statLabel}</p>
        </div>
        <div>
          <p className={`text-lg font-bold font-mono ${hitColor}`}>
            {Math.round(data.hitRate * 100)}%
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hit Rate</p>
        </div>
        <div>
          <p className={`text-lg font-bold font-mono ${marginColor}`}>
            {data.avgMargin > 0 ? "+" : ""}{data.avgMargin.toFixed(1)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Margin</p>
        </div>
      </div>

      {/* Mini insight line */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          In {data.matchingGames} similar games, {statLabel.toLowerCase()} averaged{" "}
          <span className="font-mono font-medium text-foreground">{data.avgValue.toFixed(1)}</span>
          {" "}vs tonight&apos;s line of{" "}
          <span className="font-mono font-medium text-foreground">{line}</span>
        </p>
      </div>
    </div>
  )
}
