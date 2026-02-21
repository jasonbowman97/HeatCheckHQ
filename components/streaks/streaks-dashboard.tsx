"use client"

import { useState, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Search,
  CalendarCheck,
  ArrowUpDown,
  Table2,
  LayoutGrid,
  Lock,
} from "lucide-react"
import { useUserTier } from "@/components/user-tier-provider"
import { SectionInfoTip } from "@/components/ui/section-info-tip"
import { SignupGate } from "@/components/signup-gate"
import { StreakTable } from "./streak-table"
import { PlayerAnalysisPanel } from "./player-analysis-panel"
import {
  filterAndSort,
  hitRateColorClass,
  type FilteredPlayerRow,
  type SortOption,
} from "@/lib/streak-filter"
import {
  SPORT_STAT_CONFIGS,
  SPORT_LABELS,
  getTeamLogoUrl,
  WINDOW_OPTIONS,
  type EnrichedPlayer,
  type GameStatKey,
  type WindowSize,
  type SportKey,
} from "@/lib/streak-types"

/** Number of rows visible to anonymous users */
const PREVIEW_ROWS = 8

type ViewMode = "table" | "cards"

interface StreaksDashboardProps {
  players: EnrichedPlayer[]
  sport?: SportKey
}

export function StreaksDashboard({ players, sport = "nba" }: StreaksDashboardProps) {
  const userTier = useUserTier()
  const isAnonymous = userTier === "anonymous"
  const router = useRouter()
  const searchParams = useSearchParams()

  const statConfigs = SPORT_STAT_CONFIGS[sport]
  const sportLabel = SPORT_LABELS[sport]

  // Read initial state from URL params, fall back to defaults
  const initialStat = statConfigs.find(
    (c) => c.key === searchParams.get("stat")
  ) ?? statConfigs[0]

  const initialThreshold = Number(searchParams.get("threshold")) || initialStat.defaultThreshold
  const initialWindow = (Number(searchParams.get("window")) || initialStat.defaultWindow) as WindowSize

  const [activeStat, setActiveStat] = useState(initialStat)
  const [threshold, setThreshold] = useState(initialThreshold)
  const [window, setWindow] = useState<WindowSize>(initialWindow)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [search, setSearch] = useState("")
  const [activeTeam, setActiveTeam] = useState("All")
  const [playingTodayOnly, setPlayingTodayOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>("hitRate")
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)

  // Sync state to URL
  const updateUrl = useCallback(
    (stat: string, thresh: number, win: WindowSize) => {
      const params = new URLSearchParams()
      params.set("stat", stat)
      params.set("threshold", String(thresh))
      params.set("window", String(win))
      router.replace(`/${sport}/streaks?${params.toString()}`, { scroll: false })
    },
    [router, sport]
  )

  // Derive unique teams
  const teams = useMemo(() => {
    const set = new Set(players.map((p) => p.team))
    return Array.from(set).sort()
  }, [players])

  // Playing today count
  const playingTodayCount = useMemo(
    () => players.filter((p) => p.playingToday).length,
    [players]
  )

  // Main filter computation
  const rows: FilteredPlayerRow[] = useMemo(
    () =>
      filterAndSort(players, activeStat.gameStatKey, threshold, window, {
        team: activeTeam,
        search,
        playingTodayOnly,
        sortBy,
      }),
    [players, activeStat.gameStatKey, threshold, window, activeTeam, search, playingTodayOnly, sortBy]
  )

  // Handlers
  const handleStatChange = (config: typeof activeStat) => {
    setActiveStat(config)
    setThreshold(config.defaultThreshold)
    updateUrl(config.key, config.defaultThreshold, window)
  }

  const handleThresholdChange = (value: number) => {
    setThreshold(value)
    updateUrl(activeStat.key, value, window)
  }

  const handleWindowChange = (value: WindowSize) => {
    setWindow(value)
    updateUrl(activeStat.key, threshold, value)
  }

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "hitRate", label: "Hit Rate" },
    { value: "streak", label: "Streak" },
    { value: "windowAvg", label: "Window Avg" },
    { value: "seasonAvg", label: "Season Avg" },
    { value: "name", label: "Player Name" },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            {sportLabel} Streak Tracker
            <SectionInfoTip page={`/${sport}/streaks`} />
          </h2>
          {players.length > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
              {players.length} players loaded
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Set custom stat thresholds and see which players consistently hit your
          lines. Adjust filters to build your own consistency sheet.
        </p>
      </div>

      {/* ── Toolbar: Stat chips + Threshold + Window + View toggle ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Stat chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statConfigs.map((config) => (
            <button
              key={config.key}
              type="button"
              onClick={() => handleStatChange(config)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                activeStat.key === config.key
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground bg-card border border-border hover:border-primary/30"
              }`}
            >
              {config.shortLabel}
            </button>
          ))}
        </div>

        {/* Threshold dropdown */}
        <select
          value={threshold}
          onChange={(e) => handleThresholdChange(Number(e.target.value))}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          {activeStat.thresholds.map((t) => (
            <option key={t} value={t}>
              {t}+ {activeStat.shortLabel}
            </option>
          ))}
        </select>

        {/* Window dropdown */}
        <select
          value={window}
          onChange={(e) => handleWindowChange(Number(e.target.value) as WindowSize)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          {WINDOW_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex items-center rounded-lg border border-border bg-card p-1 gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "table"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Table view"
          >
            <Table2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === "cards"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Card view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Filters row ── */}
      <div className="relative">
        {isAnonymous && (
          <div className="absolute inset-0 z-10 flex items-center justify-end pr-4">
            <Link
              href="/auth/sign-up"
              className="flex items-center gap-1.5 rounded-lg bg-card/95 border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors shadow-sm backdrop-blur-sm"
            >
              <Lock className="h-3 w-3" />
              Sign up to filter
            </Link>
          </div>
        )}
        <div
          className={`flex flex-wrap items-center gap-3 ${
            isAnonymous ? "pointer-events-none opacity-40" : ""
          }`}
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search player or team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-border bg-card pl-9 pr-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary w-52"
            />
          </div>

          {/* Team filter */}
          {teams.length > 1 && (
            <select
              value={activeTeam}
              onChange={(e) => setActiveTeam(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="All">All Teams</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          )}

          {/* Playing Today toggle */}
          {playingTodayCount > 0 && (
            <button
              type="button"
              onClick={() => setPlayingTodayOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                playingTodayOnly
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "text-muted-foreground hover:text-foreground border-border bg-card"
              }`}
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Playing Today ({playingTodayCount})
            </button>
          )}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-muted-foreground">
        Showing {Math.min(rows.length, isAnonymous ? PREVIEW_ROWS : rows.length)}{" "}
        of {rows.length} player{rows.length !== 1 ? "s" : ""} hitting{" "}
        {threshold}+ {activeStat.shortLabel}
      </p>

      {/* ── Content area ── */}
      {rows.length > 0 ? (
        viewMode === "table" ? (
          isAnonymous && rows.length > PREVIEW_ROWS ? (
            <SignupGate
              headline={`See all ${sportLabel} player streaks — free`}
              description={`Unlock the full consistency sheet with every ${sportLabel} rotation player. Free forever, no credit card.`}
              countLabel={`${rows.length} players found`}
              preview={
                <StreakTable
                  rows={rows.slice(0, PREVIEW_ROWS)}
                  threshold={threshold}
                  statLabel={activeStat.shortLabel}
                  window={window}
                  sport={sport}
                  onPlayerClick={setSelectedPlayerId}
                />
              }
              gated={
                <StreakTable
                  rows={rows.slice(PREVIEW_ROWS)}
                  threshold={threshold}
                  statLabel={activeStat.shortLabel}
                  window={window}
                  startRank={PREVIEW_ROWS + 1}
                  sport={sport}
                  onPlayerClick={setSelectedPlayerId}
                />
              }
            />
          ) : (
            <StreakTable
              rows={rows}
              threshold={threshold}
              statLabel={activeStat.shortLabel}
              window={window}
              sport={sport}
              onPlayerClick={setSelectedPlayerId}
            />
          )
        ) : (
          /* Card view */
          isAnonymous && rows.length > PREVIEW_ROWS ? (
            <SignupGate
              headline={`See all ${sportLabel} player streaks — free`}
              description={`Unlock the full consistency sheet. Free forever, no credit card.`}
              countLabel={`${rows.length} players found`}
              preview={
                <StreakCardGrid
                  rows={rows.slice(0, PREVIEW_ROWS)}
                  threshold={threshold}
                  statLabel={activeStat.shortLabel}
                  sport={sport}
                  onPlayerClick={setSelectedPlayerId}
                />
              }
              gated={
                <StreakCardGrid
                  rows={rows.slice(PREVIEW_ROWS)}
                  threshold={threshold}
                  statLabel={activeStat.shortLabel}
                  sport={sport}
                  onPlayerClick={setSelectedPlayerId}
                />
              }
            />
          ) : (
            <StreakCardGrid
              rows={rows}
              threshold={threshold}
              statLabel={activeStat.shortLabel}
              sport={sport}
              onPlayerClick={setSelectedPlayerId}
            />
          )
        )
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-16 text-center flex flex-col items-center gap-3">
          {players.length === 0 ? (
            <>
              <Table2 className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                No player data available
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Player data updates daily. Check back during the regular season.
              </p>
            </>
          ) : (
            <>
              <Search className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                No players match your filters
              </p>
              <p className="text-xs text-muted-foreground">
                Try lowering the threshold or widening the game window.
              </p>
            </>
          )}
        </div>
      )}

      {/* Player Analysis Panel */}
      {selectedPlayerId && (
        <PlayerAnalysisPanel
          playerId={selectedPlayerId}
          sport={sport}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </div>
  )
}

/* ── Card grid (secondary view) ── */

function StreakCardGrid({
  rows,
  threshold,
  statLabel,
  sport = "nba",
  onPlayerClick,
}: {
  rows: FilteredPlayerRow[]
  threshold: number
  statLabel: string
  sport?: SportKey
  onPlayerClick?: (playerId: string) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row, i) => {
        const colors = hitRateColorClass(row.hitRate)
        return (
          <div
            key={`${row.player.id}-${i}`}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                className="flex items-center gap-2 text-left group"
                onClick={() => onPlayerClick?.(row.player.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getTeamLogoUrl(sport, row.player.team)}
                  alt={row.player.team}
                  width={24}
                  height={24}
                  className="rounded"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {row.player.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {row.player.team} · {row.player.position}
                    {row.player.opponent && ` · vs ${row.player.opponent}`}
                  </p>
                </div>
              </button>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md ${colors.text} ${colors.bg}`}
              >
                {row.hitCount}/{row.windowGames.length}
              </span>
            </div>

            {/* Game dots */}
            <div className="flex items-center gap-1">
              {row.hitGames.map((hit, j) => (
                <div
                  key={j}
                  className={`flex-1 h-2 rounded-full ${
                    hit ? "bg-emerald-400" : "bg-red-400/40"
                  }`}
                  title={`${row.statValues[j]} ${statLabel}`}
                />
              ))}
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {threshold}+ {statLabel}
              </span>
              <span className="font-semibold text-foreground">
                Avg: {row.windowAvg.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                Szn: {row.seasonAvg.toFixed(1)}
              </span>
            </div>

            {row.consecutiveStreak > 0 && (
              <p className="text-[10px] text-emerald-400 font-medium">
                {row.consecutiveStreak} game streak active
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
