"use client"

import type { ConvergenceFactor } from "@/types/check-prop"

interface ConvergenceBreakdownProps {
  factors: ConvergenceFactor[]
  overCount: number
  underCount: number
  neutralCount: number
}

export function ConvergenceBreakdown({
  factors,
  overCount,
  underCount,
  neutralCount,
}: ConvergenceBreakdownProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Convergence Breakdown
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {overCount} Over
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {underCount} Under
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            {neutralCount} Neutral
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {factors.map((factor) => (
          <FactorRow key={factor.key} factor={factor} />
        ))}
      </div>
    </div>
  )
}

function FactorRow({ factor }: { factor: ConvergenceFactor }) {
  const signalColor =
    factor.signal === "over"
      ? "text-emerald-400"
      : factor.signal === "under"
      ? "text-red-400"
      : "text-gray-400"

  const barColor =
    factor.signal === "over"
      ? "bg-emerald-500"
      : factor.signal === "under"
      ? "bg-red-500"
      : "bg-gray-500"

  return (
    <div className="flex items-center gap-3">
      {/* Icon */}
      <span className="text-lg w-7 text-center shrink-0">{factor.icon}</span>

      {/* Name + Detail */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{factor.name}</span>
          <span className={`text-xs font-bold uppercase ${signalColor}`}>
            {factor.signal}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{factor.detail}</p>
      </div>

      {/* Strength Bar */}
      <div className="w-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${barColor} transition-all`}
              style={{ width: `${Math.round(factor.strength * 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">
            {Math.round(factor.strength * 100)}
          </span>
        </div>
      </div>

      {/* Data Point */}
      <span className="text-xs font-mono text-muted-foreground w-20 text-right shrink-0 hidden sm:block">
        {factor.dataPoint}
      </span>
    </div>
  )
}
