"use client"

import { useMemo } from "react"
import type { GameLog } from "@/types/shared"

interface GameLogTimelineProps {
  games: GameLog[] // chronological order (oldest first)
  movingAverage: number[]
  seasonAverage: number
  stat: string
  statLabel: string
  line: number
}

const CHART_WIDTH = 600
const CHART_HEIGHT = 180
const PADDING = { top: 16, right: 16, bottom: 32, left: 40 }
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom
const BAR_GAP = 2

export function GameLogTimeline({
  games,
  movingAverage,
  seasonAverage,
  stat,
  statLabel,
  line,
}: GameLogTimelineProps) {
  const { bars, maPath, maxValue, yScale } = useMemo(() => {
    if (games.length === 0) {
      return { bars: [], maPath: "", maxValue: 0, yScale: () => 0 }
    }

    const values = games.map(g => g.stats[stat] ?? 0)
    const maxValue = Math.max(...values, line, seasonAverage) * 1.15

    const barWidth = Math.max(4, (PLOT_WIDTH - BAR_GAP * (games.length - 1)) / games.length)

    const xScale = (i: number) => PADDING.left + i * (barWidth + BAR_GAP) + barWidth / 2
    const yScale = (v: number) => PADDING.top + PLOT_HEIGHT - (v / maxValue) * PLOT_HEIGHT

    const bars = games.map((game, i) => {
      const value = game.stats[stat] ?? 0
      const isHit = value > line
      const barHeight = (value / maxValue) * PLOT_HEIGHT

      return {
        x: PADDING.left + i * (barWidth + BAR_GAP),
        y: PADDING.top + PLOT_HEIGHT - barHeight,
        width: barWidth,
        height: barHeight,
        value,
        isHit,
        game,
      }
    })

    // Moving average line
    const maPoints = movingAverage.map((v, i) => `${xScale(i)},${yScale(v)}`)
    const maPath = maPoints.length > 1 ? `M ${maPoints.join(" L ")}` : ""

    return { bars, maPath, maxValue, yScale }
  }, [games, movingAverage, stat, line, seasonAverage])

  if (games.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-center h-48">
        <p className="text-sm text-muted-foreground">No game log data available</p>
      </div>
    )
  }

  const lineY = yScale(line)
  const avgY = yScale(seasonAverage)

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Game Log
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 bg-foreground/50 inline-block" style={{ borderTop: "2px dashed" }} />
            Line ({line})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 bg-blue-400 inline-block" />
            5-game MA
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 bg-muted-foreground/40 inline-block" />
            Season avg
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Season average line */}
        <line
          x1={PADDING.left}
          y1={avgY}
          x2={PADDING.left + PLOT_WIDTH}
          y2={avgY}
          stroke="currentColor"
          strokeWidth={1}
          strokeOpacity={0.2}
          className="text-muted-foreground"
        />

        {/* Prop line */}
        <line
          x1={PADDING.left}
          y1={lineY}
          x2={PADDING.left + PLOT_WIDTH}
          y2={lineY}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="6,4"
          className="text-foreground/50"
        />

        {/* Bars */}
        {bars.map((bar, i) => (
          <g key={i}>
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={Math.max(1, bar.height)}
              rx={2}
              fill={bar.isHit ? "rgba(34, 197, 94, 0.7)" : "rgba(239, 68, 68, 0.5)"}
              className="transition-opacity hover:opacity-100"
              opacity={0.85}
            >
              <title>
                {bar.game.date} vs {bar.game.opponent}: {bar.value} {statLabel}
                {bar.game.markers.length > 0 ? ` [${bar.game.markers.map(m => m.label).join(", ")}]` : ""}
              </title>
            </rect>

            {/* Marker dots for special games */}
            {bar.game.markers.length > 0 && (
              <circle
                cx={bar.x + bar.width / 2}
                cy={bar.y - 6}
                r={3}
                fill="rgba(250, 204, 21, 0.8)"
              />
            )}
          </g>
        ))}

        {/* Moving average line */}
        {maPath && (
          <path
            d={maPath}
            fill="none"
            stroke="rgba(96, 165, 250, 0.8)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        )}

        {/* X-axis */}
        <line
          x1={PADDING.left}
          y1={PADDING.top + PLOT_HEIGHT}
          x2={PADDING.left + PLOT_WIDTH}
          y2={PADDING.top + PLOT_HEIGHT}
          stroke="currentColor"
          strokeWidth={1}
          className="text-border"
        />

        {/* Y-axis label for line */}
        <text
          x={PADDING.left - 4}
          y={lineY + 3}
          textAnchor="end"
          className="fill-muted-foreground text-[9px] font-mono"
        >
          {line}
        </text>
      </svg>

      {/* Scrollable game details below chart */}
      <div className="mt-3 flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
        {games.map((game, i) => {
          const value = game.stats[stat] ?? 0
          const isHit = value > line
          return (
            <div
              key={game.gameId}
              className={`shrink-0 rounded-md px-2 py-1 text-center text-[10px] border ${
                isHit ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
              }`}
              style={{ minWidth: 44 }}
            >
              <p className="font-mono font-bold text-foreground">{value}</p>
              <p className="text-muted-foreground">{game.opponent}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
