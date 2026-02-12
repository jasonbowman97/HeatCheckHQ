"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import Link from "next/link"
import Image from "next/image"
import { BarChart3, Loader2, Shield, ChevronDown } from "lucide-react"
import type { TodayMatchup, MatchupInsight, Position, StatCategory, PositionRankingRow } from "@/lib/nba-defense-vs-position"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const POSITIONS: { key: Position; label: string }[] = [
  { key: "PG", label: "PG" },
  { key: "SG", label: "SG" },
  { key: "SF", label: "SF" },
  { key: "PF", label: "PF" },
  { key: "C", label: "C" },
]

const STAT_CATEGORIES: { key: StatCategory; label: string }[] = [
  { key: "PTS", label: "Points" },
  { key: "REB", label: "Rebounds" },
  { key: "AST", label: "Assists" },
  { key: "3PM", label: "3PM" },
]

type ViewMode = "matchups" | "rankings"

/* ── Reusable filter button group ── */

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  showAll,
}: {
  label: string
  options: { key: T; label: string }[]
  value: T | "ALL"
  onChange: (v: T | "ALL") => void
  showAll?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex rounded-lg border border-border overflow-hidden">
        {showAll && (
          <button
            onClick={() => onChange("ALL" as T | "ALL")}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              value === "ALL"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
        )}
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              value === opt.key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Page ── */

export default function DefenseVsPositionPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("matchups")
  const [filterPosition, setFilterPosition] = useState<Position | "ALL">("ALL")
  const [filterStat, setFilterStat] = useState<StatCategory | "ALL">("ALL")
  const [rankPosition, setRankPosition] = useState<Position>("PG")
  const [rankStat, setRankStat] = useState<StatCategory>("PTS")

  // Matchups data (always fetch so we have today's teams for rankings highlight)
  const { data: matchupsData, isLoading: matchupsLoading } = useSWR<{ matchups: TodayMatchup[] }>(
    "/api/nba/defense-vs-position?mode=matchups",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  // Rankings data
  const { data: rankingsData, isLoading: rankingsLoading } = useSWR<{ rankings: PositionRankingRow[] }>(
    viewMode === "rankings" ? `/api/nba/defense-vs-position?mode=rankings&position=${rankPosition}&stat=${rankStat}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  const matchups = matchupsData?.matchups ?? []
  const rankings = rankingsData?.rankings ?? []
  const isLoading = (viewMode === "matchups" && matchupsLoading) || (viewMode === "rankings" && rankingsLoading)

  // Collect today's team abbreviations for highlighting in rankings
  const todayTeams = useMemo(() => {
    const teams = new Set<string>()
    for (const m of matchups) {
      teams.add(m.awayTeam.abbr)
      teams.add(m.homeTeam.abbr)
    }
    return teams
  }, [matchups])

  function filterInsights(insights: MatchupInsight[]) {
    return insights.filter((i) => {
      if (filterPosition !== "ALL" && i.position !== filterPosition) return false
      if (filterStat !== "ALL" && !i.statCategory.toLowerCase().includes(filterStat.toLowerCase().replace("3pm", "3-pointer"))) return false
      return true
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">HeatCheck HQ</h1>
                <p className="text-xs text-muted-foreground">NBA Defense vs Position</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/mlb/hot-hitters" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              MLB
            </Link>
            <Link href="/nba/first-basket" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              First Basket
            </Link>
            <Link href="/nba/head-to-head" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              H2H
            </Link>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              Def vs Pos
            </span>
            <Link href="/nba/trends" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              Trends
            </Link>
            <div className="hidden sm:block h-5 w-px bg-border mx-1" />
            <Link href="/nfl/matchup" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary">
              NFL
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-6 flex flex-col gap-6">
        {/* Page heading */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Defense vs Position</h2>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground">
            Which teams allow the most stats to each position, mapped to tonight{"'"}s players.
          </p>
        </div>

        {/* View mode toggle + filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("matchups")}
              className={`px-4 py-2 text-xs font-semibold transition-colors ${
                viewMode === "matchups"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {"Today's Matchups"}
            </button>
            <button
              onClick={() => setViewMode("rankings")}
              className={`px-4 py-2 text-xs font-semibold transition-colors ${
                viewMode === "rankings"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              Full Rankings
            </button>
          </div>

          {viewMode === "matchups" && (
            <>
              <FilterGroup label="Position" options={POSITIONS} value={filterPosition} onChange={setFilterPosition} showAll />
              <FilterGroup label="Stat" options={STAT_CATEGORIES} value={filterStat} onChange={setFilterStat} showAll />
            </>
          )}

          {viewMode === "rankings" && (
            <>
              <FilterGroup label="Position" options={POSITIONS} value={rankPosition} onChange={(v) => { if (v !== "ALL") setRankPosition(v as Position) }} />
              <FilterGroup label="Stat" options={STAT_CATEGORIES} value={rankStat} onChange={(v) => { if (v !== "ALL") setRankStat(v as StatCategory) }} />
            </>
          )}
        </div>

        {/* Content */}
        {viewMode === "matchups" && (
          <MatchupsView
            matchups={matchups}
            isLoading={matchupsLoading}
            filterInsights={filterInsights}
          />
        )}

        {viewMode === "rankings" && (
          <RankingsView
            rankings={rankings}
            isLoading={rankingsLoading}
            position={rankPosition}
            stat={rankStat}
            todayTeams={todayTeams}
          />
        )}
      </main>
    </div>
  )
}

/* ── Rank badge color ── */

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-red-500/15 text-red-400 border-red-500/20"
  if (rank === 2) return "bg-orange-500/15 text-orange-400 border-orange-500/20"
  if (rank === 3) return "bg-amber-500/15 text-amber-400 border-amber-500/20"
  return "bg-secondary text-muted-foreground border-border"
}

function statUnit(category: string): string {
  if (category.toLowerCase().includes("point")) return "PPG"
  if (category.toLowerCase().includes("rebound")) return "RPG"
  if (category.toLowerCase().includes("assist")) return "APG"
  if (category.toLowerCase().includes("3-pointer")) return "3PM/G"
  return "/G"
}

/* ── Matchups View ── */

function MatchupsView({
  matchups,
  isLoading,
  filterInsights,
}: {
  matchups: TodayMatchup[]
  isLoading: boolean
  filterInsights: (insights: MatchupInsight[]) => MatchupInsight[]
}) {
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set())

  function toggleGame(eventId: string) {
    setExpandedGames((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Scanning box scores to build defensive rankings...
          </p>
          <p className="text-xs text-muted-foreground">This may take a moment on first load</p>
        </div>
      </div>
    )
  }

  if (matchups.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground">No Games Today</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Check back when NBA games are scheduled.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {matchups.map((matchup) => {
        const filtered = filterInsights(matchup.insights)
        const isExpanded = expandedGames.has(matchup.eventId)
        const displayInsights = isExpanded ? filtered : filtered.slice(0, 6)
        const gameDate = new Date(matchup.gameTime)
        const timeStr = gameDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZoneName: "short",
        })
        const dayStr = gameDate.toLocaleDateString("en-US", { weekday: "short" })

        return (
          <div
            key={matchup.eventId}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            {/* Game header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/80">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {matchup.awayTeam.logo && (
                    <Image
                      src={matchup.awayTeam.logo}
                      alt={matchup.awayTeam.abbr}
                      width={28}
                      height={28}
                      className="rounded"
                      unoptimized
                    />
                  )}
                  <span className="text-sm font-bold text-foreground">{matchup.awayTeam.abbr}</span>
                </div>
                <span className="text-xs text-muted-foreground">@</span>
                <div className="flex items-center gap-2">
                  {matchup.homeTeam.logo && (
                    <Image
                      src={matchup.homeTeam.logo}
                      alt={matchup.homeTeam.abbr}
                      width={28}
                      height={28}
                      className="rounded"
                      unoptimized
                    />
                  )}
                  <span className="text-sm font-bold text-foreground">{matchup.homeTeam.abbr}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {dayStr} {timeStr}
              </span>
            </div>

            {/* Insights */}
            <div className="px-5 py-3">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  No notable position matchups (top 5) for this game with current filters.
                </p>
              ) : (
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Last 14 Days
                  </p>
                  {displayInsights.map((insight, i) => (
                    <div
                      key={`${insight.teamAbbr}-${insight.position}-${insight.statCategory}-${i}`}
                      className="flex items-center gap-2 py-2 border-b border-dashed border-border/50 last:border-0"
                    >
                      {/* Rank badge */}
                      <span
                        className={`shrink-0 text-[10px] font-bold w-6 h-5 flex items-center justify-center rounded border ${rankBadgeClass(insight.rank)}`}
                      >
                        #{insight.rank}
                      </span>

                      {/* Insight text */}
                      <span className="text-sm text-muted-foreground flex-1 min-w-0">
                        <span className="text-foreground font-medium">{insight.teamAbbr}</span>
                        {" allow "}
                        <span className={`font-semibold ${insight.rank <= 2 ? "text-primary" : "text-foreground"}`}>
                          {insight.rankLabel}
                        </span>
                        {" "}{insight.statCategory} to {insight.position}
                      </span>

                      {/* Avg stat */}
                      <span className="shrink-0 text-xs font-bold text-foreground font-mono tabular-nums">
                        {insight.avgAllowed.toFixed(1)}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {statUnit(insight.statCategory)}
                      </span>

                      {/* Pipe + player name */}
                      <span className="shrink-0 text-xs text-muted-foreground mx-0.5">|</span>
                      <span className="shrink-0 text-sm font-bold text-foreground whitespace-nowrap">
                        {insight.playerName}
                      </span>
                    </div>
                  ))}

                  {filtered.length > 6 && (
                    <button
                      onClick={() => toggleGame(matchup.eventId)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2 py-1 transition-colors"
                    >
                      <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      {isExpanded ? "Show less" : `Show ${filtered.length - 6} more`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Rankings View ── */

function RankingsView({
  rankings,
  isLoading,
  position,
  stat,
  todayTeams,
}: {
  rankings: PositionRankingRow[]
  isLoading: boolean
  position: Position
  stat: StatCategory
  todayTeams: Set<string>
}) {
  const statLabel = STAT_CATEGORIES.find((c) => c.key === stat)?.label ?? stat

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading rankings...</p>
        </div>
      </div>
    )
  }

  if (rankings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">No ranking data available yet.</p>
      </div>
    )
  }

  const maxVal = rankings[0]?.avgAllowed ?? 1

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          {statLabel} Allowed to {position} — All 30 Teams
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ranked from most allowed (worst defense) to least. Based on last 14 days of box scores.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">Rank</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                Avg {statLabel} Allowed
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right w-20">GP</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-48" />
            </tr>
          </thead>
          <tbody>
            {rankings.map((row) => {
              const barWidth = maxVal > 0 ? (row.avgAllowed / maxVal) * 100 : 0
              const isTop5 = row.rank <= 5
              const isBottom5 = row.rank > 25
              const isPlaying = todayTeams.has(row.teamAbbr)

              return (
                <tr
                  key={row.teamAbbr}
                  className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${
                    isPlaying ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  <td className="px-5 py-3">
                    <span className={`text-sm font-bold ${isTop5 ? "text-primary" : isBottom5 ? "text-blue-400" : "text-foreground"}`}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{row.teamAbbr}</span>
                      <span className="text-xs text-muted-foreground hidden md:inline">{row.teamName}</span>
                      {isPlaying && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                          Tonight
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-sm font-bold tabular-nums ${isTop5 ? "text-primary" : "text-foreground"}`}>
                      {row.avgAllowed.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-xs text-muted-foreground tabular-nums">{row.gamesPlayed}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isTop5 ? "bg-primary" : isBottom5 ? "bg-blue-400/60" : "bg-muted-foreground/40"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
