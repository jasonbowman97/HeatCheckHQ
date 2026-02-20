"use client"

import { useMemo, useState } from "react"
import type { PropSummary } from "@/types/analyzer"
import type { Sport } from "@/types/shared"
import { PropCard } from "./prop-card"
import { ProGate } from "@/components/pro-gate"
import { useUserTier } from "@/components/user-tier-provider"
import { STAT_CATEGORIES, CORE_STATS } from "@/lib/prop-lines"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Flame, Snowflake, ArrowRight, Lock, Target, Crosshair, Gem } from "lucide-react"
import type { MatchupContextLight } from "@/lib/design-tokens"

type SmartFilter = "all" | "misprice" | "hot" | "high-conf"

interface PropGridProps {
  props: PropSummary[]
  sport: Sport
  selectedStat: string | null
  onSelectProp: (stat: string) => void
  /** Matchup context from API — passed through to PropCards for narrative tags */
  matchupContext?: MatchupContextLight
  /** Hide the Top Signals row (when RecentPerformance section is shown above) */
  hideTopSignals?: boolean
}

// ──── Small helpers ────

function SignalDots({ over, under }: { over: number; under: number }) {
  const total = 7
  const neutral = total - over - under
  return (
    <div className="flex items-center gap-[3px]">
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

function TrendIcon({ trend }: { trend: "hot" | "cold" | "steady" }) {
  if (trend === "hot") return <Flame className="h-3 w-3 text-emerald-400" />
  if (trend === "cold") return <Snowflake className="h-3 w-3 text-red-400" />
  return <ArrowRight className="h-3 w-3 text-muted-foreground" />
}

// ──── Top Signals Row ────

function TopSignals({
  props,
  onSelectProp,
}: {
  props: PropSummary[]
  onSelectProp: (stat: string) => void
}) {
  // Pick top 3 by confidence
  const topProps = useMemo(
    () => [...props].sort((a, b) => b.confidence - a.confidence).slice(0, 3),
    [props]
  )

  if (topProps.length === 0) return null

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary">
            Top Signals
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {props.length} props analyzed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {topProps.map((p) => {
          const isOver = p.verdict === "over"
          const l10Pct = Math.round(p.hitRateL10 * 100)

          return (
            <button
              key={p.stat}
              onClick={() => onSelectProp(p.stat)}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/80 px-3.5 py-3 text-left transition-all hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5 group"
            >
              {/* Verdict indicator */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                  isOver
                    ? "bg-emerald-500/15 text-emerald-400"
                    : p.verdict === "under"
                      ? "bg-red-500/15 text-red-400"
                      : "bg-yellow-500/10 text-yellow-400"
                }`}
              >
                {p.verdict === "over" ? "O" : p.verdict === "under" ? "U" : "—"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-foreground truncate">
                    {p.statLabel}
                  </span>
                  <TrendIcon trend={p.trend} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-[10px] font-semibold ${
                      l10Pct >= 70 ? "text-emerald-400" : l10Pct < 40 ? "text-red-400" : "text-muted-foreground"
                    }`}
                  >
                    L10: {l10Pct}%
                  </span>
                  <SignalDots over={p.convergenceOver} under={p.convergenceUnder} />
                </div>
              </div>

              {/* Line */}
              <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
                {p.line}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ──── Category Card Grid ────

function CategoryCards({
  props,
  sport,
  coreStats,
  isPro,
  selectedStat,
  onSelectProp,
  matchupContext,
}: {
  props: PropSummary[]
  sport: Sport
  coreStats: string[]
  isPro: boolean
  selectedStat: string | null
  onSelectProp: (stat: string) => void
  matchupContext?: MatchupContextLight
}) {
  const freeProps = props.filter((p) => coreStats.includes(p.stat))
  const proProps = props.filter((p) => !coreStats.includes(p.stat))

  if (props.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No props available in this category
      </div>
    )
  }

  return (
    <div className="animate-in fade-in-0 duration-300">
      {/* Free props */}
      {freeProps.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {freeProps.map((prop) => (
            <PropCard
              key={prop.stat}
              prop={prop}
              sport={sport}
              allValues={prop.allValues}
              matchupContext={matchupContext}
              isSelected={selectedStat === prop.stat}
              onClick={() => onSelectProp(prop.stat)}
            />
          ))}
        </div>
      )}

      {/* Pro props */}
      {proProps.length > 0 &&
        (isPro ? (
          <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${freeProps.length > 0 ? "mt-3" : ""}`}>
            {proProps.map((prop) => (
              <PropCard
                key={prop.stat}
                prop={prop}
                sport={sport}
                allValues={prop.allValues}
                isSelected={selectedStat === prop.stat}
                onClick={() => onSelectProp(prop.stat)}
              />
            ))}
          </div>
        ) : (
          <div className={freeProps.length > 0 ? "mt-3" : ""}>
            <ProGate
              feature="prop_analyzer_full"
              headline="Unlock All Props"
              teaser={`See all ${proProps.length} remaining stat analyses with hit rates, trends, and convergence signals`}
              minHeight="200px"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {proProps.slice(0, 6).map((prop) => (
                  <PropCard
                    key={prop.stat}
                    prop={prop}
                    sport={sport}
                    allValues={prop.allValues}
                    isSelected={false}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </ProGate>
          </div>
        ))}
    </div>
  )
}

// ──── Main Grid ────

// ──── Smart Filter Logic ────

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

// ──── Main Grid ────

export function PropGrid({ props, sport, selectedStat, onSelectProp, matchupContext, hideTopSignals = false }: PropGridProps) {
  const tier = useUserTier()
  const isPro = tier === "pro"
  const categories = STAT_CATEGORIES[sport] || []
  const coreStats = CORE_STATS[sport] || []

  // Smart filter state
  const [activeFilter, setActiveFilter] = useState<SmartFilter>("all")

  // Compute filter counts
  const filterCounts = useMemo(() => ({
    all: props.length,
    misprice: applySmartFilter(props, "misprice").length,
    hot: applySmartFilter(props, "hot").length,
    "high-conf": applySmartFilter(props, "high-conf").length,
  }), [props])

  // Apply smart filter first
  const filteredProps = useMemo(
    () => applySmartFilter(props, activeFilter),
    [props, activeFilter]
  )

  // Categories that actually have props (from filtered set)
  const activeCategories = useMemo(
    () =>
      categories
        .map((cat) => {
          const catProps = filteredProps.filter((p) => cat.stats.includes(p.stat))
          const hasPro = catProps.some((p) => !coreStats.includes(p.stat))
          return { ...cat, count: catProps.length, hasPro, props: catProps }
        })
        .filter((c) => c.count > 0),
    [categories, filteredProps, coreStats]
  )

  const defaultTab = activeCategories.length > 0 ? activeCategories[0].label : "all"

  // Summary stats
  const overCount = filteredProps.filter((p) => p.verdict === "over").length
  const underCount = filteredProps.filter((p) => p.verdict === "under").length

  return (
    <div>
      {/* Top Signals (always from unfiltered props) — hidden when RecentPerformance is shown */}
      {!hideTopSignals && <TopSignals props={props} onSelectProp={onSelectProp} />}

      {/* Smart Filter Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide mb-4 pb-0.5">
        {SMART_FILTERS.map((f) => {
          const count = filterCounts[f.key]
          const isActive = activeFilter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border"
              }`}
            >
              {f.icon}
              {f.label}
              <span className={`text-[10px] ${isActive ? "opacity-80" : "opacity-50"}`}>
                ({count})
              </span>
            </button>
          )
        })}
      </div>

      {/* Empty state for filters */}
      {filteredProps.length === 0 && activeFilter !== "all" && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No props match this filter</p>
          <button
            onClick={() => setActiveFilter("all")}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            Show all props
          </button>
        </div>
      )}

      {/* Category Tabs */}
      {filteredProps.length > 0 && activeCategories.length > 1 ? (
        <Tabs defaultValue={defaultTab} key={activeFilter}>
          {/* Summary row */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] text-muted-foreground">
              <span className="text-emerald-400 font-medium">{overCount} over</span>
              {" · "}
              <span className="text-red-400 font-medium">{underCount} under</span>
              {" · "}
              {filteredProps.length - overCount - underCount} neutral
            </p>
          </div>

          <TabsList className="w-full justify-start gap-0.5 overflow-x-auto scrollbar-hide bg-secondary/30 border border-border p-1 rounded-lg mb-4 flex-wrap h-auto">
            {activeCategories.map((cat) => (
              <TabsTrigger
                key={cat.label}
                value={cat.label}
                className="relative gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-3 py-1.5"
              >
                {!isPro && cat.hasPro && (
                  <Lock className="h-2.5 w-2.5 opacity-50" />
                )}
                {cat.label}
                <span className="text-[10px] opacity-60">({cat.count})</span>
              </TabsTrigger>
            ))}

            {/* "All" tab at the end */}
            <TabsTrigger
              value="all"
              className="gap-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-3 py-1.5"
            >
              All
              <span className="text-[10px] opacity-60">({filteredProps.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Category content panels */}
          {activeCategories.map((cat) => (
            <TabsContent key={cat.label} value={cat.label}>
              <CategoryCards
                props={cat.props}
                sport={sport}
                coreStats={coreStats}
                isPro={isPro}
                selectedStat={selectedStat}
                onSelectProp={onSelectProp}
                matchupContext={matchupContext}
              />
            </TabsContent>
          ))}

          {/* All content panel */}
          <TabsContent value="all">
            <CategoryCards
              props={filteredProps}
              sport={sport}
              coreStats={coreStats}
              isPro={isPro}
              selectedStat={selectedStat}
              onSelectProp={onSelectProp}
              matchupContext={matchupContext}
            />
          </TabsContent>
        </Tabs>
      ) : filteredProps.length > 0 ? (
        /* Single category — no tabs needed */
        <CategoryCards
          props={filteredProps}
          sport={sport}
          coreStats={coreStats}
          isPro={isPro}
          selectedStat={selectedStat}
          onSelectProp={onSelectProp}
          matchupContext={matchupContext}
        />
      ) : null}
    </div>
  )
}

// ──── Skeleton for loading state ────

export function PropGridSkeleton() {
  return (
    <div>
      {/* Top Signals skeleton */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="h-3.5 w-3.5 rounded bg-muted animate-pulse" />
          <div className="h-3 w-20 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/80 px-3.5 py-3 animate-pulse"
            >
              <div className="h-9 w-9 rounded-lg bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-16 rounded bg-muted" />
                <div className="h-2.5 w-24 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab pills skeleton */}
      <div className="flex gap-1.5 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-md bg-muted animate-pulse" />
        ))}
      </div>

      {/* Card grid skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="relative rounded-xl border border-border bg-card overflow-hidden animate-pulse"
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-muted" />
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-24 rounded bg-muted" />
                <div className="h-5 w-14 rounded bg-muted" />
              </div>
              {/* Chart area */}
              <div className="h-10 w-full rounded bg-muted mb-3" />
              {/* Line + split bar */}
              <div className="flex items-center gap-3 mb-2">
                <div className="h-7 w-16 rounded bg-muted" />
                <div className="flex-1 h-4 rounded bg-muted" />
              </div>
              {/* Quick stats */}
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
