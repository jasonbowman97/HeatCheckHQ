"use client"

import type { ConvergenceFactor } from "@/types/check-prop"

interface SignalBarsProps {
  factors: ConvergenceFactor[]
}

export function SignalBars({ factors }: SignalBarsProps) {
  const overCount = factors.filter(f => f.signal === "over").length
  const underCount = factors.filter(f => f.signal === "under").length
  const dominantDir = overCount >= underCount ? "over" : "under"
  const dominantCount = Math.max(overCount, underCount)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Convergence Signals
        </h4>
        <span className="text-[10px] font-medium text-muted-foreground">
          {dominantCount}/7 lean{" "}
          <span className={dominantDir === "over" ? "text-emerald-400" : "text-red-400"}>
            {dominantDir}
          </span>
        </span>
      </div>

      <div className="space-y-1.5">
        {factors.map((factor) => (
          <div key={factor.key} className="flex items-center gap-2">
            {/* Signal dot */}
            <div
              className={`h-2 w-2 rounded-full shrink-0 ${
                factor.signal === "over"
                  ? "bg-emerald-500"
                  : factor.signal === "under"
                    ? "bg-red-500"
                    : "bg-muted-foreground/40"
              }`}
            />

            {/* Factor name */}
            <span className="text-xs text-foreground w-28 shrink-0 truncate">
              {factor.name}
            </span>

            {/* Signal label */}
            <span
              className={`text-[10px] font-semibold uppercase w-12 shrink-0 ${
                factor.signal === "over"
                  ? "text-emerald-400"
                  : factor.signal === "under"
                    ? "text-red-400"
                    : "text-muted-foreground"
              }`}
            >
              {factor.signal === "neutral" ? "—" : factor.signal.toUpperCase()}
            </span>

            {/* Strength bar */}
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  factor.signal === "over"
                    ? "bg-emerald-500/70"
                    : factor.signal === "under"
                      ? "bg-red-500/70"
                      : "bg-muted-foreground/30"
                }`}
                style={{ width: `${Math.round(factor.strength * 100)}%` }}
              />
            </div>

            {/* Strength % */}
            <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
              {Math.round(factor.strength * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
