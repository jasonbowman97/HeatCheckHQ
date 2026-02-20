"use client"

import { useState, useMemo } from "react"
import { ChevronUp, ChevronDown, Flame, Snowflake, ArrowRight } from "lucide-react"
import type { PropSummary } from "@/types/analyzer"
import type { Sport } from "@/types/shared"
import { MiniBarChart } from "./mini-bar-chart"
import { getThresholds } from "@/lib/prop-lines"

interface PropCardProps {
  prop: PropSummary
  sport: Sport
  /** All season values for client-side line recalculation */
  allValues: number[]
  isSelected?: boolean
  onClick?: () => void
}

// Signal dots — visual convergence indicator
function SignalDots({ over, under }: { over: number; under: number }) {
  const total = 7
  const neutral = total - over - under
  return (
    <div className="flex items-center gap-[3px]" title={`${over} over / ${under} under / ${neutral} neutral`}>
      {Array.from({ length: over }).map((_, i) => (
        <span key={`o${i}`} className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      ))}
      {Array.from({ length: neutral }).map((_, i) => (
        <span key={`n${i}`} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
      ))}
      {Array.from({ length: under }).map((_, i) => (
        <span key={`u${i}`} className="h-1.5 w-1.5 rounded-full bg-red-500" />
      ))}
    </div>
  )
}

export function PropCard({
  prop,
  sport,
  allValues,
  isSelected = false,
  onClick,
}: PropCardProps) {
  const thresholds = getThresholds(prop.stat, sport, prop.seasonAvg)
  const [currentLineIdx, setCurrentLineIdx] = useState(() =>
    thresholds.indexOf(prop.line) >= 0 ? thresholds.indexOf(prop.line) : 0
  )
  const [customLine, setCustomLine] = useState<number | null>(null)
  const [isEditingLine, setIsEditingLine] = useState(false)

  const activeLine = customLine ?? thresholds[currentLineIdx] ?? prop.line

  // Recompute hit rates client-side when line changes
  const computed = useMemo(() => {
    const line = activeLine
    const last10 = allValues.slice(0, 10)
    const last5 = allValues.slice(0, 5)

    const hitRateL10 = last10.length > 0
      ? last10.filter(v => v > line).length / last10.length
      : 0
    const hitRateL5 = last5.length > 0
      ? last5.filter(v => v > line).length / last5.length
      : 0
    const hitRateSeason = allValues.length > 0
      ? allValues.filter(v => v > line).length / allValues.length
      : 0

    const overPct = Math.round(hitRateL10 * 100)
    const underPct = 100 - overPct

    return { hitRateL10, hitRateL5, hitRateSeason, overPct, underPct }
  }, [activeLine, allValues])

  const cycleLine = (direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation()
    setCustomLine(null)
    if (direction === "up" && currentLineIdx < thresholds.length - 1) {
      setCurrentLineIdx(currentLineIdx + 1)
    } else if (direction === "down" && currentLineIdx > 0) {
      setCurrentLineIdx(currentLineIdx - 1)
    }
  }

  const handleLineEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingLine(true)
  }

  const handleLineSubmit = (value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0) {
      setCustomLine(num)
    }
    setIsEditingLine(false)
  }

  // Accent bar color
  const accentColor =
    prop.verdict === "over"
      ? "bg-emerald-500"
      : prop.verdict === "under"
        ? "bg-red-500"
        : "bg-yellow-500"

  // Trend badge
  const TrendBadge = () => {
    if (prop.trend === "hot") {
      return (
        <span className="flex items-center gap-0.5 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
          <Flame className="h-3 w-3" /> HOT
        </span>
      )
    }
    if (prop.trend === "cold") {
      return (
        <span className="flex items-center gap-0.5 rounded-md bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
          <Snowflake className="h-3 w-3" /> COLD
        </span>
      )
    }
    return (
      <span className="flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
        <ArrowRight className="h-3 w-3" /> STEADY
      </span>
    )
  }

  // Whether line is above/below season average
  const avgDiff = activeLine - prop.seasonAvg
  const avgLabel = avgDiff > 0 ? "above avg" : avgDiff < 0 ? "below avg" : "at avg"

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col rounded-xl border text-left transition-all duration-200 overflow-hidden ${
        isSelected
          ? "border-primary ring-1 ring-primary bg-card shadow-lg shadow-primary/5"
          : "border-border bg-card hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentColor}`} />

      <div className="p-4 pl-5">
        {/* Header: stat name + trend */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-base font-bold text-foreground">
            {prop.statLabel}
          </span>
          <TrendBadge />
        </div>

        {/* Mini bar chart */}
        <div className="mb-3">
          <MiniBarChart
            values={prop.last10Values}
            line={activeLine}
            height={44}
          />
        </div>

        {/* Line selector + season avg */}
        <div className="flex items-center gap-3 mb-2.5">
          {/* Line pill with up/down arrows */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/50 px-1">
            <button
              onClick={(e) => cycleLine("down", e)}
              disabled={currentLineIdx <= 0 && customLine === null}
              className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronDown className="h-3 w-3" />
            </button>

            {isEditingLine ? (
              <input
                autoFocus
                type="number"
                step="0.5"
                defaultValue={activeLine}
                onBlur={(e) => handleLineSubmit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLineSubmit(e.currentTarget.value)
                  if (e.key === "Escape") setIsEditingLine(false)
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-10 bg-transparent text-center text-xs font-bold text-foreground outline-none tabular-nums"
              />
            ) : (
              <button
                onClick={handleLineEdit}
                className="px-1 text-xs font-bold text-foreground tabular-nums hover:text-primary transition-colors"
              >
                {activeLine}
              </button>
            )}

            <button
              onClick={(e) => cycleLine("up", e)}
              disabled={currentLineIdx >= thresholds.length - 1 && customLine === null}
              className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>

          {/* Season avg context */}
          <span className="text-[10px] text-muted-foreground">
            Avg <span className="font-semibold text-foreground tabular-nums">{prop.seasonAvg.toFixed(1)}</span>
            <span className="ml-1 opacity-70">({avgLabel})</span>
          </span>
        </div>

        {/* Over/Under split bar — thicker */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
            <span className="text-emerald-400">Over {computed.overPct}%</span>
            <span className="text-red-400">Under {computed.underPct}%</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-muted">
            <div
              className="bg-emerald-500 transition-all duration-300 rounded-l-full"
              style={{ width: `${computed.overPct}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-300 rounded-r-full"
              style={{ width: `${computed.underPct}%` }}
            />
          </div>
        </div>

        {/* Quick stats row with signal dots */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>
            L5: <span className={computed.hitRateL5 > 0.6 ? "text-emerald-400 font-semibold" : computed.hitRateL5 < 0.4 ? "text-red-400 font-semibold" : "text-foreground font-semibold"}>
              {Math.round(computed.hitRateL5 * 100)}%
            </span>
          </span>
          <span className="text-border">·</span>
          <span>
            L10: <span className={computed.hitRateL10 > 0.6 ? "text-emerald-400 font-semibold" : computed.hitRateL10 < 0.4 ? "text-red-400 font-semibold" : "text-foreground font-semibold"}>
              {Math.round(computed.hitRateL10 * 100)}%
            </span>
          </span>
          <span className="text-border">·</span>
          <span>
            SZN: <span className="text-foreground font-semibold">
              {Math.round(computed.hitRateSeason * 100)}%
            </span>
          </span>
          <span className="ml-auto">
            <SignalDots over={prop.convergenceOver} under={prop.convergenceUnder} />
          </span>
        </div>
      </div>
    </button>
  )
}
