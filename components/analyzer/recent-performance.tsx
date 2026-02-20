"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Flame, Snowflake, ArrowRight, Crosshair, Gem } from "lucide-react"
import type { PropSummary } from "@/types/analyzer"
import type { Player, Game, Sport } from "@/types/shared"
import { STAT_CATEGORIES, CORE_STATS } from "@/lib/prop-lines"
import { getStatLabel, getHitRateColor, getConfidenceColor, generateNarrativeTags } from "@/lib/design-tokens"
import type { MatchupContextLight } from "@/lib/design-tokens"

type SampleSize = 5 | 10 | 20 | "all"

// ──── Smart Filter Types ────
type SmartFilter = "all" | "misprice" | "hot" | "high-conf"

function applySmartFilter(props: PropSummary[], filter: SmartFilter): PropSummary[] {
  switch (filter) {
    case "misprice":
      return props
        .filter((p) => Math.abs(p.seasonAvg - p.line) >= 2 && p.confidence >= 60)
        .sort((a, b) => Math.abs(b.seasonAvg - b.line) - Math.abs(a.seasonAvg - a.line))
    case "hot":
      return props.filter((p) => p.trend === "hot")
    case "high-conf":
      return props.filter((p) => p.confidence >= 75)
    default:
      return props
  }
}

const SMART_FILTERS: Array<{ key: SmartFilter; label: string; icon: React.ReactNode }> = [
  { key: "all", label: "All Props", icon: null },
  { key: "misprice", label: "Misprice Hunter", icon: <Crosshair className="h-3 w-3" /> },
  { key: "hot", label: "Hot Streaks", icon: <Flame className="h-3 w-3" /> },
  { key: "high-conf", label: "High Confidence", icon: <Gem className="h-3 w-3" /> },
]

interface RecentPerformanceProps {
  /** Player info for the header section */
  player: Player
  nextGame: Game | null
  /** All analyzed props */
  props: PropSummary[]
  sport: Sport
  seasonAverages: Record<string, number>
  gamesPlayed: number
  /** Called when user clicks a stat tab (used for URL deep linking) */
  onSelectProp: (stat: string) => void
  /** Matchup context for narrative tags */
  matchupContext?: MatchupContextLight
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

// ──── Signal Dots (inline convergence) ────

function SignalDots({ over, under }: { over: number; under: number }) {
  const total = 7
  const neutral = total - over - under
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: over }).map((_, i) => (
        <span key={`o${i}`} className="h-2 w-2 rounded-full bg-emerald-500" />
      ))}
      {Array.from({ length: neutral }).map((_, i) => (
        <span key={`n${i}`} className="h-2 w-2 rounded-full bg-muted-foreground/30" />
      ))}
      {Array.from({ length: under }).map((_, i) => (
        <span key={`u${i}`} className="h-2 w-2 rounded-full bg-red-500" />
      ))}
    </div>
  )
}

// ──── Inline Hit Rate Pill ────

function HitRatePill({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100)
  const textColor = getHitRateColor(value)
  const bgColor =
    pct >= 70
      ? "bg-emerald-500/15 border-emerald-500/20"
      : pct >= 50
        ? "bg-yellow-500/10 border-yellow-500/20"
        : "bg-red-500/15 border-red-500/20"

  return (
    <div className={`flex flex-col items-center rounded-lg border px-2.5 py-1.5 min-w-[48px] ${bgColor}`}>
      <span className="text-[9px] font-medium text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold tabular-nums ${textColor}`}>{pct}%</span>
    </div>
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
  matchupContext,
}: RecentPerformanceProps) {
  const categories = STAT_CATEGORIES[sport] || []
  const tabsRef = useRef<HTMLDivElement>(null)

  // Smart filter state
  const [activeFilter, setActiveFilter] = useState<SmartFilter>("all")

  // Apply smart filter
  const filteredProps = useMemo(
    () => applySmartFilter(props, activeFilter),
    [props, activeFilter]
  )

  // Filter counts
  const filterCounts = useMemo(() => ({
    all: props.length,
    misprice: applySmartFilter(props, "misprice").length,
    hot: applySmartFilter(props, "hot").length,
    "high-conf": applySmartFilter(props, "high-conf").length,
  }), [props])

  // Default to highest confidence prop
  const defaultStat = useMemo(
    () => [...filteredProps].sort((a, b) => b.confidence - a.confidence)[0]?.stat ?? filteredProps[0]?.stat,
    [filteredProps]
  )

  const [selectedStat, setSelectedStat] = useState<string>(defaultStat)
  const [sampleSize, setSampleSize] = useState<SampleSize>(10)

  // Reset selection when props change (new player) or filter changes
  useEffect(() => {
    setSelectedStat(defaultStat)
  }, [defaultStat])

  // Reset to L10 on new player
  useEffect(() => {
    setSampleSize(10)
  }, [player.id])

  const activeProp = useMemo(
    () => filteredProps.find((p) => p.stat === selectedStat) ?? filteredProps[0],
    [filteredProps, selectedStat]
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

  // ── Chart data ──
  // Use allValues for L20/All, last10Values for L5/L10
  const allGameValues = activeProp.allValues // newest first
  const totalGames = allGameValues.length

  const sliceCount = sampleSize === "all" ? totalGames : Math.min(sampleSize as number, totalGames)
  const sliced = allGameValues.slice(0, sliceCount)
  const values = [...sliced].reverse() // chronological (oldest first)

  // Opponents/dates — only available for last 10
  const oppSlice = sampleSize === "all" ? [] : activeProp.last10Opponents.slice(0, Math.min(sliceCount, 10))
  const dateSlice = sampleSize === "all" ? [] : activeProp.last10Dates.slice(0, Math.min(sliceCount, 10))
  const opponents = [...oppSlice].reverse()
  const dates = [...dateSlice].reverse()

  const count = values.length
  const showOpponents = count <= 20 && opponents.length > 0
  const showDates = count <= 10 && dates.length > 0

  // ── Chart dimensions — HERO SIZE ──
  // Wide viewBox so SVG aspect ratio matches the wide container naturally
  const vbWidth = 1000
  const chartHeight = 400
  const labelArea = showDates ? 60 : showOpponents ? 35 : 15
  const topPad = 30
  const maxVal = Math.max(...values, activeProp.line * 1.25, activeProp.seasonAvg * 1.1)

  const barWidth = vbWidth / count
  const barGap = count <= 5 ? barWidth * 0.25 : count <= 10 ? barWidth * 0.2 : count <= 20 ? barWidth * 0.15 : barWidth * 0.1
  const effectiveBarWidth = barWidth - barGap

  const lineY = topPad + chartHeight - (activeProp.line / maxVal) * chartHeight
  const avgY = topPad + chartHeight - (activeProp.seasonAvg / maxVal) * chartHeight

  // Compute hit rate for current sample
  const sampleHitRate = count > 0 ? values.filter(v => v > activeProp.line).length / count : 0
  const sampleHitPct = Math.round(sampleHitRate * 100)

  // ── Compute L20 hit rate ──
  const l20Count = Math.min(20, totalGames)
  const l20Values = allGameValues.slice(0, l20Count)
  const l20HitRate = l20Count > 0 ? l20Values.filter(v => v > activeProp.line).length / l20Count : 0

  // ── Group props by category for tab rendering ──
  const orderedProps = useMemo(() => {
    const ordered: Array<{ prop: PropSummary; category: string }> = []
    for (const cat of categories) {
      for (const stat of cat.stats) {
        const p = filteredProps.find((pr) => pr.stat === stat)
        if (p) ordered.push({ prop: p, category: cat.label })
      }
    }
    for (const p of filteredProps) {
      if (!ordered.some((o) => o.prop.stat === p.stat)) {
        ordered.push({ prop: p, category: "Other" })
      }
    }
    return ordered
  }, [filteredProps, categories])

  // Scroll active tab into view
  useEffect(() => {
    if (tabsRef.current) {
      const activeTab = tabsRef.current.querySelector('[data-active="true"]')
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
      }
    }
  }, [selectedStat])

  // Narrative tags
  const narrativeTags = useMemo(
    () => generateNarrativeTags(activeProp, matchupContext),
    [activeProp, matchupContext]
  )

  // Convergence info
  const dominantDir = activeProp.convergenceOver >= activeProp.convergenceUnder ? "over" : "under"
  const dominantCount = Math.max(activeProp.convergenceOver, activeProp.convergenceUnder)

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

      {/* ═══════ GAME LOG SECTION ═══════ */}

      {/* Section Header + Sample Size Toggle */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-2">
        <h3 className="text-sm font-bold text-foreground">Game Log</h3>
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/30 p-0.5">
          {([5, 10, 20, "all"] as SampleSize[]).map((size) => {
            // Only show options that have enough games
            if (typeof size === "number" && totalGames < size) return null

            return (
              <button
                key={String(size)}
                onClick={() => setSampleSize(size)}
                className={`rounded-md px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
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

      {/* Smart Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-4 sm:px-5 pb-2">
        {SMART_FILTERS.map((f) => {
          const fCount = filterCounts[f.key]
          if (f.key !== "all" && fCount === 0) return null
          const isActive = activeFilter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
              }`}
            >
              {f.icon}
              {f.label}
              <span className={`${isActive ? "opacity-80" : "opacity-50"}`}>
                ({fCount})
              </span>
            </button>
          )
        })}
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
                onClick={() => {
                  setSelectedStat(p.stat)
                  onSelectProp(p.stat)
                }}
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

      {/* Empty state when filter yields no results */}
      {filteredProps.length === 0 && activeFilter !== "all" && (
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <p className="text-sm text-muted-foreground">No props match this filter</p>
          <button
            onClick={() => setActiveFilter("all")}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            Show all props
          </button>
        </div>
      )}

      {/* ═══════ HERO BAR CHART ═══════ */}
      {filteredProps.length > 0 && (
        <div className="px-4 sm:px-5">
          <div className="rounded-lg border border-border bg-background/50 p-3 sm:p-4">
            {count === 0 ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                No game data available
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${vbWidth} ${topPad + chartHeight + labelArea}`}
                className="w-full"
                preserveAspectRatio="none"
                style={{ height: "clamp(280px, 40vw, 480px)" }}
              >
                {/* Bars */}
                {values.map((val, i) => {
                  const isOver = val > activeProp.line
                  const barH = (val / maxVal) * chartHeight
                  const x = i * barWidth + barGap / 2
                  const y = topPad + chartHeight - barH
                  const rx = Math.min(effectiveBarWidth * 0.08, 6)

                  return (
                    <g key={i}>
                      {/* Bar */}
                      <rect
                        x={x}
                        y={y}
                        width={effectiveBarWidth}
                        height={barH}
                        rx={rx}
                        className={isOver ? "fill-emerald-500/80" : "fill-red-500/70"}
                      />

                      {/* Value label above bar */}
                      {count <= 30 && (
                        <text
                          x={x + effectiveBarWidth / 2}
                          y={y - 8}
                          textAnchor="middle"
                          className="fill-foreground font-semibold"
                          style={{ fontSize: count <= 5 ? "28px" : count <= 10 ? "22px" : count <= 20 ? "16px" : "13px" }}
                        >
                          {val % 1 === 0 ? val : val.toFixed(1)}
                        </text>
                      )}

                      {/* Opponent label below chart */}
                      {showOpponents && i < opponents.length && (
                        <text
                          x={x + effectiveBarWidth / 2}
                          y={topPad + chartHeight + 20}
                          textAnchor="middle"
                          className="fill-muted-foreground font-medium"
                          style={{ fontSize: count <= 5 ? "22px" : count <= 10 ? "18px" : "14px" }}
                        >
                          {opponents[i] || ""}
                        </text>
                      )}

                      {/* Date label below opponent */}
                      {showDates && i < dates.length && (
                        <text
                          x={x + effectiveBarWidth / 2}
                          y={topPad + chartHeight + 40}
                          textAnchor="middle"
                          className="fill-muted-foreground/60"
                          style={{ fontSize: count <= 5 ? "17px" : "14px" }}
                        >
                          {dates[i]
                            ? new Date(dates[i]).toLocaleDateString("en-US", {
                                month: "numeric",
                                day: "numeric",
                              })
                            : ""}
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* Over/Under Line (dashed) */}
                <line
                  x1={0}
                  y1={lineY}
                  x2={vbWidth}
                  y2={lineY}
                  strokeDasharray="12 8"
                  className="stroke-foreground/50"
                  strokeWidth={2}
                />
                {/* O/U Line label (right) */}
                <text
                  x={vbWidth - 8}
                  y={lineY - 8}
                  textAnchor="end"
                  className="fill-foreground/70 font-semibold"
                  style={{ fontSize: "18px" }}
                >
                  LINE {activeProp.line}
                </text>

                {/* Season Average Line (solid, subtle) */}
                {Math.abs(avgY - lineY) > 20 && (
                  <>
                    <line
                      x1={0}
                      y1={avgY}
                      x2={vbWidth}
                      y2={avgY}
                      className="stroke-primary/40"
                      strokeWidth={1.5}
                    />
                    <text
                      x={8}
                      y={avgY - 8}
                      textAnchor="start"
                      className="fill-primary/60 font-medium"
                      style={{ fontSize: "16px" }}
                    >
                      AVG {activeProp.seasonAvg.toFixed(1)}
                    </text>
                  </>
                )}
              </svg>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-emerald-500/80" /> Over
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-red-500/70" /> Under
              </span>
              <span className="flex items-center gap-1">
                <span className="h-px w-3 border-t border-dashed border-foreground/50" /> Line ({activeProp.line})
              </span>
              {count > 0 && (
                <span className="ml-auto font-medium">
                  {sampleHitPct}% hit rate ({values.filter(v => v > activeProp.line).length}/{count})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ANALYSIS PANEL (below chart — replaces detail panel) ═══════ */}
      {filteredProps.length > 0 && activeProp && (
        <div className="px-4 sm:px-5 py-4 space-y-4">

          {/* ── Verdict + Convergence Row ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Verdict Card */}
            <div className={`flex-1 rounded-xl border p-3.5 ${
              activeProp.verdict === "over"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : activeProp.verdict === "under"
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-yellow-500/30 bg-yellow-500/5"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <VerdictPill verdict={activeProp.verdict} confidence={activeProp.confidence} />
                <TrendBadge trend={activeProp.trend} />
              </div>
              <p className="text-xs text-muted-foreground">
                {activeProp.statLabel} {activeProp.verdict === "over" ? "Over" : activeProp.verdict === "under" ? "Under" : "at"}{" "}
                <span className="font-bold text-foreground">{activeProp.line}</span>
                {" · "}Avg: <span className="font-bold text-foreground">{activeProp.seasonAvg.toFixed(1)}</span>
              </p>

              {/* Narrative Tags */}
              {narrativeTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {narrativeTags.map((tag, i) => (
                    <span
                      key={i}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        tag.variant === "positive"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : tag.variant === "negative"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Convergence Signals */}
            <div className="sm:w-56 rounded-xl border border-border bg-card/50 p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Convergence
                </h4>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {dominantCount}/7{" "}
                  <span className={dominantDir === "over" ? "text-emerald-400" : "text-red-400"}>
                    {dominantDir}
                  </span>
                </span>
              </div>
              <SignalDots over={activeProp.convergenceOver} under={activeProp.convergenceUnder} />
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Over ({activeProp.convergenceOver})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Under ({activeProp.convergenceUnder})
                </span>
              </div>
            </div>
          </div>

          {/* ── Hit Rate Pills ── */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Hit Rates
            </h4>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <HitRatePill label="L5" value={activeProp.hitRateL5} />
              <HitRatePill label="L10" value={activeProp.hitRateL10} />
              {totalGames >= 20 && (
                <HitRatePill label="L20" value={l20HitRate} />
              )}
              <HitRatePill label="SZN" value={activeProp.hitRateSeason} />
              {activeProp.hitRateH2H !== null && (
                <HitRatePill label="H2H" value={activeProp.hitRateH2H} />
              )}
            </div>
          </div>

          {/* ── Matchup Context (if available) ── */}
          {matchupContext && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {matchupContext.defRank !== undefined && (
                <span className={`rounded-full px-2 py-0.5 font-medium ${
                  matchupContext.defRank >= 21
                    ? "bg-emerald-500/15 text-emerald-400"
                    : matchupContext.defRank <= 10
                      ? "bg-red-500/15 text-red-400"
                      : "bg-yellow-500/10 text-yellow-400"
                }`}>
                  vs #{matchupContext.defRank} DEF
                </span>
              )}
              {matchupContext.isHome !== undefined && (
                <span className="rounded-full bg-secondary/50 px-2 py-0.5 font-medium">
                  {matchupContext.isHome ? "Home" : "Away"}
                </span>
              )}
              {matchupContext.restDays !== undefined && matchupContext.restDays <= 1 && (
                <span className="rounded-full bg-red-500/15 px-2 py-0.5 font-medium text-red-400">
                  {matchupContext.isB2B ? "Back-to-Back" : `${matchupContext.restDays}d rest`}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
