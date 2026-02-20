"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Flame, Snowflake, ArrowRight, ChevronRight } from "lucide-react"
import type { PropSummary } from "@/types/analyzer"
import type { Player, Game, Sport } from "@/types/shared"
import { STAT_CATEGORIES, CORE_STATS } from "@/lib/prop-lines"
import { getStatLabel, getHitRateColor, getConfidenceColor } from "@/lib/design-tokens"

type SampleSize = 5 | 10

interface RecentPerformanceProps {
  /** Player info for the header section */
  player: Player
  nextGame: Game | null
  /** All analyzed props */
  props: PropSummary[]
  sport: Sport
  seasonAverages: Record<string, number>
  gamesPlayed: number
  /** Called when user clicks "See Full Analysis" → opens the detail panel */
  onSelectProp: (stat: string) => void
}

// ──── Trend Badge ────

function TrendBadge({ trend }: { trend: "hot" | "cold" | "steady" }) {
  if (trend === "hot") {
    return (
      <span className="flex items-center gap-0.5 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
        <Flame className="h-3 w-3" /> HOT
      </span>
    )
  }
  if (trend === "cold") {
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

// ──── Verdict Pill ────

function VerdictPill({ verdict, confidence }: { verdict: string; confidence: number }) {
  const isOver = verdict === "over"
  const isUnder = verdict === "under"
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        isOver
          ? "bg-emerald-500/15 text-emerald-400"
          : isUnder
            ? "bg-red-500/15 text-red-400"
            : "bg-yellow-500/10 text-yellow-400"
      }`}
    >
      <span className={getConfidenceColor(confidence)}>{confidence}%</span>
      {verdict.toUpperCase()}
    </span>
  )
}

// ──── Main Component ────

export function RecentPerformance({
  player,
  nextGame,
  props,
  sport,
  seasonAverages,
  gamesPlayed,
  onSelectProp,
}: RecentPerformanceProps) {
  const categories = STAT_CATEGORIES[sport] || []
  const tabsRef = useRef<HTMLDivElement>(null)

  // Default to highest confidence prop
  const defaultStat = useMemo(
    () => [...props].sort((a, b) => b.confidence - a.confidence)[0]?.stat ?? props[0]?.stat,
    [props]
  )

  const [selectedStat, setSelectedStat] = useState<string>(defaultStat)
  const [sampleSize, setSampleSize] = useState<SampleSize>(5)

  // Reset selection when props change (new player)
  useEffect(() => {
    setSelectedStat(defaultStat)
    setSampleSize(5)
  }, [defaultStat])

  const activeProp = useMemo(
    () => props.find((p) => p.stat === selectedStat) ?? props[0],
    [props, selectedStat]
  )

  if (!activeProp || props.length === 0) return null

  // ── Player header helpers ──
  const isHome = nextGame ? nextGame.homeTeam.id === player.team.id : false
  const opponent = nextGame
    ? (isHome ? nextGame.awayTeam : nextGame.homeTeam)
    : null

  const gameTime = nextGame?.startTime
    ? new Date(nextGame.startTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : null

  // Season averages to display
  const coreStats = CORE_STATS[sport] || []
  const displayStats = [...coreStats]
  if (sport === "nba" && !displayStats.includes("minutes")) {
    displayStats.push("minutes")
  }

  // ── Chart data (chronological — oldest first) ──
  const sliced = activeProp.last10Values.slice(0, sampleSize)
  const values = [...sliced].reverse()
  const opponents = [...activeProp.last10Opponents.slice(0, sampleSize)].reverse()
  const dates = [...activeProp.last10Dates.slice(0, sampleSize)].reverse()
  const count = values.length

  // ── Chart dimensions ──
  const chartHeight = 180
  const labelArea = 32
  const topPad = 16
  const maxVal = Math.max(...values, activeProp.line * 1.25, activeProp.seasonAvg * 1.1)

  const barWidth = 100 / count
  const barGap = Math.min(barWidth * 0.2, 3)
  const effectiveBarWidth = barWidth - barGap

  const lineY = topPad + chartHeight - (activeProp.line / maxVal) * chartHeight
  const avgY = topPad + chartHeight - (activeProp.seasonAvg / maxVal) * chartHeight

  // ── Group props by category for tab rendering ──
  const orderedProps = useMemo(() => {
    const ordered: Array<{ prop: PropSummary; category: string }> = []
    for (const cat of categories) {
      for (const stat of cat.stats) {
        const p = props.find((pr) => pr.stat === stat)
        if (p) ordered.push({ prop: p, category: cat.label })
      }
    }
    for (const p of props) {
      if (!ordered.some((o) => o.prop.stat === p.stat)) {
        ordered.push({ prop: p, category: "Other" })
      }
    }
    return ordered
  }, [props, categories])

  // Scroll active tab into view
  useEffect(() => {
    if (tabsRef.current) {
      const activeTab = tabsRef.current.querySelector('[data-active="true"]')
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
      }
    }
  }, [selectedStat])

  // Hit rates for context row
  const l5Pct = Math.round(activeProp.hitRateL5 * 100)
  const l10Pct = Math.round(activeProp.hitRateL10 * 100)
  const sznPct = Math.round(activeProp.hitRateSeason * 100)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* ═══════ PLAYER HEADER ═══════ */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Player Photo */}
          {player.headshotUrl ? (
            <img
              src={player.headshotUrl}
              alt={player.name}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground border-2 border-border">
              {player.name.charAt(0)}
            </div>
          )}

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
              {player.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
              {player.team.logo && (
                <img src={player.team.logo} alt={player.team.abbrev} className="h-4 w-4" />
              )}
              <span className="font-medium">{player.team.abbrev}</span>
              <span>·</span>
              <span>{player.position}</span>
              <span>·</span>
              <span>{gamesPlayed} GP</span>
            </div>

            {/* Next Game Info */}
            {nextGame && opponent && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-foreground">
                  {isHome ? "vs" : "@"} {opponent.abbrev}
                </span>
                {gameTime && <span>· {gameTime}</span>}
                {nextGame.venue && <span className="hidden sm:inline">· {nextGame.venue}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Season Averages Bar */}
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1">
          {displayStats.map((stat) => {
            const avg = seasonAverages[stat]
            if (avg === undefined || avg === 0) return null
            return (
              <div
                key={stat}
                className="flex flex-col items-center rounded-lg bg-secondary/50 px-2 py-2"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {getStatLabel(stat, sport).replace(/^(\w+).*/, "$1").slice(0, 6)}
                </span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {avg % 1 === 0 ? avg.toFixed(0) : avg.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════ DIVIDER ═══════ */}
      <div className="border-t border-border" />

      {/* ═══════ RECENT PERFORMANCE ═══════ */}

      {/* Section Header + L5/L10 Toggle */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-2">
        <h3 className="text-sm font-bold text-foreground">Recent Performance</h3>
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/30 p-0.5">
          {([5, 10] as SampleSize[]).map((size) => (
            <button
              key={size}
              onClick={() => setSampleSize(size)}
              className={`rounded-md px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                sampleSize === size
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              L{size}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Tabs */}
      <div
        ref={tabsRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-4 sm:px-5 pb-3"
      >
        {orderedProps.map(({ prop: p }, i) => {
          const isActive = p.stat === selectedStat
          const prevCategory = i > 0 ? orderedProps[i - 1].category : null
          const currentCategory = orderedProps[i].category
          const showSep = i > 0 && currentCategory !== prevCategory

          return (
            <div key={p.stat} className="flex items-center gap-1 shrink-0">
              {showSep && (
                <div className="h-4 w-px bg-border mx-0.5" />
              )}
              <button
                data-active={isActive}
                onClick={() => setSelectedStat(p.stat)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border"
                }`}
              >
                {/* Verdict dot */}
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    p.verdict === "over"
                      ? "bg-emerald-400"
                      : p.verdict === "under"
                        ? "bg-red-400"
                        : "bg-yellow-400"
                  }`}
                />
                {p.statLabel}
              </button>
            </div>
          )
        })}
      </div>

      {/* Rich Bar Chart */}
      <div className="px-4 sm:px-5">
        <div className="rounded-lg border border-border bg-background/50 p-3">
          {count === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No game data available
            </div>
          ) : (
            <svg
              viewBox={`0 0 100 ${topPad + chartHeight + labelArea}`}
              className="w-full"
              style={{ height: chartHeight + labelArea + topPad }}
            >
              {/* Bars */}
              {values.map((val, i) => {
                const isOver = val > activeProp.line
                const barH = (val / maxVal) * chartHeight
                const x = i * barWidth + barGap / 2
                const y = topPad + chartHeight - barH

                return (
                  <g key={i}>
                    {/* Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={effectiveBarWidth}
                      height={barH}
                      rx={effectiveBarWidth > 6 ? 2 : 1}
                      className={isOver ? "fill-emerald-500/80" : "fill-red-500/70"}
                    />

                    {/* Value label above bar */}
                    <text
                      x={x + effectiveBarWidth / 2}
                      y={y - 2}
                      textAnchor="middle"
                      className="fill-foreground font-semibold"
                      style={{ fontSize: count <= 5 ? "4px" : "3.2px" }}
                    >
                      {val % 1 === 0 ? val : val.toFixed(1)}
                    </text>

                    {/* Opponent label below chart */}
                    <text
                      x={x + effectiveBarWidth / 2}
                      y={topPad + chartHeight + 10}
                      textAnchor="middle"
                      className="fill-muted-foreground font-medium"
                      style={{ fontSize: count <= 5 ? "3.2px" : "2.5px" }}
                    >
                      {opponents[i] || ""}
                    </text>

                    {/* Date label below opponent */}
                    <text
                      x={x + effectiveBarWidth / 2}
                      y={topPad + chartHeight + 18}
                      textAnchor="middle"
                      className="fill-muted-foreground/60"
                      style={{ fontSize: count <= 5 ? "2.5px" : "2px" }}
                    >
                      {dates[i]
                        ? new Date(dates[i]).toLocaleDateString("en-US", {
                            month: "numeric",
                            day: "numeric",
                          })
                        : ""}
                    </text>
                  </g>
                )
              })}

              {/* Over/Under Line (dashed) */}
              <line
                x1={0}
                y1={lineY}
                x2={100}
                y2={lineY}
                strokeDasharray="1.5 1.5"
                className="stroke-foreground/50"
                strokeWidth={0.35}
              />
              {/* O/U Line label (right) */}
              <text
                x={99}
                y={lineY - 1.5}
                textAnchor="end"
                className="fill-foreground/70 font-semibold"
                style={{ fontSize: "2.5px" }}
              >
                O/U {activeProp.line}
              </text>

              {/* Season Average Line (solid, subtle) */}
              {Math.abs(avgY - lineY) > 4 && (
                <>
                  <line
                    x1={0}
                    y1={avgY}
                    x2={100}
                    y2={avgY}
                    className="stroke-primary/40"
                    strokeWidth={0.3}
                  />
                  {/* Avg label (left) */}
                  <text
                    x={1}
                    y={avgY - 1.5}
                    textAnchor="start"
                    className="fill-primary/60 font-medium"
                    style={{ fontSize: "2.3px" }}
                  >
                    AVG {activeProp.seasonAvg.toFixed(1)}
                  </text>
                </>
              )}
            </svg>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-emerald-500/80" /> Over
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-red-500/70" /> Under
            </span>
            <span className="flex items-center gap-1">
              <span className="h-px w-3 border-t border-dashed border-foreground/50" /> Line ({activeProp.line})
            </span>
          </div>
        </div>
      </div>

      {/* Context Row */}
      <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Season Avg + Trend */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Avg{" "}
            <span className="font-bold text-foreground tabular-nums">
              {activeProp.seasonAvg.toFixed(1)}
            </span>
          </span>
          <TrendBadge trend={activeProp.trend} />
        </div>

        {/* Hit Rates */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">
            L5:{" "}
            <span className={`font-bold ${getHitRateColor(activeProp.hitRateL5)}`}>{l5Pct}%</span>
          </span>
          <span className="text-border">·</span>
          <span className="text-muted-foreground">
            L10:{" "}
            <span className={`font-bold ${getHitRateColor(activeProp.hitRateL10)}`}>{l10Pct}%</span>
          </span>
          <span className="text-border">·</span>
          <span className="text-muted-foreground">
            SZN:{" "}
            <span className="font-bold text-foreground">{sznPct}%</span>
          </span>
        </div>

        {/* Verdict + Confidence */}
        <div className="ml-auto">
          <VerdictPill verdict={activeProp.verdict} confidence={activeProp.confidence} />
        </div>
      </div>

      {/* Full Analysis Link */}
      <div className="border-t border-border px-4 sm:px-5 py-2.5">
        <button
          onClick={() => onSelectProp(activeProp.stat)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group"
        >
          See Full Analysis
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  )
}
