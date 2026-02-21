"use client"

import { useState, useCallback, useMemo } from "react"
import useSWR from "swr"
import { Loader2, Zap, ArrowRight, AlertCircle, RefreshCw, Lock, Users, BarChart3, Target } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { DashboardShell } from "@/components/dashboard-shell"
import { DateNavigator } from "@/components/nba/date-navigator"
import { FirstBasketTable, buildRows, type SplitView } from "@/components/nba/first-basket-table"
import { TopPicks } from "@/components/nba/top-picks"
import { SignupGate } from "@/components/signup-gate"
import { LastUpdated } from "@/components/ui/last-updated"
import { SectionInfoTip } from "@/components/ui/section-info-tip"
import { useUserTier } from "@/components/user-tier-provider"
import { GameWindowFilter, type GameWindow } from "@/components/nba/pbp/game-window-filter"
import { ShareCapture } from "@/components/ui/share-capture"
import type { NBAScheduleGame } from "@/lib/nba-api"
import type { BPFirstBasketPlayer, BPTeamTipoff } from "@/lib/bettingpros-scraper"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type PropTab = "first-basket" | "first-team-fg"

/** ESPN → BettingPros team abbreviation mapping */
const ESPN_TO_BP: Record<string, string> = {
  GS: "GSW", SA: "SAS", NY: "NYK", NO: "NOR",
  WSH: "WAS", PHX: "PHO", UTAH: "UTH",
}
function toBP(espn: string): string {
  return ESPN_TO_BP[espn] ?? espn
}

/** NBA.com → BettingPros team abbreviation mapping (for lineup data) */
const NBA_TO_BP: Record<string, string> = {
  NOP: "NOR", UTA: "UTH", PHX: "PHO",
  GSW: "GSW", SAS: "SAS", NYK: "NYK", WAS: "WAS",
}
function nbaToBP(nba: string): string {
  return NBA_TO_BP[nba] ?? nba
}

/** Normalize a name for fuzzy matching (strip suffixes, lowercase, remove accents) */
function normalizeName(name: string): string {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\b(Jr\.?|Sr\.?|III|II|IV)\b/gi, "")     // strip suffixes
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

/** Build starter set from lineup data. Returns the set AND which teams have lineup data. */
function buildStarterSet(starters: Record<string, string[]>): { set: Set<string>; teamsWithData: Set<string> } {
  const set = new Set<string>()
  const teamsWithData = new Set<string>()
  for (const [nbaTeam, names] of Object.entries(starters)) {
    const bpTeam = nbaToBP(nbaTeam)
    if (names.length > 0) teamsWithData.add(bpTeam)
    for (const name of names) {
      set.add(`${name}|${bpTeam}`)
      set.add(`~full:${normalizeName(name)}|${bpTeam}`)
      const lastName = name.split(" ").pop()?.toLowerCase() ?? ""
      if (lastName) set.add(`~last:${lastName}|${bpTeam}`)
    }
  }
  return { set, teamsWithData }
}

function isStarter(
  player: BPFirstBasketPlayer,
  starterSet: Set<string>,
  teamsWithData: Set<string>,
): boolean {
  if (!teamsWithData.has(player.team)) return true
  if (starterSet.has(`${player.name}|${player.team}`)) return true
  if (starterSet.has(`~full:${normalizeName(player.name)}|${player.team}`)) return true
  const lastName = player.name.split(" ").pop()?.toLowerCase() ?? ""
  return starterSet.has(`~last:${lastName}|${player.team}`)
}

interface GameInfo {
  id: string
  away: string
  awayLogo?: string
  home: string
  homeLogo?: string
  label: string
  time: string
  venue: string
  status: string
}

function toLiveGames(espnGames: NBAScheduleGame[]): GameInfo[] {
  return espnGames.map((g, i) => ({
    id: g.id || `live-${i}`,
    away: g.awayTeam.abbreviation,
    awayLogo: g.awayTeam.logo,
    home: g.homeTeam.abbreviation,
    homeLogo: g.homeTeam.logo,
    label: `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`,
    time: new Date(g.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    venue: g.venue,
    status: g.status,
  }))
}

/** Number of table rows visible to anonymous users */
const PREVIEW_ROWS = 8

export default function NBAFirstBasketPage() {
  const userTier = useUserTier()
  const isAnonymous = userTier === "anonymous"

  const [activeTab, setActiveTab] = useState<PropTab>("first-basket")
  const [date, setDate] = useState(new Date())
  const [gameFilter, setGameFilter] = useState("all")
  const [minGames, setMinGames] = useState(0)
  const [startersOnly, setStartersOnly] = useState(true)
  const [sortColumn, setSortColumn] = useState("firstBasketPct")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [splitView, setSplitView] = useState<SplitView>("season")
  const [gameWindow, setGameWindow] = useState<GameWindow>("season")

  const isFirstBasketTab = activeTab === "first-basket"

  const dateParam = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
  const { data: scheduleData, isLoading: scheduleLoading, error: scheduleError, mutate: mutateSchedule } = useSWR<{ games: NBAScheduleGame[] }>(
    `/api/nba/schedule?date=${dateParam}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  // BettingPros first basket data (only used on First Basket tab)
  const { data: fbData, isLoading: fbLoading, error: fbError, mutate: mutateFb } = useSWR<{
    players: BPFirstBasketPlayer[]
    teams: BPTeamTipoff[]
    updatedAt?: string
  }>(isFirstBasketTab ? "/api/nba/first-basket" : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 43200000,
  })

  // PBP data (used on Team First FG tab)
  const pbpApiUrl = !isFirstBasketTab
    ? `/api/nba/first-basket-pbp?type=first-team-fg&window=${gameWindow}`
    : null
  const { data: pbpData, isLoading: pbpLoading, error: pbpError, mutate: mutatePbp } = useSWR(
    pbpApiUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 3600000 }
  )

  const { data: lineupsData } = useSWR<{ starters: Record<string, string[]> }>(
    "/api/nba/lineups",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 43200000 }
  )

  const hasError = scheduleError || (isFirstBasketTab ? fbError : pbpError)
  const isLoading = scheduleLoading || (isFirstBasketTab ? fbLoading : pbpLoading)

  const games = useMemo(() => (scheduleData?.games?.length ? toLiveGames(scheduleData.games) : []), [scheduleData])
  const hasLiveStats = isFirstBasketTab ? !!fbData?.players?.length : !!pbpData?.players?.length

  // Get today's team abbreviations for filtering players (convert to BettingPros format)
  const todayTeams = useMemo(() => {
    const teams = new Set<string>()
    for (const g of games) {
      teams.add(toBP(g.away))
      teams.add(toBP(g.home))
    }
    return teams
  }, [games])

  // Build matchup map: team → { opponent, isHome } (using BettingPros abbreviations)
  const matchupMap = useMemo(() => {
    const map: Record<string, { opponent: string; isHome: boolean }> = {}
    for (const g of games) {
      map[toBP(g.home)] = { opponent: toBP(g.away), isHome: true }
      map[toBP(g.away)] = { opponent: toBP(g.home), isHome: false }
    }
    return map
  }, [games])

  // Build starter name set from lineup data
  const { starterSet, teamsWithLineups } = useMemo(() => {
    if (!lineupsData?.starters) return { starterSet: new Set<string>(), teamsWithLineups: new Set<string>() }
    const { set, teamsWithData } = buildStarterSet(lineupsData.starters)
    return { starterSet: set, teamsWithLineups: teamsWithData }
  }, [lineupsData])

  // Filter first basket players to today's teams + minimum games started + optional starters filter
  const filteredPlayers = useMemo(() => {
    if (!fbData?.players?.length) return []
    return fbData.players.filter((p) =>
      todayTeams.has(p.team) &&
      p.gamesStarted >= minGames &&
      (!startersOnly || isStarter(p, starterSet, teamsWithLineups))
    )
  }, [fbData, todayTeams, minGames, startersOnly, starterSet, teamsWithLineups])

  // Build team tipoff lookup
  const teamTipoffs = useMemo(() => {
    const map: Record<string, BPTeamTipoff> = {}
    for (const t of fbData?.teams ?? []) {
      map[t.team] = t
    }
    return map
  }, [fbData])

  // Build rows for Top Picks (unfiltered by game, sorted by composite)
  const allRows = useMemo(() => {
    return buildRows(filteredPlayers, teamTipoffs, matchupMap, "all")
  }, [filteredPlayers, teamTipoffs, matchupMap])

  // PBP players for Team First FG tab
  const pbpPlayers = pbpData?.players ?? []

  const handlePrevDay = useCallback(() => {
    setDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 1)
      return d
    })
  }, [])

  const handleNextDay = useCallback(() => {
    setDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 1)
      return d
    })
  }, [])

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  const pageTitle = isFirstBasketTab
    ? "NBA First Basket Picks Today"
    : "NBA Team First FG"
  const pageDescription = isFirstBasketTab
    ? "Track which players score the first basket and their team's tipoff win rate."
    : "Which players score their team's first field goal each game. Powered by play-by-play data."

  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6">
        {/* Page heading */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">{pageTitle}</h1>
            <SectionInfoTip page="/nba/first-basket" />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {isFirstBasketTab && hasLiveStats && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                Live
              </span>
            )}
            {isFirstBasketTab && !isLoading && games.length > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                {games.length} Games · Season Stats
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {pageDescription}
          </p>
          <LastUpdated timestamp={isFirstBasketTab ? fbData?.updatedAt : pbpData?.updatedAt} />
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div
            className="flex rounded-lg border border-border overflow-hidden"
            role="tablist"
            aria-label="Prop type"
          >
            {(
              [
                { value: "first-basket" as PropTab, label: "First Basket", icon: Target },
                { value: "first-team-fg" as PropTab, label: "Team First FG", icon: Users },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={activeTab === opt.value}
                onClick={() => setActiveTab(opt.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
                  activeTab === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <opt.icon className="h-3 w-3" />
                {opt.label}
              </button>
            ))}
          </div>

          {/* Game window filter (Team First FG tab only) */}
          {!isFirstBasketTab && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Window
              </span>
              <GameWindowFilter value={gameWindow} onChange={setGameWindow} />
            </div>
          )}
        </div>

        {/* ─── First Basket Tab Content ─── */}
        {isFirstBasketTab && (
          <>
            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <DateNavigator date={date} onPrev={handlePrevDay} onNext={handleNextDay} />

              {/* Game + Min GP filters — locked for anonymous users */}
              <div className="relative flex flex-wrap items-center gap-3 sm:gap-4">
                {isAnonymous && (
                  <div className="absolute inset-0 z-10 flex items-center justify-end pr-2">
                    <Link
                      href="/auth/sign-up"
                      className="flex items-center gap-1.5 rounded-lg bg-card/95 border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors shadow-sm backdrop-blur-sm"
                    >
                      <Lock className="h-3 w-3" />
                      Sign up to filter
                    </Link>
                  </div>
                )}
                <div className={isAnonymous ? "pointer-events-none opacity-40 flex flex-wrap items-center gap-3 sm:gap-4" : "flex flex-wrap items-center gap-3 sm:gap-4"}>
                  <div className="flex items-center gap-2">
                    <Select value={gameFilter} onValueChange={setGameFilter}>
                      <SelectTrigger className="w-[160px] sm:w-[180px] h-9 bg-card border-border text-sm" aria-label="Filter by game matchup">
                        <SelectValue placeholder="All Matchups" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Matchups</SelectItem>
                        {games.map((game) => (
                          <SelectItem key={game.id} value={`${toBP(game.away)}-${toBP(game.home)}`}>
                            {game.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Min games started filter */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Min GP</span>
                    <div className="flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Minimum games played">
                      {([0, 10, 20, 30] as const).map((threshold) => (
                        <button
                          key={threshold}
                          type="button"
                          onClick={() => setMinGames(threshold)}
                          aria-pressed={minGames === threshold}
                          aria-label={threshold === 0 ? "All games played" : `Minimum ${threshold} games played`}
                          className={`px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-semibold transition-colors ${
                            minGames === threshold
                              ? "bg-primary text-primary-foreground"
                              : "bg-card text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {threshold === 0 ? "All" : `${threshold}+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Projected starters filter */}
                  <button
                    type="button"
                    onClick={() => setStartersOnly((prev) => !prev)}
                    aria-pressed={startersOnly}
                    aria-label="Show starters only"
                    className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-semibold rounded-lg border transition-colors ${
                      startersOnly
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground hover:text-foreground border-border"
                    }`}
                  >
                    <Users className="h-3 w-3" />
                    Starters Only
                  </button>

                  {/* Stats view toggle — Season vs Tonight's context */}
                  <div className="flex rounded-lg border border-border overflow-hidden" role="group" aria-label="Stats view">
                    {([
                      { value: "season" as SplitView, label: "Season" },
                      { value: "tonight" as SplitView, label: "Tonight" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSplitView(opt.value)}
                        aria-pressed={splitView === opt.value}
                        className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-semibold transition-colors ${
                          splitView === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.value === "tonight" && <BarChart3 className="h-3 w-3" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Games strip — locked for anonymous users */}
            {games.length > 0 && (
              <div className={isAnonymous ? "pointer-events-none opacity-40" : ""}>
                <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by game">
                  <span className="text-xs text-muted-foreground mr-1">{"Today's games:"}</span>
                  {games.map((game) => (
                    <button
                      key={game.id}
                      onClick={() =>
                        setGameFilter((prev) =>
                          prev === `${toBP(game.away)}-${toBP(game.home)}` ? "all" : `${toBP(game.away)}-${toBP(game.home)}`
                        )
                      }
                      aria-pressed={gameFilter === `${toBP(game.away)}-${toBP(game.home)}`}
                      aria-label={`Filter to ${game.label}`}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        gameFilter === `${toBP(game.away)}-${toBP(game.home)}`
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                      }`}
                    >
                      {game.awayLogo && <Image src={game.awayLogo} alt={game.away} width={16} height={16} className="rounded" />}
                      {game.label}
                      {game.homeLogo && <Image src={game.homeLogo} alt={game.home} width={16} height={16} className="rounded" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error state */}
            {hasError && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-sm font-medium text-foreground">Failed to load data</p>
                <p className="text-xs text-muted-foreground">Something went wrong. Try refreshing.</p>
                <button
                  onClick={() => { mutateSchedule(); mutateFb() }}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            )}

            {/* No games state */}
            {!isLoading && !hasError && games.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">No games scheduled</p>
                <p className="text-xs text-muted-foreground">Try selecting a different date.</p>
              </div>
            )}

            {/* Top Picks spotlight — hidden for anonymous users */}
            {!isAnonymous && allRows.length > 0 && gameFilter === "all" && (
              <TopPicks rows={allRows} maxPicks={5} />
            )}

            {/* Table */}
            {games.length > 0 && (
              isAnonymous ? (
                <SignupGate
                  headline="See all first basket picks — free"
                  description="Unlock the full player rankings, every matchup, and advanced sorting. Free forever, no credit card."
                  countLabel={`${allRows.length} players available today`}
                  preview={
                    <FirstBasketTable
                      players={filteredPlayers}
                      teamTipoffs={teamTipoffs}
                      gameFilter={gameFilter}
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      isLive={hasLiveStats}
                      matchupMap={matchupMap}
                      maxRows={PREVIEW_ROWS}
                      splitView={splitView}
                    />
                  }
                  gated={
                    <FirstBasketTable
                      players={filteredPlayers}
                      teamTipoffs={teamTipoffs}
                      gameFilter={gameFilter}
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      isLive={hasLiveStats}
                      matchupMap={matchupMap}
                      skipRows={PREVIEW_ROWS}
                      splitView={splitView}
                    />
                  }
                />
              ) : (
                <FirstBasketTable
                  players={filteredPlayers}
                  teamTipoffs={teamTipoffs}
                  gameFilter={gameFilter}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  isLive={hasLiveStats}
                  matchupMap={matchupMap}
                  splitView={splitView}
                />
              )
            )}
          </>
        )}

        {/* ─── Team First FG Tab Content ─── */}
        {!isFirstBasketTab && (
          <>
            {/* Error state */}
            {pbpError && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-sm font-medium text-foreground">Failed to load data</p>
                <p className="text-xs text-muted-foreground">
                  PBP data may not be available yet. Run the backfill script first.
                </p>
                <button
                  onClick={() => mutatePbp()}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            )}

            {/* No data state */}
            {!pbpLoading && !pbpError && pbpPlayers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">No data available</p>
                <p className="text-xs text-muted-foreground">
                  Play-by-play data hasn{"'"}t been ingested yet or no players are playing today.
                </p>
              </div>
            )}

            {/* PBP Table */}
            {pbpPlayers.length > 0 &&
              (isAnonymous ? (
                <SignupGate
                  headline="See all team first FG data — free"
                  description="Unlock the full player rankings, every matchup, and advanced sorting. Free forever, no credit card."
                  countLabel={`${pbpPlayers.length} players available today`}
                  preview={
                    <TeamFirstFGTable
                      players={pbpPlayers}
                      maxRows={PREVIEW_ROWS}
                    />
                  }
                  gated={
                    <TeamFirstFGTable
                      players={pbpPlayers}
                      skipRows={PREVIEW_ROWS}
                    />
                  }
                />
              ) : (
                <TeamFirstFGTable players={pbpPlayers} />
              ))}
          </>
        )}

        {/* Pro upsell for free users */}
        {userTier === "free" && (
          <div className="rounded-xl border border-primary/20 bg-primary/[0.03] px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Go Pro for unlimited data, all filters & zero gates</p>
                <p className="text-xs text-muted-foreground">Full access to every dashboard — $12/mo</p>
              </div>
            </div>
            <Link
              href="/checkout"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              Go Pro
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </main>
    </DashboardShell>
  )
}

/* ─── Team First FG Inline Table (PBP data) ─── */

interface PBPPlayer {
  athleteId: string
  athleteName: string
  team: string
  firstCount: number
  gamesInWindow: number
  rate: number
  recentResults: {
    gameId: string
    date: string
    opponent: string
    isHome: boolean
    scored: boolean
  }[]
  opponent: string | null
  isHome: boolean
}

function hitRateColor(rate: number): { text: string; bg: string } {
  if (rate >= 30) return { text: "text-emerald-400", bg: "bg-emerald-400/15" }
  if (rate >= 20) return { text: "text-emerald-300", bg: "bg-emerald-400/10" }
  if (rate >= 10) return { text: "text-amber-400", bg: "bg-amber-400/10" }
  return { text: "text-muted-foreground", bg: "bg-secondary" }
}

function TeamFirstFGTable({
  players,
  maxRows,
  skipRows,
}: {
  players: PBPPlayer[]
  maxRows?: number
  skipRows?: number
}) {
  const rows = (() => {
    if (skipRows) return players.slice(skipRows)
    if (maxRows !== undefined) return players.slice(0, maxRows)
    return players
  })()

  return (
    <ShareCapture label="Team First FG">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-card/80">
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary w-10">
                  #
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary min-w-[160px]">
                  Player
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary text-center w-20">
                  Rate
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary text-center w-16">
                  Made
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary text-center w-16">
                  Games
                </th>
                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <span className="hidden md:inline">Recent Games</span>
                  <span className="md:hidden">Recent</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((player, i) => {
                const rank = (skipRows ?? 0) + i + 1
                const colors = hitRateColor(player.rate)

                return (
                  <tr
                    key={player.athleteId}
                    className="border-b border-border/50 last:border-b-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-xs font-medium text-muted-foreground">
                      {rank}
                    </td>
                    <td className="px-3 py-2.5">
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
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md ${colors.text} ${colors.bg}`}
                      >
                        {player.rate.toFixed(1)}%
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
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {player.recentResults.map((game, j) => (
                          <div key={j} className="relative group">
                            <div
                              className={`hidden md:flex items-center justify-center w-7 h-7 rounded text-[11px] font-bold border ${
                                game.scored
                                  ? "bg-emerald-400/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-red-400/10 text-red-400/70 border-red-500/15"
                              }`}
                            >
                              {game.scored ? "✓" : "✗"}
                            </div>
                            <div
                              className={`md:hidden w-3.5 h-3.5 rounded-full ${
                                game.scored
                                  ? "bg-emerald-400"
                                  : "bg-red-400/40"
                              }`}
                              title={`${game.scored ? "Scored" : "Missed"} vs ${game.opponent}`}
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ShareCapture>
  )
}
