"use client"

import { useMemo } from "react"
import type { HeatRingGame } from "@/types/check-prop"
import { getHeatRingSegmentColor, getDefenseRingColor } from "@/lib/design-tokens"

interface HeatRingSVGProps {
  games: HeatRingGame[]
  size?: "sm" | "md" | "lg"
  hitRate: number
  hitCount: number
  totalGames: number
  streak: number
}

const SIZES = {
  sm: { width: 120, innerRadius: 30, ringWidth: 12, gap: 2 },
  md: { width: 200, innerRadius: 50, ringWidth: 20, gap: 3 },
  lg: { width: 280, innerRadius: 70, ringWidth: 28, gap: 4 },
}

export function HeatRingSVG({
  games,
  size = "md",
  hitRate,
  hitCount,
  totalGames,
  streak,
}: HeatRingSVGProps) {
  const { width, innerRadius, ringWidth, gap } = SIZES[size]
  const center = width / 2
  const outerRadius = innerRadius + ringWidth
  const defenseRingRadius = outerRadius + gap + 4

  const segments = useMemo(() => {
    if (games.length === 0) return []

    const anglePerGame = (2 * Math.PI) / games.length
    const gapAngle = (gap / outerRadius) // gap in radians

    return games.map((game, i) => {
      const startAngle = i * anglePerGame - Math.PI / 2 + gapAngle / 2
      const endAngle = (i + 1) * anglePerGame - Math.PI / 2 - gapAngle / 2

      // Segment height modulated by margin magnitude
      const magnitude = Math.min(1, Math.abs(game.margin) / 10)
      const segInnerRadius = innerRadius + (1 - magnitude) * ringWidth * 0.3
      const segOuterRadius = outerRadius

      const color = getHeatRingSegmentColor(game.margin)
      const defColor = getDefenseRingColor(game.opponentDefRank)

      return {
        game,
        startAngle,
        endAngle,
        segInnerRadius,
        segOuterRadius,
        color,
        defColor,
      }
    })
  }, [games, innerRadius, outerRadius, ringWidth, gap])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={width}
        height={width}
        viewBox={`0 0 ${width} ${width}`}
        className="drop-shadow-sm"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          className="text-border/30"
        />

        {/* Heat segments */}
        {segments.map((seg, i) => (
          <g key={i}>
            {/* Main heat segment */}
            <path
              d={arcPath(center, center, seg.segInnerRadius, seg.segOuterRadius, seg.startAngle, seg.endAngle)}
              fill={seg.color}
              opacity={0.9}
              className="transition-opacity hover:opacity-100"
            >
              <title>
                {seg.game.date} vs {seg.game.opponent}: {seg.game.actualValue} ({seg.game.margin > 0 ? '+' : ''}{seg.game.margin.toFixed(1)})
              </title>
            </path>

            {/* Defense rank indicator (thin outer ring) */}
            <path
              d={arcPath(center, center, defenseRingRadius - 2, defenseRingRadius + 2, seg.startAngle, seg.endAngle)}
              fill={seg.defColor}
              opacity={0.6}
            />
          </g>
        ))}

        {/* Center text */}
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          className="fill-foreground text-lg font-bold"
          style={{ fontSize: size === 'sm' ? 14 : size === 'md' ? 20 : 26 }}
        >
          {hitCount}/{totalGames}
        </text>
        <text
          x={center}
          y={center + 8}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: size === 'sm' ? 9 : size === 'md' ? 11 : 13 }}
        >
          {Math.round(hitRate * 100)}% hit rate
        </text>
        {streak !== 0 && (
          <text
            x={center}
            y={center + (size === 'sm' ? 20 : size === 'md' ? 26 : 32)}
            textAnchor="middle"
            className={streak > 0 ? "fill-emerald-400" : "fill-red-400"}
            style={{ fontSize: size === 'sm' ? 8 : size === 'md' ? 10 : 12 }}
          >
            {streak > 0 ? `${streak} over streak` : `${Math.abs(streak)} under streak`}
          </text>
        )}
      </svg>
    </div>
  )
}

/**
 * Build SVG arc path for a ring segment
 */
function arcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle)
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle)
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle)
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle)

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ")
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}
