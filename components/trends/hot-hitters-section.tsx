"use client"

import { useState } from "react"
import useSWR from "swr"
import { Flame, Zap, Target, Loader2 } from "lucide-react"
import type { HotHitter } from "@/lib/hot-hitters"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type StreakTab = "hitting" | "xbh" | "hr"

const tabs: { key: StreakTab; label: string; icon: typeof Flame; description: string }[] = [
  {
    key: "hitting",
    label: "Hitting Streaks",
    icon: Flame,
    description: "Consecutive games with at least one hit",
  },
  {
    key: "xbh",
    label: "XBH Streaks",
    icon: Zap,
    description: "Consecutive games with an extra-base hit (2B, 3B, HR)",
  },
  {
    key: "hr",
    label: "HR Streaks",
    icon: Target,
    description: "Consecutive games with a home run",
  },
]

// Fallback data to show while the API is loading or if it fails
const fallbackHitters: HotHitter[] = [
  {
    id: "hit-fb-1", playerId: "fb1", playerName: "Bobby Witt Jr.", team: "KC", position: "SS",
    streakType: "hitting", streakLength: 12, headline: "12-game hitting streak",
    detail: "Has recorded at least one hit in each of his last 12 games, batting .410 over that span.",
    recentGames: [true, true, true, true, true, true, true, true, true, true], statValue: ".410", statLabel: "AVG L12",
  },
  {
    id: "hit-fb-2", playerId: "fb2", playerName: "Juan Soto", team: "NYM", position: "RF",
    streakType: "hitting", streakLength: 9, headline: "9-game hitting streak",
    detail: "Consistently reaching base with hits in 9 consecutive games.",
    recentGames: [true, true, true, true, true, true, true, true, true], statValue: ".389", statLabel: "AVG L9",
  },
  {
    id: "hit-fb-3", playerId: "fb3", playerName: "Freddie Freeman", team: "LAD", position: "1B",
    streakType: "hitting", streakLength: 8, headline: "8-game hitting streak",
    detail: "Recording hits consistently over his last 8 games with a .375 average.",
    recentGames: [true, true, true, true, true, true, true, true], statValue: ".375", statLabel: "AVG L8",
  },
  {
    id: "xbh-fb-1", playerId: "fb4", playerName: "Trea Turner", team: "PHI", position: "SS",
    streakType: "xbh", streakLength: 5, headline: "XBH in 5 straight games",
    detail: "6 extra-base hits across 5 consecutive games: 3 doubles, 1 triple, and 2 home runs.",
    recentGames: [true, true, true, true, true], statValue: "6 XBH", statLabel: "Last 5 gms",
  },
  {
    id: "xbh-fb-2", playerId: "fb5", playerName: "Shohei Ohtani", team: "LAD", position: "DH",
    streakType: "xbh", streakLength: 4, headline: "XBH in 4 straight games",
    detail: "5 extra-base hits across 4 consecutive games with elite bat speed.",
    recentGames: [true, true, true, true, false], statValue: "5 XBH", statLabel: "Last 4 gms",
  },
  {
    id: "xbh-fb-3", playerId: "fb6", playerName: "Mookie Betts", team: "LAD", position: "SS",
    streakType: "xbh", streakLength: 3, headline: "XBH in 3 straight games",
    detail: "4 extra-base hits over the last 3 games including 2 home runs.",
    recentGames: [true, true, true, false, false], statValue: "4 XBH", statLabel: "Last 3 gms",
  },
  {
    id: "hr-fb-1", playerId: "fb7", playerName: "Aaron Judge", team: "NYY", position: "RF",
    streakType: "hr", streakLength: 4, headline: "HR in 4 straight games",
    detail: "5 home runs across 4 consecutive games. Exit velo averaging 108.2 mph.",
    recentGames: [true, true, true, true, false], statValue: "5 HR", statLabel: "Last 4 gms",
  },
  {
    id: "hr-fb-2", playerId: "fb8", playerName: "Kyle Schwarber", team: "PHI", position: "DH",
    streakType: "hr", streakLength: 3, headline: "HR in 3 straight games",
    detail: "4 total home runs in his last 3 games. Pulling the ball at a 52% rate.",
    recentGames: [true, true, true, false, false], statValue: "4 HR", statLabel: "Last 3 gms",
  },
  {
    id: "hr-fb-3", playerId: "fb9", playerName: "Pete Alonso", team: "NYM", position: "1B",
    streakType: "hr", streakLength: 2, headline: "HR in 2 straight games",
    detail: "3 home runs across his last 2 games with a 1.200 SLG.",
    recentGames: [true, true, false, false, false], statValue: "3 HR", statLabel: "Last 2 gms",
  },
]

export function HotHittersSection() {
  const [activeTab, setActiveTab] = useState<StreakTab>("hitting")
  const { data, isLoading } = useSWR<{ streaks: HotHitter[]; cached?: boolean }>(
    "/api/hot-hitters",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  const liveStreaks = data?.streaks ?? []
  const hasLiveData = liveStreaks.length > 0
  const streaks = hasLiveData ? liveStreaks : fallbackHitters

  const filtered = streaks.filter((h) => h.streakType === activeTab)
  const activeTabInfo = tabs.find((t) => t.key === activeTab)!

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
              Sample data
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Players on active streaks across all MLB rosters -- not just top players. Updated by scanning every active batter.
        </p>
      </div>

      {/* Streak type tabs */}
      <div className="flex items-center rounded-lg border border-border bg-card p-1 gap-1 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const count = streaks.filter((h) => h.streakType === tab.key).length
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Tab description */}
      <p className="text-xs text-muted-foreground">
        {activeTabInfo.description} -- showing {filtered.length} player{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Streak table */}
      {filtered.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border bg-secondary/30">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Player</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Streak</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Stat</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right min-w-[80px]">Recent</span>
          </div>

          {/* Rows */}
          {filtered.map((hitter, i) => (
            <div
              key={hitter.id}
              className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-secondary/20 ${
                i < filtered.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              {/* Player */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold text-foreground truncate">{hitter.playerName}</span>
                <span className="text-[11px] text-muted-foreground">
                  {hitter.team} &middot; {hitter.position}
                </span>
              </div>

              {/* Streak length */}
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                  {hitter.streakLength}
                </span>
                <span className="text-[10px] text-muted-foreground">gms</span>
              </div>

              {/* Stat */}
              <div className="text-right">
                <p className="text-sm font-bold font-mono tabular-nums text-foreground">{hitter.statValue}</p>
                <p className="text-[10px] text-muted-foreground">{hitter.statLabel}</p>
              </div>

              {/* Recent games dots */}
              <div className="flex gap-1 justify-end min-w-[80px]">
                {hitter.recentGames.map((hit, j) => (
                  <div
                    key={`${hitter.id}-g-${j}`}
                    className={`h-2.5 w-2.5 rounded-full ${
                      hit ? "bg-emerald-400" : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Scanning all MLB rosters for active streaks..." : "No active streaks found for this category."}
          </p>
        </div>
      )}
    </div>
  )
}
