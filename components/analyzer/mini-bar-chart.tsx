"use client"

interface MiniBarChartProps {
  /** Game values (newest first — component will reverse for chronological display) */
  values: number[]
  /** The prop line threshold */
  line: number
  /** Height of the chart in pixels */
  height?: number
  /** Whether to show value labels on top of bars */
  showLabels?: boolean
}

export function MiniBarChart({
  values,
  line,
  height = 48,
  showLabels = false,
}: MiniBarChartProps) {
  // Display chronologically (oldest first)
  const chronological = [...values].reverse()
  const count = chronological.length

  if (count === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height }}>
        No data
      </div>
    )
  }

  const maxVal = Math.max(...chronological, line * 1.2)
  const barWidth = 100 / count
  const barGap = barWidth * 0.2
  const effectiveBarWidth = barWidth - barGap
  const lineY = height - (line / maxVal) * height
  const labelOffset = showLabels ? 12 : 0
  const totalHeight = height + labelOffset

  return (
    <svg
      viewBox={`0 0 100 ${totalHeight}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: totalHeight }}
    >
      {/* Bars */}
      {chronological.map((val, i) => {
        const isOver = val > line
        const barH = (val / maxVal) * height
        const x = i * barWidth + barGap / 2
        const y = height - barH + labelOffset

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={effectiveBarWidth}
              height={barH}
              rx={1}
              className={isOver ? "fill-emerald-500/80" : "fill-red-500/70"}
            />
            {showLabels && (
              <text
                x={x + effectiveBarWidth / 2}
                y={y - 2}
                textAnchor="middle"
                className="fill-muted-foreground text-[3px]"
              >
                {val % 1 === 0 ? val : val.toFixed(1)}
              </text>
            )}
          </g>
        )
      })}

      {/* Threshold Line */}
      <line
        x1={0}
        y1={lineY + labelOffset}
        x2={100}
        y2={lineY + labelOffset}
        strokeDasharray="2 2"
        className="stroke-muted-foreground/50"
        strokeWidth={0.5}
      />
    </svg>
  )
}
