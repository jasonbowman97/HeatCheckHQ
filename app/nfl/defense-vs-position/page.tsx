"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import Image from "next/image"
import { Loader2, Shield, ChevronDown } from "lucide-react"
import { NFLHeader } from "@/components/nfl/nfl-header"
import { SignupGate } from "@/components/signup-gate"
import { useUserTier } from "@/components/user-tier-provider"
import type {
  NFLDvpPosition,
  NFLDvpStat,
  NFLDvpMatchup,
  NFLDvpInsight,
  NFLDvpRankingRow,
} from "@/lib/nfl-defense-vs-position"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/* ── Position + stat filter options ── */

const POSITIONS: { key: NFLDvpPosition; label: string }[] = [
  { key: "QB", label: "QB" },
  { key: "RB", label: "RB" },
  { key: "WR", label: "WR" },
  { key: "TE", label: "TE" },
]

const STAT_OPTIONS: Record<NFLDvpPosition, { key: NFLDvpStat; label: string }[]> = {
  QB: [
    { key: "PASS_YDS", label: "Pass Yds" },
    { key: "PASS_TD", label: "Pass TDs" },
    { key: "QBR", label: "QBR" },
    { key: "SACKS", label: "Sacks" },
    { key: "INT", label: "INTs" },
  ],
  RB: [
    { key: "RUSH_YDS", label: "Rush Yds" },
    { key: "RUSH_TD", label: "Rush TDs" },
    { key: "YPC", label: "YPC" },
  ],
  WR: [
    { key: "REC_YDS", label: "Rec Yds" },
    { key: "REC_TD", label: "Rec TDs" },
    { key: "REC", label: "Receptions" },
    { key: "YPR", label: "YPR" },
  ],
  TE: [
    { key: "REC_YDS", label: "Rec Yds" },
    { key: "REC_TD", label: "Rec TDs" },
    { key: "REC", label: "Receptions" },
    { key: "YPR", label: "YPR" },
  ],
}

const DEFAULT_STAT: Record<NFLDvpPosition, NFLDvpStat> = {
  QB: "PASS_YDS",
  RB: "RUSH_YDS",
  WR: "REC_YDS",
  TE: "REC_YDS",
}

const POSITION_LABELS: Record<NFLDvpPosition, string> = {
  QB: "Quarterbacks",
  RB: "Running Backs",
  WR: "Wide Receivers",
  TE: "Tight Ends",
}

const INVERTED_STATS = new Set<NFLDvpStat>(["SACKS", "INT"])

type ViewMode = "matchups" | "rankings"

/* ── Reusable filter group ── */

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

/** Number of games/ranking rows visible to anonymous users */
const PREVIEW_GAMES = 2
const PREVIEW_RANKING_ROWS = 10

export default function NFLDefenseVsPositionPage() {
  const userTier = useUserTier()
  const isAnonymous = userTier === "anonymous"

  const [viewMode, setViewMode] = useState<ViewMode>("matchups")
  const [filterPosition, setFilterPosition] = useState<NFLDvpPosition | "ALL">("ALL")
  const [filterStat, setFilterStat] = useState<NFLDvpStat | "ALL">("ALL")
  const [rankPosition, setRankPosition] = useState<NFLDvpPosition>("QB")
  const [rankStat, setRankStat] = useState<NFLDvpStat>("PASS_YDS")

  // Matchups data
  const { data: matchupsData, isLoading: matchupsLoading } = useSWR<{ matchups: NFLDvpMatchup[] }>(
    "/api/nfl/dvp?mode=matchups",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  // Rankings data
  const { data: rankingsData, isLoading: rankingsLoading } = useSWR<{ rankings: NFLDvpRankingRow[] }>(
    viewMode === "rankings" ? `/api/nfl/dvp?mode=rankings&position=${rankPosition}&stat=${rankStat}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  const matchups = matchupsData?.matchups ?? []
  const rankings = rankingsData?.rankings ?? []
  const isLoading = (viewMode === "matchups" && matchupsLoading) || (viewMode === "rankings" && rankingsLoading)

  // Collect this week's team abbreviations for highlighting in rankings
  const weekTeams = useMemo(() => {
    const teams = new Set<string>()
    for (const m of matchups) {
      teams.add(m.awayTeam.abbr)
      teams.add(m.homeTeam.abbr)
    }
    return teams
  }, [matchups])

  // When changing ranking position, reset stat to default for that position
  function handleRankPositionChange(pos: NFLDvpPosition | "ALL") {
    if (pos === "ALL") return
    setRankPosition(pos)
    setRankStat(DEFAULT_STAT[pos])
  }

  function filterInsights(insights: NFLDvpInsight[]) {
    return insights.filter((i) => {
      if (filterPosition !== "ALL" && i.position !== filterPosition) return false
      if (filterStat !== "ALL" && i.stat !== filterStat) return false
      return true
    })
  }

  // Build combined stat filter for matchups view
  const matchupStatOptions = useMemo(() => {
    if (filterPosition === "ALL") {
      // Show unique stats across all positions
      const seen = new Set<NFLDvpStat>()
      const opts: { key: NFLDvpStat; label: string }[] = []
      for (const pos of POSITIONS) {
        for (const s of STAT_OPTIONS[pos.key]) {
          if (!seen.has(s.key)) {
            seen.add(s.key)
            opts.push(s)
          }
        }
      }
      return opts
    }
    return STAT_OPTIONS[filterPosition as NFLDvpPosition] ?? []
  }, [filterPosition])

  return (
    <div className="min-h-screen bg-background">
      <NFLHeader />

      <main className="mx-auto max-w-[1440px] px-6 py-6 flex flex-col gap-6">
        {/* Page heading */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Defense vs Position</h2>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground">
            Which defenses allow the most stats to each position — QB, RB, WR, TE.
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
              {"This Week's Matchups"}
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
              <FilterGroup label="Stat" options={matchupStatOptions} value={filterStat} onChange={setFilterStat} showAll />
            </>
          )}

          {viewMode === "rankings" && (
            <>
              <FilterGroup label="Position" options={POSITIONS} value={rankPosition} onChange={handleRankPositionChange} />
              <FilterGroup
                label="Stat"
                options={STAT_OPTIONS[rankPosition]}
                value={rankStat}
                onChange={(v) => { if (v !== "ALL") setRankStat(v as NFLDvpStat) }}
              />
            </>
          )}
        </div>

        {/* Content */}
        {viewMode === "matchups" && (
          isAnonymous && matchups.length > PREVIEW_GAMES ? (
            <SignupGate
              headline="See every matchup breakdown — free"
              description="Unlock all defensive insights for this week's games. Free forever, no credit card."
              countLabel={`${matchups.length} games this week — updated daily`}
              preview={
                <MatchupsView
                  matchups={matchups.slice(0, PREVIEW_GAMES)}
                  isLoading={matchupsLoading}
                  filterInsights={filterInsights}
                />
              }
              gated={
                <MatchupsView
                  matchups={matchups.slice(PREVIEW_GAMES)}
                  isLoading={false}
                  filterInsights={filterInsights}
                />
              }
            />
          ) : (
            <MatchupsView
              matchups={matchups}
              isLoading={matchupsLoading}
              filterInsights={filterInsights}
            />
          )
        )}

        {viewMode === "rankings" && (
          isAnonymous && rankings.length > PREVIEW_RANKING_ROWS ? (
            <SignupGate
              headline="See all 32 teams ranked — free"
              description="Unlock the complete defensive rankings by position. Free forever, no credit card."
              countLabel={`${rankings.length} teams ranked — find the weakest defenses`}
              preview={
                <RankingsView
                  rankings={rankings.slice(0, PREVIEW_RANKING_ROWS)}
                  isLoading={rankingsLoading}
                  position={rankPosition}
                  stat={rankStat}
                  weekTeams={weekTeams}
                />
              }
              gated={
                <RankingsView
                  rankings={rankings.slice(PREVIEW_RANKING_ROWS)}
                  isLoading={false}
                  position={rankPosition}
                  stat={rankStat}
                  weekTeams={weekTeams}
                />
              }
            />
          ) : (
            <RankingsView
              rankings={rankings}
              isLoading={rankingsLoading}
              position={rankPosition}
              stat={rankStat}
              weekTeams={weekTeams}
            />
          )
        )}
      </main>
    </div>
  )
}

/* ── Rank badge color ── */

function rankBadgeClass(rank: number): string {
  if (rank <= 3) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
  return "bg-secondary text-muted-foreground border-border"
}

/* ── Matchups View ── */

function MatchupsView({
  matchups,
  isLoading,
  filterInsights,
}: {
  matchups: NFLDvpMatchup[]
  isLoading: boolean
  filterInsights: (insights: NFLDvpInsight[]) => NFLDvpInsight[]
}) {
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set())

  function toggleGame(gameId: string) {
    setExpandedGames((prev) => {
      const next = new Set(prev)
      if (next.has(gameId)) next.delete(gameId)
      else next.add(gameId)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading defensive rankings...</p>
        </div>
      </div>
    )
  }

  if (matchups.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground">No Games This Week</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Check back when NFL games are scheduled, or switch to Full Rankings.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {matchups.map((matchup) => {
        const filtered = filterInsights(matchup.insights)
        const isExpanded = expandedGames.has(matchup.gameId)
        const displayInsights = isExpanded ? filtered : filtered.slice(0, 6)

        return (
          <div
            key={matchup.gameId}
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

                    />
                  )}
                  <span className="text-sm font-bold text-foreground">{matchup.homeTeam.abbr}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {matchup.week}
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
                    Defensive Weaknesses
                  </p>
                  {displayInsights.map((insight, i) => (
                    <div
                      key={`${insight.defenseAbbr}-${insight.position}-${insight.stat}-${i}`}
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
                        <span className="text-foreground font-medium">{insight.defenseAbbr}</span>
                        {" allow "}
                        <span className={`font-semibold ${insight.rank <= 2 ? "text-emerald-400" : "text-foreground"}`}>
                          {insight.rankLabel}
                        </span>
                        {" "}{insight.statLabel} to {POSITION_LABELS[insight.position]}
                      </span>

                      {/* Value */}
                      <span className="shrink-0 text-xs font-bold text-foreground font-mono tabular-nums">
                        {insight.value.toFixed(1)}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {insight.unit}
                      </span>
                    </div>
                  ))}

                  {filtered.length > 6 && (
                    <button
                      onClick={() => toggleGame(matchup.gameId)}
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
  weekTeams,
}: {
  rankings: NFLDvpRankingRow[]
  isLoading: boolean
  position: NFLDvpPosition
  stat: NFLDvpStat
  weekTeams: Set<string>
}) {
  const statLabel = STAT_OPTIONS[position]?.find((s) => s.key === stat)?.label ?? stat
  const isInverted = INVERTED_STATS.has(stat)

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

  const maxVal = Math.max(...rankings.map((r) => r.value), 1)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          {statLabel} Allowed to {POSITION_LABELS[position]} — All 32 Teams
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isInverted
            ? "Ranked from fewest allowed (best matchup for offense) to most."
            : "Ranked from most allowed (worst defense) to least."
          }
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">Rank</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team</th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                {statLabel} Allowed
              </th>
              <th className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-48" />
            </tr>
          </thead>
          <tbody>
            {rankings.map((row) => {
              const barWidth = maxVal > 0 ? (row.value / maxVal) * 100 : 0
              const isTop5 = row.rank <= 5
              const isBottom5 = row.rank > 27
              const isPlaying = weekTeams.has(row.teamAbbr)

              return (
                <tr
                  key={row.teamAbbr}
                  className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${
                    isPlaying ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  <td className="px-5 py-3">
                    <span className={`text-sm font-bold ${isTop5 ? "text-emerald-400" : isBottom5 ? "text-red-400" : "text-foreground"}`}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {row.logo && (
                        <Image
                          src={row.logo}
                          alt={row.teamAbbr}
                          width={20}
                          height={20}
                          className="rounded"
    
                        />
                      )}
                      <span className="text-sm font-semibold text-foreground">{row.teamAbbr}</span>
                      {isPlaying && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                          This Week
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-sm font-bold tabular-nums ${isTop5 ? "text-emerald-400" : isBottom5 ? "text-red-400" : "text-foreground"}`}>
                      {row.value.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isTop5 ? "bg-emerald-400/70" : isBottom5 ? "bg-red-400/60" : "bg-muted-foreground/40"
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
