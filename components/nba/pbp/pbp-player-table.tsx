"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { ChevronDown, ChevronUp, Trophy, Share2, Search } from "lucide-react"
import { ShareCapture } from "@/components/ui/share-capture"

/* ─── Types ─── */

export interface PBPPlayer {
  athleteId: string
  athleteName: string
  team: string
  headshotUrl?: string
  // For first-basket / first-team-fg / 2H props
  firstCount?: number
  rate?: number
  // For first-3min scoring
  avgPoints?: number
  hitCount?: number
  hitRate?: number
  // Common
  gamesInWindow: number
  recentResults: {
    date: string
    points?: number
    hit?: boolean
    scored?: boolean
    opponent: string
    isHome: boolean
    gameId?: string
  }[]
  opponent: string | null
  isHome: boolean
  playsToday?: boolean
}

export interface TodayGame {
  away: string
  home: string
  awayLogo?: string
  homeLogo?: string
}

type TableMode = "first-basket" | "scoring"

interface PBPPlayerTableProps {
  players: PBPPlayer[]
  mode: TableMode
  label: string
  todayGames?: TodayGame[]
  threshold?: number
  maxRows?: number
  skipRows?: number
  showTopPicks?: boolean
}

/* ─── Helpers ─── */

function hitRateColor(rate: number, mode: TableMode): { text: string; bg: string } {
  if (mode === "scoring") {
    if (rate >= 80) return { text: "text-emerald-400", bg: "bg-emerald-400/10" }
    if (rate >= 60) return { text: "text-emerald-300", bg: "bg-emerald-300/10" }
    if (rate >= 40) return { text: "text-amber-400", bg: "bg-amber-400/10" }
    return { text: "text-red-400", bg: "bg-red-400/10" }
  }
  // first-basket mode — rates are lower (typically 5-30%)
  if (rate >= 25) return { text: "text-emerald-400", bg: "bg-emerald-400/15" }
  if (rate >= 15) return { text: "text-emerald-300", bg: "bg-emerald-400/10" }
  if (rate >= 8) return { text: "text-amber-400", bg: "bg-amber-400/10" }
  return { text: "text-muted-foreground", bg: "bg-secondary" }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/**
 * Top Picks score for PBP-based props.
 * Factors:
 *  - Rate: How often the player achieves the prop (0-100)
 *  - Volume: Higher games played = more reliable
 *  - Recency: Streak bonus — recent consecutive hits
 *  - Matchup: Playing today gives a relevance bonus
 */
function pbpPickScore(player: PBPPlayer, mode: TableMode): number {
  const rate = mode === "scoring" ? (player.hitRate ?? 0) : (player.rate ?? 0)
  const games = player.gamesInWindow

  // Normalize rate (0-1)
  const rateScore = mode === "scoring" ? rate / 100 : rate / 30 // 30% is elite for first-basket

  // Volume factor (diminishing returns, min 5 games)
  const volumeScore = Math.min(games / 30, 1)

  // Streak bonus: count consecutive recent hits
  let streak = 0
  for (const r of player.recentResults) {
    if (mode === "scoring" ? r.hit : r.scored) {
      streak++
    } else break
  }
  const streakBonus = Math.min(streak / 5, 0.3)

  // Matchup bonus
  const matchupBonus = player.playsToday ? 0.15 : 0

  return (rateScore * 0.5) + (volumeScore * 0.2) + (streakBonus) + (matchupBonus)
}

/* ─── Sort Header ─── */

function SortHeader({
  label,
  column,
  sortColumn,
  sortDir,
  onSort,
  className = "",
}: {
  label: string
  column: string
  sortColumn: string
  sortDir: "asc" | "desc"
  onSort: (col: string) => void
  className?: string
}) {
  const active = sortColumn === column
  return (
    <th
      className={`px-3 py-3 text-[10px] font-bold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-foreground ${
        active ? "text-primary" : "text-muted-foreground"
      } ${className}`}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active &&
          (sortDir === "desc" ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          ))}
      </span>
    </th>
  )
}

/* ─── Top Picks Component ─── */

function PBPTopPicks({ players, mode, label }: { players: PBPPlayer[]; mode: TableMode; label: string }) {
  // Only show players who play today and have 5+ games
  const eligible = players.filter(
    (p) => p.playsToday && p.gamesInWindow >= 5
  )
  if (eligible.length === 0) return null

  const topPicks = [...eligible]
    .sort((a, b) => pbpPickScore(b, mode) - pbpPickScore(a, mode))
    .slice(0, 5)

  return (
    <ShareCapture label={`Tonight's Top ${label} Picks`}>
      <div className="rounded-xl border border-primary/20 bg-primary/[0.02] overflow-hidden">
        <div className="px-4 py-3 border-b border-primary/10 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Tonight{"'"}s Top Picks</span>
          <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline">
            Based on hit rate, consistency, streak, and matchup
          </span>
          <button
            onClick={() => {
              const text = topPicks
                .slice(0, 3)
                .map((p, i) => {
                  const stat = mode === "scoring"
                    ? `${p.avgPoints?.toFixed(1)} avg pts (${p.hitRate?.toFixed(0)}% hit rate)`
                    : `${p.rate?.toFixed(1)}% rate (${p.firstCount}/${p.gamesInWindow})`
                  return `${i + 1}. ${p.athleteName} (${p.team}) — ${stat}`
                })
                .join("\n")
              const shareText = `Tonight's Top ${label} Picks\n${text}\n\nFull analysis at heatcheckhq.io`
              if (navigator.share) {
                navigator.share({ text: shareText }).catch(() => {})
              } else {
                navigator.clipboard.writeText(shareText).catch(() => {})
              }
            }}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-primary/5"
            title="Share tonight's picks"
          >
            <Share2 className="h-3 w-3" />
            Share
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
          {topPicks.map((pick, i) => {
            const mainStat = mode === "scoring" ? pick.avgPoints?.toFixed(1) : `${pick.rate?.toFixed(1)}%`
            const mainLabel = mode === "scoring" ? "Avg Pts" : "Rate"
            const subStat = mode === "scoring"
              ? `${pick.hitCount}/${pick.gamesInWindow}`
              : `${pick.firstCount}/${pick.gamesInWindow}`
            const subLabel = "Made"

            return (
              <div key={pick.athleteId} className="px-4 py-3 flex items-center gap-3 sm:flex-col sm:items-center sm:text-center sm:py-4">
                {/* Rank badge */}
                <div className={`shrink-0 flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                  i === 0 ? "bg-primary/20 text-primary" :
                  i === 1 ? "bg-amber-500/20 text-amber-400" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                {/* Player info */}
                <div className="flex items-center gap-2.5 sm:flex-col sm:gap-1.5">
                  {pick.headshotUrl ? (
                    <Image
                      src={pick.headshotUrl}
                      alt={pick.athleteName}
                      width={48}
                      height={35}
                      className="rounded-full bg-secondary shrink-0 h-11 w-11 object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-secondary shrink-0" />
                  )}
                  <div className="flex flex-col sm:items-center">
                    <span className="text-sm font-semibold text-foreground">{pick.athleteName}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {pick.team} {pick.opponent && <>{pick.isHome ? "vs" : "@"} {pick.opponent}</>}
                    </span>
                  </div>
                </div>
                {/* Key stats */}
                <div className="ml-auto flex items-center gap-3 sm:ml-0 sm:mt-1">
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-primary font-mono tabular-nums">{mainStat}</span>
                    <span className="text-[9px] text-muted-foreground uppercase">{mainLabel}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold font-mono tabular-nums text-foreground">{subStat}</span>
                    <span className="text-[9px] text-muted-foreground uppercase">{subLabel}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ShareCapture>
  )
}

/* ─── Game Filter ─── */

function GameFilter({
  todayGames,
  gameFilter,
  setGameFilter,
  teamFilter,
  setTeamFilter,
}: {
  todayGames: TodayGame[]
  gameFilter: string
  setGameFilter: (v: string) => void
  teamFilter: string | null
  setTeamFilter: (v: string | null) => void
}) {
  if (!todayGames.length) return null

  // Parse the selected matchup to show team sub-filter
  const isMatchupSelected = gameFilter !== "all" && gameFilter !== "today" && gameFilter.includes("-")
  const matchupTeams = isMatchupSelected ? gameFilter.split("-") : []

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by game">
        <span className="text-xs text-muted-foreground mr-1">{"Today's games:"}</span>
        <button
          onClick={() => { setGameFilter("all"); setTeamFilter(null) }}
          aria-pressed={gameFilter === "all"}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            gameFilter === "all"
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
          }`}
        >
          All Players
        </button>
        <button
          onClick={() => { setGameFilter("today"); setTeamFilter(null) }}
          aria-pressed={gameFilter === "today"}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            gameFilter === "today"
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
          }`}
        >
          Today Only
        </button>
        {todayGames.map((game) => {
          const key = `${game.away}-${game.home}`
          return (
            <button
              key={key}
              onClick={() => { setGameFilter(gameFilter === key ? "today" : key); setTeamFilter(null) }}
              aria-pressed={gameFilter === key}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                gameFilter === key
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {game.awayLogo && (
                <Image src={game.awayLogo} alt={game.away} width={16} height={16} className="rounded" />
              )}
              {game.away} @ {game.home}
              {game.homeLogo && (
                <Image src={game.homeLogo} alt={game.home} width={16} height={16} className="rounded" />
              )}
            </button>
          )
        })}
      </div>

      {/* Team sub-filter — only shows when a specific matchup is selected */}
      {isMatchupSelected && matchupTeams.length === 2 && (
        <div className="flex items-center gap-2" role="group" aria-label="Filter by team">
          <span className="text-xs text-muted-foreground mr-1">Team:</span>
          <button
            onClick={() => setTeamFilter(null)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              teamFilter === null
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            Both
          </button>
          {matchupTeams.map((team) => (
            <button
              key={team}
              onClick={() => setTeamFilter(teamFilter === team ? null : team)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                teamFilter === team
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {team}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Main Table Component ─── */

export function PBPPlayerTable({
  players,
  mode,
  label,
  todayGames = [],
  threshold,
  maxRows,
  skipRows = 0,
  showTopPicks = false,
}: PBPPlayerTableProps) {
  const [sortColumn, setSortColumn] = useState(mode === "scoring" ? "avgPoints" : "rate")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  // Default to "today" when there are games today, so users see relevant players first
  const [gameFilter, setGameFilter] = useState(todayGames.length > 0 ? "today" : "all")
  const [teamFilter, setTeamFilter] = useState<string | null>(null)
  const [minGP, setMinGP] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  function handleSort(col: string) {
    if (sortColumn === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(col)
      setSortDir("desc")
    }
  }

  const handleGameFilterChange = (v: string) => {
    setGameFilter(v)
    setTeamFilter(null)
  }

  // Filter by game, team, min GP, and search
  const filtered = useMemo(() => {
    let result = players

    // Game filter
    if (gameFilter === "today") {
      result = result.filter((p) => p.playsToday)
    } else if (gameFilter !== "all") {
      const [away, home] = gameFilter.split("-")
      result = result.filter((p) => p.team === away || p.team === home)
    }

    // Team filter (within a matchup)
    if (teamFilter) {
      result = result.filter((p) => p.team === teamFilter)
    }

    // Min GP filter
    if (minGP > 0) {
      result = result.filter((p) => p.gamesInWindow >= minGP)
    }

    // Player search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter((p) => p.athleteName.toLowerCase().includes(q))
    }

    return result
  }, [players, gameFilter, teamFilter, minGP, searchQuery])

  // Sort
  const sorted = useMemo(() => {
    const s = [...filtered].sort((a, b) => {
      const aVal = (a as unknown as Record<string, number>)[sortColumn] ?? 0
      const bVal = (b as unknown as Record<string, number>)[sortColumn] ?? 0
      return sortDir === "desc" ? bVal - aVal : aVal - bVal
    })

    // When a matchup is selected with no team filter, group by team
    const isMatchupSelected = gameFilter !== "all" && gameFilter !== "today" && gameFilter.includes("-") && !teamFilter
    if (isMatchupSelected) {
      const [away, home] = gameFilter.split("-")
      const awayPlayers = s.filter((p) => p.team === away)
      const homePlayers = s.filter((p) => p.team === home)
      return [...awayPlayers, ...homePlayers]
    }

    return s
  }, [filtered, sortColumn, sortDir, gameFilter, teamFilter])

  const displayed = maxRows
    ? sorted.slice(skipRows, skipRows + maxRows)
    : sorted.slice(skipRows)

  const isScoring = mode === "scoring"

  // Detect team separator for grouped display
  const isMatchupGrouped = gameFilter !== "all" && gameFilter !== "today" && gameFilter.includes("-") && !teamFilter
  const [awayTeam, homeTeam] = isMatchupGrouped ? gameFilter.split("-") : ["", ""]

  return (
    <>
      {/* Top Picks (before the table) */}
      {showTopPicks && skipRows === 0 && (
        <PBPTopPicks players={players} mode={mode} label={label} />
      )}

      {/* Game filter */}
      {todayGames.length > 0 && skipRows === 0 && (
        <GameFilter
          todayGames={todayGames}
          gameFilter={gameFilter}
          setGameFilter={handleGameFilterChange}
          teamFilter={teamFilter}
          setTeamFilter={setTeamFilter}
        />
      )}

      {/* Extra filters: Min GP + Player Search */}
      {skipRows === 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Min GP filter */}
          <div className="flex items-center gap-2" role="group" aria-label="Minimum games played">
            <span className="text-xs text-muted-foreground">Min GP:</span>
            {[0, 5, 10, 20, 30].map((gp) => (
              <button
                key={gp}
                onClick={() => setMinGP(gp)}
                aria-pressed={minGP === gp}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  minGP === gp
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                {gp === 0 ? "All" : `${gp}+`}
              </button>
            ))}
          </div>

          {/* Player search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search player..."
              className="h-8 w-44 rounded-md border border-border bg-secondary pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        </div>
      )}

      <ShareCapture label={label}>
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-10">
                    #
                  </th>
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary min-w-[180px]">
                    Player
                  </th>
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <span className="hidden lg:inline">Recent Games</span>
                    <span className="lg:hidden">Recent</span>
                  </th>
                  {isScoring ? (
                    <>
                      <SortHeader label="Avg Pts" column="avgPoints" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} className="text-right w-16" />
                      <SortHeader label="Hit Rate" column="hitRate" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} className="text-center w-20" />
                      <SortHeader label="GP" column="gamesInWindow" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} className="text-center w-16" />
                    </>
                  ) : (
                    <>
                      <SortHeader label="Rate" column="rate" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} className="text-center w-20" />
                      <SortHeader label="Made" column="firstCount" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} className="text-center w-16" />
                      <SortHeader label="GP" column="gamesInWindow" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} className="text-center w-16" />
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {displayed.map((player, i) => {
                  const rank = skipRows + i + 1
                  const rate = isScoring ? (player.hitRate ?? 0) : (player.rate ?? 0)
                  const colors = hitRateColor(rate, mode)

                  // Team separator row when matchup is grouped
                  const showTeamSeparator = isMatchupGrouped && i > 0 && displayed[i - 1]?.team !== player.team
                  const isFirstGroup = isMatchupGrouped && i === 0

                  return (
                    <>
                      {/* Team header separator */}
                      {(showTeamSeparator || isFirstGroup) && (
                        <tr key={`sep-${player.team}`} className="bg-secondary/50">
                          <td colSpan={isScoring ? 6 : 6} className="px-3 py-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                              {player.team === awayTeam ? `${awayTeam} (Away)` : `${homeTeam} (Home)`}
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr
                        key={player.athleteId}
                        className="border-b border-border/50 last:border-b-0 hover:bg-secondary/30 transition-colors"
                      >
                        {/* Rank */}
                        <td className="px-3 py-2.5 text-xs font-medium text-muted-foreground">
                          {rank}
                        </td>

                        {/* Player with headshot */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {player.headshotUrl ? (
                              <Image
                                src={player.headshotUrl}
                                alt={player.athleteName}
                                width={36}
                                height={26}
                                className="rounded bg-secondary shrink-0 h-8 w-8 object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="h-8 w-8 rounded bg-secondary shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {player.athleteName}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {player.team}
                                {player.opponent && (
                                  <span
                                    className={`ml-1 ${
                                      player.isHome
                                        ? "text-emerald-400"
                                        : "text-blue-400"
                                    }`}
                                  >
                                    {player.isHome ? "vs" : "@"} {player.opponent}
                                  </span>
                                )}
                                {!player.playsToday && player.opponent === null && (
                                  <span className="ml-1 text-muted-foreground/50">
                                    no game
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Recent games — oldest on left, most recent on right */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-0.5">
                            {[...player.recentResults.slice(0, 10)].reverse().map((g, j) => {
                              const isHit = isScoring ? g.hit : g.scored
                              const displayValue = isScoring ? g.points : (isHit ? "✓" : "✗")
                              const tooltipText = `${formatDate(g.date)} ${g.isHome ? "vs" : "@"} ${g.opponent}${isScoring ? ` — ${g.points} pts` : isHit ? " — Scored first" : " — No"}`

                              return (
                                <div key={j} className="relative group" title={tooltipText}>
                                  {/* Desktop: show value in box */}
                                  <div
                                    className={`hidden md:flex items-center justify-center w-7 h-7 rounded text-[10px] font-bold border transition-colors ${
                                      isHit
                                        ? "bg-emerald-400/10 text-emerald-400 border-emerald-500/20"
                                        : "bg-red-400/10 text-red-400/60 border-red-500/10"
                                    }`}
                                  >
                                    {displayValue}
                                  </div>
                                  {/* Mobile: dots */}
                                  <div
                                    className={`md:hidden w-3 h-3 rounded-full ${
                                      isHit ? "bg-emerald-400" : "bg-red-400/30"
                                    }`}
                                  />
                                  {/* Tooltip on hover */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20 pointer-events-none">
                                    <div className="bg-popover text-popover-foreground border border-border rounded-md px-2 py-1 text-[10px] whitespace-nowrap shadow-lg">
                                      <div className="font-semibold">{formatDate(g.date)} {g.isHome ? "vs" : "@"} {g.opponent}</div>
                                      {isScoring && <div>{g.points} pts</div>}
                                      {!isScoring && <div>{isHit ? "Scored first" : "Did not score first"}</div>}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </td>

                        {/* Stats columns */}
                        {isScoring ? (
                          <>
                            <td className="px-3 py-2.5 text-right">
                              <span className="text-sm font-bold text-foreground font-mono tabular-nums">
                                {player.avgPoints?.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md ${colors.text} ${colors.bg}`}>
                                {player.hitCount}/{player.gamesInWindow}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                                {player.gamesInWindow}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md ${colors.text} ${colors.bg}`}>
                                {player.rate?.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="text-sm font-bold text-foreground font-mono tabular-nums">
                                {player.firstCount}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                                {player.gamesInWindow}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ShareCapture>
    </>
  )
}
