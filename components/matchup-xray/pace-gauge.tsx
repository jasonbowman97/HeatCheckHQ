// ============================================================
// components/matchup-xray/pace-gauge.tsx — Pace projection gauge
// ============================================================
// Visualizes projected game pace relative to league average
// with total projection comparison.

"use client"

import { Gauge, ArrowUp, ArrowDown, Minus } from "lucide-react"
import type { PaceProjection } from "@/types/innovation-playbook"

interface PaceGaugeProps {
  projection: PaceProjection
}

export function PaceGauge({ projection }: PaceGaugeProps) {
  const paceDeviation = projection.projectedPace - projection.leagueAvgPace
  const pacePercent = Math.min(100, Math.max(0, ((projection.projectedPace - 90) / 20) * 100))

  const paceIcon = projection.paceImpact === 'fast' ? (
    <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />
  ) : projection.paceImpact === 'slow' ? (
    <ArrowDown className="h-3.5 w-3.5 text-red-400" />
  ) : (
    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  )

  const paceColor = projection.paceImpact === 'fast' ? 'text-emerald-400' :
    projection.paceImpact === 'slow' ? 'text-red-400' : 'text-foreground'

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-muted/30">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-primary" />
          Pace Projection
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Pace gauge */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase">Slow</span>
            <span className={`text-xs font-bold ${paceColor} flex items-center gap-0.5`}>
              {paceIcon}
              {projection.projectedPace} possessions
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">Fast</span>
          </div>

          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            {/* League average marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-foreground/30 z-10"
              style={{ left: `${((projection.leagueAvgPace - 90) / 20) * 100}%` }}
            />
            {/* Projected pace fill */}
            <div
              className={`h-full rounded-full transition-all ${
                projection.paceImpact === 'fast' ? 'bg-emerald-500' :
                projection.paceImpact === 'slow' ? 'bg-red-500' :
                'bg-primary'
              }`}
              style={{ width: `${pacePercent}%` }}
            />
          </div>

          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground/60">90</span>
            <span className="text-[10px] text-muted-foreground/60">
              Avg: {projection.leagueAvgPace}
            </span>
            <span className="text-[10px] text-muted-foreground/60">110</span>
          </div>
        </div>

        {/* Deviation label */}
        <div className="text-center">
          <span className={`text-xs font-semibold ${paceColor}`}>
            {paceDeviation > 0 ? '+' : ''}{paceDeviation.toFixed(1)} vs league average
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {projection.paceImpact === 'fast' ? 'Expect more possessions — boosts counting stats' :
             projection.paceImpact === 'slow' ? 'Fewer possessions — may suppress stats' :
             'Average pace — neutral impact on props'}
          </p>
        </div>

        {/* Total comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Projected Total</p>
            <p className="text-lg font-bold text-foreground">{projection.projectedTotal}</p>
          </div>
          {projection.vegasTotal && (
            <div className="rounded-lg border border-border p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Vegas Total</p>
              <p className="text-lg font-bold text-primary">{projection.vegasTotal}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
