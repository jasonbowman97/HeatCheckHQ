"use client"

import { useState } from "react"
import type { GameLog } from "@/types/shared"

interface GameLogChartProps {
  /** Games in chronological order (oldest first) */
  games: GameLog[]
  stat: string
  line: number
  seasonAverage: number
}

type SampleSize = 5 | 10 | 20 | "all"

export function GameLogChart({ games, stat, line, seasonAverage }: GameLogChartProps) {
  const [sampleSize, setSampleSize] = useState<SampleSize>(10)

  // Slice games by sample size (games are already chronological — oldest first)
  const displayGames =
    sampleSize === "all"
      ? games
      : games.slice(-sampleSize)

  const values = displayGames.map(g => g.stats[stat] ?? 0)
  const count = values.length

  if (count === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
        No game log data available
      </div>
    )
  }

  const maxVal = Math.max(...values, line * 1.3)
  const chartHeight = 140
  const barWidth = 100 / count
  const barGap = Math.min(barWidth * 0.25, 1.5)
  const effectiveBarWidth = barWidth - barGap
  const lineY = chartHeight - (line / maxVal) * chartHeight

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Game Log
        </h4>

        {/* Sample Size Toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/30 p-0.5">
          {([5, 10, 20, "all"] as SampleSize[]).map((size) => {
            // Only show options that have enough games
            if (typeof size === "number" && games.length < size) return null

            return (
              <button
                key={size}
                onClick={() => setSampleSize(size)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  sampleSize === size
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {size === "all" ? "All" : `L${size}`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border bg-card p-3">
        <svg viewBox={`0 0 100 ${chartHeight + 20}`} className="w-full" style={{ height: chartHeight + 20 }}>
          {/* Bars */}
          {values.map((val, i) => {
            const isOver = val > line
            const barH = (val / maxVal) * chartHeight
            const x = i * barWidth + barGap / 2
            const y = chartHeight - barH

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={effectiveBarWidth}
                  height={barH}
                  rx={effectiveBarWidth > 3 ? 1.5 : 0.5}
                  className={isOver ? "fill-emerald-500/80" : "fill-red-500/70"}
                />
                {/* Value label on top (only if enough space) */}
                {count <= 20 && (
                  <text
                    x={x + effectiveBarWidth / 2}
                    y={y - 2}
                    textAnchor="middle"
                    className="fill-foreground font-medium"
                    style={{ fontSize: count <= 10 ? "3.5px" : "2.8px" }}
                  >
                    {val % 1 === 0 ? val : val.toFixed(1)}
                  </text>
                )}
                {/* Opponent label below */}
                {count <= 20 && (
                  <text
                    x={x + effectiveBarWidth / 2}
                    y={chartHeight + 8}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: count <= 10 ? "2.8px" : "2.2px" }}
                  >
                    {displayGames[i]?.opponent || ""}
                  </text>
                )}
                {/* Date below opponent */}
                {count <= 10 && (
                  <text
                    x={x + effectiveBarWidth / 2}
                    y={chartHeight + 14}
                    textAnchor="middle"
                    className="fill-muted-foreground/60"
                    style={{ fontSize: "2px" }}
                  >
                    {displayGames[i]?.date
                      ? new Date(displayGames[i].date).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })
                      : ""}
                  </text>
                )}
              </g>
            )
          })}

          {/* Threshold Line */}
          <line
            x1={0}
            y1={lineY}
            x2={100}
            y2={lineY}
            strokeDasharray="1.5 1.5"
            className="stroke-foreground/40"
            strokeWidth={0.4}
          />

          {/* Line label */}
          <text
            x={1}
            y={lineY - 2}
            className="fill-foreground/60"
            style={{ fontSize: "2.5px" }}
          >
            {line}
          </text>
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-emerald-500/80" /> Over
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-red-500/70" /> Under
          </span>
          <span className="flex items-center gap-1">
            <span className="h-px w-3 border-t border-dashed border-foreground/40" /> Line ({line})
          </span>
          <span className="ml-auto">Avg: {seasonAverage.toFixed(1)}</span>
        </div>
      </div>
    </div>
  )
}
