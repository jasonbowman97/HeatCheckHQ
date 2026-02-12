"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import {
  Flame,
  Zap,
  Target,
  Loader2,
  TrendingUp,
  Footprints,
  Circle,
  BarChart2,
  Shield,
  Snowflake,
  CalendarCheck,
} from "lucide-react"
// Streak types (mirrored from lib/hot-hitters.ts to avoid importing server-only module)
type StreakType =
  | "hitting"
  | "multi-hit"
  | "xbh"
  | "hr"
  | "rbi"
  | "runs"
  | "sb"
  | "total-bases"
  | "on-base"
  | "cold"

interface HotHitter {
  id: string
  playerId: string
  playerName: string
  team: string
  position: string
  streakType: StreakType
  streakLength: number
  headline: string
  detail: string
  recentGames: boolean[]
  statValue: string
  statLabel: string
  avgDuringStreak?: string
}

interface TodayGame {
  homeTeam: string
  awayTeam: string
  gameTime: string
  probables: Record<string, string>
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const tabs: { key: StreakType; label: string; icon: typeof Flame; description: string; hot: boolean }[] = [
  {
    key: "hitting",
    label: "Hitting",
    icon: Flame,
    description: "Consecutive games with at least one hit",
    hot: true,
  },
  {
    key: "multi-hit",
    label: "Multi-Hit",
    icon: Zap,
    description: "Consecutive games with 2+ hits — key prop bet market",
    hot: true,
  },
  {
    key: "xbh",
    label: "XBH",
    icon: TrendingUp,
    description: "Consecutive games with an extra-base hit (2B, 3B, HR)",
    hot: true,
  },
  {
    key: "hr",
    label: "HR",
    icon: Target,
    description: "Consecutive games with a home run",
    hot: true,
  },
  {
    key: "rbi",
    label: "RBI",
    icon: BarChart2,
    description: "Consecutive games driving in at least one run",
    hot: true,
  },
  {
    key: "runs",
    label: "Runs",
    icon: TrendingUp,
    description: "Consecutive games scoring at least one run",
    hot: true,
  },
  {
    key: "sb",
    label: "SB",
    icon: Footprints,
    description: "Consecutive games with a stolen base",
    hot: true,
  },
  {
    key: "total-bases",
    label: "Total Bases",
    icon: Circle,
    description: "Consecutive games with 2+ total bases — popular prop market",
    hot: true,
  },
  {
    key: "on-base",
    label: "On-Base",
    icon: Shield,
    description: "Consecutive games reaching base (hit, walk, or HBP)",
    hot: true,
  },
  {
    key: "cold",
    label: "Cold",
    icon: Snowflake,
    description: "Players in hitless slumps — consecutive games without a hit",
    hot: false,
  },
]

export function HotHittersSection() {
  const [activeTab, setActiveTab] = useState<StreakType>("hitting")
  const [teamFilter, setTeamFilter] = useState<string>("All")
  const [showPlayingToday, setShowPlayingToday] = useState(false)
  const { data, isLoading } = useSWR<{ streaks: HotHitter[]; todayGames?: TodayGame[]; cached?: boolean }>(
    "/api/hot-hitters",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  const liveStreaks = data?.streaks ?? []
  const todayGames = data?.todayGames ?? []
  const hasLiveData = liveStreaks.length > 0

  // Build a set of teams playing today + their matchup info
  const todayInfo = useMemo(() => {
    const map: Record<string, { opponent: string; pitcher: string; gameTime: string }> = {}
    for (const game of todayGames) {
      // Home team faces away team's pitcher
      map[game.homeTeam] = {
        opponent: game.awayTeam,
        pitcher: game.probables[game.awayTeam] ?? "TBD",
        gameTime: game.gameTime,
      }
      // Away team faces home team's pitcher
      map[game.awayTeam] = {
        opponent: game.homeTeam,
        pitcher: game.probables[game.homeTeam] ?? "TBD",
        gameTime: game.gameTime,
      }
    }
    return map
  }, [todayGames])

  const teams = useMemo(() => {
    const set = new Set(liveStreaks.map((h) => h.team))
    return Array.from(set).sort()
  }, [liveStreaks])

  const filtered = liveStreaks.filter((h) => {
    if (h.streakType !== activeTab) return false
    if (teamFilter !== "All" && h.team !== teamFilter) return false
    if (showPlayingToday && !todayInfo[h.team]) return false
    return true
  })

  const activeTabInfo = tabs.find((t) => t.key === activeTab)!
  const isColdTab = activeTab === "cold"

  // Count of playing today for the active tab
  const playingTodayCount = liveStreaks.filter(
    (h) => h.streakType === activeTab && todayInfo[h.team]
  ).length

  return (
    <div className="flex flex-col gap-6">
      {/* Section header */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Hot Hitters</h2>
          {isLoading && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
              <Loader2 className="h-3 w-3 animate-spin" />
              Scanning all players
            </span>
          )}
          {hasLiveData && !isLoading && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
              Live
            </span>
          )}
          {!hasLiveData && !isLoading && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
              No data available
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Active streaks across all MLB rosters. Scans every batter&apos;s game log to find betting-relevant trends.
        </p>
      </div>

      {/* Streak type tabs — scrollable row */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex items-center rounded-lg border border-border bg-card p-1 gap-1 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const count = liveStreaks.filter((h) => h.streakType === tab.key).length
            const isActive = activeTab === tab.key
            const isCold = tab.key === "cold"
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? isCold
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-emerald-500/10 text-emerald-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1 rounded ${
                    isActive
                      ? isCold ? "bg-blue-500/20" : "bg-emerald-500/20"
                      : "bg-secondary"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Team filter */}
        {teams.length > 1 && (
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-primary w-fit"
          >
            <option value="All">All Teams</option>
            {teams.map((team) => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        )}

        {/* Playing Today toggle */}
        {todayGames.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPlayingToday(!showPlayingToday)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showPlayingToday
                ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            Playing Today
            {playingTodayCount > 0 && (
              <span className={`text-[10px] font-bold px-1 rounded ${
                showPlayingToday ? "bg-amber-500/20" : "bg-secondary"
              }`}>
                {playingTodayCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tab description */}
      <p className="text-xs text-muted-foreground">
        {activeTabInfo.description} — showing {filtered.length} player{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Streak table */}
      {filtered.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-border bg-secondary/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Player</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Streak</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Stat</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right hidden sm:block">Today</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right min-w-[80px]">Recent</span>
          </div>

          {/* Rows */}
          {filtered.map((hitter, i) => {
            const today = todayInfo[hitter.team]
            const isPlayingToday = !!today

            return (
              <div
                key={hitter.id}
                className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-secondary/20 ${
                  i < filtered.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                {/* Player */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{hitter.playerName}</span>
                    {isPlayingToday && (
                      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {hitter.team} · {hitter.position}
                    {hitter.avgDuringStreak && (
                      <span className="text-muted-foreground/60"> · {hitter.avgDuringStreak} AVG</span>
                    )}
                  </span>
                </div>

                {/* Streak length */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-lg font-bold font-mono tabular-nums ${
                    isColdTab ? "text-blue-400" : "text-emerald-400"
                  }`}>
                    {hitter.streakLength}
                  </span>
                  <span className="text-[10px] text-muted-foreground">gms</span>
                </div>

                {/* Stat */}
                <div className="text-right">
                  <p className="text-sm font-bold font-mono tabular-nums text-foreground">{hitter.statValue}</p>
                  <p className="text-[10px] text-muted-foreground">{hitter.statLabel}</p>
                </div>

                {/* Today's matchup */}
                <div className="text-right hidden sm:block min-w-[100px]">
                  {isPlayingToday ? (
                    <div>
                      <p className="text-xs font-semibold text-foreground">vs {today.opponent}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                        {today.pitcher !== "TBD" ? `vs ${today.pitcher}` : "TBD"}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/40">—</span>
                  )}
                </div>

                {/* Recent games dots */}
                <div className="flex gap-1 justify-end min-w-[80px]">
                  {hitter.recentGames.map((hit, j) => (
                    <div
                      key={`${hitter.id}-g-${j}`}
                      className={`h-2.5 w-2.5 rounded-full ${
                        isColdTab
                          ? hit ? "bg-emerald-400" : "bg-blue-400"
                          : hit ? "bg-emerald-400" : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Scanning all MLB rosters for active streaks..."
              : showPlayingToday
                ? "No players playing today with active streaks in this category."
                : "No active streaks found for this category."
            }
          </p>
        </div>
      )}
    </div>
  )
}
