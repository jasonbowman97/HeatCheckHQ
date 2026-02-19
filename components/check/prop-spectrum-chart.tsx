"use client"

import { useMemo } from "react"
import type { PropCheckResult } from "@/types/check-prop"

interface PropSpectrumChartProps {
  spectrum: PropCheckResult["spectrum"]
  line: number
  statLabel: string
}

const CHART_WIDTH = 500
const CHART_HEIGHT = 200
const PADDING = { top: 20, right: 20, bottom: 40, left: 40 }
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom

export function PropSpectrumChart({ spectrum, line, statLabel }: PropSpectrumChartProps) {
  const { distribution, overPct, underPct, volatility, volatilityScore } = spectrum

  const { pathData, xScale, yMax, lineX } = useMemo(() => {
    if (distribution.kde.length === 0) {
      return { pathData: "", xScale: (x: number) => 0, yMax: 1, lineX: 0 }
    }

    const xMin = distribution.kde[0].x
    const xMax = distribution.kde[distribution.kde.length - 1].x
    const yMax = Math.max(...distribution.kde.map(p => p.y))

    const xScale = (x: number) =>
      PADDING.left + ((x - xMin) / (xMax - xMin)) * PLOT_WIDTH
    const yScale = (y: number) =>
      PADDING.top + PLOT_HEIGHT - (y / yMax) * PLOT_HEIGHT

    const points = distribution.kde.map(p => `${xScale(p.x)},${yScale(p.y)}`)
    const pathData = `M ${points.join(" L ")}`

    const lineX = xScale(line)

    return { pathData, xScale, yMax, lineX }
  }, [distribution, line])

  if (distribution.kde.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-center h-48">
        <p className="text-sm text-muted-foreground">Insufficient data for distribution chart</p>
      </div>
    )
  }

  // Fill paths for over/under areas
  const xMin = distribution.kde[0].x
  const xMax = distribution.kde[distribution.kde.length - 1].x
  const yScale = (y: number) =>
    PADDING.top + PLOT_HEIGHT - (y / yMax) * PLOT_HEIGHT

  // Over area (right of line)
  const overPoints = distribution.kde.filter(p => p.x >= line)
  const overPath = overPoints.length > 1
    ? `M ${xScale(line)},${PADDING.top + PLOT_HEIGHT} ` +
      overPoints.map(p => `L ${xScale(p.x)},${yScale(p.y)}`).join(" ") +
      ` L ${xScale(overPoints[overPoints.length - 1].x)},${PADDING.top + PLOT_HEIGHT} Z`
    : ""

  // Under area (left of line)
  const underPoints = distribution.kde.filter(p => p.x <= line)
  const underPath = underPoints.length > 1
    ? `M ${xScale(underPoints[0].x)},${PADDING.top + PLOT_HEIGHT} ` +
      underPoints.map(p => `L ${xScale(p.x)},${yScale(p.y)}`).join(" ") +
      ` L ${xScale(line)},${PADDING.top + PLOT_HEIGHT} Z`
    : ""

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Prop Spectrum
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-400 font-mono">{Math.round(overPct * 100)}% over</span>
          <span className="text-red-400 font-mono">{Math.round(underPct * 100)}% under</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            volatility === 'low' ? 'bg-emerald-500/15 text-emerald-400' :
            volatility === 'medium' ? 'bg-yellow-500/15 text-yellow-400' :
            'bg-red-500/15 text-red-400'
          }`}>
            {volatility} vol
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Under area fill */}
        {underPath && (
          <path d={underPath} fill="rgba(239, 68, 68, 0.15)" />
        )}

        {/* Over area fill */}
        {overPath && (
          <path d={overPath} fill="rgba(34, 197, 94, 0.15)" />
        )}

        {/* KDE curve */}
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-foreground/70"
        />

        {/* Line marker */}
        <line
          x1={lineX}
          y1={PADDING.top}
          x2={lineX}
          y2={PADDING.top + PLOT_HEIGHT}
          stroke="currentColor"
          strokeWidth={2}
          strokeDasharray="4,4"
          className="text-foreground"
        />
        <text
          x={lineX}
          y={PADDING.top - 6}
          textAnchor="middle"
          className="fill-foreground text-[10px] font-bold"
        >
          Line: {line}
        </text>

        {/* Mean marker */}
        <line
          x1={xScale(distribution.mean)}
          y1={PADDING.top + PLOT_HEIGHT - 4}
          x2={xScale(distribution.mean)}
          y2={PADDING.top + PLOT_HEIGHT + 4}
          stroke="currentColor"
          strokeWidth={2}
          className="text-blue-400"
        />
        <text
          x={xScale(distribution.mean)}
          y={PADDING.top + PLOT_HEIGHT + 16}
          textAnchor="middle"
          className="fill-blue-400 text-[9px]"
        >
          avg {distribution.mean.toFixed(1)}
        </text>

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

        {/* X-axis label */}
        <text
          x={PADDING.left + PLOT_WIDTH / 2}
          y={CHART_HEIGHT - 4}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          {statLabel}
        </text>
      </svg>

      {/* Stats Row */}
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <MiniStat label="Mean" value={distribution.mean.toFixed(1)} />
        <MiniStat label="Median" value={distribution.median.toFixed(1)} />
        <MiniStat label="Std Dev" value={distribution.stdDev.toFixed(1)} />
        <MiniStat label="Range" value={`${distribution.min}-${distribution.max}`} />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-mono font-medium text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  )
}
